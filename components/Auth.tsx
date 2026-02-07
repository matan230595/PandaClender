import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const Spinner: React.FC = () => (
    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
);

const getSupabaseErrorMessage = (message: string): string => {
    if (message.includes("Invalid login credentials")) {
        return "אימייל או סיסמה שגויים. אנא נסה שוב.";
    }
    if (message.includes("User already registered")) {
        return "משתמש עם כתובת אימייל זו כבר קיים.";
    }
    if (message.includes("Password should be at least 6 characters")) {
        return "הסיסמה חייבת להכיל לפחות 6 תווים.";
    }
    if (message.includes("Unable to validate email address")) {
        return "כתובת האימייל אינה תקינה.";
    }
    return "אירעה שגיאה. אנא בדוק את הפרטים ונסה שוב.";
};

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

        const { error: authError } = isSignUp
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            setError(getSupabaseErrorMessage(authError.message));
        } else if (isSignUp) {
            setMessage('נשלח מייל אימות! אנא בדוק את תיבת הדואר הנכנס שלך.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 w-full max-w-sm">
                <h1 className="text-3xl font-bold text-indigo-900">PandaClender</h1>
                <p className="text-slate-500 text-sm mt-1 mb-6">הפוקוס שלך, השקט שלך ✨</p>

                <h2 className="text-xl font-bold text-slate-800 mb-4">{isSignUp ? 'הרשמה' : 'התחברות'}</h2>
                <form onSubmit={handleAuthAction} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="כתובת אימייל"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="סיסמה"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                    {message && <p className="text-emerald-500 text-xs">{message}</p>}
                    <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center disabled:opacity-50">
                        {loading ? <Spinner /> : isSignUp ? 'הירשם' : 'התחבר'}
                    </button>
                </form>
                <div className="mt-6 text-sm">
                    <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }} className="text-indigo-600 hover:underline">
                        {isSignUp ? 'יש לך כבר חשבון? התחבר' : 'אין לך חשבון? הירשם'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
