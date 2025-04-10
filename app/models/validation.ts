import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import DocumentRequest from '#models/document_request'
import User from '#models/user'

export default class Validation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare requestId: number

  @column()
  declare staffId: number

  @column()
  declare step: 'validation1' | 'validation2' | 'validation3'

  @column()
  declare approved: boolean

  @column()
  declare comments: string | null

  @column()
  declare signaturePath: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Une validation appartient à une demande
  @belongsTo(() => DocumentRequest, {foreignKey: 'requestId'})
  declare request: BelongsTo<typeof DocumentRequest>

  // Une validation est effectuée par un staff
  @belongsTo(() => User, {foreignKey: 'staffId'})
  declare staff: BelongsTo<typeof User>

  // Méthode pour formater les données de validation
  serialize() {
    return {
      id: this.id,
      step: this.step,
      approved: this.approved,
      comments: this.comments,
      signature: this.signaturePath 
        ? `/signatures/${this.signaturePath}`
        : null,
      validator: this.staff?.serialize(),
      createdAt: this.createdAt.toISO()
    }
  }
}