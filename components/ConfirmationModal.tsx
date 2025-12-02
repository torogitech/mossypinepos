import React from 'react';
import { Button } from './ui/Button';
import { AlertTriangle, Trash2, RefreshCw, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: 'trash' | 'warning' | 'refresh';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  icon = 'warning'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (icon) {
      case 'trash': return <Trash2 size={32} />;
      case 'refresh': return <RefreshCw size={32} />;
      default: return <AlertTriangle size={32} />;
    }
  };

  const getColors = () => {
    switch (variant) {
      case 'danger': return { bg: 'bg-red-50', text: 'text-red-500', btn: 'danger' as const };
      case 'warning': return { bg: 'bg-amber-50', text: 'text-amber-600', btn: 'primary' as const }; // Using primary/custom for warning usually
      default: return { bg: 'bg-[#E8F5E9]', text: 'text-[#4A6741]', btn: 'primary' as const };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className={`h-16 w-16 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center mb-4`}>
          {getIcon()}
        </div>
        <h3 className="text-xl font-bold text-[#1A2F1A] mb-2">{title}</h3>
        <p className="text-[#7A8C7A] text-sm mb-6 leading-relaxed">
          {description}
        </p>
        <div className="flex gap-3 w-full">
          <Button 
            variant="secondary" 
            className="flex-1 bg-[#F2F5F1] text-[#7A8C7A] hover:bg-[#E8EFE6] hover:text-[#1A2F1A] shadow-none"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            variant={colors.btn}
            className={`flex-1 ${variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};