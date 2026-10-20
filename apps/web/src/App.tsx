import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/client/LoginPage';
import { ProductSelectPage } from './pages/client/ProductSelectPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/client/product-select" element={<ProductSelectPage />} />
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