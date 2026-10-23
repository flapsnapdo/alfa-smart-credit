import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/client/LoginPage';
import { ProductSelectPage } from './pages/client/ProductSelectPage';
import { CompanyPage } from './pages/client/CompanyPage';
import { FinancialsPage } from './pages/client/FinancialPage';
import { ReviewPage } from './pages/client/ReviewPage';
import { StatusPage } from './pages/client/StatusPage';
import { ApplicationsPage } from './pages/client/ApplicationsPage';
import { ClientLayout } from './components/ClientLayout';
import { DocumentsPage } from './pages/client/DocumentsPage';
import { OfferPage } from './pages/client/OfferPage';
import { SigningPage } from './pages/client/SigningPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<ClientLayout />}>
        <Route path="/client/product-select" element={<ProductSelectPage />} />
        <Route path="/client/company" element={<CompanyPage />} />
        <Route path="/client/financials" element={<FinancialsPage />} />
        <Route path="/client/review" element={<ReviewPage />} />
        <Route path="/client/status" element={<StatusPage />} />
        <Route path="/client/dashboard" element={<ApplicationsPage />} />
        <Route path="/client/documents" element={<DocumentsPage />} />
        <Route path="/client/offer" element={<OfferPage />} />
        <Route path="/client/signing" element={<SigningPage />} />
      </Route>

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