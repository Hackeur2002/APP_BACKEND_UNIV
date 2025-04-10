// app/Models/Payment.ts
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import DocumentRequest from '#models/document_request'

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare requestId: number

  @column()
  declare reference: string

  @column()
  declare amount: number

  @column()
  declare method: 'card' | 'mobile_money' | 'bank_transfer' | 'cash'

  @column()
  declare status: 'pending' | 'completed' | 'failed' | 'refunded'

  @column()
  declare metadata: any

  @column.dateTime()
  declare paidAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => DocumentRequest, {foreignKey: 'requestId'})
  declare request: BelongsTo<typeof DocumentRequest>
}