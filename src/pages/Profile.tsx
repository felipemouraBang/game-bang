import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Lock, Camera, Save, Bell, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    nickname: user.nickname || '',
    photo: user.photo || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/users/notifications', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/users/notifications/${id}/read`, { 
        method: 'POST',
        credentials: 'include'
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 800;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setFormData({ ...formData, photo: dataUrl });
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setMessage('As senhas não conferem.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          nickname: formData.nickname,
          photo: formData.photo,
          password: formData.password || undefined
        })
      });

      if (res.ok) {
        setMessage('Dados atualizados com sucesso! (Recarregue a página para ver a nova foto no menu)');
      } else {
        setMessage('Erro ao atualizar dados.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold text-white mb-8">Meus Dados</h1>

        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-xl">
          {message && (
            <div className={`p-4 rounded-lg mb-6 text-center ${message.includes('sucesso') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center mb-6">
              <div 
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 rounded-full bg-slate-700 overflow-hidden border-4 border-slate-600 group-hover:border-orange-500 transition-colors">
                  {formData.photo ? (
                    <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full text-white shadow-lg">
                  <Camera className="w-4 h-4" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </div>
            </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Apelido (Como quer ser chamado)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={e => setFormData({...formData, nickname: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-orange-500" />
              Alterar Senha
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nova Senha</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Deixe em branco para manter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Repita a nova senha"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-orange-500/20 flex items-center transition-all hover:scale-105"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
      </div>

      <div className="lg:col-span-1">
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
          <Bell className="w-6 h-6 mr-2 text-orange-500" />
          Notificações
        </h2>
        
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl max-h-[600px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhuma notificação no momento.</p>
          ) : (
            <div className="space-y-4">
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`p-4 rounded-lg border ${
                    notif.read ? 'bg-slate-900 border-slate-700' : 'bg-slate-700 border-orange-500/50'
                  }`}
                >
                  <p className="text-sm text-white mb-2">{notif.message}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-400">
                      {new Date(notif.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {!notif.read && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="text-xs text-orange-500 hover:text-orange-400 flex items-center"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Marcar como lida
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
