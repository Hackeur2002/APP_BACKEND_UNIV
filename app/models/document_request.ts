import { DateTime } from 'luxon'
import { BaseModel, column, hasOne, hasMany } from '@adonisjs/lucid/orm'
import type { HasOne, HasMany } from '@adonisjs/lucid/types/relations'
import Payment from './payment.js'
import Document from './document.js'
import Validation from './validation.js'

export default class DocumentRequest extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare trackingId: string

  @column()
  declare studentName: string

  @column()
  declare studentEmail: string

  @column()
  declare studentPhone: string

  @column()
  declare matricule: string

  @column()
  declare establishment: string

  @column()
  declare studyYear: string

  @column()
  declare academicYear: string

  @column()
  declare documentType: string

  @column()
  declare status: string

  @column()
  declare rejectionReason: string | null

  @column()
  declare acteNaissancePath: string | null

  @column()
  declare carteEtudiantPath: string | null

  @column()
  declare fichePreinscriptionPath: string | null

  @column()
  declare diplomeBacPath: string | null

  @column()
  declare demandeManuscritePath: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasOne(() => Payment, {foreignKey: 'requestId'})
  declare payment: HasOne<typeof Payment>

  @hasMany(() => Document, {foreignKey: 'requestId'})
  declare documents: HasMany<typeof Document>

  @hasMany(() => Validation, {foreignKey: 'requestId'})
  declare validations: HasMany<typeof Validation>
}