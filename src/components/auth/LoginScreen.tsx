import React, { useState } from 'react';
import { BookOpen, User, UserCog, Sun, Moon, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { Card } from '../common/Card';

export const LoginScreen: React.FC = () => {
  const { estado, login } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [professorSelecionado, setProfessorSelecionado] = useState('');
  const [diretorSelecionado, setDiretorSelecionado] = useState('');

  const professores = estado.usuarios.filter(u => u.role === 'professor');
  const diretores = estado.usuarios.filter(u => u.role === 'diretor');

  const handleLoginProfessor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!professorSelecionado) return;
    login(professorSelecionado);
  };

  const handleLoginDiretor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diretorSelecionado) return;
    login(diretorSelecionado);
  };

  return (
    <div className="min-h-[calc(100vh-44px)] flex flex-col justify-between p-4 sm:p-6 bg-base">
      {/* Barra discreta de tema na entrada */}
      <div className="max-w-4xl w-full mx-auto flex justify-end">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-surface border border-base text-secondary hover:text-primary hover:bg-hover transition-colors"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4" aria-hidden="true" />
              <span>Tema claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" aria-hidden="true" />
              <span>Tema escuro</span>
            </>
          )}
        </button>
      </div>

      {/* Conteúdo principal */}
      <div className="w-full max-w-4xl mx-auto my-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-md">
            <BookOpen className="w-8 h-8 text-on-primary" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">
            Planejamento Pedagógico Quinzenal
          </h1>
          <p className="text-base sm:text-lg text-secondary mt-2 max-w-2xl mx-auto">
            Organize planejamentos das 24 quinzenas letivas e simule o ciclo completo de revisão pedagógica entre professor e direção.
          </p>
        </div>

        {/* Cards de seleção de perfil */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card hover className="p-6 sm:p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <User className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Perfil simulado
                </p>
                <h2 className="text-xl font-bold text-primary">Área do Professor</h2>
              </div>
            </div>

            <p className="text-sm text-secondary mb-5">
              Acesse o calendário de 24 quinzenas, salve rascunhos, valide campos obrigatórios, envie para revisão e responda a ajustes solicitados.
            </p>

            <form onSubmit={handleLoginProfessor} className="space-y-4">
              <Select
                label="Selecione um professor fictício"
                required
                value={professorSelecionado}
                onChange={e => setProfessorSelecionado(e.target.value)}
                options={[
                  { value: '', label: 'Selecione um perfil...' },
                  ...professores.map(p => ({
                    value: p.id,
                    label: `${p.nome} (${(p.disciplinas || []).join(', ')})`
                  }))
                ]}
              />

              <Button
                type="submit"
                variant="primary"
                disabled={!professorSelecionado}
                className="w-full"
              >
                <User className="w-4 h-4" aria-hidden="true" />
                Entrar como Professor
              </Button>
            </form>
          </Card>

          <Card hover className="p-6 sm:p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-info/10 rounded-xl">
                <UserCog className="w-6 h-6 text-info" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Perfil simulado
                </p>
                <h2 className="text-xl font-bold text-primary">Painel da Direção</h2>
              </div>
            </div>

            <p className="text-sm text-secondary mb-5">
              Acompanhe indicadores calculados em tempo real, filtre por professor ou status, registre comentários, solicite ajustes ou aprove envios.
            </p>

            <form onSubmit={handleLoginDiretor} className="space-y-4">
              <Select
                label="Selecione um perfil da direção"
                required
                value={diretorSelecionado}
                onChange={e => setDiretorSelecionado(e.target.value)}
                options={[
                  { value: '', label: 'Selecione um perfil...' },
                  ...diretores.map(d => ({
                    value: d.id,
                    label: d.nome
                  }))
                ]}
              />

              <Button
                type="submit"
                variant="primary"
                disabled={!diretorSelecionado}
                className="w-full"
              >
                <UserCog className="w-4 h-4" aria-hidden="true" />
                Entrar como Direção
              </Button>
            </form>
          </Card>
        </div>

        {/* Nota clara sobre armazenamento local e ausência de autenticação */}
        <div className="mt-8 p-4 rounded-xl bg-surface border border-base flex items-start gap-3 text-xs sm:text-sm text-secondary">
          <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>Aviso de demonstração:</strong> esta seleção apenas alterna a visualização local no mesmo navegador. Não há login, servidor, controle de acesso seguro ou sincronização entre dispositivos. Não insira dados pessoais, informações de estudantes ou registros escolares reais.
          </p>
        </div>
      </div>

      <footer className="text-center text-xs text-muted py-2">
        Aplicação demonstrativa local · Dados fictícios armazenados em localStorage
      </footer>
    </div>
  );
};
