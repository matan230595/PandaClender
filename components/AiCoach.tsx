
import React, { useState, useEffect } from 'react';
import { Task, UserProgress, Priority } from '../lib/types';
import { generateContentWithFallback } from '../utils/ai';

interface AiCoachProps {
  onClose: () => void;
  tasks: Task[];
  progress: UserProgress;
}

const AiCoach: React.FC<AiCoachProps> = ({ onClose, tasks, progress }) => {
  const [tip, setTip] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTip = async () => {
      setIsLoading(true);
      
      const uncompletedTasks = tasks.filter(t => !t.completed);
      const priorityOrder = { [Priority.URGENT]: 0, [Priority.IMPORTANT]: 1, [Priority.REGULAR]: 2 };
      
      const mostImportantTask = uncompletedTasks.sort((a, b) => {
        return priorityOrder[a.priority] - priorityOrder[b.priority] || a.dueDate.getTime() - b.dueDate.getTime();
      })[0];

      let prompt;
      if (mostImportantTask) {
        prompt = `Act as a supportive ADHD coach. The user is feeling stuck. Their most important task is "${mostImportantTask.title}". Provide one tiny, physical first step (2-5 minutes) to get started on this specific task. For example, if the task is 'write report', suggest 'open a new document and write just the title'. Your response must be in Hebrew, under 50 words, very friendly, and use emojis.`;
      } else {
        prompt = `Act as a supportive ADHD coach. The user has no urgent tasks. Provide one concise, encouraging tip in Hebrew about the importance of rest or celebrating small wins. Your response must be in Hebrew, under 50 words, very friendly, and use emojis.`
      }

      try {
        const response = await generateContentWithFallback(prompt);
        if (response && response.text) {
          setTip(response.text);
        } else {
          setTip("לא הצלחתי להתחבר למאמן ה-AI כרגע. אנא ודא שמפתח ה-API שלך הוגדר כראוי.");
        }
      } catch (error) {
        console.error("AI Coach Error:", error);
        setTip("אוי, משהו השתבש. נסה שוב מאוחר יותר.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTip();
  }, [tasks, progress]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8 flex flex-col gap-6 animate-in zoom-in duration-300 relative">
        <button onClick={onClose} className="absolute top-4 inset-inline-start-4 text-slate-300 hover:text-slate-500 text-2xl font-bold">×</button>
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🤖</div>
          <h2 className="text-2xl font-black text-slate-800">מאמן ה-AI שלך</h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            הנה טיפ קטן ומותאם אישית שיעזור לך להמשיך...
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 min-h-[120px] flex items-center justify-center">
            {isLoading ? (
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            ) : (
                <p className="text-center text-indigo-900 font-bold text-lg leading-relaxed">{tip}</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default AiCoach;