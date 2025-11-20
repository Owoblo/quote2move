import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PricingPage from './pages/PricingPage';
import DashboardPage from './pages/DashboardPage';
import EstimatePage from './pages/EstimatePage';
import QuoteViewerPage from './pages/QuoteViewerPage';
import QuotePreviewPage from './pages/QuotePreviewPage';
import EditQuotePage from './pages/EditQuotePage';
import DemoPage from './pages/DemoPage';
import DemoThankYouPage from './pages/DemoThankYouPage';
import CrewCalendarPage from './pages/CrewCalendarPage';
import SettingsPage from './pages/SettingsPage';
import CustomerUploadPage from './pages/CustomerUploadPage';
import CompanySignupPage from './pages/CompanySignupPage';
import QuoteFeedbackPage from './pages/QuoteFeedbackPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/signup-company" element={<CompanySignupPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/demo/thank-you" element={<DemoThankYouPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/estimate"
            element={
              <ProtectedRoute>
                <EstimatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quote-preview"
            element={<QuotePreviewPage />}
          />
          <Route
            path="/quote/:quoteId"
            element={<QuoteViewerPage />}
          />
          <Route
            path="/quote/:quoteId/edit"
            element={
              <ProtectedRoute>
                <EditQuotePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quote/:quoteId/feedback"
            element={
              <ProtectedRoute>
                <QuoteFeedbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crew/calendar"
            element={<CrewCalendarPage />}
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-upload/:token"
            element={<CustomerUploadPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
