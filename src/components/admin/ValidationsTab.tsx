import React, { useState, useEffect } from 'react';
import { Check, X, MapPin, Image, UserPlus, Star } from 'lucide-react';

export default function ValidationsTab() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingActions();
  }, []);

  const fetchPendingActions = async () => {
    try {
      const res = await fetch('/api/actions/pending', { credentials: 'include' });
      const data = await res.json();
      setActions(data);
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
      default: return type;
    }
  };

  const renderProof = (action) => {
    if (!action.proof) return null;
    try {
      const proof = JSON.parse(action.proof);
      if (action.type === 'challenge_completion') {
        return (
          <div className="mt-2 text-xs text-slate-400 bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-1">
            <p><span className="text-slate-500">Nome:</span> <span className="text-white">{proof.fullName}</span></p>
            <p><span className="text-slate-500">WhatsApp:</span> <span className="text-white">{proof.whatsapp}</span></p>
            <p><span className="text-slate-500">Unidade:</span> <span className="text-white">{proof.unit}</span></p>
          </div>
        );
      }
      return (
        <div className="mt-2 text-xs text-slate-400 bg-slate-800 p-2 rounded truncate">
          Prova: {action.proof}
        </div>
      );
    } catch (e) {
      return (
        <div className="mt-2 text-xs text-slate-400 bg-slate-800 p-2 rounded truncate">
          Prova: {action.proof}
        </div>
      );
    }
  };

  if (loading) return <div className="text-center text-slate-400 py-10">Carregando...</div>;
  if (actions.length === 0) return <div className="text-center text-slate-400 py-10">Nenhuma validação pendente.</div>;

  return (
    <div className="grid gap-4">
      {actions.map((action) => (
        <div key={action.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-slate-800 p-3 rounded-full">
              {getIcon(action.type)}
            </div>
            <div>
              <h4 className="font-semibold text-white">{getLabel(action.type)}</h4>
              <p className="text-sm text-slate-400">Aluno: <span className="text-orange-400">{action.user_name}</span></p>
              <p className="text-xs text-slate-500">{new Date(action.created_at).toLocaleString()}</p>
              {renderProof(action)}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleValidate(action.id, false)}
              className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
              title="Rejeitar"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleValidate(action.id, true)}
              className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors"
              title="Aprovar"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
