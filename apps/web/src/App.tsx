import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/client/LoginPage';
import { ProductSelectPage } from './pages/client/ProductSelectPage';
import { CompanyPage } from './pages/client/CompanyPage';
import { ReviewPage } from './pages/client/ReviewPage';
import { StatusPage } from './pages/client/StatusPage';
import { ApplicationsPage } from './pages/client/ApplicationsPage';
import { AnalystLayout, ClientLayout } from './components/ClientLayout';
import { DocumentsPage } from './pages/client/DocumentsPage';
import { OfferPage } from './pages/client/OfferPage';
import { SigningPage } from './pages/client/SigningPage';
import { A1 } from './pages/analyst/A1';
import { A2 } from './pages/analyst/A2';
import { A3 } from './pages/analyst/A3';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Кабинет клиента: К2 мои заявки → К3 продукт → К4 компания → К6 проверка → К7–К9 статус, документы, предложение, подпись */}
      <Route element={<ClientLayout />}>
        <Route path="/client/dashboard" element={<ApplicationsPage />} />
        <Route path="/client/product-select" element={<ProductSelectPage />} />
        <Route path="/client/company" element={<CompanyPage />} />
        <Route path="/client/review" element={<ReviewPage />} />
        <Route path="/client/applications/:id" element={<StatusPage />} />
        <Route path="/client/applications/:id/documents" element={<DocumentsPage />} />
        <Route path="/client/applications/:id/offer" element={<OfferPage />} />
        <Route path="/client/applications/:id/signing" element={<SigningPage />} />
      </Route>

      {/* Кабинет аналитика: А1 очередь → А2 карточка → А3 решение */}
      <Route element={<AnalystLayout />}>
        <Route path="/analyst/dashboard" element={<A1 />} />
        <Route path="/analyst/application/:id" element={<A2 />} />
        <Route path="/analyst/application/:id/decision" element={<A3 />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
