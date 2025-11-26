
export type Category = string;

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  category: Category;
  image: string;
  description?: string;
  stock: number;
  barcode?: string; // Added for scanning sync
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string;
  timestamp?: string; // Added for calculating sales stats
  amount: number;
  status: 'completed' | 'pending' | 'refunded';
  items: string;
  cashierName: string;
  orderItems?: CartItem[];
  paymentMethod?: 'CASH' | 'CARD' | 'QR';
  discount?: number;
  paidAmount?: number;
  change?: number;
}

export type ViewMode = 'HOME' | 'POS' | 'INVENTORY' | 'OVERVIEW' | 'MORE' | 'TRANSACTIONS' | 'EXPENSES' | 'REPORTS';

export type StockAction = 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'INITIAL' | 'DELETE' | 'BULK_IMPORT';

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  action: StockAction;
  quantityChange: number;
  newStockLevel: number;
  timestamp: string;
  note?: string;
}

export type Role = 'OWNER' | 'MANAGER' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  phone: string;
  joinedDate: string;
}

export type ExpenseCategory = 'FOOD' | 'UTILITIES' | 'MAINTENANCE' | 'SALARY' | 'MISC';

export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  recordedBy: string;
  note?: string;
}
