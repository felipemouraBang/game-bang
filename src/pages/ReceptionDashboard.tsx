import React, { useState } from 'react';
import { Users, CheckCircle } from 'lucide-react';
import UsersTab from '../components/admin/UsersTab';
import ValidationsTab from '../components/admin/ValidationsTab';
import ChallengeCountdown from '../components/ChallengeCountdown';

export default function ReceptionDashboard() {
  const [activeTab, setActiveTab] = useState('validations');

  const tabs = [
    { id: 'validations', label: 'Validações', icon: CheckCircle },
    { id: 'users', label: 'Alunos', icon: Users },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Painel da Recepção</h1>

      <div className="mb-8">
        <ChallengeCountdown />
      </div>

      <div className="flex space-x-4 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 min-h-[500px]">
        {activeTab === 'validations' && <ValidationsTab isAdmin={false} />}
        {activeTab === 'users' && <UsersTab />}
      </div>
    </div>
  );
}
