import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/client/LoginPage';

export default function App() {
  return (
    <Routes>
      {/* Главная страница → редирект на вход */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Экран входа */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Заглушки для кабинетов (пока в разработке) */}
      <Route 
        path="/client/dashboard" 
        element={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Кабинет клиента</h1>
            <p>В разработке...</p>
          </div>
        } 
      />
      <Route 
        path="/analyst/dashboard" 
        element={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Кабинет аналитика</h1>
            <p>В разработке...</p>
          </div>
        } 
      />
    </Routes>
  );
}