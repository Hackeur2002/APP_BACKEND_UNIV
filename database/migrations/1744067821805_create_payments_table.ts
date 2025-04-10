import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('request_id').unsigned().references('id').inTable('document_requests')
      table.string('reference').notNullable().unique()
      table.decimal('amount', 10, 2).notNullable()
      table.enum('method', ['card', 'mobile_money', 'bank_transfer', 'cash']).notNullable()
      table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('pending')
      table.json('metadata').nullable()
      table.timestamp('paid_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}