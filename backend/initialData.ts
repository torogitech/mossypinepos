// This file contains the initial data constants to seed the WatermelonDB database
// Replicated from App.tsx for backend independence

export const INITIAL_PRODUCTS = [
  {
    id: '1',
    name: 'Signature Cold Brew',
    price: 160.00,
    costPrice: 50.00,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400',
    description: 'Smooth, slow-steeped cold brew served over ice.',
    stock: 50,
    barcode: '1001'
  },
  {
    id: '2',
    name: 'Matcha Latte',
    price: 150.00,
    costPrice: 60.00,
    category: 'Tea',
    image: 'https://images.unsplash.com/photo-1515810397858-220d1e6a622e?w=400',
    description: 'Premium Japanese matcha green tea with oat milk.',
    stock: 35,
    barcode: '1002'
  },
  {
    id: '3',
    name: 'Butter Croissant',
    price: 85.00,
    costPrice: 25.00,
    category: 'Bakery',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f40388085?w=400',
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
    image: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?w=400',
    description: 'Sourdough bread topped with fresh avocado and seeds.',
    stock: 15,
    barcode: '1004'
  },
  {
    id: '5',
    name: 'Mossypine Tote',
    price: 350.00,
    costPrice: 150.00,
    category: 'Merch',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400',
    description: 'Durable canvas tote bag with our signature logo.',
    stock: 50,
    barcode: '1005'
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

export const INITIAL_STOCK_LOGS = [] as any[];

export const INITIAL_TRANSACTIONS = [] as any[];
