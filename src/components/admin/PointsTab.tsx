import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Trash2, MinusCircle, PlusCircle, User, X, Check } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  nickname: string;
  score_monthly: number;
  score_annual: number;
  unit: string;
}

function RemovePointsModal({ user, onClose, onConfirm }: { user: UserData, onClose: () => void, onConfirm: (points: number, type: 'monthly' | 'annual' | 'both') => void }) {
  const [points, setPoints] = useState('');
  const [type, setType] = useState<'monthly' | 'annual' | 'both'>('monthly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(points);
    if (!isNaN(p) && p > 0) {
      onConfirm(p, type);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Remover Pontos</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-slate-300 mb-4">
          Remover pontos de <strong className="text-white">{user.name}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Quantidade de Pontos</label>
            <input 
              type="number" 
              min="1"
              value={points}
              onChange={e => setPoints(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tipo de Pontuação</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
            >
              <option value="monthly">Apenas Mensal</option>
              <option value="annual">Apenas Anual</option>
              <option value="both">Mensal e Anual</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded transition-colors"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddPointsModal({ user, onClose, onConfirm }: { user: UserData, onClose: () => void, onConfirm: (points: number, type: 'monthly' | 'annual' | 'both') => void }) {
  const [points, setPoints] = useState('');
  const [type, setType] = useState<'monthly' | 'annual' | 'both'>('monthly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(points);
    if (!isNaN(p) && p > 0) {
      onConfirm(p, type);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Adicionar Pontos</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-slate-300 mb-4">
          Adicionar pontos para <strong className="text-white">{user.name}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Quantidade de Pontos</label>
            <input 
              type="number" 
              min="1"
              value={points}
              onChange={e => setPoints(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tipo de Pontuação</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
            >
              <option value="monthly">Apenas Mensal</option>
              <option value="annual">Apenas Anual</option>
              <option value="both">Mensal e Anual</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded transition-colors"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PointsTab() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userToAddPoints, setUserToAddPoints] = useState<UserData | null>(null);
  const [userToRemovePoints, setUserToRemovePoints] = useState<UserData | null>(null);
  const [userToReset, setUserToReset] = useState<UserData | null>(null);
  const [confirmReset, setConfirmReset] = useState<'monthly' | 'annual' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data.filter((u: any) => u.role === 'student'));
        } else {
          setUsers([]);
        }
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleReset = async (type: 'monthly' | 'annual') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reset/${type}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`Reset ${type} successful:`, data);
        setConfirmReset(null);
        showSuccess(`Pontuação ${type === 'monthly' ? 'MENSAL' : 'ANUAL'} de todos os alunos foi resetada!`);
        fetchUsers();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Erro ao resetar pontuação.');
      }
    } catch (err) {
      console.error('Reset error:', err);
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateMonthly = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/recalculate/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        showSuccess(data.message || 'Pontuação mensal recalculada com sucesso!');
        fetchUsers();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Erro ao recalcular pontuação mensal.');
      }
    } catch (err) {
      console.error('Recalculate error:', err);
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetUser = async (userId: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reset-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        credentials: 'include'
      });
      if (res.ok) {
        const user = users.find(u => u.id === userId);
        setUserToReset(null);
        showSuccess(`Pontuação de ${user?.name || 'aluno'} foi resetada!`);
        fetchUsers();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Erro ao resetar pontuação do aluno.');
      }
    } catch (err) {
      console.error('Reset user error:', err);
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePoints = async (userId: number, points: number, type: 'monthly' | 'annual' | 'both') => {
    try {
      const res = await fetch('/api/admin/remove-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, points, type }),
        credentials: 'include'
      });
      if (res.ok) {
        const user = users.find(u => u.id === userId);
        setUserToRemovePoints(null);
        showSuccess(`${points} pontos removidos de ${user?.name || 'aluno'}!`);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao remover pontos.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPoints = async (userId: number, points: number, type: 'monthly' | 'annual' | 'both') => {
    try {
      const res = await fetch('/api/admin/add-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, points, type }),
        credentials: 'include'
      });
      if (res.ok) {
        const user = users.find(u => u.id === userId);
        setUserToAddPoints(null);
        showSuccess(`${points} pontos adicionados a ${user?.name || 'aluno'}!`);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao adicionar pontos.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.nickname && u.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl z-[100] animate-bounce flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {successMessage}
        </div>
      )}

      {/* Global Resets & Recalculate */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <RefreshCw className="w-32 h-32 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 text-emerald-500" />
            Recalcular Mês Atual
          </h3>
          <p className="text-slate-400 mb-6 text-sm">
            Recalcula e sincroniza os pontos mensais com base APENAS nas ações aprovadas do mês 7 (Julho/2026).
          </p>
          <button
            onClick={handleRecalculateMonthly}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? 'Sincronizando...' : 'Recalcular Pontos do Mês'}
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <RefreshCw className="w-32 h-32 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 text-blue-500" />
            Resetar Mês (Global)
          </h3>
          <p className="text-slate-400 mb-6 text-sm">
            Zera a pontuação mensal de todos os alunos.
          </p>
          <button
            onClick={() => setConfirmReset('monthly')}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? 'Processando...' : 'Resetar Pontuação Mensal'}
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <RefreshCw className="w-32 h-32 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 text-orange-500" />
            Resetar Ano (Global)
          </h3>
          <p className="text-slate-400 mb-6 text-sm">
            Zera a pontuação anual de todos os alunos.
          </p>
          <button
            onClick={() => setConfirmReset('annual')}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? 'Processando...' : 'Resetar Pontuação Anual'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Global Resets */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center text-orange-500 mb-4">
              <AlertTriangle className="w-8 h-8 mr-3" />
              <h3 className="text-xl font-bold text-white">Confirmação de Reset Global</h3>
            </div>
            <p className="text-slate-300 mb-6">
              Tem certeza que deseja resetar a pontuação <strong className="text-white uppercase">{confirmReset === 'monthly' ? 'Mensal' : 'Anual'}</strong> de <strong className="text-white">TODOS</strong> os alunos? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setConfirmReset(null)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleReset(confirmReset)}
                disabled={loading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
              >
                {loading ? 'Processando...' : 'Confirmar Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Individual User Reset */}
      {userToReset && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center text-orange-500 mb-4">
              <AlertTriangle className="w-8 h-8 mr-3" />
              <h3 className="text-xl font-bold text-white">Zerar Pontuação</h3>
            </div>
            <p className="text-slate-300 mb-6">
              Deseja resetar <strong className="text-white">TODA</strong> a pontuação (Mensal e Anual) do aluno <strong className="text-white">{userToReset.name}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setUserToReset(null)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleResetUser(userToReset.id)}
                disabled={loading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
              >
                {loading ? 'Processando...' : 'Zerar Pontos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User List Management */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <User className="w-5 h-5 mr-2 text-orange-500" />
            Gerenciar Pontuação por Usuário
          </h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={fetchUsers}
              className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-lg"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Aluno</th>
                <th className="px-6 py-4 font-medium">Unidade</th>
                <th className="px-6 py-4 font-medium">Mês</th>
                <th className="px-6 py-4 font-medium">Ano</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{u.name}</div>
                    <div className="text-slate-500 text-xs">{u.nickname || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-300 text-sm">{u.unit || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-orange-500 font-bold">{u.score_monthly}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-blue-500 font-bold">{u.score_annual}</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => setUserToAddPoints(u)}
                      title="Adicionar pontos"
                      className="p-2 text-slate-400 hover:text-green-500 transition-colors bg-slate-800 rounded-lg"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setUserToRemovePoints(u)}
                      title="Remover pontos"
                      className="p-2 text-slate-400 hover:text-orange-500 transition-colors bg-slate-800 rounded-lg"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setUserToReset(u)}
                      title="Zerar pontuação deste aluno"
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-800 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {userToAddPoints && (
        <AddPointsModal
          user={userToAddPoints}
          onClose={() => setUserToAddPoints(null)}
          onConfirm={(points, type) => handleAddPoints(userToAddPoints.id, points, type)}
        />
      )}

      {userToRemovePoints && (
        <RemovePointsModal
          user={userToRemovePoints}
          onClose={() => setUserToRemovePoints(null)}
          onConfirm={(points, type) => handleRemovePoints(userToRemovePoints.id, points, type)}
        />
      )}
    </div>
  );
}
