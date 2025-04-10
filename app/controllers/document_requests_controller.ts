import { HttpContext } from '@adonisjs/core/http'
import DocumentRequest from '#models/document_request'
import AcademicValidator from '#services/academic_validator'
import PaymentProcessor from '#services/payment_processor'
import files_uploads_services from '#services/files_uploads_services'
import { createDocumentRequestValidator } from '#validators/document_request'

export default class DocumentRequestsController {
  /**
   * Crée une nouvelle demande de document
   */
  async store({ request, response }: HttpContext) {
    const validator = new AcademicValidator()
    const paymentProcessor = new PaymentProcessor()

    const data = await request.validateUsing(createDocumentRequestValidator)

    // const academicData = request.only([
    //   'matricule',
    //   'establishment',
    //   'studyYear',
    //   'academicYear'
    // ])

    try {
      const { isValid, studentInfo } = await validator.validateStudentData(data)
      if (!isValid) {
        return response.badRequest({ error: 'Données académiques invalides' })
      }

      // Gestion des fichiers uploadés avec filesUploadsServices
      const files = {
        acteNaissance: data.acteNaissance,
        carteEtudiant: data.carteEtudiant,
        fichePreinscription: data.fichePreinscription,
        diplomeBac: data.diplomeBac,
        demandeManuscrite: data.demandeManuscrite
      }

      // console.log('files', files)

      const filePaths: { [key: string]: string | null } = {}
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const move = await files_uploads_services.filesUploadsServices(file, 'document_requests')
          if (!move) {
            return response.status(500).json({ message: `Erreur avec le fichier ${key}` })
          }
          filePaths[key] = move
        } else {
          filePaths[key] = null
        }
      }

      // console.log(filePaths)

      const documentRequest = await DocumentRequest.create({
        studentName: studentInfo.fullName,
        matricule: data.matricule,
        establishment: data.establishment,
        studyYear: data.studyYear,
        academicYear: data.academicYear,
        documentType: data.documentType,
        studentEmail: data.studentEmail,
        studentPhone: data.studentPhone,
        trackingId: `DOC-${Date.now().toString(36).toUpperCase()}`,
        status: 'payment_pending',
        acteNaissancePath: filePaths.acteNaissance,
        carteEtudiantPath: filePaths.carteEtudiant,
        fichePreinscriptionPath: filePaths.fichePreinscription,
        diplomeBacPath: filePaths.diplomeBac,
        demandeManuscritePath: filePaths.demandeManuscrite
      })

      const { payment, paymentUrl } = await paymentProcessor.initiatePayment(
        documentRequest,
        data.paymentMethod
      )

      return response.created({
        trackingId: documentRequest.trackingId,
        paymentStatus: payment.status,
        paymentUrl
      })
    } catch (error) {
      return response.badRequest({
        error: error.message,
        details: error.details || null
      })
    }
  }

  /**
   * Affiche une demande spécifique via son tracking ID
   */
  async show({ params, response }: HttpContext) {
    const request = await DocumentRequest.query()
      .where('tracking_id', params.tracking_id)
      .preload('payment')
      .preload('documents')
      .firstOrFail()

    return response.ok(request)
  }

  /**
   * Liste toutes les demandes (pour interface admin)
   */
  async index({ response }: HttpContext) {
    const requests = await DocumentRequest.query()
      .preload('payment')
      .preload('documents')
      .orderBy('created_at', 'desc')

    return response.ok(requests)
  }

  /**
   * Annule une demande
   */
  async cancel({ params, response }: HttpContext) {
    const request = await DocumentRequest.findOrFail(params.id)
    
    if (request.status !== 'payment_pending') {
      return response.badRequest({ 
        error: 'La demande ne peut pas être annulée dans son état actuel' 
      })
    }

    request.status = 'cancelled'
    await request.save()

    return response.ok(request)
  }
}