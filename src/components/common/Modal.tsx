import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop - semi-transparente para profundidade */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/70"
        onClick={onClose}
      />
      
      {/* Modal - fundo 100% sólido */}
      <div className={`relative rounded-2xl shadow-2xl ${sizes[size]} w-full animate-scale-in overflow-hidden flex flex-col max-h-[90vh] bg-surface border-2 border-base`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-8 py-6 border-b-2 border-base bg-surface">
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all text-text-muted hover:text-text-primary hover:bg-hover active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-surface">
          {children}
        </div>
      </div>
    </div>
  );
};
