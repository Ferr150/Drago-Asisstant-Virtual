
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, Blob as GenAI_Blob, FunctionCall } from '@google/genai';
import { Message, Sender, Reminder, SearchSource } from './types';
import { DragoCoreIcon, MicrophoneIcon, StopIcon, InfoIcon, GearIcon, BellIcon, WindowCloseIcon, WindowMinimizeIcon, WebSearchIcon, UserIcon, CpuChipIcon } from './components/Icons';

type Status = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
type Language = 'en' | 'es';
type RightPanelContent = { type: 'welcome' } | { type: 'search'; data: SearchSource[] } | { type: 'settings'; };

interface LiveSession {
    sendRealtimeInput(input: { media: GenAI_Blob }): void;
    sendToolResponse(response: { functionResponses: { id: string, name: string, response: { result: any } } }): void;
    close(): void;
}

const translations = {
    title: { en: 'D R A G O', es: 'D R A G O' },
    listeningMessage: { en: 'Listening...', es: 'Escuchando...' },
    startMessage: { en: 'System Idle. Engage Core.', es: 'Sistema Inactivo. Inicia el Núcleo.' },
    reminderHeader: { en: 'CRONO-ALERTAS', es: 'CRONO-ALERTAS' },
    systemStatusHeader: { en: 'SYSTEM STATUS', es: 'ESTADO DEL SISTEMA' },
    reminderAt: { en: 'at', es: 'a las' },
    reminderPopupTitle: { en: 'ALERT', es: 'ALERTA' },
    dismissButton: { en: 'Acknowledge', es: 'Confirmado' },
    startListeningLabel: { en: 'Engage Core', es: 'Iniciar Núcleo' },
    stopListeningLabel: { en: 'Disengage Core', es: 'Detener Núcleo' },
    minimizeLabel: { en: 'Minimize', es: 'Minimizar' },
    closeLabel: { en: 'Close', es: 'Cerrar' },
    restoreLabel: { en: 'Restore Drago', es: 'Restaurar Drago' },
    apiKeyError: { en: "API key not found. Please ensure it is configured correctly.", es: "Clave de API no encontrada. Por favor, asegúrate de que esté configurada correctamente." },
    micError: { en: "Failed to start microphone: {message}", es: "Fallo al iniciar el micrófono: {message}" },
    unknownError: { en: "An unknown error occurred.", es: "Ocurrió un error desconocido." },
    apiError: { en: "An error occurred: {message}", es: "Ocurrió un error: {message}" },
    search_results_title: { en: "Web Context", es: "Contexto Web" },
    responses: {
        system_control: { en: "Understood. Simulating computer {action}. As a web-based assistant, I can't perform this action directly for security reasons.", es: "Entendido. Simulando {action} de la computadora. Como asistente web, no puedo realizar esta acción directamente por razones de seguridad." },
        application_control: { en: 'Acknowledged. Simulating {action} of "{appName}". Since I\'m running in a browser, I can\'t directly interact with your desktop applications.', es: 'Recibido. Simulando {action} de "{appName}". Como estoy en un navegador, no puedo interactuar directamente con tus aplicaciones de escritorio.' },
        media_control: { en: "Okay, simulating {action}{target}. I'm unable to control media playback in other applications.", es: "De acuerdo, simulando {action}{target}. No puedo controlar la reproducción multimedia en otras aplicaciones." },
        set_reminder_success: { en: 'Okay, I\'ve set a reminder for you to "{reminderText}" {confirmation}.', es: 'De acuerdo, he programado un recordatorio para "{reminderText}" {confirmation}.' },
        set_reminder_fail: { en: "I'm sorry, I couldn't understand the time for the reminder. Please try again.", es: "Lo siento, no pude entender la hora para el recordatorio. Por favor, inténtalo de nuevo." },
        searching_web: { en: "Consulting the network for: '{query}'...", es: "Consultando la red sobre: '{query}'..." },
        general_fail: { en: "I'm sorry, I encountered an issue with that command.", es: "Lo siento, encontré un problema con ese comando." }
    },
    systemInstruction: {
        en: 'You are Drago, a highly intelligent and versatile virtual assistant. Your primary purpose is to be a helpful and knowledgeable partner. You can answer general knowledge questions, explain complex topics, write creative text, and engage in conversation on any subject. In addition to your conversational abilities, you can also control the user\'s computer by using the provided tools for system control, application management, media playback, and setting reminders. Use the web_search tool only when the user\'s query requires real-time, up-to-the-minute information (like recent news, stock prices, or weather). For all other questions, rely on your own extensive internal knowledge. For actions you cannot perform due to security limitations (like shutting down the PC), first acknowledge the command as if you are doing it, then politely explain the simulation and limitation. Be concise, friendly, and knowledgeable.',
        es: 'Eres Drago, un asistente virtual muy inteligente y versátil. Tu propósito principal es ser un compañero útil y bien informado. Puedes responder preguntas de conocimiento general, explicar temas complejos, escribir textos creativos y conversar sobre cualquier tema. Además de tus capacidades de conversación, también puedes controlar la computadora del usuario utilizando las herramientas proporcionadas para control del sistema, gestión de aplicaciones, reproducción de medios y programación de recordatorios. Utiliza la herramienta web_search solo cuando la consulta del usuario requiera información en tiempo real y de último minuto (como noticias recientes, precios de acciones o el clima). Para todas las demás preguntas, confía en tu propio y extenso conocimiento interno. Para acciones que no puedes realizar debido a las limitaciones de seguridad (como apagar el PC), primero confirma el comando como si lo estuvieras haciendo, y luego explica cortésmente la simulación y la limitación. Sé conciso, amigable y erudito.'
    }
};

// Audio Utility Functions
function decode(base64: string): Uint8Array { const binaryString = atob(base64); const len = binaryString.length; const bytes = new Uint8Array(len); for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); } return bytes; }
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> { const dataInt16 = new Int16Array(data.buffer); const frameCount = dataInt16.length / numChannels; const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate); for (let channel = 0; channel < numChannels; channel++) { const channelData = buffer.getChannelData(channel); for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; } } return buffer; }
function encode(bytes: Uint8Array): string { let binary = ''; const len = bytes.byteLength; for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); } return btoa(binary); }
function createBlob(data: Float32Array): GenAI_Blob { const l = data.length; const int16 = new Int16Array(l); for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; } return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000', }; }

const functionDeclarations: FunctionDeclaration[] = [ { name: 'system_control', description: 'Handles system-level commands like shutting down or restarting the computer.', parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, description: 'The system action to perform.', enum: ['SHUTDOWN', 'RESTART'] } }, required: ['action'] }, }, { name: 'application_control', description: 'Opens or closes applications on the user\'s computer.', parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, description: 'The application action to perform.', enum: ['OPEN', 'CLOSE'] }, applicationName: { type: Type.STRING, description: 'The name of the application to control, e.g., "Spotify", "Chrome".' } }, required: ['action', 'applicationName'] }, }, { name: 'media_control', description: 'Controls media playback, such as pausing, playing, or adjusting volume.', parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, description: 'The media action to perform.', enum: ['PLAY', 'PAUSE', 'VOLUME_UP', 'VOLUME_DOWN'] }, target: { type: Type.STRING, description: 'Optional target like "YouTube" or "Spotify".' } }, required: ['action'] }, }, { name: 'set_reminder', description: 'Sets a reminder for the user for a future time. Can be a specific time or a delay.', parameters: { type: Type.OBJECT, properties: { reminderText: { type: Type.STRING, description: 'The content of the reminder, e.g., "call mom".' }, delayMinutes: { type: Type.NUMBER, description: 'The delay in minutes from now for the reminder. Use for phrases like "in 5 minutes".' }, specificTime: { type: Type.STRING, description: 'A specific time for the reminder in HH:MM AM/PM format, e.g., "4:00 PM". Use for phrases like "at 4 PM".' } }, required: ['reminderText'] }, }, { name: 'web_search', description: 'Searches the web for information on a given topic.', parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: 'The search query or topic to look up on the web.' } }, required: ['query'] } }];

const Header = ({ onMinimize, onClose, onSettingsClick, language }: { onMinimize: () => void; onClose: () => void; onSettingsClick: () => void, language: Language }) => (
    <header className="flex justify-between items-center h-12 px-4 flex-shrink-0 z-20 border-b border-slate-700/50 bg-slate-900/50">
        <h1 className="text-lg font-bold text-slate-200 tracking-widest font-mono">{translations.title[language]}</h1>
        <div className="flex items-center gap-1">
            <button onClick={onSettingsClick} className="text-slate-400 hover:text-white hover:bg-white/10 transition-colors p-2 rounded-full">
                <GearIcon className="w-5 h-5" />
            </button>
            <div className="w-px h-5 bg-slate-700 mx-2"></div>
            <button onClick={onMinimize} className="text-slate-400 hover:text-white hover:bg-white/10 transition-colors p-2 rounded-full" title={translations.minimizeLabel[language]}>
                <WindowMinimizeIcon className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors p-2 rounded-full" title={translations.closeLabel[language]}>
                <WindowCloseIcon className="w-5 h-5" />
            </button>
        </div>
    </header>
);

const LeftSidebar = ({ reminders, language }: { reminders: Reminder[], language: Language }) => (
    <aside className="w-64 flex-shrink-0 p-4 border-r border-slate-700/50 flex flex-col gap-6">
        <div>
            <h4 className="text-xs font-bold text-cyan-300/70 mb-3 tracking-widest font-mono">{translations.systemStatusHeader[language]}</h4>
            <div className="text-sm space-y-3 font-mono">
                <div className="flex justify-between items-center">
                    <span className="text-slate-400">Core</span>
                    <span className="text-green-400">Online</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-400">Network</span>
                    <span className="text-green-400">Stable</span>
                </div>
            </div>
        </div>
        <div>
            <h4 className="text-xs font-bold text-cyan-300/70 mb-3 tracking-widest font-mono flex items-center gap-2">
                <BellIcon className="w-4 h-4" />
                {translations.reminderHeader[language]}
            </h4>
            {reminders.length > 0 ? (
                <ul className="text-sm text-slate-300 space-y-2 custom-scrollbar pr-2">
                    {reminders.map(r => (
                        <li key={r.id} className="p-2 rounded-md bg-slate-800/50 border-l-2 border-cyan-400">
                            <p className="text-slate-200 text-xs">{r.text}</p>
                            <p className="text-xs text-slate-400 mt-1">{translations.reminderAt[language]} {new Date(r.dueTime).toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-slate-500 text-xs italic mt-2">No upcoming alerts.</p>
            )}
        </div>
    </aside>
);

const RightSidebar = ({ content, language, onLanguageChange }: { content: RightPanelContent, language: Language, onLanguageChange: (lang: Language) => void }) => (
    <aside className="w-80 flex-shrink-0 p-4 border-l border-slate-700/50 slide-in-from-right bg-slate-900/20 overflow-y-auto custom-scrollbar">
        {content.type === 'search' && (
            <div>
                <h4 className="text-xs font-bold text-violet-300/70 mb-3 tracking-widest font-mono flex items-center gap-2">
                    <WebSearchIcon className="w-4 h-4"/>
                    {translations.search_results_title[language]}
                </h4>
                <ul className="space-y-2">
                    {content.data.map(source => (
                        <li key={source.uri}>
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-300/80 hover:text-violet-200 hover:underline block transition-colors p-2 rounded-md bg-slate-800/50" title={source.title}>
                                {source.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}
        {content.type === 'settings' && (
            <div>
                <h4 className="text-xs font-bold text-violet-300/70 mb-3 tracking-widest font-mono">Language / Idioma</h4>
                 <button onClick={() => onLanguageChange('es')} className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${language === 'es' ? 'bg-violet-700/50 text-slate-100' : 'text-slate-300 hover:bg-white/10'}`}>Español</button>
                 <button onClick={() => onLanguageChange('en')} className={`block w-full text-left px-3 py-2 mt-1 text-sm rounded-md transition-colors ${language === 'en' ? 'bg-violet-700/50 text-slate-100' : 'text-slate-300 hover:bg-white/10'}`}>English</button>
            </div>
        )}
    </aside>
);

export default function App() {
    const [status, setStatus] = useState<Status>('idle');
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [activeNotification, setActiveNotification] = useState<Reminder | null>(null);
    const [language, setLanguage] = useState<Language>('es');
    const [isMinimized, setIsMinimized] = useState(false);
    const [rightPanelContent, setRightPanelContent] = useState<RightPanelContent>({ type: 'welcome' });
    const [liveTranscription, setLiveTranscription] = useState('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const inputTranscriptionRef = useRef('');
    const outputTranscriptionRef = useRef('');
    const conversationEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => { conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const addMessage = useCallback((sender: Sender, text: string, searchResult?: SearchSource[]) => {
        if (!text.trim()) return;
        setMessages(prev => [...prev, { id: Date.now().toString(), sender, text, timestamp: new Date().toISOString(), searchResult }]);
        if(searchResult && searchResult.length > 0) {
            setRightPanelContent({ type: 'search', data: searchResult });
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setReminders(currentReminders => {
                const updatedReminders = [...currentReminders];
                const reminderToNotify = updatedReminders.find(r => r.dueTime <= now && !r.notified);
                if (reminderToNotify) {
                    setActiveNotification(reminderToNotify);
                    addMessage(Sender.System, `${translations.reminderPopupTitle[language]}: ${reminderToNotify.text}`);
                    return updatedReminders.map(r => r.id === reminderToNotify.id ? { ...r, notified: true } : r);
                }
                return currentReminders;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [addMessage, language]);
    
    const handleFunctionCall = useCallback((fc: FunctionCall) => {
        const handleAsync = async () => {
            switch (fc.name) {
                case 'system_control': { const systemAction = fc.args.action as string; addMessage(Sender.Drago, translations.responses.system_control[language].replace('{action}', systemAction.toLowerCase())); break; }
                case 'application_control': { const appAction = fc.args.action as string; const appName = fc.args.applicationName as string; addMessage(Sender.Drago, translations.responses.application_control[language].replace('{action}', appAction.toLowerCase()).replace('{appName}', appName)); break; }
                case 'media_control': { const mediaAction = fc.args.action as string; const target = fc.args.target ? ' on ' + fc.args.target : ''; addMessage(Sender.Drago, translations.responses.media_control[language].replace('{action}', mediaAction.toLowerCase().replace('_', ' ')).replace('{target}', target)); break; }
                case 'set_reminder': { const { reminderText, delayMinutes, specificTime } = fc.args; let dueTime = 0; let confirmation = ''; if (delayMinutes && typeof delayMinutes === 'number') { dueTime = Date.now() + delayMinutes * 60 * 1000; confirmation = language === 'es' ? `en ${delayMinutes} minuto${delayMinutes > 1 ? 's' : ''}` : `in ${delayMinutes} minute${delayMinutes > 1 ? 's' : ''}`; } else if (specificTime && typeof specificTime === 'string') { const now = new Date(); const timeParts = specificTime.match(/(\d+):(\d+)\s*(AM|PM)/i); if (timeParts) { let hours = parseInt(timeParts[1], 10); const minutes = parseInt(timeParts[2], 10); const period = timeParts[3].toUpperCase(); if (period === 'PM' && hours < 12) hours += 12; if (period === 'AM' && hours === 12) hours = 0; const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0); if (reminderDate.getTime() < now.getTime()) { reminderDate.setDate(reminderDate.getDate() + 1); } dueTime = reminderDate.getTime(); confirmation = `${translations.reminderAt[language]} ${specificTime}`; } } if (dueTime > 0 && reminderText) { const newReminder: Reminder = { id: 'rem-' + Date.now(), text: reminderText as string, dueTime, notified: false }; setReminders(prev => [...prev, newReminder].sort((a, b) => a.dueTime - b.dueTime)); addMessage(Sender.Drago, translations.responses.set_reminder_success[language].replace('{reminderText}', reminderText as string).replace('{confirmation}', confirmation)); } else { addMessage(Sender.Drago, translations.responses.set_reminder_fail[language]); } break; }
                case 'web_search': {
                    const query = fc.args.query as string;
                    if (!query) { addMessage(Sender.Drago, translations.responses.general_fail[language]); break; }
                    setStatus('processing');
                    addMessage(Sender.System, translations.responses.searching_web[language].replace('{query}', query));
                    try {
                        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: query, config: { tools: [{ googleSearch: {} }] } });
                        const sources: SearchSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({ uri: chunk.web?.uri, title: chunk.web?.title })).filter((source: any) => source.uri && source.title) ?? [];
                        const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());
                        addMessage(Sender.Drago, response.text, uniqueSources);
                    } catch (e) { console.error("Search error:", e); addMessage(Sender.Drago, translations.responses.general_fail[language]); }
                    finally { if (status !== 'idle') setStatus('listening'); }
                    break;
                }
                default: addMessage(Sender.Drago, translations.responses.general_fail[language]);
            }
        };
        handleAsync();
    }, [addMessage, language, status]);

    const stopConversation = useCallback(async () => {
        setStatus('idle');
        setLiveTranscription('');
        if (sessionPromiseRef.current) { try { const session = await sessionPromiseRef.current; session.close(); } catch (e) { console.error("Error closing session:", e); } finally { sessionPromiseRef.current = null; } }
        if (scriptProcessorRef.current) { scriptProcessorRef.current.disconnect(); scriptProcessorRef.current = null; }
        if (mediaStreamSourceRef.current) { mediaStreamSourceRef.current.disconnect(); mediaStreamSourceRef.current = null; }
        if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(track => track.stop()); mediaStreamRef.current = null; }
    }, []);

    const startConversation = useCallback(async () => {
        setError(null); setStatus('processing');
        if (!process.env.API_KEY) { setError(translations.apiKeyError[language]); setStatus('error'); return; }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaStreamRef.current = stream;
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 }); audioContextRef.current = inputAudioContext;
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const outputNode = outputAudioContext.createGain(); outputNode.connect(outputAudioContext.destination);
            let nextStartTime = 0; const sources = new Set<AudioBufferSourceNode>();
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }, systemInstruction: translations.systemInstruction[language], tools: [{ functionDeclarations }], inputAudioTranscription: {}, outputAudioTranscription: {}, },
                callbacks: {
                    onopen: () => {
                        setStatus('listening'); addMessage(Sender.System, translations.listeningMessage[language]);
                        const source = inputAudioContext.createMediaStreamSource(stream); mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1); scriptProcessorRef.current = scriptProcessor;
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => { const inputData = audioProcessingEvent.inputBuffer.getChannelData(0); const pcmBlob = createBlob(inputData); if (sessionPromiseRef.current) { sessionPromiseRef.current.then((session) => { session.sendRealtimeInput({ media: pcmBlob }); }); } };
                        source.connect(scriptProcessor); scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) { outputTranscriptionRef.current += message.serverContent.outputTranscription.text; }
                        if (message.serverContent?.inputTranscription) { 
                            inputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                            setLiveTranscription(inputTranscriptionRef.current);
                        }
                        if (message.serverContent?.turnComplete) { 
                            if (inputTranscriptionRef.current.trim()) {
                                addMessage(Sender.User, inputTranscriptionRef.current);
                            }
                            if (!message.toolCall?.functionCalls && outputTranscriptionRef.current.trim()) {
                                addMessage(Sender.Drago, outputTranscriptionRef.current); 
                            }
                            inputTranscriptionRef.current = ''; 
                            outputTranscriptionRef.current = ''; 
                            setLiveTranscription('');
                        }
                        if (message.toolCall?.functionCalls) { for (const fc of message.toolCall.functionCalls) { handleFunctionCall(fc); if (sessionPromiseRef.current) { sessionPromiseRef.current.then((session) => { session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: 'ok' } } }); }); } } }
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            setStatus('speaking'); nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource(); source.buffer = audioBuffer; source.connect(outputNode);
                            source.addEventListener('ended', () => { sources.delete(source); if (sources.size === 0) setStatus('listening'); });
                            source.start(nextStartTime); nextStartTime += audioBuffer.duration; sources.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => { const errorMessage = (e as any).message || 'Unknown live connection error'; setError(translations.apiError[language].replace('{message}', errorMessage)); setStatus('error'); stopConversation(); },
                    onclose: () => {},
                }
            });
        } catch (err) { if (err instanceof Error) { setError(translations.micError[language].replace('{message}', err.message)); } else { setError(translations.unknownError[language]); } setStatus('error'); }
    }, [handleFunctionCall, stopConversation, addMessage, language]);

    const handleMicClick = () => { if (status === 'listening' || status === 'processing' || status === 'speaking') { stopConversation(); } else { startConversation(); } };
    
    const handleClose = useCallback(() => {
        stopConversation();
        setMessages([]);
        setError(null);
        setRightPanelContent({ type: 'welcome' });
    }, [stopConversation]);
    
    const toggleSettings = () => {
        setRightPanelContent(prev => prev.type === 'settings' ? {type: 'welcome'} : {type: 'settings'});
    };
    const setLangAndCloseSettings = (lang: Language) => {
        setLanguage(lang);
        setRightPanelContent({type: 'welcome'});
    }


    const upcomingReminders = reminders.filter(r => !r.notified);

    if (isMinimized) {
        return (
            <div className="fixed bottom-8 right-8 z-50 fade-in">
                <button onClick={() => setIsMinimized(false)} className="w-20 h-20 group" aria-label={translations.restoreLabel[language]} title={translations.restoreLabel[language]}>
                    <DragoCoreIcon className="w-full h-full" status={status}/>
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden relative selection:bg-cyan-500/30">
            {activeNotification && (
                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-50 backdrop-blur-sm fade-in">
                    <div className="bg-slate-800 border border-violet-500/30 rounded-lg p-8 max-w-sm text-center shadow-2xl shadow-violet-500/20 w-full mx-4">
                        <h3 className="text-2xl font-bold text-violet-300 mb-4 tracking-widest uppercase">{translations.reminderPopupTitle[language]}</h3>
                        <p className="text-lg mb-8 font-light text-slate-200">{activeNotification.text}</p>
                        <button onClick={() => setActiveNotification(null)} className="bg-violet-600 hover:bg-violet-500 border border-violet-400 text-white font-bold py-2 px-8 rounded-md transition-all duration-300 uppercase tracking-wider text-sm">
                            {translations.dismissButton[language]}
                        </button>
                    </div>
                </div>
            )}
            
            <Header onMinimize={() => setIsMinimized(true)} onClose={handleClose} onSettingsClick={toggleSettings} language={language} />

            <div className="flex-grow flex overflow-hidden">
                <LeftSidebar reminders={upcomingReminders} language={language} />
                <main className="flex-grow flex flex-col relative">
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
                         {messages.map((msg) => (
                             <div key={msg.id} className={`flex items-start gap-3 mb-6 max-w-4xl mx-auto fade-in ${msg.sender === Sender.User ? 'flex-row-reverse' : 'flex-row'}`}>
                                {msg.sender === Sender.System ? (
                                    <div className="w-full text-center text-amber-400/80 text-sm italic font-light py-2">
                                        {msg.text}
                                    </div>
                                ) : (
                                    <div className={`p-3 px-4 rounded-lg shadow-md max-w-xl ${
                                        msg.sender === Sender.User ? 'bg-slate-700 border-l-4 border-cyan-400' : 'bg-slate-800 border-l-4 border-violet-500'
                                    }`}>
                                        <p className="font-light whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                        {messages.length === 0 && <div className="flex items-center justify-center h-full text-slate-500 text-lg font-light tracking-widest uppercase">{translations.startMessage[language]}</div>}
                        <div ref={conversationEndRef} />
                    </div>
                     {liveTranscription && (status === 'listening' || status === 'speaking') && (
                        <div className="flex-shrink-0 px-6 pb-4 text-center fade-in">
                            <p className="text-slate-400 italic max-w-4xl mx-auto">{liveTranscription}</p>
                        </div>
                    )}
                    {error && (
                        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex justify-center items-center z-20">
                            <div className="flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-500/30 px-4 py-2 rounded-lg backdrop-blur-sm">
                                <InfoIcon className="w-5 h-5"/>
                                <span className="text-sm">{error}</span>
                            </div>
                        </div>
                    )}
                    <footer className="w-full flex-shrink-0 h-28 flex items-center justify-center z-10 bg-gradient-to-t from-slate-900/50 to-transparent">
                         <button onClick={handleMicClick} disabled={status === 'processing'} className="w-24 h-24 relative group disabled:opacity-50 disabled:cursor-wait" aria-label={status === 'listening' ? translations.stopListeningLabel[language] : translations.startListeningLabel[language]}>
                            <DragoCoreIcon className="w-full h-full" status={status}/>
                            <div className="absolute inset-0 flex items-center justify-center text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {status === 'listening' || status === 'speaking' || status === 'processing' ? <StopIcon className="w-8 h-8" /> : <MicrophoneIcon className="w-8 h-8" />}
                            </div>
                        </button>
                    </footer>
                </main>
                {rightPanelContent.type !== 'welcome' && <RightSidebar content={rightPanelContent} language={language} onLanguageChange={setLangAndCloseSettings}/>}
            </div>
        </div>
    );
}
