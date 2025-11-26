import { database, seedDatabase } from '../backend';
import { Q } from '@nozbe/watermelondb';
import Product from '../backend/models/Product';
import Transaction from '../backend/models/Transaction';
import StockLog from '../backend/models/StockLog';
import User from '../backend/models/User';
import Expense from '../backend/models/Expense';
import { Product as ProductType, Transaction as TransactionType, StockLog as StockLogType, User as UserType, ExpenseRecord, CartItem, Role, ExpenseCategory } from '../types';

// Data Mappers
const mapProduct = (p: Product): ProductType => ({
  id: p.id,
  name: p.name,
  price: p.price,
  costPrice: p.costPrice,
  category: p.category,
  image: p.image,
  description: p.description,
  stock: p.stock,
  barcode: p.barcode
});

const mapTransaction = (t: Transaction): TransactionType => ({
  id: t.id,
  date: t.dateStr,
  timestamp: t.timestamp,
  amount: t.amount,
  status: t.status as any,
  items: t.itemsSummary,
  cashierName: t.cashierName,
  orderItems: t.orderItems || [],
  paymentMethod: t.paymentMethod as any,
  discount: t.discount,
  paidAmount: t.paidAmount,
  change: t.change
});

const mapStockLog = (l: StockLog): StockLogType => ({
  id: l.id,
  productId: l.productId,
  productName: l.productName,
  action: l.action as any,
  quantityChange: l.quantityChange,
  newStockLevel: l.newStockLevel,
  timestamp: l.timestamp,
  note: l.note
});

const mapUser = (u: User): UserType => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role as Role,
  avatar: u.avatar,
  phone: u.phone,
  joinedDate: u.joinedDate
});

const mapExpense = (e: Expense): ExpenseRecord => ({
  id: e.id,
  title: e.title,
  amount: e.amount,
  category: e.category as ExpenseCategory,
  date: e.date,
  recordedBy: e.recordedBy,
  note: e.note
});

export const dbService = {
  async initialize() {
    await seedDatabase();
  },

  async getProducts() {
    const products = await database.get<Product>('products').query(Q.sortBy('created_at', Q.desc)).fetch();
    return products.map(mapProduct);
  },

  async getTransactions() {
    const transactions = await database.get<Transaction>('transactions').query(Q.sortBy('created_at', Q.desc)).fetch();
    return transactions.map(mapTransaction);
  },

  async getStockLogs() {
    const logs = await database.get<StockLog>('stock_logs').query(Q.sortBy('created_at', Q.desc)).fetch();
    return logs.map(mapStockLog);
  },

  async getUsers() {
    const users = await database.get<User>('users').query().fetch();
    return users.map(mapUser);
  },

  async getExpenses() {
    const expenses = await database.get<Expense>('expenses').query(Q.sortBy('created_at', Q.desc)).fetch();
    return expenses.map(mapExpense);
  },

  // --- Products ---

  async addProduct(data: ProductType) {
      await database.write(async () => {
          await database.get<Product>('products').create(p => {
              p._raw.id = data.id; 
              p.name = data.name;
              p.price = data.price;
              p.costPrice = data.costPrice;
              p.category = data.category;
              p.image = data.image;
              p.description = data.description || '';
              p.stock = data.stock;
              p.barcode = data.barcode || '';
          });
      });
  },

  async addProductsBatch(products: ProductType[], logs: StockLogType[]) {
      await database.write(async () => {
          const productCollection = database.get<Product>('products');
          const logsCollection = database.get<StockLog>('stock_logs');

          const productBatch = products.map(data => 
              productCollection.prepareCreate(p => {
                p._raw.id = data.id;
                p.name = data.name;
                p.price = data.price;
                p.costPrice = data.costPrice;
                p.category = data.category;
                p.image = data.image;
                p.description = data.description || '';
                p.stock = data.stock;
                p.barcode = data.barcode || '';
              })
          );

          const logBatch = logs.map(data => 
            logsCollection.prepareCreate(l => {
                l._raw.id = data.id;
                l.productId = data.productId;
                l.productName = data.productName;
                l.action = data.action;
                l.quantityChange = data.quantityChange;
                l.newStockLevel = data.newStockLevel;
                l.timestamp = data.timestamp;
                l.note = data.note || '';
            })
          );
          
          await database.batch(...productBatch, ...logBatch);
      });
  },

  async updateProduct(data: ProductType) {
      await database.write(async () => {
          const product = await database.get<Product>('products').find(data.id);
          await product.update(p => {
              p.name = data.name;
              p.price = data.price;
              p.costPrice = data.costPrice;
              p.category = data.category;
              p.image = data.image;
              p.description = data.description || '';
              p.stock = data.stock;
              p.barcode = data.barcode || '';
          });
      });
  },

  async deleteProduct(id: string) {
      await database.write(async () => {
          const product = await database.get<Product>('products').find(id);
          await product.destroyPermanently();
      });
  },

  // --- Transactions (Checkout) ---

  async createTransaction(txData: TransactionType, stockUpdates: {productId: string, newStock: number}[], newLogs: StockLogType[]) {
      await database.write(async () => {
          // 1. Create Transaction
          await database.get<Transaction>('transactions').create(t => {
              t._raw.id = txData.id;
              t.dateStr = txData.date;
              t.timestamp = txData.timestamp || new Date().toISOString();
              t.amount = txData.amount;
              t.status = txData.status;
              t.itemsSummary = txData.items;
              t.cashierName = txData.cashierName;
              t.orderItems = txData.orderItems || [];
              t.paymentMethod = txData.paymentMethod || 'CASH';
              t.discount = txData.discount || 0;
              t.paidAmount = txData.paidAmount || 0;
              t.change = txData.change || 0;
          });

          // 2. Update Stocks
          for (const update of stockUpdates) {
               const product = await database.get<Product>('products').find(update.productId);
               await product.update(p => {
                   p.stock = update.newStock;
               });
          }

          // 3. Create Logs
          const logsCollection = database.get<StockLog>('stock_logs');
          for (const log of newLogs) {
              await logsCollection.create(l => {
                  l._raw.id = log.id;
                  l.productId = log.productId;
                  l.productName = log.productName;
                  l.action = log.action;
                  l.quantityChange = log.quantityChange;
                  l.newStockLevel = log.newStockLevel;
                  l.timestamp = log.timestamp;
                  l.note = log.note || '';
              });
          }
      });
  },
  
  // --- Logs ---

  async addStockLog(log: StockLogType) {
      await database.write(async () => {
           await database.get<StockLog>('stock_logs').create(l => {
                  l._raw.id = log.id;
                  l.productId = log.productId;
                  l.productName = log.productName;
                  l.action = log.action;
                  l.quantityChange = log.quantityChange;
                  l.newStockLevel = log.newStockLevel;
                  l.timestamp = log.timestamp;
                  l.note = log.note || '';
           });
      });
  },

  // --- Expenses ---

  async addExpense(data: ExpenseRecord) {
      await database.write(async () => {
          await database.get<Expense>('expenses').create(e => {
              e._raw.id = data.id;
              e.title = data.title;
              e.amount = data.amount;
              e.category = data.category;
              e.date = data.date;
              e.recordedBy = data.recordedBy;
              e.note = data.note || '';
          });
      });
  },

  // --- Users ---

  async addUser(data: UserType) {
      await database.write(async () => {
          await database.get<User>('users').create(u => {
              u._raw.id = data.id;
              u.name = data.name;
              u.email = data.email;
              u.role = data.role;
              u.avatar = data.avatar;
              u.phone = data.phone;
              u.joinedDate = data.joinedDate;
          });
      });
  },

  async updateUser(data: UserType) {
      await database.write(async () => {
          const user = await database.get<User>('users').find(data.id);
          await user.update(u => {
              u.name = data.name;
              u.email = data.email;
              u.role = data.role;
              u.avatar = data.avatar;
              u.phone = data.phone;
          });
      });
  },

  async deleteUser(id: string) {
      await database.write(async () => {
          const user = await database.get<User>('users').find(id);
          await user.destroyPermanently();
      });
  },

  // --- Admin ---

  async resetDatabase() {
      await database.write(async () => {
         await database.unsafeResetDatabase();
      });
      await this.initialize();
  }
};