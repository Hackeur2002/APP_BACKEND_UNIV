import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('request_id').unsigned().references('id').inTable('document_requests')
      table.string('type').notNullable()
      table.string('file_path').notNullable()
      table.integer('generated_by').unsigned().references('id').inTable('users').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}