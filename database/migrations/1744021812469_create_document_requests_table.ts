import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('tracking_id').notNullable().unique()
      table.string('student_name').notNullable()
      table.string('student_email').notNullable()
      table.string('student_phone').notNullable()
      table.string('matricule').notNullable()
      table.string('establishment').notNullable()
      table.string('study_year').notNullable()
      table.string('academic_year').notNullable()
      table.string('rejection_reason').nullable()
      table.string('document_type').notNullable()
      table.string('status').defaultTo('draft')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}