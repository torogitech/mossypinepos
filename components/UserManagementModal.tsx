import React, { useState } from 'react';
import { User, Role } from '../types';
import { Button } from './ui/Button';
import { X, Plus, Trash2, Mail, Check } from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  currentUserId: string;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ 
    isOpen, onClose, users, onAddUser, onUpdateUser, onDeleteUser, currentUserId 
}) => {
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('MANAGER');

  if (!isOpen) return null;

  const resetForm = () => {
      setName('');
      setEmail('');
      setPhone('');
      setRole('MANAGER');
      setEditingUser(null);
      setView('LIST');
  };

  const handleEdit = (user: User) => {
      setEditingUser(user);
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      setRole(user.role);
      setView('FORM');
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const userData: User = {
          id: editingUser ? editingUser.id : Date.now().toString(),
          name,
          email,
          phone,
          role,
          avatar: editingUser?.avatar || `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`,
          joinedDate: editingUser ? editingUser.joinedDate : new Date().toISOString()
      };

      if (editingUser) {
          onUpdateUser(userData);
      } else {
          onAddUser(userData);
      }
      resetForm();
  };

  return (
    <div className="fixed inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#FDFDFD] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-[#F2F5F1] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        <div className="p-5 border-b border-[#F2F5F1] flex justify-between items-center bg-white shrink-0">
           <div>
               <h3 className="font-bold text-xl text-[#1A2F1A]">{view === 'LIST' ? 'Team Management' : (editingUser ? 'Edit User' : 'Add New User')}</h3>
               {view === 'LIST' && <p className="text-xs text-[#7A8C7A]">{users.length} active members</p>}
           </div>
           <button onClick={onClose} className="text-[#7A8C7A] hover:text-[#1A2F1A] bg-[#F2F5F1] p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
            {view === 'LIST' ? (
                <div className="space-y-4">
                    <Button onClick={() => setView('FORM')} className="w-full mb-4" icon={<Plus size={18} />}>Add New Member</Button>
                    <div className="space-y-3">
                        {users.map(user => (
                            <div key={user.id} className="flex items-center gap-4 p-4 bg-white border border-[#F2F5F1] rounded-2xl shadow-sm hover:border-[#DCE7D9] transition-colors">
                                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover bg-[#F2F5F1]" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-bold text-[#1A2F1A] truncate">{user.name}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${user.role === 'OWNER' ? 'bg-[#1A2F1A] text-white' : 'bg-[#E8F5E9] text-[#4A6741]'}`}>
                                            {user.role}
                                        </span>
                                        {user.id === currentUserId && <span className="text-[10px] text-[#7A8C7A] italic">(You)</span>}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-[#7A8C7A]">
                                        <span className="flex items-center gap-1"><Mail size={12} /> {user.email}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEdit(user)} className="p-2 text-[#4A6741] hover:bg-[#F2F5F1] rounded-xl transition-colors font-medium text-xs">Edit</button>
                                    {user.id !== currentUserId && (
                                        <button onClick={() => onDeleteUser(user.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-[#7A8C7A] uppercase mb-2">Full Name</label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-[#F2F5F1] rounded-2xl text-[#1A2F1A] font-bold focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 uppercase" placeholder="e.g. Sarah Connor" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#7A8C7A] uppercase mb-2">Email</label>
                            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-[#F2F5F1] rounded-2xl text-[#1A2F1A] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 uppercase" placeholder="name@example.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#7A8C7A] uppercase mb-2">Phone</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-[#F2F5F1] rounded-2xl text-[#1A2F1A] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 uppercase" placeholder="+1 234 567 890" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#7A8C7A] uppercase mb-2">Role Permission</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['OWNER', 'MANAGER', 'STAFF'] as Role[]).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                                        role === r 
                                        ? 'border-[#4A6741] bg-[#F2F5F1]' 
                                        : 'border-[#E8EFE6] bg-white hover:border-[#B0C4B0]'
                                    }`}
                                >
                                    <span className={`block font-bold text-sm ${role === r ? 'text-[#4A6741]' : 'text-[#1A2F1A]'}`}>{r}</span>
                                    <span className="text-[10px] text-[#7A8C7A]">
                                        {r === 'OWNER' ? 'Full access' : r === 'MANAGER' ? 'Manage inventory' : 'POS only'}
                                    </span>
                                    {role === r && <div className="absolute top-4 right-4 text-[#4A6741]"><Check size={16} /></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setView('LIST')} className="flex-1 bg-white border border-[#E8EFE6] text-[#7A8C7A]">Cancel</Button>
                        <Button type="submit" className="flex-1">{editingUser ? 'Update User' : 'Create User'}</Button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};