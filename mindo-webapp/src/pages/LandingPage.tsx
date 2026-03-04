import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ArrowRight, Shield, Sparkles, Mic, PenTool, Brain, Globe, Database, BookOpen, LineChart } from 'lucide-react';
import GridBotFace from '../components/GridBotFace';
import type { BotEmotion } from '../hooks/useLiveAPI';

const translations = {
    es: {
        nav_login: "Iniciar sesión",
        hero_tag: "Potenciado por Gemini AI (Google)",
        hero_title_1: "El Tutor de IA",
        hero_title_gradient: "Socrático",
        hero_subtitle: "Diseñado para niños de 4 a 12 años. Guía su aprendizaje fomentando el razonamiento activo en lugar de simplemente dar respuestas fáciles.",
        cta_button: "Empezar a Aprender (Acceso Padres)",

        // Socratic Method
        pedagogy_title: "El Método Socrático: Enseñar a Pensar",
        pedagogy_subtitle: "Mindo está diseñado para ser un guía, no un solucionario.",
        ped_bad_title: "La IA Tradicional",
        ped_bad_child: "Oye, ¿cuánto es 8x7?",
        ped_bad_ai: "El resultado de 8x7 es 56.",
        ped_bad_desc: "Simplemente entrega la respuesta. El niño copia y olvida.",
        ped_good_title: "La Inteligencia de Mindo",
        ped_good_child: "Oye, ¿cuánto es 8x7?",
        ped_good_ai: "¡Vamos a pensarlo! ¿Cuánto es 8x5? Y luego le sumas dos ochos más.",
        ped_good_desc: "Guía el proceso lógico. El niño aprende a razonar por sí mismo.",

        // Voices
        voices_title: "Elige su Propia Personalidad",
        voices_subtitle: "Selecciona el estilo y la voz que mejor se adapten a tu hijo. Mindo habla de forma conversacional y en tiempo real.",
        voice_1_name: "Puck",
        voice_1_desc: "Una voz joven, enérgica y alegre. Ideal para mantener la atención de los más pequeños.",
        voice_2_name: "Aoede",
        voice_2_desc: "Voz femenina calmada y paciente. Perfecta para momentos de lectura y explicaciones profundas.",
        voice_3_name: "Charon",
        voice_3_desc: "Voz masculina profunda y robótica. A los niños mayores les encanta hacerle preguntas científicas.",

        features_title: "Diseñado para el Futuro del Aprendizaje",
        feat_1_title: "Voz y Visión en Tiempo Real",
        feat_1_desc: "Mindo conversa de forma fluida y natural, utilizando la cámara frontal para identificar objetos y reaccionar a su entorno.",
        feat_2_title: "Pizarra Colaborativa",
        feat_2_desc: "Tu hijo puede dibujar y resolver problemas matemáticos a mano en una pizarra digital en vivo.",
        feat_3_title: "Emociones Empáticas",
        feat_3_desc: "La interfaz reacciona con expresiones de sorpresa, alegría o duda en fracciones de segundo.",
        feat_4_title: "Filtro de Contenido Estricto",
        feat_4_desc: "Control parental absoluto impulsado por The Model Armor. Protege a tu hijo de temas no aptos para su edad.",
        feat_5_title: "Pizarra Viva (Autonomía AI)",
        feat_5_desc: "Mindo puede intervenir por su cuenta en la pizarra cambiando fondos (matemáticas/mapas) o dibujando grandes emojis conceptuales (🐘,🌎) para ilustrar su punto.",
        feat_6_title: "Memoria a Largo Plazo",
        feat_6_desc: "Mindo recuerda los gustos, dificultades y mascotitas de tu hijo entre sesiones para crear un vínculo real y personalizado.",
        feat_7_title: "Módulo de Lectura y Fonética",
        feat_7_desc: "Escucha al niño leer en voz alta, corrige su pronunciación sutilmente y evalúa su comprensión con preguntas socráticas.",
        feat_8_title: "Reportes Cognitivos Inteligentes",
        feat_8_desc: "Extraemos analíticas de cada sesión para que los padres reciban un informe detallado sobre el progreso y áreas a reforzar.",

        demo_title: "Conoce a Mindo",
        demo_subtitle: "Personaliza su apariencia y mira cómo expresa emociones dinámicamente en tiempo real.",
        demo_color: "Color Frontal",
        demo_shape: "Forma de Ojos",
        demo_shape_blocks: "Bloques",
        demo_shape_circles: "Círculos",
        demo_emotion: "Pruébalo",

        // Action Section
        action_title: "Mindo en Acción",
        action_1_title: "1. Personalización Precisa",
        action_1_desc: "Visualiza el perfil ideal para tu hijo. Ajusta la edad, el nivel escolar y configura la apariencia de nuestro tutor con diferentes colores y formas para crear un vínculo propio.",
        action_2_title: "2. Pizarra Interactiva Viva",
        action_2_desc: "La pizarra digital no es solo un lienzo estático. Mindo proyecta animaciones y reacciona visualmente para mantener el interés del estudiante en la sesión.",
        action_3_title: "3. Resolución Matemática en Vivo",
        action_3_desc: "Tu hijo puede escribir números y operaciones aritméticas a mano. Mindo ve el lienzo en tiempo real y ofrece guía socrática paso a paso sin darle la respuesta directa.",
        action_4_title: "4. Módulo de Lectura Compartida",
        action_4_desc: "Mindo proyecta fragmentos claros sobre la pizarra para realizar sesiones de lectura, escuchando atentamente y ayudando de forma proactiva con la fonética y la comprensión.",
        action_5_title: "5. Reportes y Descargas PDF",
        action_5_desc: "Al finalizar, Mindo genera un informe analítico detallado del rendimiento cognitivo del niño, sus fortalezas y áreas de mejora. Los padres pueden descargarlo en formato PDF para hacer un seguimiento a largo plazo.",

        footer_rights: "Todos los derechos reservados."
    },
    en: {
        nav_login: "Sign In",
        hero_tag: "Powered by Gemini AI (Google)",
        hero_title_1: "The Socratic",
        hero_title_gradient: "AI Tutor",
        hero_subtitle: "Designed for kids ages 4 to 12. Guide their learning by fostering active reasoning rather than just handing out easy answers.",
        cta_button: "Start Learning (Parent Access)",

        // Socratic Method
        pedagogy_title: "The Socratic Method: Teaching to Think",
        pedagogy_subtitle: "Mindo is designed to be a guide, not an answer key.",
        ped_bad_title: "Traditional AI",
        ped_bad_child: "Hey, what is 8x7?",
        ped_bad_ai: "The result of 8x7 is 56.",
        ped_bad_desc: "Simply hands over the answer. The child copies and forgets.",
        ped_good_title: "Mindo's Intelligence",
        ped_good_child: "Hey, what is 8x7?",
        ped_good_ai: "Let's figure it out! What is 8x5? And then you just add two more eights.",
        ped_good_desc: "Guides the logical process. The child learns to reason independently.",

        // Voices
        voices_title: "Choose Their Personality",
        voices_subtitle: "Select the style and voice that best suits your child. Mindo speaks conversationally in real-time.",
        voice_1_name: "Puck",
        voice_1_desc: "A young, energetic, and joyful voice. Ideal for keeping the youngest learners engaged.",
        voice_2_name: "Aoede",
        voice_2_desc: "Calm and patient female voice. Perfect for reading sessions and deep explanations.",
        voice_3_name: "Charon",
        voice_3_desc: "Deep, robotic male voice. Older kids love asking him scientific questions.",

        features_title: "Designed for the Future of Learning",
        feat_1_title: "Real-Time Voice & Vision",
        feat_1_desc: "Mindo converses fluidly and uses the front camera to identify objects and react to its surroundings.",
        feat_2_title: "Collaborative Whiteboard",
        feat_2_desc: "Your child can draw and solve math problems by hand on a live digital canvas.",
        feat_3_title: "Empathetic Emotions",
        feat_3_desc: "The interface reacts with expressions of surprise, joy, or thought in fractions of a second.",
        feat_4_title: "Strict Content Filtering",
        feat_4_desc: "Absolute parental control powered by The Model Armor. Protects your child from inappropriate topics.",
        feat_5_title: "Dynamic Canvas (AI Agency)",
        feat_5_desc: "Mindo can actively intervene on the whiteboard by swapping backgrounds (grids/maps) or drawing huge concept emojis (🐘,🌎) to illustrate a point.",
        feat_6_title: "Long-Term Memory",
        feat_6_desc: "Mindo remembers your child's preferences, struggles, and pets across sessions to build a real, personalized connection.",
        feat_7_title: "Reading & Phonics Module",
        feat_7_desc: "Listens to the child read aloud, subtly corrects their pronunciation, and evaluates comprehension with Socratic questions.",
        feat_8_title: "Intelligent Cognitive Reports",
        feat_8_desc: "We extract analytics from each session so parents receive detailed reports on progress and areas to reinforce.",

        demo_title: "Meet Mindo",
        demo_subtitle: "Customize its appearance and watch how it dynamically expresses emotions in real-time.",
        demo_color: "Theme Color",
        demo_shape: "Eye Shape",
        demo_shape_blocks: "Blocks",
        demo_shape_circles: "Circles",
        demo_emotion: "Try It",

        // Action Section
        action_title: "Mindo in Action",
        action_1_title: "1. Precise Customization",
        action_1_desc: "Create the ideal profile for your child. Adjust age and school level, and configure Mindo's appearance with different colors and shapes to build a strong connection.",
        action_2_title: "2. Interactive Living Canvas",
        action_2_desc: "The digital whiteboard is not just a blank board. Mindo displays animations and reacts visually to keep the student fully engaged in the lesson.",
        action_3_title: "3. Live Math Solving",
        action_3_desc: "Your child can draw numbers and operations by hand. Mindo sees the canvas in real-time and provides step-by-step Socratic guidance instead of just giving the answer.",
        action_4_title: "4. Shared Reading Module",
        action_4_desc: "Mindo projects clear text snippets on the whiteboard for reading sessions, listening attentively and actively helping with phonetics and comprehension.",
        action_5_title: "5. Reports & PDF Downloads",
        action_5_desc: "After the session, Mindo generates a detailed analytical report on the child's cognitive performance, strengths, and areas for improvement. Parents can download it as a PDF for long-term tracking.",

        footer_rights: "All rights reserved."
    }
};

type Language = 'es' | 'en';

export default function LandingPage() {
    const [lang, setLang] = useState<Language>('es');
    const t = translations[lang];

    // Demo states
    const [demoColor, setDemoColor] = useState('#4f46e5');
    const [demoVariant, setDemoVariant] = useState<'matrix_block' | 'matrix_round'>('matrix_block');
    const [demoEmotion, setDemoEmotion] = useState<BotEmotion>('neutral');

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: unknown) {
            console.error("Error signing in with Google", error);
            if (error instanceof Error) {
                alert("Error al iniciar sesión. Detalles: " + error.message);
            } else {
                alert("Error al iniciar sesión.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-200">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-300/20 blur-[120px]" />
            </div>

            {/* Navbar */}
            <nav className="relative z-10 flex items-center justify-between p-6 m-auto w-full max-w-6xl">
                <div className="flex items-center gap-3">
                    <img src="/logo_mindo.png" alt="Mindo Logo" className="h-10 w-auto drop-shadow-sm" />
                    <span className="text-2xl font-bold text-slate-800 tracking-tight">Mindo</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center bg-white/50 backdrop-blur rounded-full p-1 border border-slate-200/50 shadow-sm">
                        <button
                            onClick={() => setLang('en')}
                            className={`px-3 py-1 text-sm font-semibold rounded-full transition-all ${lang === 'en' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => setLang('es')}
                            className={`px-3 py-1 text-sm font-semibold rounded-full transition-all ${lang === 'es' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            ES
                        </button>
                    </div>
                    <button
                        onClick={handleLogin}
                        className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer hidden sm:block"
                    >
                        {t.nav_login}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-24 pb-16 px-4 text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md text-indigo-700 text-sm font-medium mb-8 border border-indigo-100 shadow-sm animate-fade-in-up">
                    <Sparkles className="w-4 h-4" />
                    <span>{t.hero_tag}</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight max-w-4xl">
                    {t.hero_title_1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{t.hero_title_gradient}</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl leading-relaxed mx-auto">
                    {t.hero_subtitle}
                </p>

                <button
                    onClick={handleLogin}
                    className="group relative inline-flex flex-row items-center justify-center gap-3 px-8 py-4 text-white font-semibold rounded-2xl bg-slate-900 transition-all hover:bg-slate-800 hover:-translate-y-1 shadow-xl hover:shadow-2xl hover:shadow-indigo-900/20 overflow-hidden cursor-pointer"
                >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
                    {t.cta_button}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Socratic Method Section */}
                <div className="mt-32 w-full max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-6 text-indigo-600">
                            <Brain className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">{t.pedagogy_title}</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t.pedagogy_subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Bad Example */}
                        <div className="bg-white/50 backdrop-blur-sm border border-red-100 rounded-[2rem] p-8 shadow-lg shadow-red-900/5 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-400" />
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">✕</span>
                                {t.ped_bad_title}
                            </h3>
                            <div className="space-y-4 mb-6">
                                <div className="bg-slate-100 rounded-2xl p-4 text-slate-700 text-left w-[85%]">
                                    <p className="font-medium">🧒 {t.ped_bad_child}</p>
                                </div>
                                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-900 text-left w-[85%] ml-auto">
                                    <p className="font-medium">🤖 {t.ped_bad_ai}</p>
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed border-t border-slate-200 pt-4 text-left">
                                {t.ped_bad_desc}
                            </p>
                        </div>

                        {/* Good Example */}
                        <div className="bg-white backdrop-blur-sm border border-indigo-100 rounded-[2rem] p-8 shadow-xl shadow-indigo-900/10 relative overflow-hidden ring-1 ring-indigo-50">
                            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">✓</span>
                                {t.ped_good_title}
                            </h3>
                            <div className="space-y-4 mb-6">
                                <div className="bg-slate-100 rounded-2xl p-4 text-slate-700 text-left w-[85%]">
                                    <p className="font-medium">🧒 {t.ped_good_child}</p>
                                </div>
                                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-indigo-900 text-left w-[90%] ml-auto shadow-sm">
                                    <p className="font-medium">✨ {t.ped_good_ai}</p>
                                </div>
                            </div>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed border-t border-slate-200 pt-4 text-left">
                                {t.ped_good_desc}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Voices & Personalities Section */}
                <div className="mt-32 w-full max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-6 text-emerald-600">
                            <Mic className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">{t.voices_title}</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t.voices_subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Voice 1 */}
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Mic className="w-24 h-24" />
                            </div>
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xl font-bold mb-6">P</div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-3">{t.voice_1_name}</h3>
                            <p className="text-slate-600 leading-relaxed relative z-10">{t.voice_1_desc}</p>
                        </div>
                        {/* Voice 2 */}
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Mic className="w-24 h-24" />
                            </div>
                            <div className="w-12 h-12 bg-fuchsia-100 text-fuchsia-600 rounded-full flex items-center justify-center text-xl font-bold mb-6">A</div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-3">{t.voice_2_name}</h3>
                            <p className="text-slate-600 leading-relaxed relative z-10">{t.voice_2_desc}</p>
                        </div>
                        {/* Voice 3 */}
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Mic className="w-24 h-24" />
                            </div>
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-6">C</div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-3">{t.voice_3_name}</h3>
                            <p className="text-slate-600 leading-relaxed relative z-10">{t.voice_3_desc}</p>
                        </div>
                    </div>
                </div>

                {/* Interactive Demo Section */}
                <div className="mt-24 w-full max-w-4xl mx-auto bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-2xl rounded-[3rem] p-8 md:p-12 mb-12">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">{t.demo_title}</h2>
                        <p className="text-slate-600 max-w-xl mx-auto">{t.demo_subtitle}</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        {/* Interactive Face */}
                        <div className="w-full md:w-1/2 flex justify-center">
                            <GridBotFace
                                botState="idle"
                                emotion={demoEmotion}
                                themeColor={demoColor}
                                eyeVariant={demoVariant}
                                audioLevel={0}
                                className="w-64 shadow-indigo-900/10"
                            />
                        </div>

                        {/* Controls */}
                        <div className="w-full md:w-1/2 flex flex-col gap-6 text-left">
                            {/* Color */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">{t.demo_color}</label>
                                <div className="flex gap-3">
                                    {['#4f46e5', '#059669', '#ea580c', '#e11d48', '#9333ea'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setDemoColor(color)}
                                            className={`w-10 h-10 rounded-full transition-transform cursor-pointer shadow-sm ${demoColor === color ? 'scale-110 ring-4 ring-offset-2' : 'hover:scale-105 opacity-80'}`}
                                            style={{ backgroundColor: color, '--tw-ring-color': color } as React.CSSProperties}
                                            aria-label={`Select color ${color}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Shape */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">{t.demo_shape}</label>
                                <div className="flex bg-slate-100/80 rounded-xl p-1 border border-slate-200 w-fit">
                                    <button
                                        onClick={() => setDemoVariant('matrix_block')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${demoVariant === 'matrix_block' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {t.demo_shape_blocks}
                                    </button>
                                    <button
                                        onClick={() => setDemoVariant('matrix_round')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${demoVariant === 'matrix_round' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {t.demo_shape_circles}
                                    </button>
                                </div>
                            </div>

                            {/* Emotion */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">{t.demo_emotion}</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['neutral', 'smiling', 'surprised', 'asking', 'calculating'] as BotEmotion[]).map(emo => (
                                        <button
                                            key={emo}
                                            onClick={() => setDemoEmotion(emo)}
                                            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${demoEmotion === emo ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <span className="capitalize">{emo}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mindo In Action Section (Screenshots) */}
                <div className="mt-24 w-full max-w-6xl mx-auto px-4 md:px-0">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight">{t.action_title}</h2>
                    </div>

                    <div className="space-y-24">
                        {/* Screnshot 1 - Profile */}
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/60 bg-white">
                                <img src="/captures/profile.png" alt="Mindo Profile Customization" className="w-full h-auto object-cover" />
                            </div>
                            <div className="w-full md:w-1/2 text-left">
                                <h3 className="text-2xl font-bold text-slate-800 mb-4">{t.action_1_title}</h3>
                                <p className="text-lg text-slate-600 leading-relaxed">{t.action_1_desc}</p>
                            </div>
                        </div>

                        {/* Screnshot 2 - Whale */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-10">
                            <div className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/60 bg-white">
                                <img src="/captures/whale.png" alt="Interactive Animations" className="w-full h-auto object-cover" />
                            </div>
                            <div className="w-full md:w-1/2 text-left">
                                <h3 className="text-2xl font-bold text-slate-800 mb-4">{t.action_2_title}</h3>
                                <p className="text-lg text-slate-600 leading-relaxed">{t.action_2_desc}</p>
                            </div>
                        </div>

                        {/* Screnshot 3 - Math */}
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/60 bg-white">
                                <img src="/captures/math.png" alt="Live Math Drawing" className="w-full h-auto object-cover" />
                            </div>
                            <div className="w-full md:w-1/2 text-left">
                                <h3 className="text-2xl font-bold text-slate-800 mb-4">{t.action_3_title}</h3>
                                <p className="text-lg text-slate-600 leading-relaxed">{t.action_3_desc}</p>
                            </div>
                        </div>

                        {/* Screnshot 4 - Reading */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-10">
                            <div className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/60 bg-white">
                                <img src="/captures/reading.png" alt="Reading Module Text" className="w-full h-auto object-cover" />
                            </div>
                            <div className="w-full md:w-1/2 text-left">
                                <h3 className="text-2xl font-bold text-slate-800 mb-4">{t.action_4_title}</h3>
                                <p className="text-lg text-slate-600 leading-relaxed">{t.action_4_desc}</p>
                            </div>
                        </div>

                        {/* Screnshot 5 - Reports */}
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/60 bg-white">
                                <img src="/captures/reports.png" alt="Analytics Reports PDF" className="w-full h-auto object-cover border border-slate-100" />
                            </div>
                            <div className="w-full md:w-1/2 text-left">
                                <h3 className="text-2xl font-bold text-slate-800 mb-4">{t.action_5_title}</h3>
                                <p className="text-lg text-slate-600 leading-relaxed">{t.action_5_desc}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="mt-12 w-full text-left">
                    <h2 className="text-3xl font-bold text-slate-800 mb-12 text-center">{t.features_title}</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="group p-8 bg-white/70 hover:bg-white backdrop-blur-md border border-slate-200/50 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                                <Mic className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">{t.feat_1_title}</h3>
                            <p className="text-slate-600 leading-relaxed">{t.feat_1_desc}</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group p-8 bg-white/70 hover:bg-white backdrop-blur-md border border-slate-200/50 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-fuchsia-500/5 transition-all duration-300">
                            <div className="bg-gradient-to-br from-fuchsia-100 to-pink-100 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 text-fuchsia-600 group-hover:scale-110 transition-transform">
                                <PenTool className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">{t.feat_2_title}</h3>
                            <p className="text-slate-600 leading-relaxed">{t.feat_2_desc}</p>
                        </div>

                        {/* Feature 5 - Dynamic Whiteboard (New) */}
                        <div className="group p-8 bg-white/70 hover:bg-white backdrop-blur-md border border-slate-200/50 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-yellow-500/5 transition-all duration-300 lg:col-span-1 md:col-span-2 lg:row-span-2">
                            <div className="bg-gradient-to-br from-yellow-100 to-amber-100 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 text-amber-600 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">{t.feat_5_title}</h3>
                            <p className="text-slate-600 leading-relaxed mb-6">{t.feat_5_desc}</p>
                            <div className="w-full aspect-video bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center p-4 relative overflow-hidden group-hover:shadow-inner transition-shadow">
                                <div className="absolute inset-0 bg-repeat opacity-40 mix-blend-multiply" style={{ backgroundImage: "url('/grid-bg.svg')", backgroundSize: '15px 15px' }} />
                                <span className="text-6xl drop-shadow-lg relative animate-bounce-slow">🐘</span>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-400 font-bold tracking-widest uppercase bg-white/80 px-2 py-0.5 rounded-full backdrop-blur">
                                    Mindo.draw("🐘")
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="group p-8 bg-white/70 hover:bg-white backdrop-blur-md border border-slate-200/50 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                                <Brain className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">{t.feat_3_title}</h3>
                            <p className="text-slate-600 leading-relaxed">{t.feat_3_desc}</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="group p-8 bg-white/70 hover:bg-white backdrop-blur-md border border-slate-200/50 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300">
                            <div className="bg-gradient-to-br from-purple-100 to-violet-100 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                                <Shield className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">{t.feat_4_title}</h3>
                            <p className="text-slate-600 leading-relaxed">{t.feat_4_desc}</p>
                        </div>

                        {/* Feature 6 */}
                        <div className="group p-8 bg-white/70 hover:bg-white backdrop-blur-md border border-slate-200/50 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300">
                            <div className="bg-gradient-to-br from-cyan-100 to-sky-100 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 text-cyan-600 group-hover:scale-110 transition-transform">
                                <Database className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">{t.feat_6_title}</h3>
                            <p className="text-slate-600 leading-relaxed">{t.feat_6_desc}</p>
                        </div>

                        {/* Feature 7 */}
                        <div className="group p-8 bg-white/70 hover:bg-white backdrop-blur-md border border-slate-200/50 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300">
                            <div className="bg-gradient-to-br from-rose-100 to-red-100 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 text-rose-600 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">{t.feat_7_title}</h3>
                            <p className="text-slate-600 leading-relaxed">{t.feat_7_desc}</p>
                        </div>

                        {/* Feature 8 (New - Analytics) */}
                        <div className="group p-8 bg-white/70 hover:bg-white backdrop-blur-md border border-slate-200/50 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300">
                            <div className="bg-gradient-to-br from-orange-100 to-amber-100 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 text-orange-600 group-hover:scale-110 transition-transform">
                                <LineChart className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">{t.feat_8_title}</h3>
                            <p className="text-slate-600 leading-relaxed">{t.feat_8_desc}</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full max-w-6xl mx-auto p-6 mt-12 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
                <div className="flex items-center gap-2 mb-4 md:mb-0">
                    <Globe className="w-4 h-4" />
                    <span>&copy; {new Date().getFullYear()} Mindo. {t.footer_rights}</span>
                </div>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
                </div>
            </footer>
        </div>
    );
}
