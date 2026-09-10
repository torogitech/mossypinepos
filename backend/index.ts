import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import { mySchema } from './schema'
import Product from './models/Product'
import Transaction from './models/Transaction'
import StockLog from './models/StockLog'
import User from './models/User'
import Expense from './models/Expense'

import { INITIAL_PRODUCTS, INITIAL_USERS, INITIAL_STOCK_LOGS, INITIAL_TRANSACTIONS } from './initialData'

const adapter = new LokiJSAdapter({
  schema: mySchema,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  onQuotaExceededError: (error) => {
    // Browser ran out of disk space
    console.error('Disk quota exceeded', error)
  },
  onSetUpError: (error) => {
    // Database failed to load
    console.error('DB Setup failed', error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [
    Product,
    Transaction,
    StockLog,
    User,
    Expense,
  ],
})

// Function to populate database with initial data if empty
export const seedDatabase = async () => {
  const productsCount = await database.get('products').query().fetchCount()
  const usersCount = await database.get('users').query().fetchCount()
  
  if (productsCount > 0 && usersCount > 0) {
    console.log('Database already populated.')
    return
  }

  console.log('Seeding database with initial data...')
  
  await database.write(async () => {
    const batches: any[] = []

    // Seed Products if needed
    if (productsCount === 0) {
      const productsCollection = database.get<Product>('products')
      const productBatch = INITIAL_PRODUCTS.map(data => 
        productsCollection.prepareCreate(product => {
          product._raw.id = data.id
          product.name = data.name
          product.price = data.price
          product.costPrice = data.costPrice
          product.category = data.category
          product.image = data.image
          product.description = data.description || ''
          product.stock = data.stock
          product.barcode = data.barcode || ''
        })
      )
      batches.push(...productBatch)
    }

    // Seed Users if needed
    if (usersCount === 0) {
      const usersCollection = database.get<User>('users')
      const userBatch = INITIAL_USERS.map(data => 
        usersCollection.prepareCreate(user => {
          user._raw.id = data.id
          user.name = data.name
          user.email = data.email
          user.role = data.role
          user.avatar = data.avatar
          user.phone = data.phone
          user.joinedDate = data.joinedDate
        })
      )
      batches.push(...userBatch)
    }

    // Seed Stock Logs if needed
    if (productsCount === 0) {
      const stockLogsCollection = database.get<StockLog>('stock_logs')
      const logBatch = INITIAL_STOCK_LOGS.map(data => 
        stockLogsCollection.prepareCreate(log => {
          log._raw.id = data.id
          log.productId = data.productId
          log.productName = data.productName
          log.action = data.action
          log.quantityChange = data.quantityChange
          log.newStockLevel = data.newStockLevel
          log.timestamp = data.timestamp
          log.note = data.note
        })
      )
      batches.push(...logBatch)
    }

    // Seed Transactions if needed
    if (productsCount === 0) {
      const transactionsCollection = database.get<Transaction>('transactions')
      const txBatch = INITIAL_TRANSACTIONS.map(data => 
        transactionsCollection.prepareCreate(tx => {
          tx._raw.id = data.id
          tx.dateStr = data.date
          tx.timestamp = data.timestamp
          tx.amount = data.amount
          tx.status = data.status
          tx.itemsSummary = data.itemsSummary
          tx.cashierName = data.cashierName
          tx.orderItems = data.orderItems
          tx.paymentMethod = data.paymentMethod
          tx.discount = 0
          tx.paidAmount = data.paidAmount
          tx.change = data.change
        })
      )
      batches.push(...txBatch)
    }

    if (batches.length > 0) {
      await database.batch(...batches)
    }
  })
  
  console.log('Seeding complete.')
}
