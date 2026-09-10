
import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './ui/Button';
import { Eye, EyeOff, LogIn, AlertCircle, ArrowRight, Check, Sparkles } from 'lucide-react';

export const DEFAULT_DEMO_USERS: User[] = [
  {
    id: 'u1',
    name: 'Jane Doe',
    email: 'jane@mossypine.com',
    role: 'OWNER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    phone: '+1 (555) 010-1234',
    joinedDate: '2023-01-15T00:00:00Z'
  },
  {
    id: 'u2',
    name: 'Alex Rivera',
    email: 'alex@mossypine.com',
    role: 'MANAGER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    phone: '+1 (555) 010-5678',
    joinedDate: '2023-03-20T00:00:00Z'
  },
  {
    id: 'u3',
    name: 'Sam Taylor',
    email: 'sam@mossypine.com',
    role: 'STAFF',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
    phone: '+1 (555) 010-9012',
    joinedDate: '2023-06-10T00:00:00Z'
  }
];

interface LoginFormProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loggingInUserId, setLoggingInUserId] = useState<string | null>(null);

  // Combine provided users with DEFAULT_DEMO_USERS to always guarantee all 3 testable roles
  const availableUsers = React.useMemo(() => {
    const list = [...(users || [])];
    DEFAULT_DEMO_USERS.forEach(demoUser => {
      if (!list.some(u => (u.email || '').toLowerCase() === demoUser.email.toLowerCase())) {
        list.push(demoUser);
      }
    });
    return list;
  }, [users]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Fast login response
    setTimeout(() => {
      // Find matching user by email
      let matchedUser = availableUsers.find(
        u => (u.email || '').trim().toLowerCase() === normalizedEmail
      );
      
      // Match by common role keywords
      if (!matchedUser) {
        if (normalizedEmail === 'owner' || normalizedEmail === 'admin') {
          matchedUser = availableUsers.find(u => u.role === 'OWNER');
        } else if (normalizedEmail === 'manager') {
          matchedUser = availableUsers.find(u => u.role === 'MANAGER');
        } else if (normalizedEmail === 'staff' || normalizedEmail === 'cashier') {
          matchedUser = availableUsers.find(u => u.role === 'STAFF');
        }
      }

      // If user typed 'demo' or 'test'
      if (!matchedUser && (normalizedEmail.includes('demo') || normalizedEmail.includes('test'))) {
        matchedUser = availableUsers[0];
      }

      if (matchedUser) {
        onLogin(matchedUser);
      } else {
        setError('User not found. Click one of the 1-Click Demo accounts below to test.');
        setIsLoading(false);
      }
    }, 300);
  };

  // Instant 1-Click login for testing
  const handleQuickLogin = (user: User) => {
    setEmail(user.email);
    setPassword('••••••••');
    setError(null);
    setLoggingInUserId(user.id);
    setIsLoading(true);

    setTimeout(() => {
      onLogin(user);
    }, 200);
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

        {/* 1-Click Quick Demo Login - Placed prominently for instant testing */}
        <div className="mb-6 bg-[#F2F5F1] p-4 rounded-3xl border border-[#E8EFE6]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A6741] uppercase tracking-wider">
              <Sparkles size={14} className="text-[#4A6741]" />
              <span>1-Click Demo Login</span>
            </div>
            <span className="text-[10px] text-[#7A8C7A] font-semibold">Tap any role</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {availableUsers.slice(0, 3).map(user => {
              const isCurrentLoggingIn = loggingInUserId === user.id;
              return (
                <button 
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickLogin(user)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-between p-3 bg-white border rounded-2xl transition-all text-left shadow-sm active:scale-[0.98] ${
                    isCurrentLoggingIn 
                      ? 'border-[#4A6741] bg-[#E8F5E9] ring-2 ring-[#4A6741]/20' 
                      : 'border-[#E8EFE6] hover:border-[#4A6741] hover:bg-white/90'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-10 h-10 rounded-full bg-[#F2F5F1] shrink-0 border border-[#E8EFE6]" 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#1A2F1A] truncate">{user.name}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          user.role === 'OWNER' 
                            ? 'bg-[#1A2F1A] text-white' 
                            : user.role === 'MANAGER' 
                            ? 'bg-[#E8F5E9] text-[#4A6741]' 
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7A8C7A] truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-[#4A6741] pl-2 shrink-0">
                    {isCurrentLoggingIn ? (
                      <span className="flex items-center gap-1 text-[11px] animate-pulse">
                        <Check size={14} /> Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] opacity-80 group-hover:opacity-100">
                        Login <ArrowRight size={14} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-[#E8EFE6]"></div>
          <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-wider text-[#B0C4B0]">Or Sign In With Email</span>
          <div className="flex-grow border-t border-[#E8EFE6]"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-3xl border border-[#E8EFE6] shadow-sm">
          <div>
            <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all text-sm"
              placeholder="jane@mossypine.com"
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
                className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all pr-12 text-sm"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A8C7A] hover:text-[#1A2F1A] transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold animate-in slide-in-from-top-1">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full py-4 shadow-lg shadow-[#4A6741]/20 mt-2" 
            isLoading={isLoading && !loggingInUserId}
            icon={<LogIn size={18} />}
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};
