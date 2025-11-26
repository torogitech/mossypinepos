import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators'

const sanitizeOrderItems = (raw: any) => {
  return Array.isArray(raw) ? raw : []
}

export default class Transaction extends Model {
  static table = 'transactions'

  @field('date_str') dateStr!: string
  @field('timestamp') timestamp!: string
  @field('amount') amount!: number
  @field('status') status!: string
  @field('items_summary') itemsSummary!: string
  @field('cashier_name') cashierName!: string
  
  // Storing complex objects as JSON
  @json('order_items', sanitizeOrderItems) orderItems!: any[]
  
  @field('payment_method') paymentMethod!: string
  @field('discount') discount!: number
  @field('paid_amount') paidAmount!: number
  @field('change') change!: number
  
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}