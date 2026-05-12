import React, { useState, useEffect } from 'react';
import { Timer, Trophy, CheckCircle, StopCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChallengeValidationModal from './student/ChallengeValidationModal';

interface Challenge {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  points: number;
  user_status?: string | null;
}

export default function ChallengeCountdown({ externalRefreshKey = 0 }: { externalRefreshKey?: number }) {
  console.log('ChallengeCountdown rendering, externalRefreshKey:', externalRefreshKey);
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [status, setStatus] = useState<'upcoming' | 'active' | 'ended'>('upcoming');
  const [completing, setCompleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    console.log('Fetching active challenge, refreshKey:', refreshKey, 'externalRefreshKey:', externalRefreshKey);
    fetch('/api/challenges/active', { credentials: 'include' })
      .then(res => {
        console.log('Active challenge fetch status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Active challenge data received:', data);
        setChallenge(data);
      })
      .catch(err => console.error('Error fetching active challenge:', err));
  }, [refreshKey, externalRefreshKey]);

  useEffect(() => {
    if (!challenge) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(challenge.start_date).getTime();
      const end = new Date(challenge.end_date).getTime();

      let targetDate = start;
      let currentStatus: 'upcoming' | 'active' | 'ended' = 'upcoming';

      if (now < start) {
        currentStatus = 'upcoming';
        targetDate = start;
      } else if (now >= start && now < end) {
        currentStatus = 'active';
        targetDate = end;
      } else {
        currentStatus = 'ended';
        setTimeLeft(null);
        clearInterval(interval);
        return;
      }

      setStatus(currentStatus);

      const distance = targetDate - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge]);

  const handleComplete = async (formData: { fullName: string; whatsapp: string; unit: string }) => {
    if (!challenge) return;

    setCompleting(true);
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (res.ok) {
        setChallenge(prev => prev ? { ...prev, user_status: 'pending' } : null);
        setShowModal(false);
      } else {
        let errorMsg = 'Erro ao enviar.';
        try {
          const text = await res.text();
          const data = JSON.parse(text);
          errorMsg = data.error || errorMsg;
        } catch (e) {
          console.error("Non-JSON error from server");
        }
        alert(errorMsg);
      }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setCompleting(false);
    }
  };

  const [ending, setEnding] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleEndChallenge = async () => {
    console.log('Ending challenge from countdown component');
    if (!challenge) return;
    
    setEnding(true);
    setShowConfirm(false);
    setMessage(null);
    
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      console.log('End challenge response status:', res.status);
      if (res.ok) {
        // Refresh challenge data
        setRefreshKey(prev => prev + 1);
        setMessage({ text: 'Desafio encerrado com sucesso!', type: 'success' });
      } else {
        let errorMsg = 'Erro ao encerrar desafio.';
        try {
          const text = await res.text();
          const data = JSON.parse(text);
          errorMsg = data.error || errorMsg;
        } catch (e) {
          console.error("Non-JSON error from server");
        }
        setMessage({ text: errorMsg, type: 'error' });
      }
    } catch (err) {
      console.error('Error ending challenge:', err);
      setMessage({ text: 'Erro de conexão.', type: 'error' });
    } finally {
      setEnding(false);
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (!challenge || !timeLeft) {
    if (user?.role === 'admin') {
      return (
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 mb-6 text-center">
          <Timer className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum Desafio Ativo</h3>
          <p className="text-slate-400 text-sm">Crie um novo desafio para motivar os alunos!</p>
        </div>
      );
    }
    return null;
  }

  const getStatusMessage = () => {
    if (challenge.user_status === 'pending') return 'Enviado para validação!';
    if (challenge.user_status === 'approved') return 'Desafio Validado! Parabéns!';
    if (challenge.user_status === 'rejected') return 'Validação Recusada.';
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <>
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 shadow-xl border border-orange-500 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Timer className="w-32 h-32 text-white" />
        </div>
        
        <div className="relative z-10 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-yellow-300" />
              <h2 className="text-xl font-bold uppercase tracking-wider">
                {status === 'upcoming' ? 'Próximo Desafio:' : 'Desafio em Andamento:'}
              </h2>
            </div>
            {challenge.points > 0 && (
              <div className="bg-yellow-400 text-slate-900 px-3 py-1 rounded-full font-bold text-sm shadow-lg">
                Valendo {challenge.points} pts
              </div>
            )}
          </div>
          
          <h3 className="text-2xl font-black mb-2">{challenge.title}</h3>
          <p className="text-orange-100 mb-4 text-sm max-w-xs">{challenge.description}</p>

          <div className="grid grid-cols-4 gap-2 text-center max-w-sm mb-4">
            <div className="bg-black/30 rounded-lg p-2 backdrop-blur-sm">
              <span className="block text-2xl font-bold font-mono">{timeLeft.days}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-75">Dias</span>
            </div>
            <div className="bg-black/30 rounded-lg p-2 backdrop-blur-sm">
              <span className="block text-2xl font-bold font-mono">{timeLeft.hours.toString().padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-75">Horas</span>
            </div>
            <div className="bg-black/30 rounded-lg p-2 backdrop-blur-sm">
              <span className="block text-2xl font-bold font-mono">{timeLeft.minutes.toString().padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-75">Min</span>
            </div>
            <div className="bg-black/30 rounded-lg p-2 backdrop-blur-sm">
              <span className="block text-2xl font-bold font-mono">{timeLeft.seconds.toString().padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-75">Seg</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs font-medium bg-black/20 inline-block px-3 py-1 rounded-full">
              {status === 'upcoming' 
                ? `Começa em: ${new Date(challenge.start_date).toLocaleDateString()}`
                : `Termina em: ${new Date(challenge.end_date).toLocaleDateString()}`
              }
            </div>

            {user?.role === 'admin' && (status === 'active' || status === 'upcoming') && (
              <div className="flex flex-col items-center space-y-2">
                {!showConfirm ? (
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={ending}
                    className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white border border-white/30 font-bold py-2 px-6 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 text-sm flex items-center backdrop-blur-md"
                  >
                    <StopCircle className="w-4 h-4 mr-2" />
                    Encerrar Desafio Agora
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-xl border border-red-500/50 backdrop-blur-md">
                    <span className="text-xs text-white font-medium px-2">Confirmar encerramento?</span>
                    <button
                      onClick={handleEndChallenge}
                      disabled={ending}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                    >
                      {ending ? 'Encerrando...' : 'Sim, Encerrar'}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      disabled={ending}
                      className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                {message && (
                  <p className={`text-xs font-bold ${message.type === 'success' ? 'text-green-400' : 'text-red-400'} animate-bounce`}>
                    {message.text}
                  </p>
                )}
              </div>
            )}

            {status === 'active' && user?.role === 'student' && (
              <div>
                {statusMessage ? (
                  <span className="text-green-300 font-bold flex items-center bg-black/30 px-3 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4 mr-1" /> {statusMessage}
                  </span>
                ) : (
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-white text-orange-600 hover:bg-orange-100 font-bold py-2 px-4 rounded-lg shadow-lg transition-colors text-sm flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Validar Desafio
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <ChallengeValidationModal
          onClose={() => setShowModal(false)}
          onSubmit={handleComplete}
          loading={completing}
        />
      )}
    </>
  );
}
