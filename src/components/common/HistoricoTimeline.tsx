import React from 'react';
import { CheckCircle2, AlertTriangle, MessageCircle, Send, RotateCcw } from 'lucide-react';
import { HistoricoConsideracao, TipoHistorico } from '../../types';
import { DateHelpers } from '../../utils/dateHelpers';

interface HistoricoTimelineProps {
  itens: HistoricoConsideracao[];
}

function getConfigTipo(tipo: TipoHistorico) {
  switch (tipo) {
    case 'aprovacao':
      return {
        label: 'Aprovação',
        icon: CheckCircle2,
        cor: 'text-success bg-success/10 border-success/30'
      };
    case 'ajuste':
      return {
        label: 'Ajustes solicitados',
        icon: AlertTriangle,
        cor: 'text-danger bg-danger/10 border-danger/30'
      };
    case 'reenvio':
      return {
        label: 'Reenvio após ajustes',
        icon: RotateCcw,
        cor: 'text-primary bg-primary/10 border-primary/30'
      };
    case 'envio':
      return {
        label: 'Envio para revisão',
        icon: Send,
        cor: 'text-info bg-info/10 border-info/30'
      };
    default:
      return {
        label: 'Comentário',
        icon: MessageCircle,
        cor: 'text-secondary bg-elevated border-base'
      };
  }
}

export const HistoricoTimeline: React.FC<HistoricoTimelineProps> = ({ itens }) => {
  if (itens.length === 0) {
    return (
      <p className="text-sm text-muted italic">
        Nenhum evento de envio ou revisão registrado até o momento.
      </p>
    );
  }

  const ordenados = [...itens].sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
  );

  return (
    <ol className="space-y-3">
      {ordenados.map(item => {
        const config = getConfigTipo(item.tipo);
        const Icon = config.icon;

        return (
          <li
            key={item.id}
            className="p-3.5 rounded-xl bg-elevated/60 border border-base"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.cor}`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {config.label}
              </span>
              <time className="text-xs text-muted" dateTime={item.criadoEm}>
                {DateHelpers.formatarDataHora(item.criadoEm)}
              </time>
            </div>
            <p className="text-sm text-primary whitespace-pre-wrap leading-relaxed">
              {item.texto}
            </p>
            {item.autorNome && (
              <p className="text-xs text-muted mt-1.5">
                Registrado por {item.autorNome}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
};
