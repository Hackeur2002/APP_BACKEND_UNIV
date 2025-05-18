import { HttpContext } from '@adonisjs/core/http'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import DocumentGenerator from '#services/document_generator'
import DocumentRequest from '#models/document_request'
import Validation from '#models/validation'
import Document from '#models/document'
import User from '#models/user'
import Payment from '#models/payment'
import mail from '@adonisjs/mail/services/main'

export default class StaffController {
  /**
   * Liste des demandes filtrées par rôle
   */
  async index({ auth, response }: HttpContext) {
    const user = await auth.authenticate()
    
    const query = DocumentRequest.query()
      .preload('payment')
      .preload('documents')
      .preload('validations', (q) => q.preload('staff'))

    if (user.role !== 'admin') {
      query.where('status', `pending_${user.role}`)
    }

    const requests = await query.orderBy('created_at', 'desc')
    return response.ok(requests)
  }

  /**
   * Détails d'une demande spécifique
   */
  async show({ params, response }: HttpContext) {
    const request = await DocumentRequest.query()
      .where('id', params.id)
      .preload('payment')
      .preload('documents')
      .preload('validations', (q) => q.preload('staff'))
      .firstOrFail()

    return response.ok(request)
  }

  /**
   * Met à jour le statut d'une demande
   */
  async updateStatus({ params, request, response }: HttpContext) {
    const { id } = params
    const { status } = request.only(['status'])

    const allowedStatuses = ['pending', 'under_review', 'approved', 'rejected']
    if (!allowedStatuses.includes(status)) {
      return response.badRequest({ error: 'Statut invalide' })
    }

    const docRequest = await DocumentRequest.findOrFail(id)
    docRequest.status = status
    await docRequest.save()

    return response.ok(docRequest)
  }

  /**
   * Valide ou rejette une demande
   */
  async validate({ auth, params, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const { id } = params

    const documentRequest = await DocumentRequest.findOrFail(id)
    
    if (user.role !== "admin" && user.role !== "validator1") {
      return response.forbidden({ 
        error: 'Action non autorisée pour votre rôle' 
      })
    }

    const { approved, comments } = request.only(['approved', 'comments'])
    const signatureFile = request.file('signature')

    const validation = await Validation.create({
      requestId: id,
      staffId: user.id,
      step: user.role.replace('validator', 'validation') as 'validation1' | 'validation2' | 'validation3',
      approved,
      comments,
      ...(signatureFile && {
        signaturePath: await this.storeSignature(signatureFile as unknown as File)
      })
    })

    documentRequest.status = this.getNextStatus(
      user.role,
      approved,
      documentRequest.documentType
    )

    if (!approved) {
      documentRequest.rejectionReason = comments
      documentRequest.status = 'rejected'
    }

    await documentRequest.save()

    return response.ok({
      validation: validation.serialize(),
      request: documentRequest.serialize()
    })
  }

  /**
   * Génère le document PDF
   */
  // async generate({ auth, params, response }: HttpContext) {
  //   const user = await auth.authenticate()
  //   const { id } = params

  //   const request = await DocumentRequest.query()
  //     .where('id', id)
  //     .where('status', 'approved')
  //     .firstOrFail()

  //   const exists = await Document.query()
  //     .where('request_id', id)
  //     .first()

  //   if (exists) {
  //     return response.conflict({ 
  //       error: 'Document déjà généré' 
  //     })
  //   }

  //   const fileName = `${request.trackingId}_${cuid()}.pdf`
  //   const filePath = app.tmpPath('documents', fileName)

  //   await new DocumentGenerator().generate(request, filePath)

  //   const document = await Document.create({
  //     requestId: request.id,
  //     type: request.documentType,
  //     filePath: `documents/${fileName}`,
  //     generatedBy: user.id
  //   })

  //   return response.created(document)
  // }
  async generate({ auth, params, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const { id } = params

    const documentRequest = await DocumentRequest.query()
      .where('id', id)
      .where('status', 'approved')
      .firstOrFail()

    const exists = await Document.query()
      .where('request_id', id)
      .first()

    if (exists) {
      return response.conflict({ 
        error: 'Document déjà généré' 
      })
    }

    const signatureFile = request.file('signature')
    let signaturePath: string | null = null
    if (signatureFile) {
      signaturePath = await this.storeSignature(signatureFile as unknown as File)
    }

    const fileName = `${documentRequest.trackingId}_${cuid()}.pdf`
    const filePath = app.tmpPath('documents', fileName)

    await new DocumentGenerator().generate(documentRequest, filePath, signaturePath)

    const document = await Document.create({
      requestId: documentRequest.id,
      type: documentRequest.documentType,
      filePath: `documents/${fileName}`,
      generatedBy: user.id,
    })

    // Send email to student
    await mail.send(message => {
      message.to(documentRequest.studentEmail)
      message.subject(`Votre document ${documentRequest.documentType} est prêt`)
      message.html(`
        <p>Cher(e) ${documentRequest.studentName},</p>
        <p>Votre document (${documentRequest.documentType}) a été généré avec succès.</p>
        <p>Vous trouverez le document en pièce jointe.</p>
        <p>Cordialement,<br>L'équipe administrative</p>
      `)
      message.hasAttachment(
        filePath,
        // `${documentRequest.documentType}_${documentRequest.trackingId}.pdf`,
      )
    })

    return response.created(document)
  }

  /**
   * Télécharge un document généré
   */
  async download({ params, response }: HttpContext) {
    const document = await Document.findOrFail(params.id)
    return response.download(app.tmpPath(document.filePath))
  }

  /**
   * Liste tous les documents générés
   */
  async listDocuments({ response }: HttpContext) {
    const documents = await Document.query()
      .preload('request')
      .orderBy('created_at', 'desc')

    return response.ok(documents)
  }

  /**
   * Historique des validations par le membre du staff
   */
  async validationsHistory({ auth, response }: HttpContext) {
    const user = await auth.authenticate()
    const validations = await Validation.query()
      .where('staff_id', user.id)
      .preload('request')
      .orderBy('created_at', 'desc')

    return response.ok(validations)
  }

  /**
   * Métriques administratives
   */
  async getMetrics({ auth, response }: HttpContext) {
    const user = await auth.authenticate()
    if (user.role !== 'admin') {
      return response.forbidden({ error: 'Accès réservé aux administrateurs' })
    }

    const metrics = {
      totalRequests: await DocumentRequest.query().count('* as total'),
      pendingValidations: await DocumentRequest.query()
        .where('status', 'under_review')
        .count('* as total'),
      generatedDocuments: await Document.query().count('* as total'),
      payments: {
        completed: await Payment.query()
          .where('status', 'completed')
          .count('* as total'),
        failed: await Payment.query()
          .where('status', 'failed')
          .count('* as total')
      }
    }

    return response.ok(metrics)
  }

  // Méthodes privées
  private async storeSignature(file: File) {
    const fileName = `${cuid()}.${file.extname}`
    await file.move(app.tmpPath('signatures'), { name: fileName })
    return `signatures/${fileName}`
  }

  private getNextStatus(role: string, approved: boolean, docType: string): string {
    if (!approved) return 'rejected'

    switch(role) {
      case 'validator1': return 'pending_validator2'
      case 'validator2': 
        return docType === 'diploma' 
          ? 'pending_validation3' 
          : 'approved'
      case 'validator3': return 'approved'
      default: return 'rejected'
    }
  }
}