import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';

// Import images directly so Vite bundles them correctly
import logoEsquerda from '../assets/logo-da-esquerda.png.PNG';
import logoMeio from '../assets/logo-do-meio.png.PNG';
import logoDireita from '../assets/logo-da-direita.png.png';

export const UNITS = [
  'Forte Muay',
  'Forte Fitness',
  'Forte Fight',
  'Anita Muay',
  'Anita Fitness',
  'Moinhos Fitness',
  'Moinhos Muay',
  'Protásio Fitness',
  'Protásio Muay',
  'Protásio Fight',
  'Cristiano Muay',
  'Cristiano Fitness',
  'ZS Muay',
  'ZS Fitness',
  'Tramandai Muay'
];

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    login: '',
    password: '',
    confirmPassword: '',
    email: '',
    nickname: '',
    unit: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem.');
      setLoading(false);
      return;
    }

    if (!formData.unit) {
      setError('Por favor, selecione sua unidade.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          login: formData.login,
          password: formData.password,
          email: formData.email,
          nickname: formData.nickname,
          unit: formData.unit
        }),
        credentials: 'include'
      });

      if (res.ok) {
        // Registration successful and cookie set.
        // Force a reload to update AuthContext state (since we don't have a set method exposed)
        // Or navigate to login (but user is already logged in via cookie).
        // Let's just reload to root.
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao criar conta.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <img 
              src={logoEsquerda} 
              alt="Logo Esquerda" 
              className="w-16 h-16 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <img 
              src={logoMeio} 
              alt="Logo Meio" 
              className="w-24 h-24 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <img 
              src={logoDireita} 
              alt="Logo Direita" 
              className="w-16 h-16 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">CRIAR CONTA</h1>
          <p className="text-slate-400">Junte-se ao game da Team Bang Fight E Fitness</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nome Completo</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Login</label>
              <input
                type="text"
                value={formData.login}
                onChange={(e) => setFormData({...formData, login: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Apelido (Opcional)</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Unidade *</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              required
            >
              <option value="">Selecione...</option>
              {UNITS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">E-mail (Opcional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar Senha</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-orange-500/20 mt-6 flex items-center justify-center"
          >
            {loading ? 'Criando...' : <><UserPlus className="w-5 h-5 mr-2" /> CADASTRAR</>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-slate-400 hover:text-white text-sm flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Login
          </Link>
        </div>
      </div>
    </div>
  );
}
