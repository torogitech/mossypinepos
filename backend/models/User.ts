import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class User extends Model {
  static table = 'users'

  @field('name') name!: string
  @field('email') email!: string
  @field('role') role!: string
  @field('avatar') avatar!: string
  @field('phone') phone!: string
  @field('joined_date') joinedDate!: string
  
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}