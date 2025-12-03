import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { X, ArrowRight, Package, Minus, Plus } from 'lucide-react';
import { Product } from '../types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, reason: string) => void;
  product: Product | null;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ isOpen, onClose, onConfirm, product }) => {
  const [mode, setMode] = useState<'ADD' | 'REMOVE'>('ADD');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  // Reset state when modal opens with a new product
  useEffect(() => {
    if (isOpen) {
      setMode('ADD');
      setQuantity('');
      setReason('');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentStock = product.stock;
  const adjustmentAmount = parseInt(quantity) || 0;
  const finalAmount = mode === 'ADD' ? adjustmentAmount : -adjustmentAmount;
  const newStock = currentStock + finalAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentAmount || adjustmentAmount <= 0) return;
    onConfirm(finalAmount, reason || (mode === 'ADD' ? 'Manual Restock' : 'Manual Adjustment'));
  };

  return (
    <div className="fixed inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#FDFDFD] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-[#F2F5F1] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#F2F5F1] flex justify-between items-center bg-white">
          <div>
            <h3 className="font-bold text-xl text-[#1A2F1A]">Adjust Stock</h3>
            <p className="text-xs text-[#7A8C7A]">For {product.name}</p>
          </div>
          <button onClick={onClose} className="text-[#7A8C7A] hover:text-[#1A2F1A] bg-[#F2F5F1] p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Current Status */}
          <div className="flex items-center justify-between bg-[#F2F5F1] p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl text-[#4A6741] shadow-sm">
                <Package size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#7A8C7A] uppercase">Current Stock</p>
                <p className="text-xl font-black text-[#1A2F1A]">{currentStock}</p>
              </div>
            </div>
            <ArrowRight className="text-[#B0C4B0]" />
            <div className="text-right">
              <p className="text-xs font-bold text-[#7A8C7A] uppercase">New Stock</p>
              <p className={`text-xl font-black ${newStock < 0 ? 'text-red-500' : 'text-[#4A6741]'}`}>
                {newStock}
              </p>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F2F5F1] rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('ADD')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                mode === 'ADD' 
                  ? 'bg-white text-[#4A6741] shadow-sm' 
                  : 'text-[#7A8C7A] hover:bg-white/50'
              }`}
            >
              <Plus size={16} /> Add Stock
            </button>
            <button
              type="button"
              onClick={() => setMode('REMOVE')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                mode === 'REMOVE' 
                  ? 'bg-white text-amber-600 shadow-sm' 
                  : 'text-[#7A8C7A] hover:bg-white/50'
              }`}
            >
              <Minus size={16} /> Remove Stock
            </button>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">
              Quantity to {mode === 'ADD' ? 'Add' : 'Remove'}
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-bold text-lg placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all uppercase"
              autoFocus
            />
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">
              Reason / Note
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={mode === 'ADD' ? "e.g., Delivery received" : "e.g., Spoilage, Damage, Internal Use"}
              className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all uppercase"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full py-4 text-base shadow-lg shadow-[#4A6741]/20"
            disabled={!quantity || parseInt(quantity) <= 0}
            variant={mode === 'REMOVE' ? 'danger' : 'primary'}
          >
            Confirm Adjustment
          </Button>
        </form>
      </div>
    </div>
  );
};