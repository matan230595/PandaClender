
import React, { useState, useEffect, useRef } from 'react';

interface BrainDumpProps {
  onClose: () => void;
  onAddTasks: (titles: string[]) => void;
}

const BrainDump: React.FC<BrainDumpProps> = ({ onClose, onAddTasks }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechRecognitionAvailable, setIsSpeechRecognitionAvailable] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechRecognitionAvailable(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'he-IL';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + '\n';
          }
        }
        setText(prev => prev + transcript);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
        console.warn("Speech Recognition not available in this browser.");
    }
  }, []);

  const handleListen = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
          console.error("Could not start recognition", e);
      }
    }
  };


  const handleSave = () => {
    if (!text.trim()) {
      onClose();
      return;
    }
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    onAddTasks(lines);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-8 flex flex-col gap-6 animate-in zoom-in duration-300 relative">
        <button onClick={onClose} className="absolute top-4 inset-inline-start-4 text-slate-300 hover:text-slate-500 text-2xl font-bold">×</button>
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🧠</div>
          <h2 className="text-2xl font-black text-slate-800">פרוק הכל החוצה (Brain Dump)</h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            הקלט או הקלד כל מה שיושב לך על הראש. כל שורה תהפוך למשימה חדשה.
          </p>
        </div>
        
        <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="למשל:&#10;לקבוע תור לרופא&#10;להחזיר את הספר לספרייה&#10;לקנות מתנה לאמא..."
              className="w-full h-64 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500 focus:ring-0 outline-none text-lg font-medium resize-none transition-all placeholder:text-slate-300"
              autoFocus
            />
            {isSpeechRecognitionAvailable && (
                <div className="absolute bottom-5 inset-inline-end-5 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-lg">{isListening ? 'מקליט...' : 'הקלט קולי'}</span>
                    <button
                        onClick={handleListen}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all text-white ${
                            isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'
                        }`}
                        aria-label={isListening ? 'הפסק הקלטה' : 'התחל הקלטה'}
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z"></path>
                            <path d="M5.5 11.5a.5.5 0 01.5.5v1a4 4 0 004 4h.5a.5.5 0 010 1h-.5a5 5 0 01-5-5v-1a.5.5 0 01.5-.5z"></path>
                            <path d="M10 18.5a.5.5 0 01-1 0v-2.071a5.002 5.002 0 014.288-4.903.5.5 0 11.224.972A4.002 4.002 0 0011 16.429V18.5z"></path>
                        </svg>
                    </button>
                </div>
            )}
        </div>


        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-grow py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            הפוך למשימות 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrainDump;
