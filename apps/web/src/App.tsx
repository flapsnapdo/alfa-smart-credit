import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/client/LoginPage';
import { ProductSelectPage } from './pages/client/ProductSelectPage';
import { ClientLayout } from './components/ClientLayout';

export default function App() {
  return (
    <Routes>
      {/* Страница входа без Layout (на весь экран) */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Все страницы клиента оборачиваем в ClientLayout */}
      <Route element={<ClientLayout />}>
        <Route path="/client/product-select" element={<ProductSelectPage />} />
        <Route 
          path="/client/dashboard" 
          element={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h1>Кабинет клиента</h1>
              <p>Здесь будет список заявок (К2)</p>
            </div>
          } 
        />
        {/* Сюда потом добавим К4, К5, К6... */}
      </Route>

      {/* Заглушка для аналитика */}
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