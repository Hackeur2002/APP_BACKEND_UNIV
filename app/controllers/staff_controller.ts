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
import fs from 'node:fs'

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

    // Filtrage selon le rôle de l'utilisateur
    switch (user.role) {
      case 'admin':
        // Les admins voient tout - pas de filtre supplémentaire
        break

      case 'validator2':
        // Validator2 voit les demandes approuvées (status = 'pending_validator2')
        query.where('status', 'pending_validator2').orWhere('status', 'generated').orWhere('status', 'approved')
        break

      case 'validator3':
        // Validator3 voit les demandes approuvées ET de type 'diploma'
        query.where('status', 'pending_validator3')
          .where('document_type', 'diploma')
        break

      default:
        // Pour tous les autres rôles (validator1, etc.), voir seulement les demandes en attente
        query.where('status', `pending_${user.role}`).orWhere('status', 'generated').orWhere('status', 'rejected')
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
    try {
      const user = await auth.authenticate()
      const { id } = params

      // Récupérer uniquement les champs nécessaires
      const { approved, comments } = request.only(['approved', 'comments'])

      const documentRequest = await DocumentRequest.findOrFail(id)

      // Création de l'entrée de validation
      const validation = await Validation.create({
        requestId: Number(id),
        staffId: Number(user.id),
        step: user.role as 'validator1' | 'validator2' | 'validator3' | 'admin',
        approved,
        comments,
      })

      // Mise à jour de rejection_reason pour un rejet
      if (!approved) {
        const rejectionEntry = {
          role: user.role,
          email: user.email,
          reason: comments || 'Aucune raison spécifiée',
        }

        let rejectionReasons = []
        if (documentRequest.rejectionReason) {
          try {
            rejectionReasons = JSON.parse(documentRequest.rejectionReason)
            if (!Array.isArray(rejectionReasons)) {
              rejectionReasons = [rejectionReasons]
            }
          } catch (error) {
            rejectionReasons = []
          }
        }
        rejectionReasons.push(rejectionEntry)
        documentRequest.rejectionReason = JSON.stringify(rejectionReasons)

        documentRequest.status = user.role === 'validator2' ? 'pending_validator1' : 'rejected'
        await this.sendRejectionEmail(documentRequest, comments, user.role === 'validator2')
      } else if (user.role === 'admin' && documentRequest.status === 'pending_validator1') {
        documentRequest.status = 'pending_validator2'
      } else if (user.role === 'admin' && documentRequest.status === 'pending_validator2') {
        documentRequest.status = 'approved'
      } else {
        documentRequest.status = this.getNextStatus(user.role, approved, documentRequest.documentType)
      }

      await documentRequest.save()

      return response.ok({
        validation: validation.serialize(),
        request: documentRequest.serialize(),
      })
    } catch (error) {
      console.error('Erreur lors de la validation:', error)
      return response.status(500).json({
        error: 'Erreur lors de la validation de la demande',
        details: error.message,
      })
    }
  }

  /**
   * Envoyer un email personnalisé à l'étudiant
   */
  async sendCustomEmail({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const { subject, message } = request.only(['subject', 'message'])

      const documentRequest = await DocumentRequest.findOrFail(id)

      // Vérifier que la demande n'a pas le statut 'generated'
      if (documentRequest.status === 'generated') {
        return response.badRequest({ error: 'Impossible d\'envoyer un email pour une demande avec le statut "generated"' })
      }

      // Envoyer l'email
      await mail.send((msg) => {
        msg
          .to(documentRequest.studentEmail)
          .subject(subject)
          .html(`
            <p>Cher(e) ${documentRequest.studentName},</p>
            <p>${message}</p>
            <p>Cordialement,<br>L'équipe administrative</p>
          `)
      })

      return response.ok({ message: 'Email envoyé avec succès' })
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
      return response.status(500).json({
        error: 'Erreur lors de l\'envoi de l\'email',
        details: error.message,
      })
    }
  }

  /**
   * Génère le document PDF
   */
  async generate({ auth, params, request, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const { id } = params

      // Vérification de la demande
      const documentRequest = await DocumentRequest.query()
        .where('id', id)
        .where('status', 'pending_validator2')
        .firstOrFail()

      // Vérification si document déjà généré
      const exists = await Document.query()
        .where('request_id', id)
        .first()
      if (exists) {
        return response.conflict({ error: 'Document déjà généré' })
      }

      // Gestion de la signature
      const signatureFile = request.file('signature', {
        size: '2mb',
        extnames: ['jpg', 'png', 'jpeg', 'pdf'],
      })
      let signaturePath: string | null = null
      if (signatureFile) {
        signaturePath = await this.storeSignature(signatureFile)
      }

      // Génération du document
      const fileName = `${documentRequest.trackingId}_${cuid()}.pdf`
      const filePath = app.tmpPath('documents', fileName)

      // Création du répertoire si inexistant
      await fs.promises.mkdir(app.tmpPath('documents'), { recursive: true })

      // Génération du PDF
      await new DocumentGenerator().generate(documentRequest, filePath, signaturePath)

      // Vérification que le fichier existe
      await fs.promises.access(filePath, fs.constants.F_OK)

      // Enregistrement en base
      const document = await Document.create({
        requestId: documentRequest.id,
        type: documentRequest.documentType,
        filePath: `documents/${fileName}`,
        generatedBy: user.id,
      })

      // Mise à jour du statut de la demande
      documentRequest.status = 'generated'
      await documentRequest.save()

      // Envoi de l'email
      try {
        await this.sendDocumentEmail(documentRequest, filePath)
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email:", emailError)
      }

      return response.created({
        ...document.serialize(),
        documentPath: `documents/${fileName}`,
      })
    } catch (error) {
      console.error('Erreur lors de la génération:', error)
      return response.status(500).json({
        error: 'Erreur lors de la génération du document',
        details: error.message,
      })
    }
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
          .count('* as total'),
      },
    }

    return response.ok(metrics)
  }

  // Méthodes privées
  private async storeSignature(file: any): Promise<string> {
    const fileName = `${cuid()}.${file.extname}`
    const signaturesDir = app.tmpPath('signatures')

    // Création du répertoire si inexistant
    await fs.promises.mkdir(signaturesDir, { recursive: true })

    await file.move(signaturesDir, {
      name: fileName,
      overwrite: true,
    })

    if (!file.filePath) {
      throw new Error('Échec du stockage de la signature')
    }

    return `signatures/${fileName}`
  }

  private async sendDocumentEmail(documentRequest: DocumentRequest, filePath: string) {
    await mail.send((message) => {
      message
        .to(documentRequest.studentEmail)
        .subject(`Votre document ${documentRequest.documentType} est prêt`)
        .html(`
          <p>Cher(e) ${documentRequest.studentName},</p>
          <p>Votre document (${documentRequest.documentType}) a été généré avec succès.</p>
          <p>Vous trouverez le document en pièce jointe.</p>
          <p>Cordialement,<br>L'équipe administrative</p>
        `)
        .attach(filePath, {
          filename: `${documentRequest.documentType}_${documentRequest.trackingId}.pdf`,
        })
    })
  }

  private async sendRejectionEmail(documentRequest: DocumentRequest, comments: string | null, isReverted: boolean = false) {
    await mail.send((message) => {
      message
        .to(documentRequest.studentEmail)
        .subject(isReverted ? `Demande ${documentRequest.trackingId} renvoyée pour révision` : `Rejet de votre demande ${documentRequest.trackingId}`)
        .html(`
          <p>Cher(e) ${documentRequest.studentName},</p>
          <p>Votre demande de document (${documentRequest.documentType}) avec l'ID de suivi ${documentRequest.trackingId} ${isReverted ? 'a été renvoyée pour révision' : 'a été rejetée'}.</p>
          <p><strong>Raison :</strong> ${comments || 'Aucune raison spécifiée'}</p>
          <p>${isReverted ? 'Veuillez vérifier les informations et documents fournis, puis soumettre à nouveau.' : 'Veuillez soumettre une nouvelle demande si nécessaire.'}</p>
          <p>Cordialement,<br>L'équipe administrative</p>
        `)
    })
  }

  private getNextStatus(role: string, approved: boolean, docType: string): string {
    if (!approved) return 'rejected'

    switch (role) {
      case 'validator1':
        return 'pending_validator2'
      case 'validator2':
        return docType === 'diploma' ? 'pending_validator3' : 'approved'
      case 'validator3':
        return 'approved'
      default:
        return 'rejected'
    }
  }
}