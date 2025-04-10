import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Document from './document.js'
import Validation from './validation.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare fullName: string

  @column()
  declare role: 'admin' | 'validator1' | 'validator2' | 'validator3'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Un staff peut avoir effectué plusieurs validations
  @hasMany(() => Validation)
  declare validations: HasMany<typeof Validation>

  // Un staff peut avoir généré plusieurs documents
  @hasMany(() => Document)
  declare generatedDocuments: HasMany<typeof Document>

  // Méthode pour vérifier les permissions
  canValidate(status: string): boolean {
    const validationMap = {
      validator1: 'pending_validation1',
      validator2: 'pending_validation2', 
      validator3: 'pending_validation3',
      admin: 'pending_validation3'
    }
    return validationMap[this.role] === status
  }
}