// This file contains the initial data constants to seed the WatermelonDB database
// Replicated from App.tsx for backend independence

export const INITIAL_PRODUCTS = [
  {
    id: '1',
    name: 'Caramel Macchiato',
    price: 120.00,
    costPrice: 45.00,
    category: 'Coffee',
    image: 'https://picsum.photos/seed/caramel/200/200',
    description: 'Rich espresso marked with caramel and steamed milk.',
    stock: 50,
    barcode: '1001'
  },
  {
    id: '2',
    name: 'Matcha Latte',
    price: 150.00,
    costPrice: 60.00,
    category: 'Tea',
    image: 'https://picsum.photos/seed/matcha/200/200',
    description: 'Premium Japanese matcha green tea with oat milk.',
    stock: 35,
    barcode: '1002'
  },
  {
    id: '3',
    name: 'Croissant',
    price: 80.00,
    costPrice: 25.00,
    category: 'Bakery',
    image: 'https://picsum.photos/seed/croissant/200/200',
    description: 'Buttery, flaky, and freshly baked every morning.',
    stock: 20,
    barcode: '1003'
  },
  {
    id: '4',
    name: 'Avocado Toast',
    price: 220.00,
    costPrice: 90.00,
    category: 'Food',
    image: 'https://picsum.photos/seed/avocado/200/200',
    description: 'Sourdough bread topped with fresh avocado and seeds.',
    stock: 5,
    barcode: '1004'
  },
  {
    id: '5',
    name: 'Iced Americano',
    price: 110.00,
    costPrice: 30.00,
    category: 'Coffee',
    image: 'https://picsum.photos/seed/americano/200/200',
    description: '',
    stock: 100,
    barcode: '1005'
  },
  {
    id: '6',
    name: 'Blueberry Muffin',
    price: 90.00,
    costPrice: 35.00,
    category: 'Bakery',
    image: 'https://picsum.photos/seed/muffin/200/200',
    description: 'Bursting with fresh blueberries and topped with crumble.',
    stock: 25,
    barcode: '1006'
  }
];

export const INITIAL_USERS = [
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
    name: 'John Smith',
    email: 'john@mossypine.com',
    role: 'MANAGER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    phone: '+1 (555) 010-5678',
    joinedDate: '2023-03-20T00:00:00Z'
  },
  {
    id: 'u3',
    name: 'Sarah Staff',
    email: 'sarah@mossypine.com',
    role: 'STAFF',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    phone: '+1 (555) 010-9999',
    joinedDate: '2023-06-10T00:00:00Z'
  }
];

const getPastDate = (daysAgo: number, hoursAgo: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

export const INITIAL_STOCK_LOGS = [
  {
    id: 'log-1',
    productId: '1',
    productName: 'Caramel Macchiato',
    action: 'SALE',
    quantityChange: -5,
    newStockLevel: 50,
    timestamp: getPastDate(0, 2),
    note: 'Morning Rush'
  },
  {
    id: 'log-2',
    productId: '1',
    productName: 'Caramel Macchiato',
    action: 'RESTOCK',
    quantityChange: 20,
    newStockLevel: 55,
    timestamp: getPastDate(2),
    note: 'Weekly Bean Delivery'
  },
  {
    id: 'log-3',
    productId: '1',
    productName: 'Caramel Macchiato',
    action: 'INITIAL',
    quantityChange: 35,
    newStockLevel: 35,
    timestamp: getPastDate(7),
    note: 'Opening Inventory'
  },
];

export const INITIAL_TRANSACTIONS = [
  { 
      id: 't1', 
      date: 'Today, 10:23 AM', 
      timestamp: getPastDate(0, 2),
      amount: 330.00, 
      status: 'completed', 
      items: '2x Latte, 1x Muffin', 
      cashierName: 'Jane Doe',
      paymentMethod: 'CASH',
      itemsSummary: '2x Latte, 1x Muffin',
      orderItems: [], // Simplification for seed
      paidAmount: 350,
      change: 20
  },
  { 
      id: 't2', 
      date: 'Today, 09:15 AM', 
      timestamp: getPastDate(0, 3),
      amount: 220.00, 
      status: 'completed', 
      items: '1x Avocado Toast', 
      cashierName: 'John Smith',
      paymentMethod: 'QR',
      itemsSummary: '1x Avocado Toast',
      orderItems: [],
      paidAmount: 220,
      change: 0
  }
];
