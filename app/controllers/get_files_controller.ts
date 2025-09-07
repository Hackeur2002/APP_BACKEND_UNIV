import type { HttpContext } from '@adonisjs/core/http'
import { sep, normalize } from 'node:path'
import app from '@adonisjs/core/services/app'

const PATH_TRAVERSAL_REGEX = /(?:^|[\\/])\.\.(?:[\\/]|$)/

export default class GetFilesController {
  async getFile({ request, response }: HttpContext) {
    const filePath = request.param('*').join(sep)
    const normalizedPath = normalize(filePath)

    console.log("File Path", filePath)
    console.log("Normalized Path", normalizedPath)

    if (PATH_TRAVERSAL_REGEX.test(normalizedPath)) {
      return response.badRequest('Malformed path')
    }

    const absolutePath = app.makePath('uploads', normalizedPath)
    console.log("Absolute Path", absolutePath)
    // Ajoutez les en-têtes CORS si nécessaire
    // response.header('Access-Control-Allow-Origin', 'http://localhost:9000')
    // response.header('Access-Control-Allow-Origin', 'http://localhost:3000')
    return response.download(absolutePath)
  }

  async getFileFromTmp({ request, response }: HttpContext) {
    const filePath = request.param('*').join(sep)
    const normalizedPath = normalize(filePath)

    console.log("File Path", filePath)
    console.log("Normalized Path", normalizedPath)

    if (PATH_TRAVERSAL_REGEX.test(normalizedPath)) {
      return response.badRequest('Malformed path')
    }

    const absolutePath = app.makePath('tmp', normalizedPath)
    console.log("Absolute Path", absolutePath)
    // Ajoutez les en-têtes CORS si nécessaire
    // response.header('Access-Control-Allow-Origin', 'http://localhost:9000')
    // response.header('Access-Control-Allow-Origin', 'http://localhost:3000')
    return response.download(absolutePath)
  }
}
