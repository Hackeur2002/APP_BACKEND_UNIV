import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_requests'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('acte_naissance_path').nullable()
      table.string('carte_etudiant_path').nullable()
      table.string('fiche_preinscription_path').nullable()
      table.string('diplome_bac_path').nullable()
      table.string('demande_manuscrite_path').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('acte_naissance_path')
      table.dropColumn('carte_etudiant_path')
      table.dropColumn('fiche_preinscription_path')
      table.dropColumn('diplome_bac_path')
      table.dropColumn('demande_manuscrite_path')
    })
  }
}