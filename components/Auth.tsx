
import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const Auth: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        const authFunction = isSignUp 
            ? supabase.auth.signUp 
            : supabase.auth.signInWithPassword;
        
        const { error } = await authFunction({ email, password });

        if (error) {
            setError(error.message);
        } else if (isSignUp) {
            setMessage('נשלח מייל אימות! אנא בדוק את תיבת הדואר שלך.');
        }
        // On successful sign-in, the onAuthStateChange listener in App.tsx will handle the state change.
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setError('');
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
        });
        if (error) setError(error.message);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <h1 className="text-4xl font-bold text-indigo-900 mb-2">PandaClender</h1>
            <p className="text-slate-500 mb-8">הפוקוס שלך, השקט שלך ✨</p>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 w-full max-w-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-4">{isSignUp ? 'הרשמה' : 'התחברות'}</h2>
                <p className="text-slate-500 mb-6 text-sm">כדי לסנכרן את המשימות שלך בין מכשירים.</p>
                
                <form onSubmit={handleAuthAction} className="space-y-4 text-end">
                    <div>
                        <label htmlFor="email" className="sr-only">אימייל</label>
                        <input 
                            id="email"
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="אימייל" 
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" 
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">סיסמה</label>
                        <input 
                            id="password"
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="סיסמה (לפחות 6 תווים)" 
                            required
                            minLength={6}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" 
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'טוען...' : (isSignUp ? 'הירשם' : 'התחבר')}
                    </button>
                </form>

                {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
                {message && <p className="text-emerald-500 text-xs mt-4">{message}</p>}

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-slate-400">או</span>
                    </div>
                </div>

                <button 
                    onClick={handleGoogleLogin} 
                    className="w-full py-3 px-6 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center gap-3 font-bold text-slate-700 hover:border-slate-300 transition-colors">
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google icon" />
                    המשך עם גוגל
                </button>

                <p className="text-xs text-slate-500 mt-6">
                    {isSignUp ? 'כבר יש לך חשבון? ' : 'אין לך חשבון? '}
                    <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }} className="font-bold text-indigo-600 hover:underline">
                        {isSignUp ? 'התחבר' : 'הירשם'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;