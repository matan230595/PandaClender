import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

const FeatureCard: React.FC<{ icon: string; title: string; desc: string; color: string }> = ({ icon, title, desc, color }) => (
  <div className={`p-6 rounded-3xl border-2 ${color} bg-white shadow-sm hover:shadow-md transition-all hover:-translate-y-1`}>
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

const Landing: React.FC = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Navbar */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <span className="text-3xl">🐼</span>
           <h1 className="text-2xl font-black text-slate-800 tracking-tight">PandaClender</h1>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-5 py-2.5 font-bold text-slate-600 hover:text-indigo-600 transition-colors">
            התחבר
          </Link>
          <Link to="/signup" className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-transform hover:scale-105 shadow-lg shadow-slate-200">
            הירשם חינם
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm mb-6 border border-indigo-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
          ✨ הדרך החדשה לנהל את הזמן שלך
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
          ניהול משימות למוחות <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">יצירתיים ו-ADHD</span>
        </h1>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          מערכת חכמה שתוכננה במיוחד כדי לעזור לך להתמקד, להתמיד וליהנות מהדרך. עם גמיפיקציה, תזכורות חכמות ועיצוב שמרגיע את העיניים.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
             <Link to="/signup" className="px-8 py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl hover:bg-indigo-700 transition-all hover:scale-105 shadow-xl shadow-indigo-200 flex items-center justify-center gap-2">
                🚀 מתחילים עכשיו
             </Link>
             <Link to="/login" className="px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 font-black text-lg rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                יש לי כבר חשבון
             </Link>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
                icon="🍅" 
                title="פוקוס ופומודורו" 
                desc="טיימר פוקוס מובנה עם צלילי רקע (רעש חום, בית קפה ועוד) כדי לעזור לך להיכנס ל-Zone."
                color="border-red-100"
            />
             <FeatureCard 
                icon="🎮" 
                title="גמיפיקציה ופרסים" 
                desc="צבור נקודות על כל משימה, פתח הישגים, ועלה רמות. הפוך את המטלות למשחק."
                color="border-indigo-100"
            />
             <FeatureCard 
                icon="🧠" 
                title="מותאם ל-ADHD" 
                desc="ממשק נקי מהסחות דעת, 'מצב התמודדות' למשימות קשות, ותזכורות שלא נותנות לך לשכוח."
                color="border-emerald-100"
            />
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-slate-400 text-sm font-medium border-t border-slate-200">
        © 2024 PandaClender. נוצר באהבה ❤️ עבור מוחות מפוזרים.
      </footer>
    </div>
  );
};

export default Landing;