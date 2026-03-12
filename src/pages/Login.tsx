import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await authLogin(login, password);
    if (success) {
      navigate('/');
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-6">
            <img 
              src="/logo-da-esquerda.png.PNG" 
              alt="Logo Esquerda" 
              className="w-20 h-20 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <img 
              src="/logo-do-meio.png.PNG" 
              alt="Logo Meio" 
              className="w-32 h-32 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <img 
              src="/logo-da-direita.png.png" 
              alt="Logo Direita" 
              className="w-20 h-20 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">BANG RANKING</h1>
          <p className="text-slate-400 font-bold tracking-wider">LEANDRO BANG FIGHT E FITNESS</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Login</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Digite seu login"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-orange-500/20"
          >
            ENTRAR
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm mb-2">Não tem conta?</p>
          <button
            onClick={() => navigate('/register')}
            className="text-orange-500 hover:text-orange-400 font-bold text-sm transition-colors"
          >
            CRIAR CONTA DE ALUNO
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Leandro Bang Fight e Fitness &copy; 2024
        </div>
      </div>
    </div>
  );
}
