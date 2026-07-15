import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Camera, UserPlus, Trophy, TrendingUp, Award, Bell, QrCode, Handshake, Heart, Target, X, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ActionModal from '../components/student/ActionModal';
import QRScannerModal from '../components/student/QRScannerModal';
import EvolutionChart from '../components/student/EvolutionChart';
import ChallengeCountdown from '../components/ChallengeCountdown';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showActionModal, setShowActionModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Direct QR Link State variables
  const [showDirectCheckin, setShowDirectCheckin] = useState(false);
  const [directModality, setDirectModality] = useState('checkin_muay_thai');
  const [directLoading, setDirectLoading] = useState(false);
  const [directError, setDirectError] = useState('');
  const [directSuccess, setDirectSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'checkin') {
      setShowDirectCheckin(true);
      // Clear query params to prevent showing again on manual refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleDirectCheckinSubmit = async () => {
    setDirectLoading(true);
    setDirectError('');
    try {
      const res = await fetch('/api/actions/qr-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: directModality }),
        credentials: 'include'
      });

      if (res.ok) {
        setDirectSuccess(true);
        setTimeout(() => {
          setShowDirectCheckin(false);
          window.location.reload(); // Reload to refresh scores and user context safely
        }, 2000);
      } else {
        let errorMsg = 'Erro ao realizar check-in.';
        try {
          const text = await res.text();
          const data = JSON.parse(text);
          errorMsg = data.error || errorMsg;
        } catch (e) {
          console.error("Non-JSON error response");
        }
        setDirectError(errorMsg);
      }
    } catch (err) {
      setDirectError('Erro de conexão com o servidor.');
    } finally {
      setDirectLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/users/notifications', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(console.error);
  }, []);

  const handleActionClick = (type) => {
    setActionType(type);
    setShowActionModal(true);
  };

  return (
    <div className="p-4 max-w-md mx-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Trophy className="w-32 h-32 text-orange-500" />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Olá, {user.nickname || user.name.split(' ')[0]}!</h1>
              <p className="text-slate-400 text-sm">Vamos treinar hoje?</p>
            </div>
            <button 
              onClick={() => navigate('/profile')}
              className="relative p-2 rounded-full hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-6 h-6 text-orange-500" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-slate-900">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 backdrop-blur-sm">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Pontos Mês</p>
              <p className="text-2xl font-bold text-orange-500">{user.score_monthly} <span className="text-xs text-slate-500">pts</span></p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 backdrop-blur-sm">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Pontos Ano</p>
              <p className="text-2xl font-bold text-blue-500">{user.score_annual} <span className="text-xs text-slate-500">pts</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Countdown */}
      <ChallengeCountdown />

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Award className="w-5 h-5 mr-2 text-orange-500" />
        Ganhar Pontos
      </h2>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <button 
          onClick={() => handleActionClick('donation')}
          className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center transition-all active:scale-95 group"
        >
          <div className="bg-red-500/20 p-3 rounded-full mb-2 group-hover:bg-red-500/30 transition-colors">
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          <span className="text-xs font-medium text-slate-300">Doação</span>
          <span className="text-[10px] text-orange-500 font-bold mt-1">+10 pts</span>
        </button>

        <button 
          onClick={() => setShowQRScanner(true)}
          className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center transition-all active:scale-95 group"
        >
          <div className="bg-orange-500/20 p-3 rounded-full mb-2 group-hover:bg-orange-500/30 transition-colors">
            <QrCode className="w-6 h-6 text-orange-400" />
          </div>
          <span className="text-xs font-medium text-slate-300">QR Code</span>
          <span className="text-[10px] text-orange-500 font-bold mt-1">+1 pt</span>
        </button>

        <button 
          onClick={() => handleActionClick('checkin')}
          className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center transition-all active:scale-95 group"
        >
          <div className="bg-blue-500/20 p-3 rounded-full mb-2 group-hover:bg-blue-500/30 transition-colors">
            <MapPin className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-xs font-medium text-slate-300">GPS</span>
          <span className="text-[10px] text-orange-500 font-bold mt-1">+1 pt</span>
        </button>

        <button 
          onClick={() => handleActionClick('post')}
          className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center transition-all active:scale-95 group"
        >
          <div className="bg-purple-500/20 p-3 rounded-full mb-2 group-hover:bg-purple-500/30 transition-colors">
            <Camera className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-xs font-medium text-slate-300">Postar</span>
          <span className="text-[10px] text-orange-500 font-bold mt-1">+5 pts</span>
        </button>

        <button 
          onClick={() => handleActionClick('referral')}
          className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center transition-all active:scale-95 group"
        >
          <div className="bg-green-500/20 p-3 rounded-full mb-2 group-hover:bg-green-500/30 transition-colors">
            <UserPlus className="w-6 h-6 text-green-400" />
          </div>
          <span className="text-xs font-medium text-slate-300">Indicar</span>
          <span className="text-[10px] text-orange-500 font-bold mt-1">+10 pts</span>
        </button>

        <button 
          onClick={() => handleActionClick('referral_deal')}
          className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center transition-all active:scale-95 group"
        >
          <div className="bg-emerald-500/20 p-3 rounded-full mb-2 group-hover:bg-emerald-500/30 transition-colors">
            <Handshake className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-xs font-medium text-slate-300">Amigo Fechou Plano</span>
          <span className="text-[10px] text-orange-500 font-bold mt-1">+20 pts</span>
        </button>

        <button 
          onClick={() => handleActionClick('graduation')}
          className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center transition-all active:scale-95 group"
        >
          <div className="bg-yellow-500/20 p-3 rounded-full mb-2 group-hover:bg-yellow-500/30 transition-colors">
            <Award className="w-6 h-6 text-yellow-400" />
          </div>
          <span className="text-xs font-medium text-slate-300">Graduação</span>
          <span className="text-[10px] text-orange-500 font-bold mt-1">+10 pts</span>
        </button>

        <button 
          onClick={() => handleActionClick('challenge_bang')}
          className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center transition-all active:scale-95 group"
        >
          <div className="bg-orange-500/20 p-3 rounded-full mb-2 group-hover:bg-orange-500/30 transition-colors">
            <Target className="w-6 h-6 text-orange-500" />
          </div>
          <span className="text-xs font-medium text-slate-300">Desafio Bang</span>
          <span className="text-[10px] text-orange-500 font-bold mt-1">+10 pts</span>
        </button>
      </div>

      {/* Evolution Chart */}
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
        Sua Evolução
      </h2>
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-8 h-64">
        <EvolutionChart userId={user.id} />
      </div>

      {/* Badges (Mock) */}
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Award className="w-5 h-5 mr-2 text-yellow-500" />
        Conquistas
      </h2>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        <div className="flex-shrink-0 bg-slate-800 p-4 rounded-xl border border-slate-700 w-32 flex flex-col items-center text-center opacity-50 grayscale">
          <div className="bg-yellow-500/20 p-3 rounded-full mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-xs font-bold text-white">Fiel da Semana</p>
          <p className="text-[10px] text-slate-500 mt-1">Treine 5x na semana</p>
        </div>
        <div className="flex-shrink-0 bg-slate-800 p-4 rounded-xl border border-slate-700 w-32 flex flex-col items-center text-center opacity-50 grayscale">
          <div className="bg-orange-500/20 p-3 rounded-full mb-2">
            <Trophy className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-xs font-bold text-white">Fiel do Mês</p>
          <p className="text-[10px] text-slate-500 mt-1">Top 3 do mês</p>
        </div>
      </div>

      {showActionModal && (
        <ActionModal 
          type={actionType} 
          onClose={() => setShowActionModal(false)} 
        />
      )}

      {showQRScanner && (
        <QRScannerModal onClose={() => setShowQRScanner(false)} />
      )}

      {/* Direct QR Link Check-in Modal */}
      {showDirectCheckin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl relative">
            <button 
              onClick={() => setShowDirectCheckin(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="bg-orange-500/20 p-3 rounded-full mb-3 w-12 h-12 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Check-in Presencial</h3>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Você escaneou o QR Code da recepção. Selecione a modalidade para confirmar sua presença de hoje.
              </p>

              {directSuccess ? (
                <div className="bg-green-500/20 text-green-400 p-6 rounded-xl mt-4 flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 mb-2 animate-bounce" />
                  <span className="font-semibold text-sm">Check-in realizado com sucesso!</span>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Selecione a Modalidade</label>
                    <select 
                      value={directModality}
                      onChange={e => setDirectModality(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-orange-500 focus:outline-none"
                    >
                      <option value="checkin_muay_thai">Check-in Muay Thai</option>
                      <option value="checkin_fitness">Check-in Fitness</option>
                      <option value="checkin_fight">Check-in Fight</option>
                    </select>
                  </div>

                  {directError && (
                    <div className="text-red-400 text-xs bg-red-500/10 p-2.5 rounded border border-red-500/10">
                      {directError}
                    </div>
                  )}

                  <button 
                    onClick={handleDirectCheckinSubmit}
                    disabled={directLoading}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:bg-slate-700"
                  >
                    {directLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirmando...</span>
                      </>
                    ) : 'Confirmar Presença'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
