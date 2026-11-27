import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, FileEdit, CircleDashed } from 'lucide-react';
import { StatusPlanejamento } from '../../types';
import { LABELS_STATUS } from '../../domain/stateMachine';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status?: StatusPlanejamento;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  if (!status) {
    return (
      <Badge variant="gray" size={size}>
        <CircleDashed className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Não criado</span>
      </Badge>
    );
  }

  switch (status) {
    case 'aprovado':
      return (
        <Badge variant="success" size={size}>
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{LABELS_STATUS.aprovado}</span>
        </Badge>
      );
    case 'aguardando_revisao':
      return (
        <Badge variant="warning" size={size}>
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{LABELS_STATUS.aguardando_revisao}</span>
        </Badge>
      );
    case 'ajustes_solicitados':
      return (
        <Badge variant="danger" size={size}>
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{LABELS_STATUS.ajustes_solicitados}</span>
        </Badge>
      );
    case 'rascunho':
      return (
        <Badge variant="info" size={size}>
          <FileEdit className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{LABELS_STATUS.rascunho}</span>
        </Badge>
      );
  }
};
