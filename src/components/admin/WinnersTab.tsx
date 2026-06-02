import React, { useState, useEffect } from 'react';
import { Award, Trophy, User } from 'lucide-react';

interface LeaderData {
  id: number;
  name: string;
  score: number;
  email: string;
  photo?: string;
}

interface UnitLeader {
  unit: string;
  monthlyLeader: LeaderData;
  annualLeader: LeaderData;
}

export default function WinnersTab() {
  const [leaders, setLeaders] = useState<UnitLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreType, setScoreType] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    try {
      const res = await fetch('/api/admin/unit-leaders', { credentials: 'include' });
      const data = await res.json();
      setLeaders(data);
    } catch (err) {
      console.error('Error fetching unit leaders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center text-slate-400 py-10">Carregando primeiros colocados...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-yellow-500 w-6 h-6" /> Primeiros Colocados por Unidade
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Localize os alunos em primeiro lugar de cada unidade para a premiação.
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setScoreType('monthly')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              scoreType === 'monthly'
                ? 'bg-orange-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ranking Mensal
          </button>
          <button
            onClick={() => setScoreType('annual')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              scoreType === 'annual'
                ? 'bg-orange-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ranking Anual
          </button>
        </div>
      </div>

      {leaders.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          Nenhum dado encontrado ou nenhum aluno cadastrado nas unidades.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaders.map((item) => {
            const isMonthly = scoreType === 'monthly';
            const leader = isMonthly ? item.monthlyLeader : item.annualLeader;
            const hasLeader = leader && leader.name;

            return (
              <div
                key={item.unit}
                className="bg-slate-900 border border-slate-700/60 rounded-xl p-5 hover:border-orange-500/30 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Visual badge highlight for 1st place */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-bl-full pointer-events-none flex items-start justify-end p-4">
                  <Award className="w-6 h-6 text-yellow-500/60" />
                </div>

                <div>
                  <span className="text-xs font-semibold text-orange-500 bg-orange-500/10 rounded-full px-3 py-1 font-mono uppercase tracking-wider">
                    {item.unit}
                  </span>

                  {hasLeader ? (
                    <div className="mt-4 flex items-center gap-4">
                      {leader.photo ? (
                        <img
                          src={leader.photo}
                          alt={leader.name}
                          className="w-14 h-14 rounded-full border-2 border-yellow-500 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-slate-800 rounded-full border-2 border-yellow-500 flex items-center justify-center text-slate-400">
                          <User className="w-7 h-7" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate text-base">
                          {leader.name}
                        </h4>
                        <p className="text-slate-400 text-xs truncate">
                          {leader.email || 'Sem e-mail'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 py-4 text-center text-slate-500 text-sm">
                      Sem alunos cadastrados nesta unidade
                    </div>
                  )}
                </div>

                {hasLeader && (
                  <div className="mt-5 pt-4 border-t border-slate-800/60 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Pontuação {isMonthly ? 'Mensal' : 'Anual'}:</span>
                    <span className="text-lg font-black text-yellow-500 font-mono">
                      {leader.score} pts
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
