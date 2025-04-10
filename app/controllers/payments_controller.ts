import { HttpContext } from '@adonisjs/core/http'
import Payment from '#models/payment'

export default class PaymentsController {
  async callback({ params, request, response }: HttpContext) {
    const reference = params.reference
    const payload = request.all() // Données envoyées par FedaPay via webhook

    try {
      // Vérifier que le webhook provient bien de FedaPay (optionnel mais recommandé en production)
      // Vous pouvez vérifier la signature avec l'en-tête X-Fedapay-Signature

      const payment = await Payment.findByOrFail('reference', reference)
      const newStatus = payload.event === 'transaction.approved' ? 'approved' : payload.status

      // Mettre à jour le statut du paiement
      payment.status = newStatus
      await payment.save()

      // Optionnel : Mettre à jour le statut de la demande associée
      if (newStatus === 'approved' && payment.requestId) {
        const documentRequest = await payment.related('request').query().first()
        if (documentRequest) {
          documentRequest.status = 'processing'
          await documentRequest.save()
        }
      }

      return response.ok({ message: 'Callback traité avec succès' })
    } catch (error) {
      console.error(`Erreur lors du traitement du callback pour ${reference}:`, error)
      return response.badRequest({ error: 'Erreur lors du traitement du callback' })
    }
  }

  async checkPaymentStatus({ params, response }: HttpContext) {
    try {
      const payment = await Payment.query()
        .where('reference', params.reference)
        .preload('request')
        .firstOrFail()

      return response.ok({
        status: payment.status,
        requestId: payment.requestId,
        trackingId: payment.request?.trackingId
      })
    } catch (error) {
      return response.notFound({ error: 'Paiement non trouvé' })
    }
  }
}