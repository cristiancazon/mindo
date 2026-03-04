import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Trash2, X, ZoomIn, ZoomOut, Maximize, Hand, PenTool } from 'lucide-react';

interface WhiteboardProps {
    activeBackground?: string;
    activeConcept?: string | null;
    activeReadingText?: string | null;
    clearTrigger?: number;
    onClearConcept?: () => void;
}

export default function Whiteboard({ activeBackground = 'blank', activeConcept = null, activeReadingText = null, clearTrigger = 0, onClearConcept }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#4f46e5');

    // Zoom & Pan State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [activeTool, setActiveTool] = useState<'draw' | 'pan'>('draw');
    const [isDragging, setIsDragging] = useState(false);
    const lastPanPos = useRef({ x: 0, y: 0 });

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
    const handleResetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    const startInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        if (activeTool === 'pan') {
            setIsDragging(true);
            lastPanPos.current = { x: clientX, y: clientY };
        } else {
            setIsDrawing(true);
            draw(e);
        }
    };

    const stopInteraction = () => {
        setIsDragging(false);
        setIsDrawing(false);
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.beginPath();
    };

    const interact = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        if (activeTool === 'pan' && isDragging) {
            const dx = clientX - lastPanPos.current.x;
            const dy = clientY - lastPanPos.current.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastPanPos.current = { x: clientX, y: clientY };
        } else if (activeTool === 'draw' && isDrawing) {
            draw(e);
        }
    };

    const draw = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Also clear the concept overlay when clearing the board
        if (onClearConcept) onClearConcept();
    };

    useEffect(() => {
        if (clearTrigger > 0) {
            clearCanvas();
        }
    }, [clearTrigger]);

    useEffect(() => {
        // Initialize canvas correctly based on CSS size to avoid stretching
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // optional: ctx.fillStyle = "white"; ctx.fillRect(0,0, canvas.width, canvas.height);
                ctx.lineCap = 'round';
            }
        }
    }, []);

    // Also handle resizing
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                // Save imageData before resize if needed, omitting for simple approach
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const colors = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#0f172a'];

    let bgStyles: React.CSSProperties = {};
    let bgClasses = "w-full h-full absolute inset-0 z-0 ";

    if (activeBackground === 'math_grid') {
        bgClasses += "bg-repeat";
        bgStyles = { backgroundImage: "url('/grid-bg.svg')", backgroundSize: '20px 20px' };
    } else if (activeBackground === 'world_map') {
        bgClasses += "bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-center bg-no-repeat bg-contain opacity-50";
    } else {
        bgClasses += "bg-white";
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
            <div className="flex flex-wrap justify-between items-center p-3 border-b border-slate-200 bg-white z-20 relative gap-3">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    {/* Action Tools */}
                    <button onClick={() => setActiveTool('draw')} className={`p-2 rounded-xl transition-colors cursor-pointer ${activeTool === 'draw' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`} title="Dibujar">
                        <PenTool className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActiveTool('pan')} className={`p-2 rounded-xl transition-colors cursor-pointer ${activeTool === 'pan' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`} title="Mover Lienzo">
                        <Hand className="w-5 h-5" />
                    </button>

                    <div className="hidden sm:block w-px bg-slate-200 mx-1 self-stretch" />

                    {/* Zoom Tools */}
                    <button onClick={handleZoomOut} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer" title="Alejar (Zoom Out)">
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 w-8 sm:w-10 text-center flex items-center justify-center select-none">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={handleZoomIn} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer" title="Acercar (Zoom In)">
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <button onClick={handleResetZoom} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer hidden md:flex" title="Restaurar Centro">
                        <Maximize className="w-5 h-5" />
                    </button>

                    <div className="hidden sm:block w-px bg-slate-200 mx-1 self-stretch" />

                    {/* Colors */}
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        {colors.map(c => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setActiveTool('draw'); }}
                                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-transform cursor-pointer ${color === c && activeTool === 'draw' ? 'scale-110 border-slate-400 shadow-sm' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                                title={c}
                            />
                        ))}
                        <div className="w-px bg-slate-200 mx-0.5 self-stretch" />
                        <button
                            onClick={() => { setColor('#ffffff'); setActiveTool('draw'); }}
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center transition-transform cursor-pointer ${color === '#ffffff' && activeTool === 'draw' ? 'scale-110 border-slate-400 shadow-sm' : ''}`}
                            title="Borrador"
                        >
                            <Eraser className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                        </button>
                    </div>
                </div>

                <button
                    onClick={clearCanvas}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer ml-auto"
                >
                    <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Limpiar</span>
                </button>
            </div>

            {/* Viewport for Canvas and Overlays */}
            <div
                className={`relative flex-1 w-full bg-white overflow-hidden touch-none ${activeTool === 'pan' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'}`}
                onMouseDown={startInteraction}
                onMouseUp={stopInteraction}
                onMouseOut={stopInteraction}
                onMouseMove={interact}
                onTouchStart={startInteraction}
                onTouchEnd={stopInteraction}
                onTouchCancel={stopInteraction}
                onTouchMove={interact}
            >
                {/* Infinite Canvas Transform Wrapper - 200% size centered */}
                <div
                    className="absolute inset-[-50%] origin-center transition-transform will-change-transform"
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                >
                    {/* Background Layer (Mindo changes this) */}
                    <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ${bgClasses}`} style={bgStyles} />

                    {/* Concept Overlay (Mindo draws this) */}
                    {activeConcept && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[25] overflow-hidden p-4">
                            <div className="relative animate-in zoom-in spin-in-1 duration-500 text-[6rem] sm:text-[8rem] md:text-[10rem] drop-shadow-2xl opacity-90 select-none flex flex-wrap justify-center items-center text-center gap-2 max-w-[90vw] leading-none">
                                {activeConcept}
                            </div>
                        </div>
                    )}

                    {/* Reading Text Overlay */}
                    {activeReadingText && (
                        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8 pointer-events-none z-[25] overflow-hidden">
                            <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-500 w-full max-w-4xl bg-[#fffdf2]/95 backdrop-blur-md rounded-2xl md:rounded-3xl shadow-2xl border-2 sm:border-4 border-amber-900/10 p-6 md:p-10 max-h-full overflow-y-auto pointer-events-auto flex items-center">
                                {/* Decorative lines */}
                                <div className="absolute left-6 md:left-10 top-0 bottom-0 w-[2px] bg-red-400/30 min-h-[120%]" />
                                <div className="w-full text-2xl sm:text-3xl md:text-5xl text-slate-800 font-serif font-bold leading-normal tracking-wide space-y-4 pl-8 md:pl-12 text-center my-auto">
                                    {activeReadingText}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Interactive Drawing Canvas Layer */}
                    <canvas
                        id="mindo-whiteboard"
                        ref={canvasRef}
                        className="w-full h-full relative z-20 bg-transparent pointer-events-none"
                    />
                </div>
            </div>

            {/* Overlay Close Button (Must be inside container so it stays floating) */}
            {(activeConcept || activeReadingText) && (
                <button
                    onClick={onClearConcept}
                    className="absolute bottom-6 right-6 p-4 bg-white/90 hover:bg-white text-slate-500 hover:text-red-500 rounded-full z-[40] transition-colors cursor-pointer shadow-xl border border-slate-200"
                    title="Cerrar overlay de Mindo"
                >
                    <X className="w-6 h-6 md:w-8 md:h-8" />
                </button>
            )}
        </div>
    );
}
