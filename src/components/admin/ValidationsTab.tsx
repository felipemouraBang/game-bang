import React, { useState, useEffect } from 'react';
import { Check, X, MapPin, Image, UserPlus, Star, Heart, Target } from 'lucide-react';

interface ValidationsTabProps {
  isAdmin?: boolean;
}

export default function ValidationsTab({ isAdmin = false }: ValidationsTabProps) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlockStatus, setUnlockStatus] = useState({
    challenges_unlocked_at: null,
    graduations_unlocked_at: null
  });
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState('');

  useEffect(() => {
    fetchPendingActions();
    if (isAdmin) {
      fetchUnlockStatus();
    }
  }, [isAdmin]);

  const fetchUnlockStatus = async () => {
    try {
      const res = await fetch('/api/admin/unlock-status', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setUnlockStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch unlock status', err);
    }
  };

  const handleUnlock = async (type) => {
    setUnlockLoading(true);
    setUnlockSuccess('');
    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setUnlockSuccess(`Sucesso ao destravar ${type === 'challenges' ? 'Desafios' : 'Graduações'} para todos os alunos!`);
        fetchUnlockStatus();
        setTimeout(() => setUnlockSuccess(''), 4000);
      } else {
        alert(data.error || 'Erro ao destravar.');
      }
    } catch (err) {
      console.error('Failed to unlock', err);
    } finally {
      setUnlockLoading(false);
    }
  };

  const fetchPendingActions = async () => {
    try {
      const res = await fetch('/api/actions/pending', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao buscar');
      setActions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch actions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id, approve) => {
    const endpoint = approve ? 'validate' : 'reject';
    try {
      await fetch(`/api/actions/${id}/${endpoint}`, { 
        method: 'POST',
        credentials: 'include'
      });
      setActions(actions.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to process action', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'checkin': return <MapPin className="w-5 h-5 text-blue-400" />;
      case 'post': return <Image className="w-5 h-5 text-purple-400" />;
      case 'referral': return <UserPlus className="w-5 h-5 text-green-400" />;
      case 'bonus_week': return <Star className="w-5 h-5 text-yellow-400" />;
      case 'graduation': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'challenge_bang': return <Target className="w-5 h-5 text-orange-500" />;
      case 'donation': return <Heart className="w-5 h-5 text-red-500" />;
      default: return <Star className="w-5 h-5 text-slate-400" />;
    }
  };

  const getLabel = (type) => {
    switch (type) {
      case 'checkin': return 'Check-in';
      case 'post': return 'Postagem';
      case 'referral': return 'Indicação';
      case 'referral_deal': return 'Fechamento';
      case 'bonus_week': return 'Bônus Semanal';
      case 'challenge_completion': return 'Desafio';
      case 'graduation': return 'Graduação';
      case 'challenge_bang': return 'Desafio Bang';
      case 'donation': return 'Doação';
      default: return type;
    }
  };

  const renderProof = (action) => {
    if (!action.proof) return null;
    let parsed = null;
    try {
      parsed = JSON.parse(action.proof);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
    } catch (e) {
      // Not JSON
    }

    if (parsed && action.type === 'challenge_completion') {
      return (
        <div className="mt-0.5 text-[10px] text-slate-400 bg-slate-950/40 p-1 px-2 rounded border border-slate-800/60 flex flex-wrap gap-x-3 gap-y-0.5 inline-flex max-w-full">
          <p><span className="text-slate-500">Nome:</span> <span className="text-white font-medium">{parsed.fullName}</span></p>
          <p><span className="text-slate-500">WhatsApp:</span> <span className="text-white font-medium">{parsed.whatsapp}</span></p>
          <p><span className="text-slate-500">Unidade:</span> <span className="text-white font-medium">{parsed.unit}</span></p>
        </div>
      );
    }
    
    // Mostrando os detalhes enviados em type referral, graduation, challenge_bang
    const details = action.details || parsed?.details;
    if (details) {
      if (['referral', 'referral_deal', 'graduation', 'challenge_bang'].includes(action.type)) {
        // According to user request, do not show 'Nome' and 'WhatsApp' here, just 'Detalhes'.
        return (
          <div className="mt-0.5 text-[10px] text-slate-400 bg-slate-950/40 p-1 px-2 rounded border border-slate-800/60 inline-block">
            <span className="text-slate-500">Detalhes:</span> <span className="text-white font-medium">{details}</span>
          </div>
        );
      }
    }

    return (
      <div className="mt-0.5 text-[10px] text-slate-400 bg-slate-950/30 p-1 px-2 rounded truncate border border-slate-800/30 inline-block max-w-md">
        <span className="text-slate-500">Prova:</span> <span className="text-white">{action.proof}</span>
      </div>
    );
  };

  if (loading) return <div className="text-center text-slate-400 py-10">Carregando...</div>;

  return (
    <div>
      {/* Seção de Desbloqueios Administrativos */}
      {isAdmin && (
        <div className="bg-slate-950 border border-slate-700/80 rounded-xl p-5 mb-8">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            Controle de Envio (Destravar)
          </h3>
          <p className="text-sm text-slate-400 mb-5">
            Por padrão, os alunos não podem reenviar atividades de Desafios ou Graduações após o primeiro envio. 
            Use os botões abaixo para liberar novos envios para **todos** os alunos do sistema.
          </p>

          {unlockSuccess && (
            <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-xs font-semibold mb-5 text-center">
              {unlockSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Desafios (Desafios Bang / Completados)</h4>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Último desbloqueio:{' '}
                  {unlockStatus.challenges_unlocked_at && unlockStatus.challenges_unlocked_at !== '1970-01-01T00:00:00.000Z'
                    ? new Date(unlockStatus.challenges_unlocked_at).toLocaleString()
                    : 'Nenhum'}
                </p>
              </div>
              <button
                disabled={unlockLoading}
                onClick={() => handleUnlock('challenges')}
                className="mt-4 w-full px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-transform transform hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider text-center"
              >
                Destravar Desafios
              </button>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Graduações</h4>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Último desbloqueio:{' '}
                  {unlockStatus.graduations_unlocked_at && unlockStatus.graduations_unlocked_at !== '1970-01-01T00:00:00.000Z'
                    ? new Date(unlockStatus.graduations_unlocked_at).toLocaleString()
                    : 'Nenhum'}
                </p>
              </div>
              <button
                disabled={unlockLoading}
                onClick={() => handleUnlock('graduations')}
                className="mt-4 w-full px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-transform transform hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider text-center"
              >
                Destravar Graduações
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Validações Pendentes</h3>
        {actions.length > 0 && (
          <span className="text-xs bg-orange-500/10 text-orange-400 font-mono font-bold px-3 py-1 rounded-full">
            {actions.length} pendentes
          </span>
        )}
      </div>

      {actions.length === 0 ? (
        <div className="text-center text-slate-500 py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl">
          Nenhuma validação pendente de alunos.
        </div>
      ) : (
        <div className="grid gap-2.5 max-w-2xl">
          {actions.map((action) => (
            <div key={action.id} className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 px-3.5 flex items-center gap-3 hover:border-slate-600 transition-colors">
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                <div className="bg-slate-800 p-2 rounded-full shrink-0">
                  {getIcon(action.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <h4 className="font-semibold text-white text-xs">{getLabel(action.type)}</h4>
                    <span className="text-slate-500 text-[9px]">{new Date(action.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Aluno: <span className="text-orange-400 font-semibold">{action.user_name}</span></p>
                  <div className="mt-0.5">{renderProof(action)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0 ml-2 bg-slate-950/40 p-1 rounded-md border border-slate-800/60">
                <button
                  onClick={() => handleValidate(action.id, false)}
                  className="px-2 py-1 text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors flex items-center gap-1 font-semibold"
                  title="Recusar"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Recusar</span>
                </button>
                <button
                  onClick={() => handleValidate(action.id, true)}
                  className="px-2 py-1 text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-md transition-colors flex items-center gap-1 font-semibold"
                  title="Aceitar"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aceitar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
