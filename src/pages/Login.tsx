import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/auth';
import Alert from '../components/Alert';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await authApi.signIn(email, password);
      if (authError) throw authError;
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
          setError('שם המשתמש או הסיסמה שגויים');
      } else {
          setError(err.message || 'ההתחברות נכשלה');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[40px] shadow-xl shadow-slate-200/50 border border-white animate-in zoom-in duration-300">
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
                🐼
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">ברוך שובך!</h2>
            <p className="text-slate-500 font-medium">הזן את הפרטים כדי להיכנס לאזור האישי</p>
        </div>

        <Alert message={error} type="error" />

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 mr-1">אימייל</label>
            <input
                type="email"
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 mr-1">סיסמה</label>
            <input
                type="password"
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white font-bold text-lg rounded-2xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"/> : 'התחבר'}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-50">
          <p className="text-slate-500 font-medium text-sm">
            אין לך עדיין חשבון?{' '}
            <Link to="/signup" className="text-indigo-600 font-bold hover:underline">
              הירשם בחינם
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;