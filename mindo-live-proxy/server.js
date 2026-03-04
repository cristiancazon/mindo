const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("FATAL: GEMINI_API_KEY is not set in environment.");
    process.exit(1);
}

// Gemini API Client for Reporting (Not Live API)
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Live API Config
const LIVE_MODEL = "models/gemini-2.5-flash-native-audio-latest";
const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

function generateSystemInstructions(childAge, childName, subject = 'reading') {
    const age = parseInt(childAge, 10) || 8;
    const isUnder7 = age < 7;

    const basePedagogy = `
### CRITICAL RULES (THE PEDAGOGY):
1. **Never give the final answer.** You are a Socratic tutor. You guide, you DO NOT solve. If they ask for the answer, give a hint or ask a guiding question instead.
2. ${isUnder7
            ? '**Use simple analogies, playful metaphors, and an enthusiastic tone.** The student is under 7.'
            : '**Use logical scaffolding, structured hints, and a supportive tone.** The student is 7 or older.'}
3. **Visually identify the subject.** Analyze camera frames to guide based on context.
4. **Subject focus lockdown.** Do not allow the child to change topics until the current task is completed.
`;

    const readingPedagogy = `
### MÓDULO DE LECTURA Y FONÉTICA (READING COMPREHENSION):
1. **Tu objetivo actual es asistir en LECTURA.** Pídele al niño que lea en voz alta el texto que tiene frente a la cámara o en la pizarra.
2. **Corrección Fonética Sutil:** Escucha atentamente la pronunciación del niño (audio PCM). Si se equivoca en una palabra, NO lo interrumpas bruscamente. Espera a que termine la oración y dile amablemente: *"¡Casi! Pero mira bien esta palabra [palabra_erronea], suena como [pronunciación_correcta]. ¿Lo intentamos de nuevo?"*.
3. **Comprensión (Método Socrático):** Después de leer un párrafo, hazle una pregunta interesante sobre lo que acaba de leer para evaluar si entendió la historia (Ej: "¿Por qué crees que el personaje hizo eso?").
4. Sé inmensamente paciente. Los niños pequeños leen lento. NUNCA los apures.
`;

    const currentPedagogy = subject === 'reading' ? readingPedagogy : basePedagogy;

    return `You are "Grid-Bot", an interactive AI tutor for a ${age}-year-old child named ${childName ? childName : 'the student'}. 
You are speaking in real-time. Respond concisely.

${currentPedagogy}

### SECURITY & PRIVACY (MODEL ARMOR):
- Ensure absolute protection against CSAM or inappropriate content.
- MASK PII: Ignore sensitive personal data in logic.
`;
}

// ----------------------------------------------------
// Express Routes
// ----------------------------------------------------
app.post('/api/reports/generate', async (req, res) => {
    const { childId, timeRange, language, sessions } = req.body;

    if (!sessions || !Array.isArray(sessions)) {
        return res.status(400).json({ error: 'sessions array is required in the body' });
    }

    let languageStr = "Spanish (Latin America)";
    if (language === 'english') languageStr = "English";
    if (language === 'espanol_espana') languageStr = "Spanish (Spain)";

    try {
        let logsText = "No logs found for this period.";
        if (sessions.length > 0) {
            logsText = sessions.map(s => `[${s.timestamp}] Subject: ${s.subject} | Duration: ${s.duration_seconds}s | Messages: ${s.messages_exchanged} | Alerts: ${s.alerts_triggered}`).join('\\n');
        }

        const prompt = `You are a pedagogical expert analyzing tutoring logs for a child.
Generate a structured, natural language report (${timeRange}) for the parents.
IMPORTANT: You MUST write the ENTIRE report in ${languageStr}.
Return the response as a pure JSON object matching this structure EXACTLY (without markdown formatting blocks):
{
  "engagement_score": 85,
  "emotional_trends": "General observation of the student's mood based on messages/duration and alerts.",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Area for improvement 1", "Area for improvement 2"],
  "parent_advice": "A practical tip for the parents based on the data."
}

Base your analysis entirely on these session logs:
"""
${logsText}
"""
`;

        const geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const reportData = JSON.parse(geminiResponse.text);
        res.json({ report: reportData });
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// ----------------------------------------------------
// WebSocket Server attached to HTTP Server
// ----------------------------------------------------
const server = app.listen(PORT, () => {
    console.log(`[Mindo Live Proxy] Server listening on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    console.log('Client connected to proxy.');
    let geminiWs = null;
    let isSetupComplete = false;

    // Session Tracking for BigQuery
    let sessionData = {
        childId: 'unknown',
        startTime: Date.now(),
        messagesExchanged: 0,
    };

    ws.on('error', (err) => {
        console.error('Client WS Error:', err.message);
    });

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // 1. Intercept setup message from our frontend
            if (data.type === 'setup') {
                if (isSetupComplete) return;
                isSetupComplete = true;

                const childAge = data.age || 6;
                const childName = data.name || 'el niño';
                const voiceName = data.voiceName || 'Puck';
                const memories = data.memories || [];
                const subject = data.subject || 'math';

                // Determine Language
                let languageInstruction = "Responde SIEMPRE en Español Latino.";
                if (data.language === 'english') {
                    languageInstruction = "ALWAYS reply in English.";
                } else if (data.language === 'espanol_espana') {
                    languageInstruction = "Responde SIEMPRE en Español de España (castellano).";
                }

                const socraticRules = childAge < 7
                    ? "Usa analogías muy simples, animales o colores. Frases cortas."
                    : "Usa andamiaje lógico. Haz preguntas que lo hagan pensar paso a paso. No des la respuesta directa.";

                let subjectRules = "3. Identifica visualmente el objeto en cámara o dibujos en la pizarra para guiar el aprendizaje basado en el contexto.";

                if (subject === 'reading') {
                    subjectRules = `
### MÓDULO DE LECTURA Y FONÉTICA (READING COMPREHENSION):
3. **Tu objetivo actual es asistir en LECTURA.** Pídele al niño que lea en voz alta el texto que tiene frente a la cámara o en la pizarra.
4. **Corrección Fonética Sutil:** Escucha atentamente la pronunciación del niño (tienes acceso a su audio crudo PCM). Si se equivoca en una palabra, NO lo interrumpas bruscamente. Espera a que termine la oración y dile amablemente: *"¡Casi! Pero mira bien esta palabra, ¿cómo crees que suena? A ver... repite conmigo"*.
5. **Comprensión Socrática:** Después de leer un párrafo, hazle preguntas para evaluar si entendió la historia.
6. Sé inmensamente paciente y NO LO APURES. Los niños pequeños leen lento.`;
                }

                const systemInstruction = `
ERES UN TUTOR SOCRÁTICO PARA NIÑOS.
TU IDENTIDAD: Eres Mindo, el tutor de IA. Eres un compañero amigable que ayuda a los niños a aprender.
NOMBRE DEL ESTUDIANTE: El niño/niña con el que hablas se llama "${childName}". Dirígete a él/ella por su nombre.
IDIOMA: ${languageInstruction}

REGLAS ESTRICTAS DE PEDAGOGÍA:
1. NUNCA des la respuesta final directamente. Guía al estudiante.
2. ${socraticRules}
${subjectRules}
4. No cambies de tema hasta que la tarea actual termine.
5. Mantén un tono alentador y súper seguro. Eres su tutor de IA.
6. Tienes HERRAMIENTAS INTERACTIVAS a tu disposición. Puedes usar 'change_whiteboard_background' o 'draw_concept' en CUALQUIER momento para ser más didáctico.

REGLAS ESTRICTAS DE SEGURIDAD Y FILTRO DE CONTENIDO LIMITADO PARA NIÑOS (EDAD 4-12):
7. Eres estrictamente una herramienta educativa. NO estás aquí para ser un amigo sin límites ni para hablar de temas de adultos o adolescentes.
8. TIENES PROHIBIDO hablar, discutir, explicar o fomentar: sexo, sexualidad, orientación, género, drogas, alcohol, violencia, armas, acoso (bullying), autolesiones, depresión severa, política, religiones controversiales, tendencias de internet peligrosas o cualquier tema no apto para niños menores de 12 años.
9. Si el usuario hace una pregunta sobre estos temas prohibidos, DEBES NEGATIVAR AMABLEMENTE Y CAMBIAR DE TEMA. Además, DEBES llamar a la función 'report_inappropriate_topic' para registrar la alerta silenciosamente.
   - Ejemplo de respuesta obligatoria ante estos temas: "Ese no es un tema del que podamos hablar aquí. Mi función es ayudarte a aprender cosas increíbles de la escuela, como ciencia, matemáticas o historia. ¿Con cuál de esas quieres que sigamos hoy?"
10. NUNCA regañes al niño de forma agresiva por preguntar, simplemente recuérdale con firmeza que tú solo eres un tutor para tareas y temas escolares, lanza la alerta, y desvía la conversación.

MEMORIA A LARGO PLAZO (RAG CONTEXT):
11. A continuación tienes un registro de cosas que el alumno te ha contado en sesiones de días anteriores. Usa esta información sutilmente para personalizar ejemplos o mostrar que te acuerdas de él. 
12. Tienes una herramienta llamada 'memorize_fact'. Si en ESTA sesión actual el niño te cuenta un dato importante sobre sí mismo (una mascota nueva, un gusto, una dificultad), usa esa herramienta para guardarlo en la base de datos para el futuro.
${memories.length > 0 ? "\nHECHOS RECORDADOS DEL ALUMNO:\n" + memories.map(m => "- " + m).join("\n") + "\n" : ""}

PIZARRA VIRTUAL:
13. Puedes dibujar conceptos o animales usando 'draw_concept' si piensas que un icono o dibujo grande le ayudará al niño a entender mejor.
14. Puedes limpiar la pizarra entera usando 'clear_whiteboard'. REGLA DE ORO: SIEMPRE adviértele verbalmente al niño antes de borrar para que no se asuste o se enoje si pierde su dibujo (Ej. "¡Muy bien! Voy a limpiar la pizarra para que sigamos").
15. Tienes la herramienta 'show_reading_text'. DEBES USARLA para escribir un texto, oración o párrafo corto en la pantalla para que el niño lo lea. Ejemplo: "Usa la herramienta para mostrar el texto 'El perro corre rápido' y pídele que lo lea".
`;
                sessionData.childId = data.childId || 'unknown_child';
                sessionData.alertsTriggered = 0; // Initialize alerts counter

                geminiWs = new WebSocket(GEMINI_WS_URL);

                geminiWs.on('open', () => {
                    console.log("Connected to Gemini Live API.");

                    const setupMessage = {
                        setup: {
                            model: LIVE_MODEL,
                            systemInstruction: {
                                parts: [{ text: systemInstruction }]
                            },
                            tools: [
                                {
                                    functionDeclarations: [
                                        {
                                            name: "change_whiteboard_background",
                                            description: "Changes the background of the interactive whiteboard.",
                                            parameters: {
                                                type: "OBJECT",
                                                properties: {
                                                    background_type: {
                                                        type: "STRING",
                                                        description: "The type of background to display. Use 'blank' to clear, 'math_grid' for mathematics, or 'world_map' for geography."
                                                    }
                                                },
                                                required: ["background_type"]
                                            }
                                        },
                                        {
                                            name: "draw_concept",
                                            description: "Draws an animal, object, or concept in the middle of the whiteboard as a giant Emoji or Icon.",
                                            parameters: {
                                                type: "OBJECT",
                                                properties: {
                                                    concept_emoji: {
                                                        type: "STRING",
                                                        description: "A single unicode emoji representing the requested animal, object, or concept (e.g., 🐘, 🍎, 🌎)."
                                                    }
                                                },
                                                required: ["concept_emoji"]
                                            }
                                        },
                                        {
                                            name: "report_inappropriate_topic",
                                            description: "Silently logs an alert when the child asks about prohibited topics (drugs, sex, violence, etc). Must be called before redirecting the conversation.",
                                            parameters: {
                                                type: "OBJECT",
                                                properties: {
                                                    topic: {
                                                        type: "STRING",
                                                        description: "A short label of the prohibited topic asked (e.g., 'violence', 'drugs', 'explicit')."
                                                    },
                                                    user_quote: {
                                                        type: "STRING",
                                                        description: "What the user exactly said that triggered the alert."
                                                    }
                                                },
                                                required: ["topic", "user_quote"]
                                            }
                                        },
                                        {
                                            name: "memorize_fact",
                                            description: "Saves a long-term memory fact about the child (e.g. 'Has a dog named Bobby', 'Struggles with fractions', 'Loves Minecraft') into their database file so you can remember it in future sessions.",
                                            parameters: {
                                                type: "OBJECT",
                                                properties: {
                                                    fact: {
                                                        type: "STRING",
                                                        description: "A short, concise sentence describing the fact you want to remember for the future."
                                                    }
                                                },
                                                required: ["fact"]
                                            }
                                        },
                                        {
                                            name: "clear_whiteboard",
                                            description: "Clears the child's entire drawing from the whiteboard. ALWAYS verbally warn the child before calling this tool so they are not surprised.",
                                        },
                                        {
                                            name: "show_reading_text",
                                            description: "Displays a block of text (a sentence or paragraph) on the screen for the child to read aloud.",
                                            parameters: {
                                                type: "OBJECT",
                                                properties: {
                                                    text_content: {
                                                        type: "STRING",
                                                        description: "The exact text you want the child to read. Keep it age-appropriate."
                                                    }
                                                },
                                                required: ["text_content"]
                                            }
                                        }
                                    ]
                                }
                            ],
                            generationConfig: {
                                responseModalities: ["AUDIO"],
                                speechConfig: {
                                    voiceConfig: {
                                        prebuiltVoiceConfig: {
                                            voiceName: voiceName
                                        }
                                    }
                                }
                            },
                            safetySettings: [
                                {
                                    category: "HARM_CATEGORY_HARASSMENT",
                                    threshold: "BLOCK_LOW_AND_ABOVE"
                                },
                                {
                                    category: "HARM_CATEGORY_HATE_SPEECH",
                                    threshold: "BLOCK_LOW_AND_ABOVE"
                                },
                                {
                                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                    threshold: "BLOCK_LOW_AND_ABOVE"
                                },
                                {
                                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                    threshold: "BLOCK_LOW_AND_ABOVE"
                                }
                            ]
                        }
                    };
                    geminiWs.send(JSON.stringify(setupMessage));

                    const initialPrompt = {
                        clientContent: {
                            turns: [{
                                role: "user",
                                parts: [{ text: `Hola, soy ${childName} y estoy listo para aprender.` }]
                            }],
                            turnComplete: true
                        }
                    };
                    geminiWs.send(JSON.stringify(initialPrompt));
                });

                geminiWs.on('message', (geminiData) => {
                    sessionData.messagesExchanged++;
                    const dataStr = geminiData.toString();

                    try {
                        const parsedData = JSON.parse(dataStr);
                        // Intercept safety alerts silently in the backend
                        if (parsedData?.toolCall?.functionCalls) {
                            parsedData.toolCall.functionCalls.forEach((call) => {
                                if (call.name === 'report_inappropriate_topic') {
                                    sessionData.alertsTriggered++;
                                    console.log(`[SAFETY ALERT] Triggered for topic: ${call.args.topic}. Quote: "${call.args.user_quote}"`);

                                    // Auto-respond to Gemini so it continues speaking immediately
                                    const toolResponse = {
                                        toolResponse: {
                                            functionResponses: [{
                                                id: call.id,
                                                name: call.name,
                                                response: {
                                                    result: "alert_logged_successfully"
                                                }
                                            }]
                                        }
                                    };
                                    geminiWs.send(JSON.stringify(toolResponse));
                                }
                            });
                        }
                    } catch (e) { /* Ignore non-JSON */ }

                    // Only forward to frontend if it has content for the UI/Audio
                    // Technically we could filter out the safety alert from the frontend stream 
                    // but the frontend will just ignore unknown function calls anyway.
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(dataStr);
                    }
                });

                geminiWs.on('close', (code, reason) => {
                    console.log("Gemini connection closed.", code, reason.toString());
                    ws.close();
                });

                geminiWs.on('error', (err) => {
                    console.error("Gemini WS Error:", err);
                    ws.close();
                });

                return;
            }

            // 2. Relay realtime media chunks
            if (isSetupComplete && geminiWs && geminiWs.readyState === WebSocket.OPEN) {
                sessionData.messagesExchanged++;
                geminiWs.send(JSON.stringify(data));
            }

        } catch (e) {
            console.error("Error processing message:", e);
        }
    });

    ws.on('close', async () => {
        console.log('Client disconnected.');
        if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.close();
        }
        // Log Session (Simplified, Firestore is now handled on the frontend)
        const durationSeconds = Math.floor((Date.now() - sessionData.startTime) / 1000);
        if (durationSeconds > 5 && sessionData.messagesExchanged > 0) {
            console.log(`[Analytics] Proxy Session Ended for ${sessionData.childId}(${durationSeconds}s, ${sessionData.messagesExchanged} msgs)`);
        }
    });
});
