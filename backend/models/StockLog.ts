import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class StockLog extends Model {
  static table = 'stock_logs'

  @field('product_id') productId!: string
  @field('product_name') productName!: string
  @field('action') action!: string
  @field('quantity_change') quantityChange!: number
  @field('new_stock_level') newStockLevel!: number
  @field('timestamp') timestamp!: string
  @field('note') note!: string
  
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}