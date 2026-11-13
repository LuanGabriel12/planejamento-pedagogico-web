export interface Usuario {
  id: string;
  nome: string;
  role: 'professor' | 'diretor';
  email: string;
  avatar: string;
  disciplinas?: string[];
  turmas?: string[];
}
