import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function EvolutionChart({ userId }) {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchData();
  }, [period, userId]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/stats/evolution?period=${period}`, { credentials: 'include' });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-end space-x-2 mb-2">
        <button 
          onClick={() => setPeriod('week')}
          className={`text-xs px-2 py-1 rounded ${period === 'week' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Semana
        </button>
        <button 
          onClick={() => setPeriod('month')}
          className={`text-xs px-2 py-1 rounded ${period === 'month' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Mês
        </button>
        <button 
          onClick={() => setPeriod('year')}
          className={`text-xs px-2 py-1 rounded ${period === 'year' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Ano
        </button>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={10} 
              tickFormatter={(val) => {
                const d = new Date(val);
                return period === 'year' ? d.toLocaleDateString('pt-BR', { month: 'short' }) : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              }}
            />
            <YAxis stroke="#94a3b8" fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
              itemStyle={{ color: '#60a5fa' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Line 
              type="monotone" 
              dataKey="total_points" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={{ r: 4, fill: '#3b82f6' }} 
              activeDot={{ r: 6, fill: '#60a5fa' }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
