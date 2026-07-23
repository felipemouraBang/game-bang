import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center text-slate-400 py-10">Carregando logs...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-slate-300">
        <thead className="text-xs uppercase bg-slate-900 text-slate-400">
          <tr>
            <th className="px-6 py-3">Data/Hora</th>
            <th className="px-6 py-3">Usuário</th>
            <th className="px-6 py-3">Ação</th>
            <th className="px-6 py-3">Detalhes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-700/50 transition-colors">
              <td className="px-6 py-4 text-xs font-mono text-slate-500">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="px-6 py-4 font-medium text-white">
                {log.user_name || 'Sistema'}
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-slate-800 rounded text-xs font-semibold text-blue-400">
                  {log.action}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-400">
                {log.details}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
