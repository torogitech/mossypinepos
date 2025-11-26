import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'products',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'price', type: 'number' },
        { name: 'cost_price', type: 'number' },
        { name: 'category', type: 'string' },
        { name: 'image', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'stock', type: 'number' },
        { name: 'barcode', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'date_str', type: 'string' }, // Display date string
        { name: 'timestamp', type: 'string' }, // ISO timestamp
        { name: 'amount', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'items_summary', type: 'string' },
        { name: 'cashier_name', type: 'string' },
        { name: 'order_items', type: 'string' }, // JSON stringified CartItem[]
        { name: 'payment_method', type: 'string', isOptional: true },
        { name: 'discount', type: 'number', isOptional: true },
        { name: 'paid_amount', type: 'number', isOptional: true },
        { name: 'change', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'stock_logs',
      columns: [
        { name: 'product_id', type: 'string' },
        { name: 'product_name', type: 'string' },
        { name: 'action', type: 'string' },
        { name: 'quantity_change', type: 'number' },
        { name: 'new_stock_level', type: 'number' },
        { name: 'timestamp', type: 'string' },
        { name: 'note', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'avatar', type: 'string' },
        { name: 'phone', type: 'string' },
        { name: 'joined_date', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'expenses',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'category', type: 'string' },
        { name: 'date', type: 'string' },
        { name: 'recorded_by', type: 'string' },
        { name: 'note', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ]
})