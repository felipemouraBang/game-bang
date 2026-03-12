import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export default function CreateChallenge() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    points: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const payload = {
        ...formData,
        points: parseInt(formData.points, 10) || 0,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/'), 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao criar desafio');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
        <Timer className="w-8 h-8 mr-3 text-orange-500" />
        Criar Novo Desafio
      </h1>

      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-xl">
        {success ? (
          <div className="bg-green-500/20 border border-green-500 text-green-400 p-6 rounded-xl text-center animate-pulse">
            <CheckCircle className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Desafio Criado!</h3>
            <p>Todos os alunos foram notificados.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">Título do Desafio</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Ex: Desafio de Verão 30 Dias"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Pontos</label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={e => setFormData({...formData, points: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Ex: 50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Descrição</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                placeholder="Detalhes do desafio..."
                rows={4}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Data de Início</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={e => setFormData({...formData, start_date: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Data de Término</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={e => setFormData({...formData, end_date: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
              >
                {loading ? 'Criando...' : 'Criar Desafio e Notificar Alunos'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
