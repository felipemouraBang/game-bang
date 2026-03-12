import React, { useState, useEffect } from 'react';
import { Timer, Calendar, CheckCircle, AlertCircle, Trash2, StopCircle } from 'lucide-react';
import ChallengeCountdown from '../ChallengeCountdown';

interface Challenge {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  points: number;
}

export default function ChallengesTab() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    points: ''
  });
  const [loading, setLoading] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchChallenges = async () => {
    try {
      const res = await fetch('/api/challenges/all', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setChallenges(data);
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

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
        setFormData({ title: '', description: '', start_date: '', end_date: '', points: '' });
        fetchChallenges();
        // window.location.reload(); // Removed reload to keep state
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

  const handleEndChallenge = async (id: number) => {
    console.log('Ending challenge from challenges tab list, ID:', id);
    setLoading(true);
    setConfirmId(null);
    try {
      const res = await fetch(`/api/challenges/${id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      console.log('End challenge response status (tab):', res.status);
      if (res.ok) {
        fetchChallenges();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao encerrar desafio');
      }
    } catch (err) {
      console.error('Error ending challenge (tab):', err);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Visualização do Aluno</h2>
        <ChallengeCountdown externalRefreshKey={refreshKey} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Timer className="w-6 h-6 mr-2 text-orange-500" />
            Criar Novo Desafio
          </h2>

          {success && (
            <div className="bg-green-500/20 border border-green-500 text-green-400 p-4 rounded-lg mb-6 flex items-center animate-pulse">
              <CheckCircle className="w-6 h-6 mr-2" />
              <div>
                <p className="font-bold">Desafio Criado!</p>
                <p className="text-sm">Todos os alunos foram notificados.</p>
              </div>
            </div>
          )}

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
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
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
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
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
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
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
        </div>

        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-500" />
            Histórico de Desafios
          </h2>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {challenges.map(c => {
              const now = new Date();
              const start = new Date(c.start_date);
              const end = new Date(c.end_date);
              const isActive = now >= start && now < end;
              const isUpcoming = now < start;
              const isEnded = now >= end;

              return (
                <div key={c.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white font-bold">{c.title}</h3>
                      <p className="text-slate-400 text-xs">{c.description}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                        isActive ? 'bg-green-500/20 text-green-400' :
                        isUpcoming ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {isActive ? 'Ativo' : isUpcoming ? 'Agendado' : 'Encerrado'}
                      </span>
                      <div className="text-orange-500 font-bold text-sm mt-1">{c.points} pts</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                    <div className="text-[10px] text-slate-500">
                      {new Date(c.start_date).toLocaleDateString()} - {new Date(c.end_date).toLocaleDateString()}
                    </div>
                    {(isActive || isUpcoming) && (
                      <div className="flex items-center space-x-2">
                        {confirmId === c.id ? (
                          <>
                            <button
                              onClick={() => handleEndChallenge(c.id)}
                              disabled={loading}
                              className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold py-1 px-2 rounded transition-colors"
                            >
                              {loading ? '...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              disabled={loading}
                              className="bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold py-1 px-2 rounded transition-colors"
                            >
                              X
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmId(c.id)}
                            disabled={loading}
                            className="text-red-500 hover:text-red-400 disabled:text-red-300 flex items-center text-xs font-bold"
                          >
                            <StopCircle className="w-4 h-4 mr-1" />
                            Encerrar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {challenges.length === 0 && (
              <p className="text-center text-slate-500 py-8">Nenhum desafio criado ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
