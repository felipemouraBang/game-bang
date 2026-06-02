import React, { useState } from 'react';
import { Users, CheckCircle, Trophy, FileText, Bell, QrCode, Timer, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UsersTab from '../components/admin/UsersTab';
import ValidationsTab from '../components/admin/ValidationsTab';
import WinnersTab from '../components/admin/WinnersTab';
import PointsTab from '../components/admin/PointsTab';
import LogsTab from '../components/admin/LogsTab';
import NotificationsTab from '../components/admin/NotificationsTab';
import QRCodeTab from '../components/admin/QRCodeTab';
import ChallengesTab from '../components/admin/ChallengesTab';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  const allTabs = [
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'validations', label: 'Validações', icon: CheckCircle },
    { id: 'winners', label: 'Primeiros Colocados', icon: Award },
    { id: 'points', label: 'Pontuação', icon: Trophy },
    { id: 'challenges', label: 'Desafios', icon: Timer },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'qrcode', label: 'QR Code', icon: QrCode },
  ];

  const tabs = user?.role === 'restricted_admin'
    ? allTabs.filter(tab => ['users', 'validations', 'winners'].includes(tab.id))
    : allTabs;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Painel Administrativo</h1>

      <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 min-h-[500px]">
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'validations' && <ValidationsTab isAdmin={true} />}
        {activeTab === 'winners' && <WinnersTab />}
        {activeTab === 'points' && <PointsTab />}
        {activeTab === 'challenges' && <ChallengesTab />}
        {activeTab === 'logs' && <LogsTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'qrcode' && <QRCodeTab />}
      </div>
    </div>
  );
}
