import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import { promises as fs } from 'node:fs'

class ManageFilesServices {
  async filesUploadsServices(file: any, table: any) {
    const filename = `${cuid()}_${file.fieldName}.${file.extname}`
    await file.move(app.makePath(`uploads/${table}`), {
      name: filename,
    })
    return `uploads/${table}/${filename}`
  }
  
  async filesDeleteServices(filePath: any) {
    try {
      await fs.unlink(filePath)
    } catch (err) {
      // Fichier non trouvé, ignorer l'erreur
      // return response.status(500).json({
      //   message: 'Fichier introuvable',
      // })
      return 'Fichier non trouvé'
    }
  }
}

export default new ManageFilesServices