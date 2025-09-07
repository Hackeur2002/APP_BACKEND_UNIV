import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_requests'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('step')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enum('step', ['validator1', 'validator2', 'validator3', 'admin']).nullable()
    })
  }
}