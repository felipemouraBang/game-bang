import React, { useState } from 'react';
import { MapPin, Camera, UserPlus, X, Loader2, Award } from 'lucide-react';

export default function ActionModal({ type, onClose }) {
  const [modality, setModality] = useState('checkin_muay_thai');
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let finalType = type;
      let proof = details;
      let finalDetails = details;

      if (type === 'checkin') {
        finalType = modality;
        // Get GPS
        if (!navigator.geolocation) {
          throw new Error('Geolocalização não suportada');
        }

        const getPosition = (highAccuracy: boolean, timeout: number): Promise<GeolocationPosition> => {
          return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: highAccuracy,
              timeout: timeout,
              maximumAge: 0
            });
          });
        };

        let position: GeolocationPosition;
        try {
          // Try with high accuracy first (better for gym verification)
          position = await getPosition(true, 20000);
        } catch (err: any) {
          if (err.code === err.TIMEOUT) {
            console.warn("High accuracy timeout, falling back to lower accuracy...");
            try {
              // Fallback to lower accuracy if high accuracy times out
              position = await getPosition(false, 10000);
            } catch (fallbackErr: any) {
              let msg = 'Erro ao obter localização';
              if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) msg = 'Permissão de localização negada pelo navegador';
              else if (fallbackErr.code === fallbackErr.POSITION_UNAVAILABLE) msg = 'Localização indisponível no momento';
              else if (fallbackErr.code === fallbackErr.TIMEOUT) msg = 'Tempo esgotado ao buscar localização. Tente novamente em um local aberto ou com sinal melhor.';
              throw new Error(msg);
            }
          } else {
            let msg = 'Erro ao obter localização';
            if (err.code === err.PERMISSION_DENIED) msg = 'Permissão de localização negada pelo navegador';
            else if (err.code === err.POSITION_UNAVAILABLE) msg = 'Localização indisponível no momento';
            throw new Error(msg);
          }
        }

        proof = JSON.stringify({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      } else if (type === 'referral' || type === 'referral_deal' || type === 'graduation') {
        const friendName = e.target.friendName.value;
        const friendPhone = e.target.friendPhone.value;
        
        proof = JSON.stringify({
          name: friendName,
          phone: friendPhone
        });
        finalDetails = type === 'referral' 
          ? `Indicação: ${friendName} (${friendPhone})`
          : type === 'graduation'
          ? `Graduação: ${friendName} (${friendPhone})`
          : `Amigo Fechou Plano: ${friendName} (${friendPhone})`;
      }

      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: finalType, proof, details: finalDetails })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao enviar ação');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro de conexão ou permissão negada');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'checkin': return 'Fazer Check-in';
      case 'post': return 'Enviar Postagem';
      case 'referral': return 'Indicar Amigo';
      case 'referral_deal': return 'Amigo Fechou Plano';
      case 'graduation': return 'Graduação';
      default: return 'Ação';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'checkin': return <MapPin className="w-8 h-8 text-blue-500 mb-4" />;
      case 'post': return <Camera className="w-8 h-8 text-purple-500 mb-4" />;
      case 'referral': return <UserPlus className="w-8 h-8 text-green-500 mb-4" />;
      case 'referral_deal': return <UserPlus className="w-8 h-8 text-emerald-500 mb-4" />;
      case 'graduation': return <Award className="w-8 h-8 text-yellow-500 mb-4" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          {getIcon()}
          <h3 className="text-xl font-bold text-white mb-2">{getTitle()}</h3>
          
          {success ? (
            <div className="bg-green-500/20 text-green-400 p-4 rounded-xl mt-4 animate-pulse">
              Ação enviada com sucesso! Aguardando validação.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
              {type === 'checkin' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Selecione a Modalidade</label>
                    <select 
                      value={modality}
                      onChange={e => setModality(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="checkin_muay_thai">Check-in Muay Thai</option>
                      <option value="checkin_fitness">Check-in Fitness</option>
                      <option value="checkin_fight">Check-in Fight</option>
                    </select>
                  </div>
                  <p className="text-slate-400 text-sm text-center">
                    Certifique-se de estar na academia. Vamos verificar sua localização.
                  </p>
                </div>
              )}

              {type === 'post' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2 text-left">Link da Postagem / Detalhes</label>
                  <textarea 
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Cole o link ou descreva..."
                    rows={3}
                    required
                  />
                </div>
              )}

              {(type === 'referral' || type === 'referral_deal' || type === 'graduation') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2 text-left">
                      {type === 'graduation' ? 'Seu Nome Completo' : 'Nome Completo do Amigo'}
                    </label>
                    <input 
                      type="text"
                      name="friendName"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none"
                      placeholder="Ex: João da Silva"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2 text-left">
                      {type === 'graduation' ? 'Seu WhatsApp' : 'WhatsApp do Amigo'}
                    </label>
                    <input 
                      type="text"
                      name="friendPhone"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none"
                      placeholder="(DD) 99999-9999"
                      required
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center ${
                  loading ? 'bg-slate-600 cursor-not-allowed' : 
                  type === 'checkin' ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20' :
                  type === 'post' ? 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20' :
                  type === 'referral_deal' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20' :
                  type === 'graduation' ? 'bg-yellow-600 hover:bg-yellow-700 shadow-lg shadow-yellow-500/20' :
                  'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {type === 'checkin' ? 'Buscando localização...' : 'Enviando...'}
                  </>
                ) : 'Confirmar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
