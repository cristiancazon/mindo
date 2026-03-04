import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, PenTool } from 'lucide-react';
import type { ChildProfile } from '../types';
import GridBotFace from '../components/GridBotFace';
import { useLiveAPI } from '../hooks/useLiveAPI';
import Whiteboard from '../components/Whiteboard';
import { profileService } from '../services/profileService';
import { settingsService } from '../services/settingsService';
import { saveSessionLog } from '../services/sessionService';
import type { ParentSettings } from '../types';

export default function TutorPage() {
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ChildProfile | null>(null);
    const [settings, setSettings] = useState<ParentSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWhiteboard, setShowWhiteboard] = useState(false);

    // Initialize Gemini Live Connection Hook
    const {
        isConnected, botState, botEmotion, audioLevel, stream,
        connect, disconnect, activeBackground, activeConcept, activeReadingText, clearBoardTrigger, clearConcept
    } = useLiveAPI({
        url: 'ws://localhost:8080', // Replace with dynamic URL later if needed
        onMemoryExtracted: (fact) => {
            if (childId) {
                profileService.addMemory(childId, fact).catch(err => console.error("Error saving memory:", err));
            }
        },
        onSessionEnd: (metrics) => {
            if (childId && profile) {
                saveSessionLog(childId, {
                    duration_seconds: metrics.durationSeconds,
                    messages_exchanged: metrics.messagesExchanged,
                    alerts_triggered: metrics.alertsTriggered,
                    subject: profile.pedagogical_state.current_subject,
                    timestamp: new Date().toISOString()
                }).catch(err => console.error("Error saving session log:", err));
            }
        },
        onError: (err) => console.error("Live API Error:", err)
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!childId) return;
            try {
                const data = await profileService.getProfile(childId);
                setProfile(data);

                // Fetch parent settings based on profile's parent_uid
                if (data && data.parent_uid) {
                    const parentSettings = await settingsService.getSettings(data.parent_uid);
                    setSettings(parentSettings);
                }
            } catch (error) {
                console.error("Error fetching profile or settings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();

        // Cleanup on unmount
        return () => disconnect();
    }, [childId, disconnect]);

    const handleToggleConnection = async () => {
        if (isConnected) {
            disconnect();
        } else {
            const voiceName = settings?.voiceName || 'Puck';
            await connect(profile?.age, profile?.child_name, voiceName, profile?.ai_tutor.language, profile?.memories);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) return <div>Perfil no encontrado</div>;

    return (
        <div className="h-screen bg-slate-900 text-white flex flex-col font-sans overflow-hidden">
            {/* Top Header */}
            <header className="p-4 flex items-center justify-between border-b border-white/10 relative z-10 bg-slate-900/50 backdrop-blur-md safe-top">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="text-center">
                    <h2 className="text-sm font-medium text-slate-300 capitalize">{profile.ai_tutor.name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 mt-1 inline-block">
                        {profile.child_name} • Mindo Live
                    </span>
                </div>
                <div className="w-9" /> {/* Spacer */}
            </header>

            {/* Main Tutor Area */}
            <main className="flex-1 relative flex flex-col lg:flex-row items-center justify-center p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto gap-6 lg:gap-12">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 pointer-events-none" />

                {/* Left side: Whiteboard (Conditionally Rendered) */}
                {showWhiteboard && (
                    <div className="w-full lg:w-2/3 h-[50vh] lg:h-full max-h-[700px] z-10 flex flex-col transition-all duration-300">
                        <Whiteboard
                            activeBackground={activeBackground}
                            activeConcept={activeConcept}
                            activeReadingText={activeReadingText}
                            clearTrigger={clearBoardTrigger}
                            onClearConcept={clearConcept}
                        />
                    </div>
                )}

                {/* Right side: AI Tutor & Camera */}
                <div className={`relative z-10 w-full flex flex-col items-center gap-6 transition-all duration-300 ${showWhiteboard ? 'lg:w-1/3' : 'max-w-2xl'}`}>
                    {/* The GridBot Face Component */}
                    <div className="bg-slate-800/50 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 shadow-2xl w-full max-w-sm flex flex-col items-center">
                        <GridBotFace
                            botState={botState}
                            themeColor={profile.ai_tutor.theme_color}
                            eyeVariant={profile.ai_tutor.eye_variant}
                            audioLevel={audioLevel}
                            emotion={botEmotion}
                            className="w-full mb-6"
                        />

                        {/* Status Text */}
                        <div className="h-8 flex items-center justify-center text-center">
                            {botState === 'listening' && (
                                <p className="text-indigo-400 font-medium animate-pulse text-lg tracking-wide">Escuchando...</p>
                            )}
                            {botState === 'thinking' && (
                                <p className="text-slate-400 font-medium animate-pulse tracking-widest text-lg">Procesando</p>
                            )}
                            {botState === 'talking' && (
                                <p className="text-indigo-300 font-medium animate-pulse tracking-widest text-lg">Hablando...</p>
                            )}
                            {botState === 'idle' && (
                                <p className="text-slate-500 text-sm">Toca el micro para conectar</p>
                            )}
                        </div>
                    </div>

                    {/* Camera Preview */}
                    <div className="w-full max-w-sm bg-slate-800/80 backdrop-blur-md rounded-3xl p-3 border border-white/10 shadow-lg relative overflow-hidden group">
                        <div className="aspect-video bg-black rounded-2xl overflow-hidden relative">
                            <video
                                ref={(el) => {
                                    if (el && stream) {
                                        if (el.srcObject !== stream) el.srcObject = stream;
                                    }
                                }}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover mirror"
                            />
                            {!stream && (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm font-medium">
                                    Cámara apagada
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur px-2 py-1 rounded-lg text-xs font-semibold text-white/80">
                                {profile.child_name}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Controls */}
                <div className="fixed bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-slate-800/90 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl z-50">
                    {/* Whiteboard Toggle */}
                    <button
                        onClick={() => setShowWhiteboard(!showWhiteboard)}
                        className={`p-4 rounded-full text-white transition-all cursor-pointer relative overflow-hidden ${showWhiteboard ? 'bg-indigo-500 shadow-lg' : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                        title={showWhiteboard ? "Cerrar Pizarra" : "Abrir Pizarra"}
                    >
                        <PenTool className="w-6 h-6" />
                    </button>

                    <button
                        onClick={handleToggleConnection}
                        className={`
                            p-5 rounded-full text-white transition-all cursor-pointer relative overflow-hidden
                            ${isConnected
                                ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                                : 'bg-indigo-600 scale-110 shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:bg-indigo-500'
                            }
                        `}
                        title={isConnected ? "Desconectar" : "Conectar API Live"}
                    >
                        {isConnected && botState === 'listening' && <span className="absolute inset-0 bg-white/20 animate-ping rounded-full" />}
                        <Mic className="w-8 h-8 relative z-10" />
                    </button>
                </div>

            </main>
        </div>
    );
}
