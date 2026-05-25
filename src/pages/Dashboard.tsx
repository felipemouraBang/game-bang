import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import ReceptionDashboard from './ReceptionDashboard';
import StudentDashboard from './StudentDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (user.role === 'admin' || user.role === 'restricted_admin') {
    return <AdminDashboard />;
  } else if (user.role === 'receptionist') {
    return <ReceptionDashboard />;
  } else {
    return <StudentDashboard />;
  }
}
