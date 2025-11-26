import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './ui/Button';
import { Eye, EyeOff, LogIn, AlertCircle, UserCheck } from 'lucide-react';

interface LoginFormProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Mock password
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid email or password');
        setIsLoading(false);
      }
    }, 800);
  };

  const handleQuickLogin = (user: User) => {
    setEmail(user.email);
    setPassword('password');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in duration-500">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-20 w-20 bg-[#1A2F1A] rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-[#4A6741]/20">
             <div className="text-white font-bold text-3xl tracking-tighter">Mp.</div>
          </div>
          <h2 className="text-2xl font-bold text-[#1A2F1A]">Welcome Back</h2>
          <p className="text-[#7A8C7A] text-sm mt-1">Sign in to access your POS terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-3xl border border-[#E8EFE6] shadow-sm">
          <div>
            <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all"
              placeholder="name@mossypine.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all pr-12"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A8C7A] hover:text-[#1A2F1A] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold animate-in slide-in-from-top-1">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full py-4 shadow-lg shadow-[#4A6741]/20 mt-2" 
            isLoading={isLoading}
            icon={<LogIn size={18} />}
          >
            Sign In
          </Button>
        </form>

        {/* Quick Login for Demo Purposes */}
        <div className="mt-8">
          <p className="text-center text-xs text-[#B0C4B0] font-bold uppercase tracking-wider mb-3">Quick Demo Login</p>
          <div className="grid grid-cols-1 gap-3">
            {users.slice(0, 3).map(user => (
              <button 
                key={user.id}
                onClick={() => handleQuickLogin(user)}
                className="flex items-center gap-3 p-3 bg-white border border-[#E8EFE6] rounded-xl hover:border-[#4A6741] hover:bg-[#F2F5F1] transition-all text-left group"
              >
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-[#F2F5F1]" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                     <p className="text-sm font-bold text-[#1A2F1A] truncate">{user.name}</p>
                     <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${user.role === 'OWNER' ? 'bg-[#1A2F1A] text-white' : user.role === 'MANAGER' ? 'bg-[#E8F5E9] text-[#4A6741]' : 'bg-blue-50 text-blue-600'}`}>
                        {user.role}
                     </span>
                  </div>
                  <p className="text-[10px] text-[#7A8C7A] truncate">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
           <p className="text-xs text-[#7A8C7A]">Having trouble? <a href="#" className="text-[#4A6741] font-bold hover:underline">Contact Support</a></p>
        </div>
      </div>
    </div>
  );
};