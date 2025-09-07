import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'validations'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Supprimer la colonne existante
      table.dropColumn('step')
    })

    this.schema.alterTable(this.tableName, (table) => {
      // Recréer la colonne avec les nouvelles valeurs ENUM
      table
        .enum('step', ['validator1', 'validator2', 'validator3', 'admin'])
        .nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('step')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('step', ['validation1', 'validation2', 'validation3'])
        .nullable()
    })
  }
}
