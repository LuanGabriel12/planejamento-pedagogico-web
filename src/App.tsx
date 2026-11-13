import React from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Header } from './components/layout/Header';
import { ProfessorDashboard } from './components/professor/ProfessorDashboard';
import { DiretorDashboard } from './components/diretor/DiretorDashboard';

const AppContent: React.FC = () => {
  const { usuarioLogado } = useApp();

  if (!usuarioLogado) {
    return <LoginScreen />;
  }

  if (usuarioLogado.role === 'professor') {
    return (
      <div className="min-h-screen">
        <Header />
        <ProfessorDashboard />
      </div>
    );
  }

  if (usuarioLogado.role === 'diretor') {
    return (
      <div className="min-h-screen">
        <Header />
        <DiretorDashboard />
      </div>
    );
  }

  return null;
};

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <div role="note" className="bg-amber-100 text-amber-950 text-center px-4 py-3 text-sm font-semibold">DEMONSTRAÇÃO EDUCACIONAL · Perfis simulados, sem autenticação real. Use apenas dados fictícios. Informações ficam neste navegador.</div>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#1f2937',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;

