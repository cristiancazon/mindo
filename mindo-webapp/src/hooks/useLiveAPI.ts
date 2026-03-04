import { useState, useRef, useCallback, useEffect } from 'react';

type BotState = 'idle' | 'listening' | 'thinking' | 'talking';

export type BotEmotion = 'neutral' | 'smiling' | 'surprised' | 'asking' | 'calculating' | 'explaining';

interface UseLiveAPIOptions {
    url?: string;
    onStateChange?: (state: BotState) => void;
    onEmotionChange?: (emotion: BotEmotion) => void;
    onMemoryExtracted?: (fact: string) => void;
    onSessionEnd?: (metrics: { durationSeconds: number, messagesExchanged: number, alertsTriggered: number }) => void;
    onError?: (err: Error) => void;
}

export function useLiveAPI({
    url = 'ws://localhost:8080', // Default local proxy port
    onStateChange,
    onEmotionChange,
    onMemoryExtracted,
    onSessionEnd,
    onError
}: UseLiveAPIOptions = {}) {
    const [isConnected, setIsConnected] = useState(false);
    const [botState, setBotState] = useState<BotState>('idle');
    const [botEmotion, setBotEmotion] = useState<BotEmotion>('neutral');
    const [audioLevel, setAudioLevel] = useState(0);
    const [stream, setStream] = useState<MediaStream | null>(null); // Bot's speaking level

    // Whiteboard tools state
    const [activeBackground, setActiveBackground] = useState<string>('blank');
    const [activeConcept, setActiveConcept] = useState<string | null>(null);
    const [activeReadingText, setActiveReadingText] = useState<string | null>(null);
    const [clearBoardTrigger, setClearBoardTrigger] = useState<number>(0);

    const wsRef = useRef<WebSocket | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    // Video capture refs
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const videoIntervalRef = useRef<number | null>(null);

    // Sound playback refs
    const playbackContextRef = useRef<AudioContext | null>(null);
    const playbackAnalyserRef = useRef<AnalyserNode | null>(null);
    const nextPlayTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);
    const botStateRef = useRef<BotState>('idle');
    const botEmotionRef = useRef<BotEmotion>('neutral');
    const currentSentenceRef = useRef<string>('');

    // Session Metrics Refs
    const startTimeRef = useRef<number>(0);
    const messageCountRef = useRef<number>(0);
    const alertsCountRef = useRef<number>(0);

    const onSessionEndRef = useRef(onSessionEnd);
    useEffect(() => {
        onSessionEndRef.current = onSessionEnd;
    }, [onSessionEnd]);

    const updateBotState = useCallback((newState: BotState) => {
        if (botStateRef.current === newState) return;
        botStateRef.current = newState;
        setBotState(newState);
        onStateChange?.(newState);
    }, [onStateChange]);

    const updateBotEmotion = useCallback((newEmotion: BotEmotion) => {
        if (botEmotionRef.current === newEmotion) return;
        botEmotionRef.current = newEmotion;
        setBotEmotion(newEmotion);
        onEmotionChange?.(newEmotion);
    }, [onEmotionChange]);

    const analyzeEmotion = useCallback((textChunk: string) => {
        currentSentenceRef.current += textChunk.toLowerCase();
        const sentence = currentSentenceRef.current;
        const chunkStr = textChunk.toLowerCase();

        // Heuristic checks (run immediately on chunk and sentence to trigger faster)
        if (/[?]/.test(textChunk) || /dónde|qué|cómo|por qué|cuál|verdad/.test(chunkStr) || /dónde|qué|cómo|por qué|cuál/.test(sentence)) {
            updateBotEmotion('asking');
        } else if (/jaja|jeje|excelente|muy bien|perfecto|genial|me encanta|bien|sí|claro|por supuesto|buenísimo/.test(chunkStr) || /excelente|muy bien|perfecto/.test(sentence)) {
            updateBotEmotion('smiling');
        } else if (/wow|sorprendente|increíble|oh|ah|madre mía|no me digas|fua/.test(chunkStr) || /increíble/.test(sentence)) {
            updateBotEmotion('surprised');
        } else if (/sumar|restar|multiplicar|dividir|calcula|número|matemática|piensa|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|matemáticas/.test(chunkStr)) {
            updateBotEmotion('calculating');
        } else if (/porque|entonces|significa|recuerda que|te explico|fíjate|mira|observa|es decir|por lo tanto/.test(chunkStr) || /te explico/.test(sentence)) {
            updateBotEmotion('explaining');
        }

        // Reset if we hit end of sentence or a pause
        if (/[.!?\\n,]/.test(textChunk)) {
            currentSentenceRef.current = '';
            // Don't reset emotion immediately, let it linger briefly
            setTimeout(() => {
                // If it's still idle or returning to idle, reset to neutral.
                // If it's calculating or asking, let it stick a tiny bit longer unless overridden.
                if (botStateRef.current !== 'talking') {
                    updateBotEmotion('neutral');
                } else if (Math.random() > 0.5) { // 50% chance to reset during speech for dynamic feel
                    updateBotEmotion('neutral');
                }
            }, 1000); // Reduced from 2000ms to 1000ms for snappier expressions
        }
    }, [updateBotEmotion]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            // Trigger session end metrics first
            if (startTimeRef.current > 0) {
                const durationSeconds = Math.floor(Date.now() / 1000) - startTimeRef.current;
                onSessionEndRef.current?.({
                    durationSeconds,
                    messagesExchanged: messageCountRef.current,
                    alertsTriggered: alertsCountRef.current
                });
                startTimeRef.current = 0; // Reset
            }

            wsRef.current.close();
            wsRef.current = null;
        }

        // Stop Media Devices
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        setStream(null);

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }

        if (videoIntervalRef.current) {
            clearInterval(videoIntervalRef.current);
            videoIntervalRef.current = null;
        }

        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        setIsConnected(false);
        updateBotState('idle');
    }, [updateBotState]);

    // Downsample to 16kHz and convert to PCM Base64
    const processAudio = useCallback((inputData: Float32Array, inputSampleRate: number) => {
        const TARGET_SAMPLE_RATE = 16000;
        const compression = inputSampleRate / TARGET_SAMPLE_RATE;
        const length = Math.floor(inputData.length / compression);
        const result = new Int16Array(length);

        for (let i = 0; i < length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[Math.floor(i * compression)]));
            result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert Int16Array to Base64
        const buffer = new ArrayBuffer(result.length * 2);
        const view = new DataView(buffer);
        result.forEach((val, i) => view.setInt16(i * 2, val, true));

        const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        return base64;
    }, []);

    const captureVideoFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const whiteboard = document.getElementById('mindo-whiteboard') as HTMLCanvasElement;

                if (whiteboard) {
                    // Composite side-by-side: 1280x480
                    canvas.width = 1280;
                    canvas.height = 480;

                    // Fill with white background so transparency doesn't turn black in jpeg
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Left half: Webcam
                    ctx.drawImage(video, 0, 0, 640, 480);

                    // Right half: Whiteboard
                    ctx.drawImage(whiteboard, 640, 0, 640, 480);
                } else {
                    canvas.width = 640;
                    canvas.height = 480;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                }

                // Convert to base64 jpeg
                const base64Img = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

                // Send to WebSocket
                wsRef.current.send(JSON.stringify({
                    realtimeInput: {
                        mediaChunks: [{
                            mimeType: "image/jpeg",
                            data: base64Img
                        }]
                    }
                }));
            }
        }
    }, []);

    // Handle incoming PCM audio chunks from Gemini
    const playAudioChunk = useCallback((base64Audio: string) => {
        if (!playbackContextRef.current) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            playbackContextRef.current = ctx;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.connect(ctx.destination);
            playbackAnalyserRef.current = analyser;

            // Start global animation frame loop
            const updateLevel = () => {
                if (playbackContextRef.current && playbackAnalyserRef.current) {
                    const dataArray = new Uint8Array(playbackAnalyserRef.current.frequencyBinCount);
                    playbackAnalyserRef.current.getByteFrequencyData(dataArray);

                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                    const avg = sum / dataArray.length;

                    // Only update state if volume is meaningful to avoid thrashing
                    if (playbackContextRef.current.currentTime >= nextPlayTimeRef.current) {
                        setAudioLevel(0);
                        updateBotState('listening');
                    } else {
                        setAudioLevel(avg / 255.0);
                    }
                }
                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };
            animationFrameRef.current = requestAnimationFrame(updateLevel);
        }

        const ctx = playbackContextRef.current;

        // Base64 to ArrayBuffer
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        // Int16 PCM array to Float32
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
        }

        const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000); // Gemini returns 24kHz audio
        audioBuffer.getChannelData(0).set(float32Array);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        // Connect source to our persistent analyzer instead of creating a new one
        if (playbackAnalyserRef.current) {
            source.connect(playbackAnalyserRef.current);
        } else {
            source.connect(ctx.destination);
        }

        // Track when to play the next chunk to avoid overlapping
        const currentTime = ctx.currentTime;
        const playTime = Math.max(currentTime, nextPlayTimeRef.current);
        source.start(playTime);
        nextPlayTimeRef.current = playTime + audioBuffer.duration;

        // Simulate "talking" visually while analyzing output
        updateBotState('talking');

        // We removed the per-chunk requestAnimationFrame loop. It is now handled globally.
    }, [updateBotState]);

    const connect = useCallback(async (age?: number, name?: string, voiceName?: string, language?: string, memories?: string[]) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            updateBotState('thinking'); // Transition state while connecting

            // Initialize hidden video/canvas elements if they don't exist
            if (!videoRef.current) {
                videoRef.current = document.createElement('video');
                videoRef.current.autoplay = true;
            }
            if (!canvasRef.current) {
                canvasRef.current = document.createElement('canvas');
            }

            // 1. Request Media Permissions (Camera + Mic)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                },
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                }
            });
            mediaStreamRef.current = stream;
            setStream(stream);

            if (videoRef.current) {
                videoRef.current.srcObject = new MediaStream(stream.getVideoTracks());
            }

            // 2. Setup WebSocket
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                // Send profile settings explicitly first to tell proxy how to initialize Gemini
                ws.send(JSON.stringify({ type: 'setup', age, name, voiceName, language, memories }));

                setIsConnected(true);
                startTimeRef.current = Math.floor(Date.now() / 1000);
                updateBotState('listening');

                // Start sending video frames at 1 FPS
                videoIntervalRef.current = window.setInterval(captureVideoFrame, 1000);

                // Setup Audio Processor
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const source = audioContextRef.current.createMediaStreamSource(stream);

                // 4096 buffer size
                const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = processor;

                source.connect(processor);
                processor.connect(audioContextRef.current.destination); // Required to make it work in Chrome

                processor.onaudioprocess = (e) => {
                    if (ws.readyState !== WebSocket.OPEN) return;
                    const inputData = e.inputBuffer.getChannelData(0);
                    const base64Audio = processAudio(inputData, e.inputBuffer.sampleRate);

                    ws.send(JSON.stringify({
                        realtimeInput: {
                            mediaChunks: [{
                                mimeType: "audio/pcm;rate=16000",
                                data: base64Audio
                            }]
                        }
                    }));
                };
            };

            ws.onmessage = (event) => {
                try {
                    // Check for JSON vs Blob
                    if (typeof event.data === 'string') {
                        const data = JSON.parse(event.data);

                        // In Gemini Live schema, audio comes wrapped in a serverContent event
                        // The structure varies slightly depending on if we are proxying it exactly as-is.
                        // We'll assume the proxy forwards standard API responses.
                        if (data?.serverContent?.modelTurn?.parts) {
                            messageCountRef.current++;
                            data.serverContent.modelTurn.parts.forEach((part: any) => {
                                if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
                                    playAudioChunk(part.inlineData.data);
                                }
                                if (part.text) {
                                    analyzeEmotion(part.text);
                                }
                            });
                        }

                        // Handle Function Calling (Live API sends it as top-level toolCall)
                        if (data?.toolCall?.functionCalls) {
                            data.toolCall.functionCalls.forEach((call: any) => {
                                const { id, name, args } = call;
                                console.log("Gemini triggered function:", name, args, "with ID:", id);

                                if (name === 'change_whiteboard_background') {
                                    setActiveBackground(args.background_type || 'blank');
                                } else if (name === 'draw_concept') {
                                    setActiveConcept(args.concept_emoji || null);
                                    setActiveReadingText(null); // mutually exclusive visual
                                } else if (name === 'show_reading_text') {
                                    setActiveReadingText(args.text_content || null);
                                    setActiveConcept(null); // mutually exclusive visual
                                } else if (name === 'clear_whiteboard') {
                                    setClearBoardTrigger(Date.now());
                                    setActiveReadingText(null);
                                    setActiveConcept(null);
                                } else if (name === 'memorize_fact') {
                                    console.log("Memory Fact Extracted:", args.fact);
                                    onMemoryExtracted?.(args.fact);
                                } else if (name === 'report_inappropriate_topic') {
                                    alertsCountRef.current++;
                                }

                                // Immediately respond to Gemini so it continues speaking
                                const toolResponse = {
                                    toolResponse: {
                                        functionResponses: [{
                                            id: id,
                                            name: name,
                                            response: {
                                                result: "success"
                                            }
                                        }]
                                    }
                                };
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify(toolResponse));
                                }
                            });
                        }

                        if (data?.serverContent?.interrupted) {
                            // Handle interruption (stop playback)
                            console.log("Model interrupted");
                            if (playbackContextRef.current && playbackContextRef.current.state === 'running') {
                                // Quickly suspend and recreate to drop buffer
                                playbackContextRef.current.close().then(() => {
                                    playbackContextRef.current = null;
                                    nextPlayTimeRef.current = 0;
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error parsing WebSocket message", err);
                }
            };

            ws.onclose = () => {
                disconnect();
            };

            ws.onerror = (e) => {
                console.error("WebSocket Error:", e);
                onError?.(new Error("WebSocket Connection Failed"));
                disconnect();
            };

        } catch (error) {
            console.error("Error setting up MediaSession/WebSocket", error);
            onError?.(error instanceof Error ? error : new Error(String(error)));
            disconnect();
        }
    }, [url, updateBotState, captureVideoFrame, processAudio, playAudioChunk, disconnect, onError]);

    return {
        isConnected,
        botState,
        botEmotion,
        audioLevel,
        stream,
        connect,
        disconnect,
        activeBackground,
        activeConcept,
        activeReadingText,
        clearBoardTrigger,
        clearConcept: () => {
            setActiveConcept(null);
            setActiveReadingText(null);
        }
    };
}
