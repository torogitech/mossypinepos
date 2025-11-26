import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Product extends Model {
  static table = 'products'

  @field('name') name!: string
  @field('price') price!: number
  @field('cost_price') costPrice!: number
  @field('category') category!: string
  @field('image') image!: string
  @field('description') description!: string
  @field('stock') stock!: number
  @field('barcode') barcode!: string
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}