import React, { useMemo } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, History, PackagePlus, Trash2, ShoppingCart, Ban } from 'lucide-react';
import { StockLog, StockAction, Product } from '../types';

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: StockLog[];
  product: Product | null;
}

export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({ isOpen, onClose, logs, product }) => {
  
  // Sort logs by timestamp descending (newest first)
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [logs]);

  if (!isOpen || !product) return null;

  const isOutOfStock = product.stock === 0;

  const getActionIcon = (action: StockAction) => {
    switch (action) {
      case 'SALE': return <ShoppingCart size={14} />;
      case 'RESTOCK': return <ArrowUpRight size={14} />;
      case 'INITIAL': 
      case 'BULK_IMPORT': return <PackagePlus size={14} />;
      case 'DELETE': return <Trash2 size={14} />;
      case 'ADJUSTMENT': return <History size={14} />;
      default: return <History size={14} />;
    }
  };

  const getActionStyle = (action: StockAction, change: number) => {
    if (action === 'DELETE') return 'bg-red-100 text-red-600';
    if (change > 0) return 'bg-emerald-100 text-emerald-700';
    if (change < 0) return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#FDFDFD] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-[#F2F5F1] max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#F2F5F1] flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            
            {/* Product Image with OOS Style */}
            <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-[#F2F5F1] shadow-sm group">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-75 grayscale' : ''}`}
                />
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] flex items-center justify-center z-10">
                     <Ban size={16} className="text-[#1A2F1A]" />
                  </div>
                )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl text-[#1A2F1A]">
                  {product.name}
                </h3>
                {isOutOfStock && (
                    <span className="bg-[#1A2F1A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      Out of Stock
                    </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#7A8C7A] mt-0.5">
                <span>Current Stock: <span className={`font-bold ${isOutOfStock ? 'text-red-500' : 'text-[#4A6741]'}`}>{product.stock}</span></span>
                <span>•</span>
                <span>Price: ₱{Number(product.price || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#7A8C7A] hover:text-[#1A2F1A] bg-[#F2F5F1] p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto p-0 flex-1">
          {sortedLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#B0C4B0]">
              <History size={48} className="mb-4 opacity-50" />
              <p>No history records found for this item.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#F9FAF9] text-[#7A8C7A] text-xs uppercase tracking-wider font-bold sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 pl-6">Time</th>
                  <th className="p-4">Action</th>
                  <th className="p-4 text-right">Change</th>
                  <th className="p-4 text-right pr-6">Stock Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F5F1]">
                {sortedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F9FAF9] transition-colors">
                    <td className="p-4 pl-6 whitespace-nowrap text-[#7A8C7A] font-medium text-xs">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider w-fit ${getActionStyle(log.action, log.quantityChange)}`}>
                            {getActionIcon(log.action)}
                            {log.action.replace('_', ' ')}
                          </div>
                          {log.note && <div className="text-[10px] text-[#7A8C7A] font-normal mt-1 ml-1">{log.note}</div>}
                      </div>
                    </td>
                    <td className={`p-4 text-right font-bold ${log.quantityChange > 0 ? 'text-emerald-600' : log.quantityChange < 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                    </td>
                    <td className="p-4 text-right pr-6 text-[#1A2F1A] font-medium">
                      {log.action === 'DELETE' ? '-' : log.newStockLevel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};