import React, { useState, useEffect } from 'react';
import { Timer, Calendar, CheckCircle, AlertCircle, StopCircle, Check, X, RefreshCw, Users, Trophy } from 'lucide-react';
import ChallengeCountdown from '../ChallengeCountdown';

interface Challenge {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  points: number;
  max_winners?: number | null;
}

interface Submission {
  id: number;
  user_id: number;
  user_name: string;
  user_nickname?: string;
  user_unit?: string;
  type: string;
  status: string;
  points: number;
  proof: string;
  challenge_id: number;
  created_at: string;
}

export default function ChallengesTab() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    points: '',
    max_winners: '1',
    unlimited_winners: true
  });
  const [loading, setLoading] = useState(false);
  const [revertLoading, setRevertLoading] = useState(false);
  const [revertMsg, setRevertMsg] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/challenges/submissions', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChallenges();
    fetchSubmissions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        points: parseInt(formData.points, 10) || 0,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        max_winners: formData.unlimited_winners ? null : (parseInt(formData.max_winners, 10) || 1)
      };

      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({ title: '', description: '', start_date: '', end_date: '', points: '', max_winners: '1', unlimited_winners: true });
        fetchChallenges();
        fetchSubmissions();
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
    setLoading(true);
    setConfirmId(null);
    try {
      const res = await fetch(`/api/challenges/${id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        fetchChallenges();
        fetchSubmissions();
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

  const handleValidateSubmission = async (actionId: number, approve: boolean) => {
    const endpoint = approve ? 'validate' : 'reject';
    try {
      const res = await fetch(`/api/actions/${actionId}/${endpoint}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Erro ao processar validação');
      }
      fetchSubmissions();
      fetchChallenges();
    } catch (err) {
      console.error('Failed to process action', err);
    }
  };

  const handleRevertAutoApprovals = async () => {
    if (!window.confirm('Deseja mover todos os desafios auto-aprovados de volta para a fila de aprovação e remover os pontos concedidos?')) {
      return;
    }
    setRevertLoading(true);
    setRevertMsg('');
    try {
      const res = await fetch('/api/admin/revert-challenge-auto-approvals', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setRevertMsg(data.message || 'Sucesso ao reverter auto-aprovações!');
        fetchChallenges();
        fetchSubmissions();
        setTimeout(() => setRevertMsg(''), 5000);
      } else {
        alert(data.error || 'Erro ao reverter auto-aprovações.');
      }
    } catch (err) {
      console.error('Error reverting auto approvals:', err);
    } finally {
      setRevertLoading(false);
    }
  };

  const renderProof = (proofStr: string) => {
    if (!proofStr) return null;
    let parsed: any = null;
    try {
      parsed = JSON.parse(proofStr);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    } catch (e) {}

    if (parsed && parsed.fullName) {
      return (
        <div className="mt-1 text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800 space-y-0.5">
          <p><span className="text-slate-500">Nome:</span> <span className="font-semibold text-white">{parsed.fullName}</span></p>
          <p><span className="text-slate-500">WhatsApp:</span> <span className="font-semibold text-white">{parsed.whatsapp}</span></p>
          <p><span className="text-slate-500">Unidade:</span> <span className="font-semibold text-white">{parsed.unit}</span></p>
        </div>
      );
    }
    return <p className="mt-1 text-[11px] text-slate-400 truncate">{proofStr}</p>;
  };

  return (
    <div className="space-y-8">
      {/* Admin Action Bar */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-500" />
            Controle de Aprovação e Correção de Pontos
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Mova desafios auto-aprovados para a fila de pendentes e recalcule os pontos de todos os alunos.
          </p>
        </div>
        <button
          onClick={handleRevertAutoApprovals}
          disabled={revertLoading}
          className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${revertLoading ? 'animate-spin' : ''}`} />
          <span>Mover Auto-Aprovados p/ Pendente & Zerar Pontos Errados</span>
        </button>
      </div>

      {revertMsg && (
        <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-xs font-bold text-center">
          {revertMsg}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Visualização do Aluno</h2>
        <ChallengeCountdown externalRefreshKey={refreshKey} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Create Challenge Form */}
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
                rows={3}
                required
              />
            </div>

            {/* Número de Vencedores */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">Quantidade de Vencedores</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, unlimited_winners: !formData.unlimited_winners})}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                    formData.unlimited_winners
                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${formData.unlimited_winners ? 'bg-green-400' : 'bg-slate-600'}`}></span>
                  <span>Todos Podem Ganhar (Sem Limite)</span>
                </button>

                {!formData.unlimited_winners && (
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Máximo:</span>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_winners}
                      onChange={e => setFormData({...formData, max_winners: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-orange-500 focus:outline-none"
                      placeholder="Ex: 1, 3, 5..."
                      required={!formData.unlimited_winners}
                    />
                    <span className="text-xs text-slate-400 font-medium">vencedores</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                {formData.unlimited_winners
                  ? 'Qualquer aluno que responder dentro do prazo ganha os pontos após aprovação.'
                  : `Apenas os primeiros ${formData.max_winners || 1} alunos aprovados receberão os pontos.`}
              </p>
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none text-sm"
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center cursor-pointer"
              >
                {loading ? 'Criando...' : 'Criar Desafio e Notificar Alunos'}
              </button>
            </div>
          </form>
        </div>

        {/* Challenges & Submissions List */}
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-500" />
            Histórico e Fila de Aprovação de Desafios
          </h2>

          <div className="space-y-6 max-h-[750px] overflow-y-auto pr-2">
            {challenges.map(c => {
              const now = new Date();
              const start = new Date(c.start_date);
              const end = new Date(c.end_date);
              const isActive = now >= start && now < end;
              const isUpcoming = now < start;

              const cSubmissions = submissions.filter(s => Number(s.challenge_id) === Number(c.id));
              const pendingCount = cSubmissions.filter(s => s.status === 'pending').length;
              const approvedCount = cSubmissions.filter(s => s.status === 'approved').length;

              return (
                <div key={c.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                  <div className="p-4 bg-slate-800/90 border-b border-slate-700/80">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold text-base">{c.title}</h3>
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                            isActive ? 'bg-green-500/20 text-green-400' :
                            isUpcoming ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {isActive ? 'Ativo' : isUpcoming ? 'Agendado' : 'Encerrado'}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs mt-1">{c.description}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="text-orange-400 font-bold text-base">+{c.points} pts</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {c.max_winners ? `Até ${c.max_winners} vencedor(es)` : 'Todos podem ganhar'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
                      <div>
                        {new Date(c.start_date).toLocaleDateString()} até {new Date(c.end_date).toLocaleDateString()}
                      </div>
                      {(isActive || isUpcoming) && (
                        <div>
                          {confirmId === c.id ? (
                            <div className="flex items-center space-x-1.5">
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
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmId(c.id)}
                              disabled={loading}
                              className="text-red-400 hover:text-red-300 flex items-center text-xs font-bold cursor-pointer"
                            >
                              <StopCircle className="w-3.5 h-3.5 mr-1" />
                              Encerrar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submissions Section */}
                  <div className="p-4 bg-slate-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-orange-400" />
                        <span>Participações / Respostas ({cSubmissions.length})</span>
                      </h4>
                      <div className="flex items-center gap-2 text-[10px]">
                        {pendingCount > 0 && (
                          <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded font-bold">
                            {pendingCount} pendente(s)
                          </span>
                        )}
                        <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-bold">
                          {approvedCount} aprovado(s)
                        </span>
                      </div>
                    </div>

                    {cSubmissions.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2 italic text-center bg-slate-950/40 rounded border border-slate-800">
                        Nenhum aluno respondeu a este desafio ainda.
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {cSubmissions.map(sub => (
                          <div key={sub.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{sub.user_name}</span>
                                {sub.user_unit && (
                                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                    {sub.user_unit}
                                  </span>
                                )}
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                  sub.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                  sub.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                  'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                  {sub.status === 'pending' ? 'Pendente' : sub.status === 'approved' ? 'Aprovado' : 'Recusado'}
                                </span>
                              </div>
                              {renderProof(sub.proof)}
                              <p className="text-[9px] text-slate-500 mt-1 font-mono">
                                Enviado em: {new Date(sub.created_at).toLocaleString()}
                              </p>
                            </div>

                            {sub.status === 'pending' && (
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                <button
                                  onClick={() => handleValidateSubmission(sub.id, false)}
                                  className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Recusar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Recusar</span>
                                </button>
                                <button
                                  onClick={() => handleValidateSubmission(sub.id, true)}
                                  className="px-2.5 py-1.5 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Aprovar e Dar Pontos"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Aprovar</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
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
