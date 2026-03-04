import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import type { BotEmotion } from '../hooks/useLiveAPI';

export type BotState = 'idle' | 'listening' | 'thinking' | 'talking';
export type EyeVariant = 'matrix_block' | 'matrix_round';

interface GridBotFaceProps {
    botState: BotState;
    emotion?: BotEmotion;
    themeColor: string;
    eyeVariant: EyeVariant;
    className?: string;
    audioLevel?: number; // 0 to 1, for talking animation
}

// Generates a 16x16 matrix of points
const GRID_SIZE = 16;
const CELL_SIZE = 10;

const getEyePixelOpacity = (row: number, col: number, emotion: BotEmotion = 'neutral', botState: BotState, blinkPhase: number): { active: boolean, opacity: number } => {
    const leftEyeOuter = 4;
    const leftEyeInner = 7;
    const rightEyeInner = 10;
    const rightEyeOuter = 13;
    const eyeTop = 5;
    const eyeBottom = 10; // 6 pixels tall

    const isLeftEye = col >= leftEyeOuter && col <= leftEyeInner;
    const isRightEye = col >= rightEyeInner && col <= rightEyeOuter;
    const isEyeBox = row >= eyeTop && row <= eyeBottom && (isLeftEye || isRightEye);

    let active = false;
    let opacity = 1;

    // Expand eyes 1 pixel outwards unconditionally when listening, but ONLY within a tight radius
    const isListeningExpanded = botState === 'listening' && (
        (row >= eyeTop - 1 && row <= eyeBottom + 1 && (
            (col >= leftEyeOuter - 1 && col <= leftEyeInner + 1) ||
            (col >= rightEyeInner - 1 && col <= rightEyeOuter + 1)
        ))
    );

    if (isEyeBox || isListeningExpanded) {

        // Base activation (start by activating the standard eye box)
        if (isEyeBox) active = true;

        const relativeY = row - eyeTop;
        const relativeXLeft = col - leftEyeOuter;
        const relativeXRight = col - rightEyeInner;

        // Apply emotion masks (turning specific active pixels off)
        if (active) {
            if (botState === 'idle' && emotion === 'neutral') {
                if (blinkPhase === 1 || blinkPhase === 3) { // Half closed
                    if (relativeY < 1 || relativeY > 4) active = false;
                } else if (blinkPhase === 2) { // Fully closed
                    if (relativeY !== 2) active = false;
                }
            } else if (emotion === 'smiling') {
                // ^ ^ Shape
                if (relativeY === 0 && (col === leftEyeOuter || col === leftEyeInner || col === rightEyeInner || col === rightEyeOuter)) active = false;
                if (isLeftEye && relativeY > Math.min(2, relativeXLeft + 1) && relativeY > Math.min(2, 4 - relativeXLeft)) active = false;
                if (isRightEye && relativeY > Math.min(2, relativeXRight + 1) && relativeY > Math.min(2, 4 - relativeXRight)) active = false;
                if (relativeY > 3) active = false; // cut off the bottom
            } else if (emotion === 'surprised') {
                // O O Shape
                // Clear the center pixel
                if (isLeftEye && relativeXLeft >= 1 && relativeXLeft <= 2 && relativeY >= 2 && relativeY <= 3) active = false;
                if (isRightEye && relativeXRight >= 1 && relativeXRight <= 2 && relativeY >= 2 && relativeY <= 3) active = false;
            } else if (emotion === 'asking') {
                // Left normal, Right raised/squinted
                if (isRightEye && (relativeY > 3 || relativeY < 1)) active = false;
            } else if (emotion === 'calculating') {
                // Squinted, looking left and right
                if (relativeY < 2 || relativeY > 3) active = false;
            } else if (emotion === 'explaining') {
                // Round corners
                if (relativeY === 0 || relativeY === 5) {
                    if (col === leftEyeOuter || col === leftEyeInner || col === rightEyeInner || col === rightEyeOuter) active = false;
                }
            }
        }

        // Apply Listening Expansion Opacity (only if it wasn't already active from standard eye logic)
        if (!active && isListeningExpanded && emotion !== 'calculating' && emotion !== 'smiling') {
            // Calculate a 1-pixel border around the active eye shape
            // For simplicity, we just enable the whole expanded box, but clip it to a hollow border
            const isLeftBorder = col === leftEyeOuter - 1 || col === leftEyeInner + 1 || row === eyeTop - 1 || row === eyeBottom + 1;
            const isRightBorder = col === rightEyeInner - 1 || col === rightEyeOuter + 1 || row === eyeTop - 1 || row === eyeBottom + 1;

            if (isLeftBorder || isRightBorder) {
                active = true;
                opacity = 0.5;
            }
        }

        // Thinking (Processing pattern overrides)
        if (active && botState === 'thinking') {
            if (Math.random() > 0.7) opacity = 0.2;
        }
    }

    return { active, opacity };
};

// SVG Cell component for performance
const Cell = ({ x, y, active, variant, color, animateOpts }: any) => {
    const isCircle = variant === 'matrix_round';

    return (
        <motion.g animate={animateOpts}>
            {isCircle ? (
                <circle
                    cx={x + CELL_SIZE / 2}
                    cy={y + CELL_SIZE / 2}
                    r={CELL_SIZE / 2 - 1}
                    fill={active ? color : 'rgba(255,255,255,0.03)'}
                    className="transition-colors duration-200"
                />
            ) : (
                <rect
                    x={x}
                    y={y}
                    width={CELL_SIZE - 2}
                    height={CELL_SIZE - 2}
                    rx={2}
                    fill={active ? color : 'rgba(255,255,255,0.03)'}
                    className="transition-colors duration-200"
                />
            )}
        </motion.g>
    );
};

export default function GridBotFace({
    botState = 'idle',
    emotion = 'neutral',
    themeColor = '#4f46e5',
    eyeVariant = 'matrix_block',
    className = '',
    audioLevel = 0
}: GridBotFaceProps) {

    const [blinkPhase, setBlinkPhase] = useState(0); // 0: Open, 1: Closing, 2: Closed, 3: Opening

    // Idle blinking logic
    useEffect(() => {
        if (botState !== 'idle' || emotion !== 'neutral') {
            setBlinkPhase(0);
            return;
        }

        const blinkInterval = setInterval(() => {
            // Trigger a blink
            setBlinkPhase(1);
            setTimeout(() => setBlinkPhase(2), 50);
            setTimeout(() => setBlinkPhase(3), 150);
            setTimeout(() => setBlinkPhase(0), 200);

            // Double blink chance
            if (Math.random() > 0.7) {
                setTimeout(() => {
                    setBlinkPhase(1);
                    setTimeout(() => setBlinkPhase(2), 50);
                    setTimeout(() => setBlinkPhase(3), 150);
                    setTimeout(() => setBlinkPhase(0), 200);
                }, 300);
            }
        }, 4000 + Math.random() * 2000);

        return () => clearInterval(blinkInterval);
    }, [botState, emotion]);

    // Generate grid matrix
    const matrix = Array.from({ length: GRID_SIZE }, (_, row) =>
        Array.from({ length: GRID_SIZE }, (_, col) => {
            const { active, opacity } = getEyePixelOpacity(row, col, emotion, botState, blinkPhase);
            return { row, col, active, opacity };
        })
    );

    // Background animation variants
    const bgVariants: Variants = {
        idle: { scale: 1, opacity: 0.8 },
        listening: { scale: [1, 1.1, 1], opacity: 1, transition: { repeat: Infinity, duration: 2 } },
        thinking: { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0], opacity: 0.9, transition: { repeat: Infinity, duration: 3 } },
        talking: { scale: 1.05, opacity: 0.95 }
    };

    // Mouth generation based on audio level
    const MOUTH_WIDTH = 8;
    const mouthStartX = (GRID_SIZE - MOUTH_WIDTH) / 2;
    const mouthY = GRID_SIZE - 2;

    const getMouthHeights = () => {
        if (botState !== 'talking' && botState !== 'listening') return Array(MOUTH_WIDTH).fill(1);

        // Base level (listening gives a small constant line, talking uses audioLevel)
        const baseVal = botState === 'listening' ? 0.2 : Math.max(0.1, audioLevel);

        return Array.from({ length: MOUTH_WIDTH }, (_, i) => {
            // Create a curve so the middle is taller
            const center = MOUTH_WIDTH / 2 - 0.5;
            const distance = Math.abs(i - center);
            const factor = 1 - (distance / (MOUTH_WIDTH / 2));

            const height = Math.max(1, Math.floor(baseVal * factor * 5) + 1);
            return Math.min(height, 4); // Max height 4 blocks
        });
    };

    const mouthHeights = getMouthHeights();

    return (
        <div className={`relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-[2.5rem] bg-slate-900 border-4 border-slate-800 shadow-2xl ${className}`}>

            {/* Blurred Ambient Gradient */}
            <motion.div
                className="absolute inset-0 blur-3xl opacity-50"
                style={{
                    background: `radial-gradient(circle at center, ${themeColor} 0%, transparent 60%)`
                }}
                variants={bgVariants}
                animate={botState}
            />

            {/* Grid Container */}
            <div className="absolute inset-0 flex items-center justify-center p-6">
                <svg
                    viewBox={`0 0 ${GRID_SIZE * CELL_SIZE} ${GRID_SIZE * CELL_SIZE}`}
                    className="w-full h-full drop-shadow-lg"
                    style={{ filter: `drop-shadow(0 0 10px ${themeColor}60)` }}
                >
                    {/* Render Eyes */}
                    {matrix.map((row, rIdx) =>
                        row.map((cell, cIdx) => (
                            <Cell
                                key={`cell-${rIdx}-${cIdx}`}
                                x={cIdx * CELL_SIZE}
                                y={rIdx * CELL_SIZE}
                                active={cell.active}
                                variant={eyeVariant}
                                color={themeColor}
                                animateOpts={{
                                    opacity: cell.opacity * (cell.active ? 1 : 0.2),
                                }}
                            />
                        ))
                    )}

                    {/* Render Mouth (Equalizer Effect) */}
                    {Array.from({ length: MOUTH_WIDTH }, (_, i) => {
                        const height = mouthHeights[i];
                        const active = botState === 'talking' || botState === 'listening';

                        return Array.from({ length: height }, (_, hIdx) => {
                            // Build blocks upwards from the mouth base (y=14)
                            const yPos = mouthY - hIdx;
                            if (yPos < 0) return null;

                            return (
                                <Cell
                                    key={`mouth-${i}-${hIdx}`}
                                    x={(mouthStartX + i) * CELL_SIZE}
                                    y={yPos * CELL_SIZE}
                                    active={true}
                                    variant="matrix_block" // Mouth is always blocks for clean lines
                                    color={active ? 'white' : 'rgba(255,255,255,0.4)'}
                                    animateOpts={{ opacity: 1 }}
                                />
                            );
                        });
                    })}
                </svg>
            </div>

            {/* Screen Gloss Reflection */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-transparent via-transparent to-white/5 pointer-events-none" />
        </div>
    );
}
