
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { X, DollarSign, FileText, Tag } from 'lucide-react';
import { ExpenseCategory, ExpenseRecord } from '../types';

interface AddExpenseModalProps {
  onSave: (expense: Omit<ExpenseRecord, 'id' | 'date' | 'recordedBy'>) => void;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('FOOD');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    onSave({
      title,
      amount: parseFloat(amount),
      category,
      note
    });
  };

  const categories: ExpenseCategory[] = ['FOOD', 'UTILITIES', 'MAINTENANCE', 'SALARY', 'MISC'];

  return (
    <div className="fixed inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#FDFDFD] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-[#F2F5F1] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#F2F5F1] flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="font-bold text-xl text-[#1A2F1A]">Add Expense</h3>
            <p className="text-xs text-[#7A8C7A]">Log operating costs</p>
          </div>
          <button onClick={onClose} className="text-[#7A8C7A] hover:text-[#1A2F1A] bg-[#F2F5F1] p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Amount Input */}
            <div>
               <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Amount (₱)</label>
               <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0C4B0]" size={20} />
                   <input 
                     type="number" 
                     required
                     min="0"
                     step="0.01"
                     value={amount}
                     onChange={(e) => setAmount(e.target.value)}
                     className="w-full pl-12 p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-black text-lg placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all"
                     placeholder="0.00"
                     autoFocus
                   />
               </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Expense Title</label>
              <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0C4B0]" size={18} />
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full pl-12 p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all"
                    placeholder="e.g., Staff Meriendas"
                  />
              </div>
            </div>

            {/* Category Selection */}
            <div>
                <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Category</label>
                <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0C4B0]" size={18} />
                    <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                        className="w-full pl-12 p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all appearance-none"
                    >
                        {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#4A6741]">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Note Input */}
            <div>
              <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Note (Optional)</label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all h-24 resize-none"
                placeholder="Additional details..."
              />
            </div>

            <Button type="submit" className="w-full py-4 text-base shadow-lg shadow-[#4A6741]/20">
                Save Expense
            </Button>

        </form>
      </div>
    </div>
  );
};
