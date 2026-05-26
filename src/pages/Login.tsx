import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import images directly so Vite bundles them correctly
import logoEsquerda from '../assets/logo-da-esquerda.png.PNG';
import logoMeio from '../assets/logo-do-meio.png.PNG';
import logoDireita from '../assets/logo-da-direita.png.png';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetLoginOrEmail, setResetLoginOrEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const success = await authLogin(login, password);
    if (success) {
      navigate('/');
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginOrEmail: resetLoginOrEmail, newPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccessMsg(data.message || 'Senha alterada com sucesso!');
        setIsResetting(false);
        setResetLoginOrEmail('');
        setNewPassword('');
      } else {
        setError(data.error || 'Crie sua conta ou verifique os dados');
      }
    } catch (err) {
      setError('Erro ao tentar redefinir senha.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-6">
            <img 
              src={logoEsquerda} 
              alt="Logo Esquerda" 
              className="w-20 h-20 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <img 
              src={logoMeio} 
              alt="Logo Meio" 
              className="w-32 h-32 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <img 
              src={logoDireita} 
              alt="Logo Direita" 
              className="w-20 h-20 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">BANG GAME</h1>
          <p className="text-slate-400 font-bold tracking-wider">TEAM BANG FIGHT E FITNESS</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 p-3 rounded-lg mb-4 text-sm text-center">
            {successMsg}
          </div>
        )}

        {!isResetting ? (
          <>
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

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsResetting(true);
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-slate-400 hover:text-orange-400 text-sm transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm mb-2">Não tem conta?</p>
              <button
                onClick={() => navigate('/register')}
                className="text-orange-500 hover:text-orange-400 font-bold text-sm transition-colors"
              >
                CRIAR CONTA DE ALUNO
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <h2 className="text-xl font-bold text-white text-center mb-4">Redefinir Senha</h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Seu Login ou E-mail</label>
              <input
                type="text"
                value={resetLoginOrEmail}
                onChange={(e) => setResetLoginOrEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="Digite seu login ou e-mail"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="Digite a nova senha"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-orange-500/20"
            >
              SALVAR NOVA SENHA
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsResetting(false);
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-slate-400 hover:text-orange-400 text-sm transition-colors"
              >
                Voltar para o Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
