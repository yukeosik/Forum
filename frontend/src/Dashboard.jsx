import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { currentUser } = useAuth();

  return (
    <div>
      <h1>Личный кабинет</h1>
      <p>Добро пожаловать, {currentUser?.username}!</p>
    </div>
  );
}