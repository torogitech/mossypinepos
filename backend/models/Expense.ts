import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Expense extends Model {
  static table = 'expenses'

  @field('title') title!: string
  @field('amount') amount!: number
  @field('category') category!: string
  @field('date') date!: string
  @field('recorded_by') recordedBy!: string
  @field('note') note!: string
  
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}