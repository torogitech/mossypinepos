import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  productName?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, onClose, imageUrl, productName }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-[#1A2F1A]/90 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Close button fixed to screen for easy access on mobile */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 md:top-8 md:right-8 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors backdrop-blur-md z-10"
      >
        <X size={24} />
      </button>

      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aspect-square w-full bg-[#F2F5F1] rounded-2xl overflow-hidden relative">
            <img 
            src={imageUrl} 
            alt={productName} 
            className="w-full h-full object-cover"
            />
        </div>
        
        {productName && (
            <div className="p-5 text-center">
                <h3 className="font-bold text-xl text-[#1A2F1A]">{productName}</h3>
            </div>
        )}
      </div>
    </div>
  );
};