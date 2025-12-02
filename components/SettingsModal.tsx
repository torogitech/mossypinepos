
import React, { useState } from 'react';
import { X, Globe, Database, Lock, RefreshCw, Trash2, Info, ChevronRight, ArrowLeft } from 'lucide-react';
import { User } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  autoBackupEnabled: boolean;
  onToggleAutoBackup: (enabled: boolean) => void;
  lowStockAlertsEnabled: boolean;
  onToggleLowStockAlerts: (enabled: boolean) => void;
  dailySalesReportEnabled: boolean;
  onToggleDailySalesReport: (enabled: boolean) => void;
  onResetData: () => void;
  onClearInventory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser,
  autoBackupEnabled,
  onToggleAutoBackup,
  lowStockAlertsEnabled,
  onToggleLowStockAlerts,
  dailySalesReportEnabled,
  onToggleDailySalesReport,
  onResetData,
  onClearInventory
}) => {
  const [currentView, setCurrentView] = useState<'MAIN' | 'ABOUT'>('MAIN');

  if (!isOpen) return null;
  
  const handleClose = () => {
      setCurrentView('MAIN');
      onClose();
  };

  const Section = ({ title, icon: Icon, children }: any) => (
      <div className="mb-6">
          <h4 className="flex items-center gap-2 font-bold text-[#4A6741] text-sm mb-3 uppercase tracking-wider">
              <Icon size={16} /> {title}
          </h4>
          <div className="bg-white rounded-2xl border border-[#E8EFE6] overflow-hidden">
              {children}
          </div>
      </div>
  );
  
  const Row = ({ label, toggle = false, checked, onChange, disabled, locked, value }: any) => (
      <div className={`flex items-center justify-between p-4 border-b border-[#F2F5F1] last:border-0 ${disabled ? 'opacity-60 bg-[#F9FAF9]' : ''}`}>
          <div className="flex items-center gap-2">
              <span className="font-medium text-[#1A2F1A] text-sm">{label}</span>
              {locked && <Lock size={12} className="text-[#7A8C7A]" />}
          </div>
          {toggle ? (
              <label className={`w-10 h-6 rounded-full relative transition-colors block ${checked ? 'bg-[#4A6741]' : 'bg-gray-300'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={checked} 
                    onChange={(e) => !disabled && onChange && onChange(e.target.checked)} 
                    disabled={disabled}
                  />
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${checked ? 'right-1' : 'left-1'}`}></div>
              </label>
          ) : (
              <span className="text-xs text-[#7A8C7A]">{value || 'English'}</span>
          )}
      </div>
  );

  const isOwner = currentUser?.role === 'OWNER';

  return (
    <div className="fixed inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={handleClose}>
      <div className="bg-[#FDFDFD] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-[#F2F5F1] h-[80vh] flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
         
         {/* Header */}
         <div className="p-5 border-b border-[#F2F5F1] flex justify-between items-center bg-white shrink-0">
           <div className="flex items-center gap-3">
               {currentView === 'ABOUT' && (
                   <button 
                    onClick={() => setCurrentView('MAIN')}
                    className="p-1 rounded-full hover:bg-[#F2F5F1] transition-colors -ml-2"
                   >
                       <ArrowLeft size={20} className="text-[#1A2F1A]" />
                   </button>
               )}
               <h3 className="font-bold text-xl text-[#1A2F1A]">
                   {currentView === 'MAIN' ? 'Settings' : 'About Us'}
               </h3>
           </div>
           <button onClick={handleClose} className="text-[#7A8C7A] hover:text-[#1A2F1A] bg-[#F2F5F1] p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
            {currentView === 'MAIN' ? (
                <>
                    <Section title="General" icon={Globe}>
                        <Row label="Language" value="English (US)" />
                        <Row label="Currency" value="PHP (₱)" />
                    </Section>
                    
                    <Section title="Data & Security" icon={Database}>
                        <Row 
                            label="Auto Backup (Local)" 
                            toggle 
                            checked={autoBackupEnabled} 
                            onChange={onToggleAutoBackup}
                            disabled={!isOwner}
                            locked={!isOwner}
                        />
                        <div className="p-4 space-y-3 border-t border-[#F2F5F1]">
                            <button 
                                onClick={onClearInventory}
                                className="text-xs font-bold text-amber-600 hover:bg-amber-50 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2 w-full"
                            >
                                <Trash2 size={14} /> Clear Inventory Data
                            </button>

                            <button 
                                onClick={onResetData}
                                className="text-xs font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2 w-full"
                            >
                                <RefreshCw size={14} /> Reset Application Data
                            </button>
                            {!isOwner && (
                                <p className="text-center text-[10px] text-[#B0C4B0]">Only Owners can manage data settings.</p>
                            )}
                        </div>
                    </Section>

                    {/* About Us Button */}
                    <div className="mt-2">
                        <button 
                            onClick={() => setCurrentView('ABOUT')}
                            className="w-full bg-white rounded-2xl border border-[#E8EFE6] p-4 flex items-center justify-between hover:shadow-sm transition-shadow group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-[#4A6741]">
                                    <Info size={18} />
                                </div>
                                <span className="font-bold text-[#1A2F1A] text-sm group-hover:text-[#4A6741] transition-colors">About Us</span>
                            </div>
                            <ChevronRight size={18} className="text-[#B0C4B0] group-hover:text-[#4A6741] transition-colors" />
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in slide-in-from-right duration-300">
                    <div className="h-24 w-24 bg-[#1A2F1A] rounded-3xl flex items-center justify-center shadow-xl shadow-[#4A6741]/20">
                         <span className="text-white font-bold text-3xl tracking-tighter">Mp.</span>
                    </div>
                    
                    <div className="space-y-4 max-w-xs">
                        <h4 className="text-xl font-bold text-[#1A2F1A]">MossypinePOS</h4>
                        <p className="text-[#4A6741] font-medium leading-relaxed italic">
                            "Mossypine Point of Sale, keeping your transactions organic and your revenue evergreen."
                        </p>
                    </div>

                    <div className="pt-8 border-t border-[#F2F5F1] w-full">
                         <p className="text-xs font-bold text-[#7A8C7A] uppercase tracking-wider mb-2">Developed By</p>
                         <p className="text-sm font-bold text-[#1A2F1A]">Jason E.</p>
                    </div>
                </div>
            )}
        </div>
        
        {currentView === 'MAIN' && (
            <div className="p-5 border-t border-[#F2F5F1] bg-white text-center">
                <p className="text-[10px] text-[#B0C4B0]">MossypinePOS v1.2.1</p>
            </div>
        )}
      </div>
    </div>
  );
};
