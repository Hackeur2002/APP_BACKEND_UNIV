import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'validations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('request_id').unsigned().references('id').inTable('document_requests')
      table.integer('staff_id').unsigned().references('id').inTable('users')
      table.enum('step', ['validation1', 'validation2', 'validation3']).nullable()
      table.boolean('approved').nullable()
      table.text('comments').nullable()
      table.string('signature_path').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}