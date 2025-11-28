
import React from 'react';
import { Transaction } from '../types';
import { X, Printer, Download, CheckCircle2, Clock, AlertCircle, CreditCard, Banknote, QrCode } from 'lucide-react';
import { Button } from './ui/Button';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const subtotal = transaction.orderItems 
    ? transaction.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) 
    : transaction.amount; 
    

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'completed': return 'text-[#4A6741] bg-[#E8F5E9]';
          case 'pending': return 'text-amber-600 bg-amber-50';
          case 'refunded': return 'text-red-500 bg-red-50';
          default: return 'text-gray-500 bg-gray-50';
      }
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'completed': return <CheckCircle2 size={16} />;
          case 'pending': return <Clock size={16} />;
          case 'refunded': return <AlertCircle size={16} />;
          default: return <CheckCircle2 size={16} />;
      }
  };

  const getPaymentIcon = (method?: string) => {
      switch(method) {
          case 'CARD': return <CreditCard size={16} />;
          case 'QR': return <QrCode size={16} />;
          default: return <Banknote size={16} />;
      }
  };

  return (
    <div className="fixed inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#FDFDFD] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-[#F2F5F1] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-5 border-b border-[#F2F5F1] flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="font-bold text-xl text-[#1A2F1A]">Order Details</h3>
            <p className="text-xs text-[#7A8C7A]">#{transaction.id}</p>
          </div>
          <button onClick={onClose} className="text-[#7A8C7A] hover:text-[#1A2F1A] bg-[#F2F5F1] p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 flex-1">
            
            {/* Status Banner */}
            <div className="flex justify-between items-center mb-6">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(transaction.status)}`}>
                    {getStatusIcon(transaction.status)}
                    {transaction.status}
                </div>
                <div className="text-right">
                    <p className="text-xs text-[#7A8C7A] font-medium">{transaction.date}</p>
                </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4 mb-6">
                <h4 className="text-xs font-bold text-[#7A8C7A] uppercase tracking-wider mb-2 border-b border-[#F2F5F1] pb-2">Items</h4>
                {transaction.orderItems && transaction.orderItems.length > 0 ? (
                    <div className="space-y-3">
                        {transaction.orderItems.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-[#F2F5F1] overflow-hidden shrink-0">
                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#1A2F1A] text-sm">{item.name}</p>
                                        <p className="text-xs text-[#7A8C7A]">{item.quantity} x ₱{item.price.toFixed(2)}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-[#1A2F1A] text-sm">₱{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 bg-[#F2F5F1] rounded-xl text-center">
                        <p className="text-sm text-[#1A2F1A] font-medium mb-1">{transaction.items}</p>
                        <p className="text-xs text-[#7A8C7A]">Item details not available for this record.</p>
                    </div>
                )}
            </div>

            {/* Payment Info */}
            <div className="bg-[#F9FAF9] p-4 rounded-2xl border border-[#F2F5F1] mb-6 space-y-3">
                 <div className="flex justify-between text-sm text-[#7A8C7A]">
                    <span>Subtotal</span>
                    <span>₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-dashed border-[#DCE7D9] pt-3 flex justify-between items-end">
                     <div>
                         <p className="text-xs text-[#7A8C7A] mb-1">Total Amount</p>
                         <div className="flex items-center gap-2 text-xs font-bold text-[#4A6741] bg-white border border-[#E8EFE6] px-2 py-1 rounded-lg w-fit">
                             {getPaymentIcon(transaction.paymentMethod)}
                             {transaction.paymentMethod || 'CASH'}
                         </div>
                     </div>
                     <span className="text-2xl font-black text-[#1A2F1A]">₱{transaction.amount.toFixed(2)}</span>
                </div>
            </div>
            
            {/* Footer Info */}
            <div className="text-center text-xs text-[#B0C4B0] space-y-1">
                <p>Served by {transaction.cashierName}</p>
                <p>Thank you for dining with us!</p>
            </div>

        </div>

        {/* Actions */}
        <div className="p-5 border-t border-[#F2F5F1] bg-white shrink-0 grid grid-cols-2 gap-3">
            <Button variant="outline" icon={<Printer size={16} />} onClick={() => {}}>Print Receipt</Button>
            <Button variant="secondary" icon={<Download size={16} />} onClick={() => {}}>Email Invoice</Button>
        </div>
      </div>
    </div>
  );
};
