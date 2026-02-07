
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { generateContentWithFallback } from '../utils/ai';

interface StruggleModeModalProps {
  task: Task;
  onClose: () => void;
}

const StruggleModeModal: React.FC<StruggleModeModalProps> = ({ task, onClose }) => {
  const [microTasks, setMicroTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getMicroTasks = async () => {
      setIsLoading(true);
      setError('');
      const prompt = `You are an ADHD coach. Break down the following task into 3-5 extremely small, actionable micro-steps that can be done in 2-5 minutes each to build momentum. The user is feeling stuck. Your tone should be encouraging. Return ONLY a valid JSON object with a key "steps" which is an array of strings. Task: "${task.title}"`;
      
      try {
        const response = await generateContentWithFallback(prompt, { responseMimeType: 'application/json' });
        if (response) {
            try {
                // Clean potential markdown and parse
                const jsonText = (response.text || '').replace(/```json|```/g, '').trim();
                const parsed = JSON.parse(jsonText);
                if (parsed.steps && Array.isArray(parsed.steps)) {
                    setMicroTasks(parsed.steps);
                } else {
                    throw new Error("Invalid JSON structure from AI.");
                }
            } catch (e) {
                console.error("JSON parsing error:", e);
                setError("ה-AI החזיר תשובה בפורמט לא תקין. נסה שוב.");
            }
        } else {
          setError("לא ניתן היה ליצור קשר עם מאמן ה-AI. בדוק את מפתח ה-API שלך.");
        }
      } catch (err) {
        console.error("Struggle Mode AI Error:", err);
        setError("אוי, משהו השתבש בדרך. נסה שוב מאוחר יותר.");
      } finally {
        setIsLoading(false);
      }
    };

    getMicroTasks();
  }, [task]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8 flex flex-col gap-6 animate-in zoom-in duration-300 relative">
        <button onClick={onClose} className="absolute top-4 inset-inline-start-4 text-slate-300 hover:text-slate-500 text-2xl font-bold">×</button>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🆘</div>
          <h2 className="text-2xl font-black text-slate-800">מצב התמודדות</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            מרגיש תקוע עם "{task.title}"? בוא נפרק את זה!
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 min-h-[160px] flex items-center justify-center">
            {isLoading ? (
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            ) : error ? (
                <p className="text-center text-red-600 font-bold">{error}</p>
            ) : (
                <div className="space-y-3 text-start w-full">
                    <h3 className="text-sm font-bold text-indigo-700">צעדים קטנים להתחיל איתם:</h3>
                    {microTasks.map((step, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center font-bold text-xs shrink-0 mt-1">{index + 1}</div>
                            <p className="text-slate-800 font-medium">{step}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <button onClick={onClose} className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold">הבנתי, תודה!</button>
      </div>
    </div>
  );
};

export default StruggleModeModal;