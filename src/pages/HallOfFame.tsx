import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Star } from 'lucide-react';
import { UNITS } from './Register';

export default function HallOfFame() {
  const [ranking, setRanking] = useState([]);
  const [annualTop3, setAnnualTop3] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [unit, setUnit] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnualTop3();
  }, []);

  useEffect(() => {
    fetchRanking();
  }, [period, unit]);

  const fetchAnnualTop3 = async () => {
    try {
      const res = await fetch(`/api/stats/ranking?period=annual&unit=all`);
      const data = await res.json();
      setAnnualTop3(data.slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats/ranking?period=${period}&unit=${period === 'monthly' ? unit : 'all'}`);
      const data = await res.json();
      setRanking(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMedal = (index) => {
    if (index === 0) return <Crown className="w-8 h-8 text-yellow-500" />;
    if (index === 1) return <Medal className="w-8 h-8 text-slate-400" />;
    if (index === 2) return <Medal className="w-8 h-8 text-orange-700" />;
    return <span className="text-xl font-bold text-slate-500 w-8 text-center">{index + 1}</span>;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center">
          <Trophy className="w-10 h-10 text-yellow-500 mr-3" />
          Hall da Fama
        </h1>
        <p className="text-slate-400">Os maiores guerreiros da Team Bang Fight E Fitness</p>
      </div>

      {/* Top 3 Anual Global */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center">
          <Star className="w-6 h-6 text-blue-500 mr-2" />
          Top 3 Anual (Global)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {annualTop3.map((user, index) => (
            <div key={user.id} className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-3 opacity-20">
                {index === 0 && <Crown className="w-16 h-16 text-yellow-500" />}
                {index === 1 && <Medal className="w-16 h-16 text-slate-400" />}
                {index === 2 && <Medal className="w-16 h-16 text-orange-700" />}
              </div>
              <div className="w-20 h-20 rounded-full bg-slate-700 overflow-hidden border-4 border-slate-800 mb-4 relative z-10 shadow-lg">
                {user.photo ? (
                  <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-2xl">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-white text-lg relative z-10">{user.nickname || user.name}</h3>
              <p className="text-xs text-slate-400 mb-3 relative z-10">{user.unit || 'Sem unidade'}</p>
              <div className="bg-blue-500/20 px-4 py-2 rounded-full relative z-10 border border-blue-500/30">
                <span className="font-bold text-blue-400 text-xl">{user.score_annual}</span>
                <span className="text-xs text-blue-300 ml-1 uppercase">pts</span>
              </div>
            </div>
          ))}
          {annualTop3.length === 0 && (
            <div className="col-span-3 text-center text-slate-500 py-8">Nenhum guerreiro pontuou no ano ainda.</div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex space-x-2 bg-slate-800 p-1 rounded-full border border-slate-700">
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
              period === 'monthly'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ranking Mensal
          </button>
          <button
            onClick={() => setPeriod('annual')}
            className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
              period === 'annual'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ranking Anual
          </button>
        </div>

        {period === 'monthly' && (
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500 shadow-lg"
          >
            <option value="all">Todas as Unidades</option>
            {UNITS.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Carregando ranking...</div>
        ) : ranking.length === 0 ? (
          <div className="p-10 text-center text-slate-400">Nenhum guerreiro pontuou ainda.</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {ranking.map((user, index) => (
              <div 
                key={user.id} 
                className={`p-4 flex items-center hover:bg-slate-700/30 transition-colors ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''
                }`}
              >
                <div className="flex-shrink-0 w-12 flex justify-center">
                  {getMedal(index)}
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden border-2 border-slate-600">
                    {user.photo ? (
                      <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-lg">
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex-1">
                  <h3 className={`font-bold ${index === 0 ? 'text-yellow-500 text-lg' : 'text-white'}`}>
                    {user.nickname || user.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {user.nickname && <span className="mr-2">{user.name}</span>}
                    {user.unit && <span className="text-orange-400/70">• {user.unit}</span>}
                  </p>
                </div>

                <div className="text-right">
                  <p className={`font-bold text-xl ${
                    period === 'monthly' ? 'text-orange-500' : 'text-blue-500'
                  }`}>
                    {period === 'monthly' ? user.score_monthly : user.score_annual}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase">Pontos</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
