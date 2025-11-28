

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Category, Product, CartItem, ViewMode, Transaction, StockLog, StockAction, User, ExpenseRecord } from './types';
import { ProductCard } from './components/ProductCard';
import { Cart } from './components/Cart';
import { InventoryForm } from './components/InventoryForm';
import { BulkAddModal } from './components/BulkAddModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { StockHistoryModal } from './components/StockHistoryModal';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { UserProfileModal } from './components/UserProfileModal';
import { UserManagementModal } from './components/UserManagementModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginForm } from './components/LoginForm';
import { LogoutConfirmationModal } from './components/LogoutConfirmationModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { ReportsView } from './components/ReportsView';
import { CategoryManagementModal } from './components/CategoryManagementModal';
import { Button } from './components/ui/Button';
import { dbService } from './services/dbService';

import { 
  LayoutGrid, 
  Package, 
  Settings, 
  Search, 
  ShoppingBag, 
  LogOut,
  Menu,
  Coffee,
  CheckCircle2,
  Trash2,
  Edit3,
  Home,
  Users,
  FileText,
  PieChart,
  Calendar,
  Truck,
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  X,
  History,
  SlidersHorizontal,
  Ban,
  User as UserIcon,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  Scan,
  Camera,
  Plus,
  Upload,
  Clock,
  Zap,
  ZapOff,
  ZoomIn,
  ZoomOut,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Utensils,
  Lightbulb,
  Wrench,
  Wallet,
  Percent,
  Tag
} from 'lucide-react';

const DEFAULT_CATEGORIES = ['Coffee', 'Tea', 'Bakery', 'Food', 'Merch'];

interface DashboardCardProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, label, color, bg, onClick }) => (
  <button onClick={onClick} className="bg-white p-4 rounded-2xl border border-[#E8EFE6] shadow-sm flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95 cursor-pointer h-24 w-full">
    <div className={`p-2.5 rounded-full ${bg} ${color}`}>
      {icon}
    </div>
    <span className="font-bold text-xs text-[#1A2F1A]">{label}</span>
  </button>
);

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors active:scale-95 ${
      active ? 'text-[#4A6741]' : 'text-[#B0C4B0] hover:text-[#1A2F1A]'
    }`}
  >
    {icon}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

// Helper for persistent local settings
const loadLocalSetting = <T,>(key: string, defaultState: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultState;
  } catch (e) {
    return defaultState;
  }
};

const App: React.FC = () => {
  // --- Data State (From Database) ---
  const [products, setProducts] = useState<Product[]>([]);
  const [stockHistory, setStockHistory] = useState<StockLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [manualExpenses, setManualExpenses] = useState<ExpenseRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isDbReady, setIsDbReady] = useState(false);
  
  // --- Local Settings State (Persisted in LocalStorage) ---
  const [categories, setCategories] = useState<string[]>(() => loadLocalSetting('mp_categories', DEFAULT_CATEGORIES));
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => loadLocalSetting('mp_autobackup_enabled', true));
  const [lowStockAlerts, setLowStockAlerts] = useState<boolean>(() => loadLocalSetting('mp_low_stock_alerts', true));
  const [dailySalesReports, setDailySalesReports] = useState<boolean>(() => loadLocalSetting('mp_daily_sales_reports', false));

  // --- UI State ---
  const [view, setView] = useState<ViewMode>('HOME');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modal States
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingImageProduct, setViewingImageProduct] = useState<Product | null>(null);
  const [viewingHistoryProduct, setViewingHistoryProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDesktopCartOpen, setIsDesktopCartOpen] = useState(true);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [inventoryFilter, setInventoryFilter] = useState<'ALL' | 'LOW_STOCK'>('ALL');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    const initData = async () => {
      try {
        await dbService.initialize();
        await refreshData();
        setIsDbReady(true);
      } catch (error) {
        console.error("Failed to initialize database", error);
        showNotification("Failed to load data", "error");
      }
    };
    initData();
  }, []);

  const refreshData = async () => {
    const [p, t, s, u, e] = await Promise.all([
      dbService.getProducts(),
      dbService.getTransactions(),
      dbService.getStockLogs(),
      dbService.getUsers(),
      dbService.getExpenses()
    ]);
    setProducts(p);
    setTransactions(t);
    setStockHistory(s);
    setUsers(u);
    setManualExpenses(e);
  };

  // --- Local Settings Persistence ---
  useEffect(() => {
    localStorage.setItem('mp_categories', JSON.stringify(categories));
    localStorage.setItem('mp_autobackup_enabled', JSON.stringify(autoBackupEnabled));
    localStorage.setItem('mp_low_stock_alerts', JSON.stringify(lowStockAlerts));
    localStorage.setItem('mp_daily_sales_reports', JSON.stringify(dailySalesReports));
  }, [categories, autoBackupEnabled, lowStockAlerts, dailySalesReports]);

  // --- Handlers ---

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
  };

  const handleResetData = async () => {
      try {
        await dbService.resetDatabase();
        // Reset local preferences
        setCategories(DEFAULT_CATEGORIES);
        await refreshData();
        showNotification("App data has been reset", "success");
        setIsSettingsOpen(false);
      } catch (e) {
        showNotification("Error resetting data", "error");
      }
  };

  const handleClearInventory = async () => {
      try {
          await dbService.clearInventory();
          await refreshData();
          showNotification("Inventory cleared successfully", "success");
          setIsSettingsOpen(false);
      } catch (e) {
          showNotification("Failed to clear inventory", "error");
      }
  };

  const handleCheckout = async (details?: { subtotal: number, discount: number, total: number, paidAmount: number, change: number }) => {
    const subtotal = details ? details.subtotal : cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = details ? details.total : subtotal;
    const discount = details ? details.discount : 0;
    const paid = details ? details.paidAmount : 0;
    const change = details ? details.change : 0;

    const stockUpdates: {productId: string, newStock: number}[] = [];
    const newLogs: StockLog[] = [];
    const timestamp = new Date().toISOString();

    // Prepare updates
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            const quantitySold = item.quantity;
            const newStock = product.stock - quantitySold;
            
            stockUpdates.push({
                productId: product.id,
                newStock: newStock
            });

            newLogs.push({
                id: `log-${Date.now()}-${product.id}`,
                productId: product.id,
                productName: product.name,
                action: 'SALE',
                quantityChange: -quantitySold,
                newStockLevel: newStock,
                timestamp: timestamp,
                note: 'POS Checkout'
            });
        }
    });

    const newTransaction: Transaction = {
      id: `t-${Date.now()}`,
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
      timestamp: timestamp,
      amount: total,
      status: 'completed',
      items: cart.map(c => `${c.quantity}x ${c.name}`).join(', '),
      cashierName: currentUser?.name || 'Guest',
      orderItems: [...cart],
      paymentMethod: 'CASH',
      discount: discount,
      paidAmount: paid,
      change: change
    };

    try {
        await dbService.createTransaction(newTransaction, stockUpdates, newLogs);
        await refreshData();
        
        showNotification(`Transaction complete! Change: ₱${change.toFixed(2)}`, "success");
        clearCart();
        setIsCartOpen(false);
        setIsDesktopCartOpen(false);

        // Alerts (Logic using updated local state from refresh is safer, but assuming optimistic check here)
        if (lowStockAlerts) {
            const lowStockItems = products.filter(p => {
                 // Check against the update list
                 const update = stockUpdates.find(u => u.productId === p.id);
                 return update ? update.newStock < 10 : false;
            });
            if (lowStockItems.length > 0) {
                setTimeout(() => {
                    showNotification(`Warning: Low stock for ${lowStockItems[0].name}`, 'error');
                }, 1500);
            }
        }
    } catch (e) {
        console.error(e);
        showNotification("Transaction failed to save", "error");
    }
  };

  const handleSaveProduct = async (product: Product) => {
    try {
        const timestamp = new Date().toISOString();
        if (editingProduct) {
            // Update
            const stockDiff = product.stock - editingProduct.stock;
            await dbService.updateProduct(product);
            
            if (stockDiff !== 0) {
                const action: StockAction = stockDiff > 0 ? 'RESTOCK' : 'ADJUSTMENT';
                await dbService.addStockLog({
                    id: `log-${Date.now()}-${product.id}`,
                    productId: product.id,
                    productName: product.name,
                    action: action,
                    quantityChange: stockDiff,
                    newStockLevel: product.stock,
                    timestamp: timestamp,
                    note: 'Manual Edit'
                });
            }
            setIsInventoryModalOpen(false);
            setEditingProduct(null);
        } else {
            // Add
            await dbService.addProduct(product);
            await dbService.addStockLog({
                id: `log-${Date.now()}-${product.id}`,
                productId: product.id,
                productName: product.name,
                action: 'INITIAL',
                quantityChange: product.stock,
                newStockLevel: product.stock,
                timestamp: timestamp,
                note: 'New Item Created'
            });
            setIsInventoryModalOpen(false);
        }
        await refreshData();
    } catch (e) {
        console.error(e);
        showNotification("Failed to save product", "error");
    }
  };

  const handleBulkAddProducts = async (newProducts: Product[]) => {
    try {
        const timestamp = new Date().toISOString();
        const logs = newProducts.map(p => ({
            id: `log-${Date.now()}-${p.id}-${Math.random()}`,
            productId: p.id,
            productName: p.name,
            action: 'BULK_IMPORT' as StockAction,
            quantityChange: p.stock,
            newStockLevel: p.stock,
            timestamp: timestamp,
            note: 'Bulk Import CSV'
        }));

        await dbService.addProductsBatch(newProducts, logs);
        await refreshData();
        
        setIsBulkAddModalOpen(false);
        showNotification("Products imported successfully", "success");
    } catch (e) {
        console.error(e);
        showNotification("Failed to import products", "error");
    }
  };

  const confirmDeleteProduct = async () => {
    if (productToDelete) {
        try {
            const product = products.find(p => p.id === productToDelete);
            if (product) {
                await dbService.addStockLog({
                    id: `log-${Date.now()}-${product.id}`,
                    productId: product.id,
                    productName: product.name,
                    action: 'DELETE',
                    quantityChange: -product.stock,
                    newStockLevel: 0,
                    timestamp: new Date().toISOString(),
                    note: 'Item Deleted'
                });
            }
            await dbService.deleteProduct(productToDelete);
            await refreshData();
            setProductToDelete(null);
            showNotification("Product deleted", "success");
        } catch (e) {
             showNotification("Failed to delete product", "error");
        }
    }
  };

  const handleConfirmAdjustment = async (amount: number, reason: string) => {
    if (adjustingProduct) {
        try {
            const newStock = adjustingProduct.stock + amount;
            const updatedProduct = { ...adjustingProduct, stock: newStock };
            const action: StockAction = amount > 0 ? 'RESTOCK' : 'ADJUSTMENT';

            await dbService.updateProduct(updatedProduct);
            await dbService.addStockLog({
                id: `log-${Date.now()}-${adjustingProduct.id}`,
                productId: adjustingProduct.id,
                productName: adjustingProduct.name,
                action: action,
                quantityChange: amount,
                newStockLevel: newStock,
                timestamp: new Date().toISOString(),
                note: reason
            });

            await refreshData();
            setAdjustingProduct(null);
            showNotification("Stock updated successfully", "success");
        } catch (e) {
            showNotification("Failed to update stock", "error");
        }
    }
  };

  const handleAddExpense = async (expense: Omit<ExpenseRecord, 'id' | 'date' | 'recordedBy'>) => {
      try {
          const newExpense: ExpenseRecord = {
              id: `exp-${Date.now()}`,
              ...expense,
              date: new Date().toISOString(),
              recordedBy: currentUser?.name || 'Unknown'
          };
          await dbService.addExpense(newExpense);
          await refreshData();
          setIsAddExpenseModalOpen(false);
          showNotification("Expense recorded", "success");
      } catch (e) {
          showNotification("Failed to add expense", "error");
      }
  };

  const handleAddUser = async (newUser: User) => {
      try {
          await dbService.addUser(newUser);
          await refreshData();
          showNotification("User added", "success");
      } catch (e) {
          showNotification("Failed to add user", "error");
      }
  };

  const handleUpdateUser = async (updatedUser: User) => {
      try {
          await dbService.updateUser(updatedUser);
          await refreshData();
          if (currentUser && updatedUser.id === currentUser.id) {
              setCurrentUser(updatedUser);
          }
          showNotification("User updated", "success");
      } catch (e) {
          showNotification("Failed to update user", "error");
      }
  };

  const handleDeleteUser = async (userId: string) => {
      try {
          await dbService.deleteUser(userId);
          await refreshData();
          showNotification("User deleted", "success");
      } catch (e) {
          showNotification("Failed to delete user", "error");
      }
  };
  
  // Update Profile Wrapper
  const handleUpdateProfile = (updatedUser: User) => {
      handleUpdateUser(updatedUser);
      setIsUserProfileOpen(false);
  };

  // --- Derived State & Other Logic ---
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const productBeingDeleted = useMemo(() => 
    products.find(p => p.id === productToDelete), 
  [products, productToDelete]);

  // Derived Stats Logic reused from original
  const salesStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); 
    startOfWeek.setHours(0,0,0,0);
    
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfWeek); 

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonthDate = new Date(now);
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    let daily = { current: 0, previous: 0 };
    let weekly = { current: 0, previous: 0 };
    let monthly = { current: 0, previous: 0 };

    transactions.forEach(t => {
      if (t.status !== 'completed' || !t.timestamp) return;
      const tDate = new Date(t.timestamp);
      const amount = t.amount;

      if (tDate.toDateString() === todayStr) daily.current += amount;
      if (tDate.toDateString() === yesterdayStr) daily.previous += amount;

      if (tDate >= startOfWeek) weekly.current += amount;
      if (tDate >= startOfLastWeek && tDate < endOfLastWeek) weekly.previous += amount;

      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) monthly.current += amount;
      if (tDate.getMonth() === lastMonth && tDate.getFullYear() === lastMonthYear) monthly.previous += amount;
    });

    const calcChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
    };

    return {
      daily: { total: daily.current, change: calcChange(daily.current, daily.previous) },
      weekly: { total: weekly.current, change: calcChange(weekly.current, weekly.previous) },
      monthly: { total: monthly.current, change: calcChange(monthly.current, monthly.previous) }
    };
  }, [transactions]);

  const financialStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonthDate = new Date(now);
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const stats = {
        revenue: { current: 0, previous: 0 },
        expenses: { current: 0, previous: 0 }
    };

    transactions.forEach(t => {
        if (t.status !== 'completed' || !t.timestamp) return;
        const d = new Date(t.timestamp);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) stats.revenue.current += t.amount;
        else if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) stats.revenue.previous += t.amount;
    });

    manualExpenses.forEach(e => {
        const d = new Date(e.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) stats.expenses.current += e.amount;
        else if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) stats.expenses.previous += e.amount;
    });

    stockHistory.forEach(log => {
        const d = new Date(log.timestamp);
        const isCurrent = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        const isPrevious = d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        if (!isCurrent && !isPrevious) return;

        let cost = 0;
        if (['RESTOCK', 'INITIAL', 'BULK_IMPORT'].includes(log.action)) {
             const product = products.find(p => p.id === log.productId);
             if (product) cost = log.quantityChange * product.costPrice;
        } else if ((log.action === 'ADJUSTMENT' && log.quantityChange < 0) || log.action === 'DELETE') {
             const product = products.find(p => p.id === log.productId);
             if (product) cost = Math.abs(log.quantityChange) * product.costPrice;
        }

        if (isCurrent) stats.expenses.current += cost;
        if (isPrevious) stats.expenses.previous += cost;
    });

    const profit = {
        current: stats.revenue.current - stats.expenses.current,
        previous: stats.revenue.previous - stats.expenses.previous
    };

    const margin = {
        current: stats.revenue.current > 0 ? (profit.current / stats.revenue.current) * 100 : 0,
        previous: stats.revenue.previous > 0 ? (profit.previous / stats.revenue.previous) * 100 : 0
    };

    const getPercentChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
    };

    return {
        revenue: { value: stats.revenue.current, change: getPercentChange(stats.revenue.current, stats.revenue.previous) },
        expenses: { value: stats.expenses.current, change: getPercentChange(stats.expenses.current, stats.expenses.previous) },
        profit: { value: profit.current, change: getPercentChange(profit.current, profit.previous) },
        margin: { value: margin.current, change: margin.current - margin.previous }
    };
  }, [transactions, manualExpenses, stockHistory, products]);

  // Auth Helpers
  const isStaff = currentUser?.role === 'STAFF';
  const isOwner = currentUser?.role === 'OWNER';

  useEffect(() => {
    if (!currentUser) {
       if (view !== 'HOME' && view !== 'MORE') setView('HOME');
    } else {
        if (isStaff && ['INVENTORY', 'OVERVIEW', 'TRANSACTIONS', 'EXPENSES', 'REPORTS'].includes(view)) setView('HOME');
        if (view === 'REPORTS' && !isOwner) setView('HOME');
    }
  }, [currentUser, isStaff, view]);

  // Camera Setup
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (view === 'POS') {
      setCameraError(null);
      setTorchOn(false);
      setZoomLevel(1);
      setCapabilities(null);
      setScanSuccess(false);
      setScanError(false);

      const constraints = {
          audio: false,
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 }, focusMode: 'continuous' } as any
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = stream;
          const track = stream.getVideoTracks()[0];
          trackRef.current = track;
          const caps = track.getCapabilities() as any;
          setCapabilities(caps);
          if (caps.zoom) setZoomLevel(caps.zoom.min || 1);
        })
        .catch(err => {
          setCameraError("Unable to access camera. Please check permissions.");
        });
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      trackRef.current = null;
    };
  }, [view]);

  // Misc Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('HOME');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('HOME');
    setCart([]);
  };

  const addToCart = (product: Product, openCart = true) => {
    if (!currentUser) {
        showNotification("Please log in to add items", "error");
        return;
    }
    if (product.stock <= 0) {
        showNotification("Item out of stock", "error");
        return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + 1 > product.stock) return prev;
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    if (openCart) {
        setIsCartOpen(true);
        setIsDesktopCartOpen(true);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const maxStock = product ? product.stock : 999;
        const newQty = item.quantity + delta;
        if (newQty > maxStock) return item;
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const clearCart = () => setCart([]);
  
  const handleAddCategory = (cat: string) => {
      if (!categories.includes(cat)) {
          setCategories(prev => [...prev, cat]);
          showNotification("Category added", "success");
      }
  };

  const handleDeleteCategory = (cat: string) => {
      setCategories(prev => prev.filter(c => c !== cat));
      showNotification("Category deleted", "success");
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsInventoryModalOpen(true);
  };

  const getLastUpdated = (productId: string): string | null => {
    const log = stockHistory.find(l => l.productId === productId);
    return log ? log.timestamp : null;
  };
  
  const formatDateSimple = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  
  // Handlers for Camera
  const toggleTorch = async () => {
      if (!trackRef.current) return;
      try {
          await trackRef.current.applyConstraints({ advanced: [{ torch: !torchOn }] } as any);
          setTorchOn(!torchOn);
      } catch (e) {}
  };

  const handleZoom = async (newZoom: number) => {
      if (!trackRef.current) return;
      try {
          await trackRef.current.applyConstraints({ advanced: [{ zoom: newZoom }] } as any);
          setZoomLevel(newZoom);
      } catch (e) {}
  };

  if (!isDbReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F2F5F1]">
        <div className="flex flex-col items-center gap-4">
           <div className="h-12 w-12 bg-[#1A2F1A] rounded-2xl flex items-center justify-center shadow-xl animate-bounce">
              <span className="text-white font-bold text-xl">Mp.</span>
           </div>
           <p className="text-[#4A6741] font-bold text-sm animate-pulse">Initializing System...</p>
        </div>
      </div>
    );
  }

  const renderHome = () => (
    <>
      <div className="sticky top-0 z-20 bg-[#F2F5F1]/95 backdrop-blur-sm pb-4 pt-2 -mx-2 px-2 md:mx-0 md:px-0">
         <div className="flex flex-col gap-4">
           <div className="flex items-center justify-between px-2 md:px-0">
             <h1 className="text-2xl font-bold text-[#1A2F1A]">Menu</h1>
             <button 
                  onClick={() => setIsDesktopCartOpen(!isDesktopCartOpen)}
                  className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                      isDesktopCartOpen 
                      ? 'bg-[#F2F5F1] text-[#7A8C7A] hover:bg-[#E8EFE6]' 
                      : 'bg-[#4A6741] text-white shadow-md hover:bg-[#3A5232]'
                  }`}
             >
                  <ShoppingBag size={18} />
                  {isDesktopCartOpen ? 'Hide Order' : 'View Order'}
                  {!isDesktopCartOpen && totalCartItems > 0 && (
                       <span className="bg-white text-[#4A6741] text-[10px] px-1.5 py-0.5 rounded-full ml-1 shadow-sm">
                           {totalCartItems}
                       </span>
                   )}
             </button>
           </div>
           <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center px-2 md:px-0">
              <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A8C7A]" size={20} />
                  <input 
                      type="text" 
                      placeholder="Search items..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-10 py-3 bg-white rounded-2xl border border-[#E8EFE6] text-sm focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 shadow-sm placeholder-[#B0C4B0]"
                  />
                  {searchQuery && (
                       <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B0C4B0] hover:text-[#1A2F1A] p-1 rounded-full hover:bg-[#F2F5F1]"><X size={16} /></button>
                  )}
              </div>
          </div>
          
          <div className="flex gap-3 overflow-x-auto w-full pb-2 no-scrollbar px-2 md:px-0">
            {['All', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as Category | 'All')}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-sm ${
                  selectedCategory === cat 
                    ? 'bg-[#1A2F1A] text-white' 
                    : 'bg-white text-[#7A8C7A] border border-[#E8EFE6] hover:bg-[#F2F5F1]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 pb-32 px-2 md:px-0 transition-all duration-300 ease-in-out">
        {filteredProducts.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAdd={addToCart} 
            onUpdateProduct={currentUser && currentUser.role !== 'STAFF' ? handleSaveProduct : undefined}
          />
        ))}
        {filteredProducts.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-20 text-[#B0C4B0]">
                 <Coffee size={48} className="mb-4 opacity-50" />
                 <p>No products found.</p>
             </div>
        )}
      </div>
    </>
  );

  const renderOverview = () => (
    <div className="space-y-6 pb-24">
      {/* Overview Cards Logic Same as before */}
      <div className="flex justify-center pt-4">
        <div className="bg-white px-6 py-2 rounded-full shadow-sm flex items-center gap-2 text-[#4A6741] text-sm font-semibold border border-[#E8EFE6]">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
      <div className="mx-2 md:mx-0">
         <div className="grid grid-cols-3 gap-3">
             <div className="bg-[#4A6741] text-white p-4 rounded-3xl shadow-lg flex flex-col justify-between h-28 relative overflow-hidden">
                <span className="text-xs font-medium opacity-80 uppercase tracking-wide">Daily</span>
                <div><span className="text-xl font-bold block">₱{salesStats.daily.total.toFixed(2)}</span></div>
             </div>
             <div className="bg-white text-[#1A2F1A] p-4 rounded-3xl border border-[#E8EFE6] shadow-sm flex flex-col justify-between h-28">
                <span className="text-xs font-bold text-[#7A8C7A] uppercase tracking-wide">Weekly</span>
                <div><span className="text-xl font-bold block">₱{salesStats.weekly.total.toFixed(2)}</span></div>
             </div>
             <div className="bg-white text-[#1A2F1A] p-4 rounded-3xl border border-[#E8EFE6] shadow-sm flex flex-col justify-between h-28">
                <span className="text-xs font-bold text-[#7A8C7A] uppercase tracking-wide">Monthly</span>
                <div><span className="text-xl font-bold block">₱{salesStats.monthly.total.toFixed(2)}</span></div>
             </div>
         </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 mx-2 md:mx-0">
        <DashboardCard icon={<FileText size={24} />} label="Expense" color="text-emerald-600" bg="bg-emerald-50" onClick={() => setView('EXPENSES')} />
        <DashboardCard icon={<Users size={24} />} label="Customer" color="text-amber-600" bg="bg-amber-50" />
        <DashboardCard icon={<ShoppingBag size={24} />} label="Orders" color="text-blue-600" bg="bg-blue-50" onClick={() => setView('TRANSACTIONS')} />
        <DashboardCard icon={<PieChart size={24} />} label="Reports" color="text-purple-600" bg="bg-purple-50" onClick={() => isOwner ? setView('REPORTS') : showNotification("Restricted", "error")} />
      </div>

       <div className="mx-2 md:mx-0">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-bold text-lg text-[#1A2F1A]">Recent Transactions</h3>
          <button onClick={() => setView('TRANSACTIONS')} className="text-[#4A6741] text-sm font-semibold flex items-center gap-1 hover:underline">See All <ArrowRight size={14} /></button>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 5).map(t => (
            <button key={t.id} onClick={() => setSelectedTransaction(t)} className="w-full bg-white p-4 rounded-2xl border border-[#E8EFE6] flex items-center justify-between shadow-sm hover:bg-[#F2F5F1] transition-colors">
               <div className="flex items-center gap-4 text-left">
                 <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${t.status === 'completed' ? 'bg-[#E8F5E9] text-[#4A6741]' : 'bg-amber-50 text-amber-600'}`}>
                   {t.status === 'completed' ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                 </div>
                 <div><p className="font-bold text-[#1A2F1A] text-sm line-clamp-1">{t.items}</p><span className="text-xs text-[#7A8C7A]">{t.date}</span></div>
               </div>
               <span className="font-bold text-[#1A2F1A] whitespace-nowrap pl-2">₱{t.amount.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-full bg-[#F2F5F1] text-[#1A2F1A] font-sans overflow-hidden transition-all duration-300 ease-in-out">
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className={`flex-1 overflow-y-auto no-scrollbar ${view === 'POS' ? 'bg-black' : ''}`}>
          <div className={`w-full max-w-[1600px] mx-auto ${view !== 'POS' ? 'pt-2 md:pt-6 px-2 md:px-6 lg:px-8' : ''}`}>
            {view === 'HOME' && renderHome()}
            {view === 'OVERVIEW' && renderOverview()}
            {view === 'TRANSACTIONS' && (
                 <div className="mb-24 mx-2 md:mx-0">
                    <div className="sticky top-0 z-30 bg-[#F2F5F1]/95 backdrop-blur-sm pb-3 pt-2 -mx-2 px-2 md:mx-0 md:px-0">
                         <div className="flex items-center gap-3 mb-4 px-2 md:px-0">
                            <button onClick={() => setView('OVERVIEW')} className="bg-white p-2 rounded-full shadow-sm border border-[#E8EFE6]"><ArrowLeft size={20} /></button>
                            <h2 className="text-2xl font-bold text-[#1A2F1A]">Transactions</h2>
                         </div>
                    </div>
                    <div className="space-y-3 px-2 md:px-0">
                        {transactions.map(t => (
                            <button key={t.id} onClick={() => setSelectedTransaction(t)} className="w-full bg-white p-4 rounded-2xl border border-[#E8EFE6] shadow-sm flex flex-col gap-3 text-left">
                                <div className="flex justify-between w-full">
                                    <span className="font-bold text-[#1A2F1A]">{t.items}</span>
                                    <span className="font-bold">₱{t.amount.toFixed(2)}</span>
                                </div>
                                <div className="text-xs text-[#7A8C7A]">{t.date} • {t.cashierName}</div>
                            </button>
                        ))}
                    </div>
                 </div>
            )}
            
            {view === 'INVENTORY' && (
                 <div className="mb-32 mx-2 md:mx-0">
                    <div className="sticky top-0 z-30 bg-[#F2F5F1]/95 backdrop-blur-sm pb-3 pt-2 -mx-2 px-2 shadow-sm md:mx-0 md:px-0 flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-[#1A2F1A]">Inventory</h2>
                        <div className="flex gap-2">
                             <button onClick={() => setIsCategoryManagementOpen(true)} className="bg-white p-2.5 rounded-full border border-[#E8EFE6] text-[#4A6741]"><Tag size={20}/></button>
                             <button onClick={() => setIsBulkAddModalOpen(true)} className="bg-white p-2.5 rounded-full border border-[#E8EFE6] text-[#4A6741]"><Upload size={20}/></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                        {filteredProducts.map(p => (
                            <div key={p.id} onClick={() => openEditModal(p)} className="bg-white p-3 rounded-3xl border border-[#E8EFE6] shadow-sm cursor-pointer hover:shadow-md">
                                <div className="aspect-square bg-[#F2F5F1] rounded-2xl overflow-hidden mb-2"><img src={p.image} className="w-full h-full object-cover"/></div>
                                <h3 className="font-bold text-sm truncate">{p.name}</h3>
                                <div className="flex justify-between text-xs mt-1"><span>₱{p.price.toFixed(2)}</span><span className="text-[#4A6741] font-bold">{p.stock} left</span></div>
                                <div className="flex gap-2 mt-2 border-t pt-2">
                                     <button onClick={(e) => {e.stopPropagation(); setAdjustingProduct(p)}} className="flex-1 bg-[#F2F5F1] h-8 rounded-lg flex items-center justify-center text-[#4A6741]"><SlidersHorizontal size={14}/></button>
                                     <button onClick={(e) => {e.stopPropagation(); setProductToDelete(p.id)}} className="flex-1 bg-[#F2F5F1] h-8 rounded-lg flex items-center justify-center text-red-400"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => { setEditingProduct(null); setIsInventoryModalOpen(true); }} className="fixed bottom-24 right-4 h-14 w-14 bg-[#4A6741] text-white rounded-full shadow-xl flex items-center justify-center z-40"><Plus size={28}/></button>
                 </div>
            )}
            
            {view === 'MORE' && (
                <div className="mb-24 mx-2 md:mx-0 space-y-6">
                    {currentUser ? (
                        <>
                         <h2 className="text-3xl font-bold text-[#1A2F1A]">More</h2>
                         <div className="bg-white p-6 rounded-3xl border border-[#E8EFE6] shadow-sm flex items-center gap-4" onClick={() => setIsUserProfileOpen(true)}>
                             <img src={currentUser.avatar} className="w-16 h-16 rounded-full"/>
                             <div><h3 className="font-bold text-lg">{currentUser.name}</h3><p className="text-xs text-[#7A8C7A]">{currentUser.email}</p></div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <button onClick={() => setIsSettingsOpen(true)} className="bg-white p-5 rounded-3xl border border-[#E8EFE6] h-32 flex flex-col items-center justify-center gap-2"><Settings size={24}/><span className="font-bold text-sm">Settings</span></button>
                             {isOwner && <button onClick={() => setIsUserManagementOpen(true)} className="bg-white p-5 rounded-3xl border border-[#E8EFE6] h-32 flex flex-col items-center justify-center gap-2"><Users size={24}/><span className="font-bold text-sm">Team</span></button>}
                             <button onClick={() => setIsLogoutModalOpen(true)} className="bg-white p-5 rounded-3xl border border-[#E8EFE6] h-32 flex flex-col items-center justify-center gap-2 text-red-500"><LogOut size={24}/><span className="font-bold text-sm">Log Out</span></button>
                         </div>
                        </>
                    ) : (
                        <LoginForm users={users} onLogin={handleLogin} />
                    )}
                </div>
            )}
            
            {view === 'EXPENSES' && (
                <div className="mb-24 mx-2 md:mx-0">
                    <div className="sticky top-0 z-30 bg-[#F2F5F1]/95 backdrop-blur-sm pb-3 pt-2 -mx-2 px-2 flex justify-between">
                         <div className="flex items-center gap-3"><button onClick={() => setView('OVERVIEW')} className="bg-white p-2 rounded-full border border-[#E8EFE6]"><ArrowLeft size={20}/></button><h2 className="text-2xl font-bold">Expenses</h2></div>
                         <button onClick={() => setIsAddExpenseModalOpen(true)} className="bg-[#1A2F1A] text-white px-4 rounded-xl text-xs font-bold flex items-center gap-2"><Plus size={16}/> Add</button>
                    </div>
                    <div className="space-y-3 mt-4">
                        {manualExpenses.map(e => (
                            <div key={e.id} className="bg-white p-4 rounded-2xl border border-[#E8EFE6] flex justify-between items-center">
                                <div><p className="font-bold text-[#1A2F1A]">{e.title}</p><p className="text-xs text-[#7A8C7A]">{formatDateSimple(e.date)} • {e.category}</p></div>
                                <span className="font-bold text-[#1A2F1A]">-₱{e.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'REPORTS' && currentUser?.role === 'OWNER' && (
              <ReportsView transactions={transactions} expenses={manualExpenses} stockLogs={stockHistory} products={products} onBack={() => setView('OVERVIEW')} />
            )}
            
            {view === 'POS' && (
                 <div className="fixed inset-0 bg-black z-50 flex flex-col">
                     <div className="absolute top-4 right-4 z-50"><button onClick={() => setView('HOME')} className="text-white bg-white/20 p-2 rounded-full"><X size={20}/></button></div>
                     <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                     <div className="absolute bottom-20 left-0 right-0 text-center"><p className="text-white bg-black/50 inline-block px-4 py-2 rounded-full">Scanner Active</p></div>
                 </div>
            )}
          </div>
        </div>

        <div className={`hidden lg:flex flex-col bg-white border-l border-[#E8EFE6] shadow-xl z-20 transition-all duration-300 ${view === 'HOME' && isDesktopCartOpen ? 'w-96' : 'w-0 overflow-hidden'}`}>
             <div className="w-96 h-full flex flex-col"> 
                 <Cart items={cart} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} onCheckout={handleCheckout} onClear={clearCart} onClose={() => setIsDesktopCartOpen(false)} />
             </div>
        </div>
        
        {isCartOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end sm:justify-center">
                <div className="absolute inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
                <div className="bg-white w-full sm:w-[400px] sm:mx-auto h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl overflow-hidden relative shadow-2xl animate-in slide-in-from-bottom duration-300">
                    <Cart items={cart} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} onCheckout={handleCheckout} onClear={clearCart} onClose={() => setIsCartOpen(false)} />
                </div>
            </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-[#F2F5F1] z-40 px-6 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
         <div className="max-w-lg mx-auto h-full flex items-center justify-between relative">
            <NavButton active={view === 'HOME'} onClick={() => setView('HOME')} icon={<Home size={24} />} label="Home" />
            {currentUser && !isStaff && <NavButton active={view === 'INVENTORY'} onClick={() => setView('INVENTORY')} icon={<Package size={24} />} label="Inventory" />}
            <div className="relative -top-6">
                <button disabled={!currentUser} onClick={() => currentUser && setView('POS')} className={`h-16 w-16 rounded-full flex items-center justify-center shadow-xl transition-all ${view === 'POS' ? 'bg-[#4A6741] text-white ring-4 ring-[#DCE7D9]' : !currentUser ? 'bg-[#F2F5F1] text-[#B0C4B0] cursor-not-allowed' : 'bg-[#1A2F1A] text-white hover:bg-[#4A6741]'}`}>
                    <Scan size={28} />
                </button>
            </div>
            {currentUser && !isStaff && <NavButton active={['OVERVIEW', 'TRANSACTIONS', 'EXPENSES', 'REPORTS'].includes(view)} onClick={() => setView('OVERVIEW')} icon={<PieChart size={24} />} label="Overview" />}
            <NavButton active={view === 'MORE'} onClick={() => setView('MORE')} icon={<MoreHorizontal size={24} />} label={currentUser ? "More" : "Login"} />
         </div>
      </div>
      
      {isInventoryModalOpen && <InventoryForm onSave={handleSaveProduct} onClose={() => { setIsInventoryModalOpen(false); setEditingProduct(null); }} initialProduct={editingProduct} categories={categories} products={products} />}
      {isBulkAddModalOpen && <BulkAddModal onSave={handleBulkAddProducts} onClose={() => setIsBulkAddModalOpen(false)} categories={categories} />}
      <CategoryManagementModal isOpen={isCategoryManagementOpen} onClose={() => setIsCategoryManagementOpen(false)} categories={categories} onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory} />
      <DeleteConfirmationModal isOpen={!!productToDelete} onClose={() => setProductToDelete(null)} onConfirm={confirmDeleteProduct} itemName={productBeingDeleted?.name} />
      <StockAdjustmentModal isOpen={!!adjustingProduct} onClose={() => setAdjustingProduct(null)} onConfirm={handleConfirmAdjustment} product={adjustingProduct} />
      <OrderDetailsModal isOpen={!!selectedTransaction} onClose={() => setSelectedTransaction(null)} transaction={selectedTransaction} />
      {currentUser && <UserProfileModal isOpen={isUserProfileOpen} onClose={() => setIsUserProfileOpen(false)} currentUser={currentUser} onUpdateProfile={handleUpdateProfile} />}
      {currentUser && isOwner && <UserManagementModal isOpen={isUserManagementOpen} onClose={() => setIsUserManagementOpen(false)} users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} currentUserId={currentUser.id} />}
      {isAddExpenseModalOpen && <AddExpenseModal onSave={handleAddExpense} onClose={() => setIsAddExpenseModalOpen(false)} />}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentUser={currentUser} 
        autoBackupEnabled={autoBackupEnabled} 
        onToggleAutoBackup={setAutoBackupEnabled} 
        lowStockAlertsEnabled={lowStockAlerts} 
        onToggleLowStockAlerts={setLowStockAlerts} 
        dailySalesReportEnabled={dailySalesReports} 
        onToggleDailySalesReport={setDailySalesReports} 
        onResetData={handleResetData}
        onClearInventory={handleClearInventory}
      />
      <LogoutConfirmationModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={() => { handleLogout(); setIsLogoutModalOpen(false); }} />
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 z-50 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#1A2F1A] text-white'}`}>
          <div className={`rounded-full p-1 ${toast.type === 'error' ? 'bg-white/20' : 'bg-[#4A6741]'}`}>{toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}</div>
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
