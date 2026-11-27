import React from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Header } from './components/layout/Header';
import { ProfessorDashboard } from './components/professor/ProfessorDashboard';
import { DiretorDashboard } from './components/diretor/DiretorDashboard';
import { PersistenceBanner } from './components/common/PersistenceBanner';

const AppContent: React.FC = () => {
  const { usuarioLogado } = useApp();

  if (!usuarioLogado) {
    return (
      <main id="conteudo-principal">
        <LoginScreen />
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-base">
      <Header />
      <main id="conteudo-principal" className="flex-1">
        {usuarioLogado.role === 'professor' ? <ProfessorDashboard /> : <DiretorDashboard />}
      </main>
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-on-primary focus:shadow-md"
        >
          Ir para o conteúdo principal
        </a>
        <div
          role="note"
          className="bg-amber-100 text-amber-950 border-b border-amber-300 text-center px-4 py-2 text-xs sm:text-sm font-medium"
        >
          <strong>DEMONSTRAÇÃO EDUCACIONAL</strong> · Perfis simulados, sem autenticação real. Use apenas dados fictícios. As informações ficam armazenadas somente neste navegador.
        </div>
        <PersistenceBanner />
        <AppContent />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'rgb(var(--bg-surface))',
              color: 'rgb(var(--text-primary))',
              border: '1px solid rgb(var(--border-strong))',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.875rem',
              boxShadow: 'var(--shadow-lg)'
            }
          }}
        />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
