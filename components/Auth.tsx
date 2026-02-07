
import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const Spinner: React.FC = () => (
    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
);

const Auth: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    if (!supabase) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 w-full max-w-sm">
                    <h1 className="text-xl font-bold text-red-800">שגיאת תצורה</h1>
                    <p className="text-slate-700 mt-2">חיבור Supabase נכשל. לא ניתן להמשיך.</p>
                </div>
            </div>
        );
    }

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
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
        } catch (err: any) {
            console.error("Caught exception during auth:", err);
            setError("אירעה שגיאה בלתי צפויה. בדוק את חיבור האינטרנט שלך.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
            });
            if (error) {
                setError(error.message);
                setLoading(false);
            }
            // On success, the page redirects, so no need to explicitly set loading to false.
        } catch (err: any) {
            console.error("Caught exception during Google auth:", err);
            setError("אירעה שגיאה בלתי צפויה.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 transition-all duration-300">
            <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-500">
                <h1 className="text-4xl font-black text-indigo-900">PandaClender</h1>
                <p className="text-slate-500 font-bold">הפוקוס שלך, השקט שלך ✨</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
                <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">{isSignUp ? 'יצירת חשבון חדש' : 'התחברות לחשבון'}</h2>
                <p className="text-slate-500 mb-6 text-sm text-center">כדי לסנכרן את המשימות שלך בין מכשירים.</p>
                
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
                        className="w-full h-12 flex items-center justify-center py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all duration-300 disabled:opacity-75 disabled:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {loading && !isSignUp ? <Spinner /> : (isSignUp ? 'הירשם' : 'התחבר')}
                    </button>
                </form>

                {error && <p className="text-red-600 text-xs mt-4 text-center bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
                {message && <p className="text-emerald-600 text-xs mt-4 text-center bg-emerald-50 p-3 rounded-lg border border-emerald-200">{message}</p>}

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
                    disabled={loading}
                    className="w-full h-12 flex items-center justify-center py-3 px-6 bg-white border-2 border-slate-200 rounded-xl gap-3 font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 disabled:opacity-75">
                    {loading ? <Spinner /> : <><img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google icon" /> המשך עם גוגל</>}
                </button>

                <p className="text-xs text-slate-500 mt-6 text-center">
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
