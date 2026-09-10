import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Button } from './ui/Button';
import { X, Camera, Mail, Phone, User as UserIcon, ShieldCheck } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateProfile: (updatedUser: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, currentUser, onUpdateProfile }) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  
  useEffect(() => {
      if (isOpen) {
          setName(currentUser.name);
          setEmail(currentUser.email);
          setPhone(currentUser.phone);
      }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
        ...currentUser,
        name,
        email,
        phone
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#FDFDFD] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-[#F2F5F1] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        <div className="p-5 border-b border-[#F2F5F1] flex justify-between items-center bg-white">
           <h3 className="font-bold text-xl text-[#1A2F1A]">My Profile</h3>
           <button onClick={onClose} className="text-[#7A8C7A] hover:text-[#1A2F1A] bg-[#F2F5F1] p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="flex flex-col items-center mb-6">
                <div className="relative">
                    <img src={currentUser.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                    <button type="button" className="absolute bottom-0 right-0 bg-[#4A6741] text-white p-2 rounded-full hover:bg-[#3A5232] transition-colors shadow-sm">
                        <Camera size={14} />
                    </button>
                </div>
                <div className="mt-3 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#4A6741] text-xs font-bold tracking-wider uppercase">
                        <ShieldCheck size={12} /> {currentUser.role}
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-[#7A8C7A] uppercase mb-2">Full Name</label>
                    <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0C4B0]" size={18} />
                        <input type="text" value={name || ''} onChange={e => setName(e.target.value)} className="w-full pl-12 p-4 bg-[#F2F5F1] rounded-2xl text-[#1A2F1A] font-bold focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 uppercase" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#7A8C7A] uppercase mb-2">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0C4B0]" size={18} />
                        <input type="email" value={email || ''} onChange={e => setEmail(e.target.value)} className="w-full pl-12 p-4 bg-[#F2F5F1] rounded-2xl text-[#1A2F1A] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 uppercase" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#7A8C7A] uppercase mb-2">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0C4B0]" size={18} />
                        <input type="tel" value={phone || ''} onChange={e => setPhone(e.target.value)} className="w-full pl-12 p-4 bg-[#F2F5F1] rounded-2xl text-[#1A2F1A] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 uppercase" />
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full py-4 shadow-lg shadow-[#4A6741]/20">Save Changes</Button>
        </form>
      </div>
    </div>
  );
};