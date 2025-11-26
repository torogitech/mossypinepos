import React from 'react';
import { Button } from './ui/Button';
import { Trash2 } from 'lucide-react';

interface DeleteCategoryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName?: string;
}

export const DeleteCategoryConfirmationModal: React.FC<DeleteCategoryConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  categoryName 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Trash2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-[#1A2F1A] mb-2">Delete Category?</h3>
        <p className="text-[#7A8C7A] text-sm mb-6">
          Are you sure you want to delete <span className="font-bold text-[#1A2F1A]">{categoryName}</span>? Products in this category may need reassigning.
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
            variant="danger" 
            className="flex-1"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};