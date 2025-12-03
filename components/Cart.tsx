
import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { Trash2, Minus, Plus, ShoppingBag, CreditCard, X, Percent, Banknote } from 'lucide-react';
import { Button } from './ui/Button';

interface CheckoutDetails {
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  change: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (details: CheckoutDetails) => void;
  onClear: () => void;
  onClose?: () => void;
}

export const Cart: React.FC<CartProps> = ({ items, onUpdateQuantity, onRemove, onCheckout, onClear, onClose }) => {
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('FIXED');
  const [paidAmount, setPaidAmount] = useState('');

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grossTotal = subtotal;

  let discount = 0;
  if (discountValue) {
      const val = parseFloat(discountValue);
      if (!isNaN(val)) {
          if (discountType === 'PERCENTAGE') {
              discount = grossTotal * (val / 100);
          } else {
              discount = val;
          }
      }
  }
  
  // Ensure discount doesn't exceed total
  if (discount > grossTotal) discount = grossTotal;

  const finalTotal = Math.max(0, grossTotal - discount);
  const paid = parseFloat(paidAmount) || 0;
  const change = Math.max(0, paid - finalTotal);
  
  // Reset local state if items are cleared
  useEffect(() => {
      if (items.length === 0) {
          setDiscountValue('');
          setPaidAmount('');
      }
  }, [items.length]);

  const handleCheckoutClick = () => {
      onCheckout({
          subtotal,
          discount,
          total: finalTotal,
          paidAmount: paid,
          change
      });
  };

  const quickAmounts = [100, 200, 500, 1000];

  return (
    <div className="flex flex-col h-full bg-[#FDFDFD]">
      {/* Header */}
      <div className="p-5 border-b border-[#F2F5F1] flex justify-between items-center bg-white shrink-0">
        <h2 className="font-bold text-xl text-[#1A2F1A]">Current Order</h2>
        <div className="flex items-center gap-2">
            {items.length > 0 && (
                <button onClick={onClear} className="text-xs text-red-400 hover:text-red-600 font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
                Clear All
                </button>
            )}
            {onClose && (
                <button onClick={onClose} className="p-2 text-[#7A8C7A] hover:text-[#1A2F1A] bg-[#F2F5F1] hover:bg-[#E8EFE6] rounded-full transition-colors">
                    <X size={20} />
                </button>
            )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#7A8C7A] p-8">
            <div className="h-24 w-24 bg-[#F2F5F1] rounded-full flex items-center justify-center mb-4">
            <ShoppingBag size={40} className="text-[#B0C4B0]" />
            </div>
            <p className="text-lg font-bold text-[#4A6741]">Current Order is Empty</p>
            <p className="text-sm">Add items from the menu to start.</p>
        </div>
      ) : (
        <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-[#F2F5F1] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                    <img src={item.image} alt={item.name} className="h-14 w-14 rounded-xl object-cover bg-[#F2F5F1]" />
                    <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                        <span className="font-bold text-[#1A2F1A] text-sm truncate">{item.name}</span>
                        <span className="font-bold text-[#4A6741] text-sm ml-2">₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[#7A8C7A]">@ ₱{item.price.toFixed(2)}</span>
                        <div className="flex items-center gap-2 bg-[#F2F5F1] rounded-lg p-1">
                        <button 
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm text-[#4A6741] disabled:opacity-50"
                            disabled={item.quantity <= 1}
                        >
                            <Minus size={12} />
                        </button>
                        <span className="text-sm font-bold w-4 text-center text-[#1A2F1A]">{item.quantity}</span>
                        <button 
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center bg-[#4A6741] rounded-md shadow-sm text-white"
                        >
                            <Plus size={12} />
                        </button>
                        </div>
                    </div>
                    </div>
                    <button 
                    onClick={() => onRemove(item.id)}
                    className="text-[#B0C4B0] hover:text-red-500 p-2 transition-colors"
                    >
                    <Trash2 size={18} />
                    </button>
                </div>
                ))}
            </div>

            {/* Payment Section */}
            <div className="p-5 bg-white border-t border-[#F2F5F1] rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10 shrink-0 space-y-4">
                
                {/* Discount Controls */}
                <div className="flex items-center gap-2">
                     <div className="relative flex-1">
                        <input 
                            type="number" 
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            placeholder="Discount"
                            className="w-full pl-3 pr-3 py-2 bg-[#F2F5F1] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 text-[#1A2F1A] uppercase"
                        />
                     </div>
                     <div className="flex bg-[#F2F5F1] rounded-xl p-1">
                        <button 
                            onClick={() => setDiscountType('FIXED')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${discountType === 'FIXED' ? 'bg-white shadow-sm text-[#1A2F1A]' : 'text-[#7A8C7A]'}`}
                        >
                            ₱
                        </button>
                        <button 
                            onClick={() => setDiscountType('PERCENTAGE')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${discountType === 'PERCENTAGE' ? 'bg-white shadow-sm text-[#1A2F1A]' : 'text-[#7A8C7A]'}`}
                        >
                            %
                        </button>
                     </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#7A8C7A]">
                        <span>Subtotal</span>
                        <span>₱{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                         <div className="flex justify-between text-xs text-[#4A6741] font-medium">
                            <span>Discount</span>
                            <span>-₱{discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-black text-[#1A2F1A] pt-2 border-t border-dashed border-[#E8EFE6]">
                        <span>Total</span>
                        <span>₱{finalTotal.toFixed(2)}</span>
                    </div>
                </div>

                {/* Paid Amount Input */}
                <div className="space-y-2">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0C4B0]">
                            <Banknote size={16} />
                        </div>
                        <input 
                            type="number" 
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            placeholder="Amount Paid"
                            className="w-full pl-10 pr-3 py-3 bg-[#F2F5F1] rounded-xl text-[#1A2F1A] font-bold focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 uppercase"
                        />
                         {paid > 0 && change >= 0 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#4A6741] bg-[#E8F5E9] px-2 py-1 rounded-lg">
                                Change: ₱{change.toFixed(2)}
                            </div>
                        )}
                    </div>
                    
                    {/* Quick Amounts */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {quickAmounts.map(amt => (
                            <button 
                                key={amt}
                                onClick={() => setPaidAmount(amt.toString())}
                                className="px-3 py-1.5 bg-white border border-[#E8EFE6] rounded-lg text-xs font-bold text-[#7A8C7A] hover:bg-[#F2F5F1] hover:text-[#1A2F1A] whitespace-nowrap"
                            >
                                ₱{amt}
                            </button>
                        ))}
                         <button 
                                onClick={() => setPaidAmount(finalTotal.toFixed(2))}
                                className="px-3 py-1.5 bg-[#4A6741]/10 border border-[#4A6741]/20 rounded-lg text-xs font-bold text-[#4A6741] hover:bg-[#4A6741]/20 whitespace-nowrap"
                            >
                                Exact
                            </button>
                    </div>
                </div>

                <Button 
                    onClick={handleCheckoutClick}
                    disabled={paid < finalTotal && paid > 0} 
                    className={`w-full py-4 text-lg shadow-lg rounded-2xl transition-colors ${
                        paid >= finalTotal ? 'shadow-[#4A6741]/30' : 'bg-[#7A8C7A] shadow-none opacity-50'
                    }`}
                    icon={<CreditCard size={20} />}
                >
                    {paid >= finalTotal ? `Charge ₱${finalTotal.toFixed(2)}` : `Pay ₱${finalTotal.toFixed(2)}`}
                </Button>
            </div>
        </>
      )}
    </div>
  );
};
