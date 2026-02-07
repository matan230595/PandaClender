
import React, { useState, useEffect, useRef } from 'react';
import { getGenAi } from '../utils/ai';
import { encode, decode, decodeAudioData, blobToBase64 } from '../utils/audio';
import { GoogleGenAI, Modality, LiveServerMessage, Blob as GenAiBlob } from "@google/genai";

type Tab = 'conversation' | 'transcription' | 'tts';

interface AiAudioToolsProps {
  onClose: () => void;
}

const AiAudioTools: React.FC<AiAudioToolsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('conversation');
  const [error, setError] = useState('');
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  useEffect(() => {
    getGenAi().then(instance => {
      if (!instance) {
        setError("לא נמצא מפתח API תקין. אנא הגדר אותו בדף ההגדרות.");
      }
      setAi(instance);
    });
  }, []);

  const renderContent = () => {
    if (error) {
      return <div className="text-center text-red-500 font-bold p-8">{error}</div>;
    }
    if (!ai) {
      return <div className="flex justify-center items-center p-8"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;
    }
    switch (activeTab) {
      case 'conversation':
        return <ConversationTab ai={ai} />;
      case 'transcription':
        return <TranscriptionTab ai={ai} />;
      case 'tts':
        return <TtsTab ai={ai} />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{ tabId: Tab, label: string, icon: string }> = ({ tabId, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-4 transition-colors ${activeTab === tabId ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
    >
      <span>{icon}</span> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col animate-in zoom-in duration-300 max-h-[90vh]">
        <div className="p-6 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center text-xl">🎙️</div>
            <h2 className="text-xl font-bold text-slate-800">כלי אודיו AI</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
        </div>
        <div className="flex border-b border-slate-100">
          <TabButton tabId="conversation" label="שיחה חיה" icon="💬" />
          <TabButton tabId="transcription" label="תמלול אודיו" icon="✍️" />
          <TabButton tabId="tts" label="טקסט לדיבור" icon="🔊" />
        </div>
        <div className="flex-grow overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// --- Conversation Tab ---
const ConversationTab: React.FC<{ ai: GoogleGenAI }> = ({ ai }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [transcriptionHistory, setTranscriptionHistory] = useState<{ speaker: 'user' | 'model'; text: string }[]>([]);
    const sessionPromise = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    let nextStartTime = 0;
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const sources = new Set<AudioBufferSourceNode>();

    const startSession = async () => {
        setIsSessionActive(true);
        setTranscriptionHistory([]);

        let currentInputTranscription = '';
        let currentOutputTranscription = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            sessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        audioContextRef.current = inputAudioContext;
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: GenAiBlob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromise.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            setTranscriptionHistory(prev => [...prev, 
                                { speaker: 'user', text: currentInputTranscription },
                                { speaker: 'model', text: currentOutputTranscription }
                            ]);
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                        }
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);
                            source.addEventListener('ended', () => sources.delete(source));
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            sources.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => console.error("Live session error:", e),
                    onclose: () => {},
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
            });
        } catch (err) {
            console.error("Microphone access denied:", err);
            setIsSessionActive(false);
        }
    };

    const stopSession = () => {
        setIsSessionActive(false);
        if (sessionPromise.current) {
            sessionPromise.current.then(session => session.close());
            sessionPromise.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if(scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        sources.forEach(source => source.stop());
        sources.clear();
    };
    
    useEffect(() => stopSession, []); // Cleanup on unmount

    return (
        <div className="p-6 flex flex-col h-full gap-4">
            <div className="flex-grow bg-slate-50 rounded-xl p-4 space-y-3 overflow-y-auto">
                {transcriptionHistory.map((entry, i) => (
                    <div key={i} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <p className={`max-w-[80%] p-3 rounded-2xl ${entry.speaker === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                           {entry.text}
                        </p>
                    </div>
                ))}
                 {!isSessionActive && transcriptionHistory.length === 0 && <p className="text-center text-slate-400 pt-16">לחץ על הכפתור כדי להתחיל שיחה</p>}
            </div>
            <button
                onClick={isSessionActive ? stopSession : startSession}
                className={`w-full py-4 rounded-xl font-bold text-white transition-colors ${isSessionActive ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                {isSessionActive ? 'סיים שיחה' : 'התחל שיחה חיה'}
            </button>
        </div>
    );
};

// --- Transcription Tab ---
const TranscriptionTab: React.FC<{ ai: GoogleGenAI }> = ({ ai }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcribedText, setTranscribedText] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        setTranscribedText('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = transcribeAudio;
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied:", err);
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            // The onstop event will trigger transcription
            setIsRecording(false);
            setIsTranscribing(true);
        }
    };

    const transcribeAudio = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
            const base64Audio = await blobToBase64(audioBlob);
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { parts: [{ inlineData: { mimeType: 'audio/webm', data: base64Audio } }, {text: "Transcribe this audio."}] },
            });
            setTranscribedText(response.text ?? '');
        } catch (err) {
            console.error("Transcription error:", err);
            setTranscribedText("שגיאה בתמלול. נסה שוב.");
        } finally {
            setIsTranscribing(false);
        }
    };

    return (
        <div className="p-6 text-center space-y-6">
            <h3 className="text-lg font-bold text-slate-700">הקלט ותמלל</h3>
            <p className="text-sm text-slate-500">לחץ על המיקרופון כדי להתחיל להקליט. לחץ שוב כדי לעצור ולקבל תמלול.</p>
            <button onClick={isRecording ? stopRecording : startRecording} disabled={isTranscribing}
                className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white text-4xl transition-all shadow-lg disabled:opacity-50 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'}`}>
                🎙️
            </button>
            <div className="bg-slate-50 rounded-xl p-4 min-h-[120px] text-start">
                {isTranscribing ? 'מעבד...' : transcribedText || <span className="text-slate-400">התמלול שלך יופיע כאן...</span>}
            </div>
        </div>
    );
};


// --- TTS Tab ---
const TtsTab: React.FC<{ ai: GoogleGenAI }> = ({ ai }) => {
    const [text, setText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState('Kore');
    const audioContextRef = useRef<AudioContext | null>(null);

    const generateSpeech = async () => {
        if (!text.trim() || isGenerating) return;
        setIsGenerating(true);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
            }
        } catch (err) {
            console.error("TTS error:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    const voices = ['Kore', 'Puck', 'Zephyr', 'Charon', 'Fenrir'];

    return (
        <div className="p-6 space-y-4">
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="הקלד טקסט כאן..."
                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none"
            />
            <div className="flex gap-4">
                <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold">
                    {voices.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <button onClick={generateSpeech} disabled={isGenerating || !text.trim()} className="flex-grow py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50">
                    {isGenerating ? 'מייצר...' : 'הפוך לדיבור'}
                </button>
            </div>
        </div>
    );
};

export default AiAudioTools;