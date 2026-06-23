import React, { useState, useEffect } from 'react';
import { Send, Users, User, MessageSquare, Loader2 } from 'lucide-react';

const MOTIVATIONAL_PHRASES = [
  "Lembre-se: o único treino ruim é aquele que não aconteceu! 💪",
  "A dor de hoje é a força de amanhã. Continue firme! 🥊",
  "Você está mais perto do seu objetivo hoje do que estava ontem! 🚀",
  "A disciplina é a ponte entre seus objetivos e suas conquistas. 🔥",
  "Não pare quando estiver cansado, pare quando tiver terminado! 🏆",
  "O sucesso não é um acidente, é trabalho duro e perseverança! 💯"
];

export default function NotificationsTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState('all');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      const data = await res.json();
      const students = data.filter(u => u.role === 'student');
      students.sort((a, b) => a.name.localeCompare(b.name));
      setUsers(students);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setStatus({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: recipient,
          message: message.trim()
        }),
        credentials: 'include'
      });

      if (res.ok) {
        setStatus({ type: 'success', text: 'Notificação enviada com sucesso!' });
        setMessage('');
      } else {
        setStatus({ type: 'error', text: 'Erro ao enviar notificação.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Erro de conexão.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', text: '' }), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
        <MessageSquare className="w-5 h-5 mr-2" />
        Enviar Notificações
      </h2>

      {status.text && (
        <div className={`p-4 rounded-lg mb-6 ${
          status.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {status.text}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Destinatário</label>
          <div className="relative">
            {recipient === 'all' ? (
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
            ) : (
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
            )}
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none appearance-none"
            >
              <option value="all">Todos os Alunos</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.nickname ? `(${user.nickname})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Frases Prontas (Clique para usar)</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {MOTIVATIONAL_PHRASES.map((phrase, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMessage(phrase)}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-full transition-colors text-left"
              >
                {phrase.length > 40 ? phrase.substring(0, 40) + '...' : phrase}
              </button>
            ))}
          </div>
          
          <label className="block text-sm font-medium text-slate-400 mb-2">Mensagem</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none"
            rows={4}
            placeholder="Digite sua mensagem aqui..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center ${
            loading || !message.trim() 
              ? 'bg-slate-700 cursor-not-allowed text-slate-500' 
              : 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20'
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Enviar Notificação
            </>
          )}
        </button>
      </form>
    </div>
  );
}
