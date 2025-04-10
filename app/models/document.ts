// app/Models/Document.ts
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import DocumentRequest from '#models/document_request'
import User from '#models/user'

export default class Document extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare requestId: number

  @column()
  declare type: string

  @column()
  declare filePath: string

  @column()
  declare generatedBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => DocumentRequest, {foreignKey: 'requestId'})
  declare request: BelongsTo<typeof DocumentRequest>

  @belongsTo(() => User, {foreignKey: 'generatedBy'})
  declare generatedByUser: BelongsTo<typeof User>
}