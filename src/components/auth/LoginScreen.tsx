import React, { useState } from 'react';
import { BookOpen, User, UserCog } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { Card } from '../common/Card';

export const LoginScreen: React.FC = () => {
  const { estado, login } = useApp();
  const [professorSelecionado, setProfessorSelecionado] = useState('');
  const [diretorSelecionado, setDiretorSelecionado] = useState('');
  const [loadingProfessor, setLoadingProfessor] = useState(false);
  const [loadingDiretor, setLoadingDiretor] = useState(false);

  const professores = estado.usuarios.filter(u => u.role === 'professor');
  const diretor = estado.usuarios.find(u => u.role === 'diretor');

  const handleLoginProfessor = () => {
    if (!professorSelecionado) return;
    setLoadingProfessor(true);
    
    setTimeout(() => {
      login(professorSelecionado);
      setLoadingProfessor(false);
    }, 800);
  };

  const handleLoginDiretor = () => {
    if (!diretorSelecionado || !diretor) return;
    setLoadingDiretor(true);
    
    setTimeout(() => {
      login(diretorSelecionado);
      setLoadingDiretor(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base transition-colors">
      <div className="w-full max-w-4xl animate-fade-in">
        {/* Logo e Título */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-primary">
            Sistema de Planejamento
          </h1>
          <p className="text-xl text-secondary">
            Pedagógico Quinzenal
          </p>
          <p className="text-sm mt-2 text-muted">
            Explore o fluxo com dados fictícios: nada é enviado à direção de uma escola.
          </p>
        </div>

        {/* Cards de Login */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card Professor */}
          <Card hover className="p-8 animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">
                  Entrar como
                </h2>
                <p className="text-2xl font-bold text-primary">
                  PROFESSOR
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Select
                label="Selecione um perfil fictício"
                required
                value={professorSelecionado}
                onChange={(e) => setProfessorSelecionado(e.target.value)}
                options={[
                  { value: '', label: 'Selecione...' },
                  ...professores.map(p => ({
                    value: p.id,
                    label: p.nome
                  }))
                ]}
              />

              <Button
                variant="primary"
                onClick={handleLoginProfessor}
                isLoading={loadingProfessor}
                disabled={!professorSelecionado}
                className="w-full"
              >
                <User className="w-5 h-5" />
                Entrar como Professor
              </Button>
            </div>
          </Card>

          {/* Card Diretor */}
          <Card hover className="p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-info/10 rounded-lg">
                <UserCog className="w-6 h-6 text-info" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">
                  Entrar como
                </h2>
                <p className="text-2xl font-bold text-info">
                  DIRETOR
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Select
                label="Selecione um perfil fictício"
                required
                value={diretorSelecionado}
                onChange={(e) => setDiretorSelecionado(e.target.value)}
                options={[
                  { value: '', label: 'Selecione...' },
                  { value: diretor?.id || '', label: diretor?.nome || '' }
                ]}
              />

              <Button
                variant="primary"
                onClick={handleLoginDiretor}
                isLoading={loadingDiretor}
                disabled={!diretorSelecionado}
                className="w-full"
              >
                <UserCog className="w-5 h-5" />
                Entrar como Diretor
              </Button>
            </div>
          </Card>
        </div>

        {/* Rodapé */}
        <div className="text-center mt-8 text-sm text-muted">
          <p>Sistema desenvolvido com ❤️ para educação de qualidade</p>
        </div>
      </div>
    </div>
  );
};
