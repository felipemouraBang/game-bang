import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UNITS } from '../../pages/Register';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchUsers();
        setConfirmDeleteId(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao excluir usuário');
      }
    } catch (err) {
      console.error('Failed to delete user', err);
      setError('Erro de conexão ao excluir usuário');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">
          {currentUser?.role === 'admin' ? 'Gerenciar Usuários' : 'Lista de Alunos'}
        </h2>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => { setEditingUser(null); setShowModal(true); }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Usuário
          </button>
        )}
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nome ou login..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-300">
          <thead className="text-xs uppercase bg-slate-900 text-slate-400">
            <tr>
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3">Login</th>
              <th className="px-6 py-3">Função</th>
              <th className="px-6 py-3">Unidade</th>
              <th className="px-6 py-3">Pontos (Mês/Ano)</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                <td className="px-6 py-4">{user.login}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                    user.role === 'receptionist' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : user.role === 'receptionist' ? 'Recepção' : 'Aluno'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-300">
                  {user.unit || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className="text-orange-400 font-bold">{user.score_monthly}</span> / <span className="text-slate-400">{user.score_annual}</span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {currentUser?.role === 'admin' ? (
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => { setEditingUser(user); setShowModal(true); }}
                        className="text-blue-400 hover:text-blue-300 p-1"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.login !== 'Admin' && (
                        confirmDeleteId === user.id ? (
                          <div className="inline-flex items-center space-x-2 bg-slate-800 p-1 rounded border border-red-500/50 animate-in fade-in zoom-in duration-200">
                            <span className="text-[10px] text-white font-bold px-1">Excluir?</span>
                            <button 
                              onClick={() => handleDelete(user.id)}
                              className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold py-1 px-2 rounded shadow-sm"
                            >
                              Sim
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-slate-600 hover:bg-slate-500 text-white text-[10px] font-bold py-1 px-2 rounded shadow-sm"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmDeleteId(user.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-xs">Apenas visualização</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <UserModal 
          user={editingUser} 
          onClose={() => setShowModal(false)} 
          onSave={() => { setShowModal(false); fetchUsers(); }} 
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    login: user?.login || '',
    password: '',
    role: user?.role || 'student',
    email: user?.email || '',
    nickname: user?.nickname || '',
    unit: user?.unit || ''
  });

  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const url = user ? `/api/users/${user.id}` : '/api/users';
    const method = user ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      if (res.ok) {
        onSave();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar usuário');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6">{user ? 'Editar Usuário' : 'Novo Usuário'}</h3>
        
        {error && (
          <div className="mb-4 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nome Completo</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Login</label>
              <input 
                type="text" 
                value={formData.login}
                onChange={e => setFormData({...formData, login: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                required
                disabled={user?.login === 'Admin'}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Senha {user && '(Opcional)'}</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                required={!user}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Função</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                disabled={user?.login === 'Admin'}
              >
                <option value="student">Aluno</option>
                <option value="receptionist">Recepcionista</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Apelido</label>
              <input 
                type="text" 
                value={formData.nickname}
                onChange={e => setFormData({...formData, nickname: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">E-mail</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Unidade</label>
              <select 
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                disabled={formData.role !== 'student'}
              >
                <option value="">Selecione...</option>
                {UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
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
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
