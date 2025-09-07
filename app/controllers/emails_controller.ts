import type { HttpContext } from '@adonisjs/core/http'
import { createMailValidator } from '#validators/mail'
import mail from '@adonisjs/mail/services/main'

export default class EmailsController {
  public async sendRecap({ request, response }: HttpContext) {
    try {
      // Validation schema for the request payload

      const payload = await request.validateUsing(createMailValidator)

      const {
        studentFullName,
        email,
        matricule,
        etablissement,
        anneeEtude,
        anneeAcademique,
        documentType,
        documentPrice,
        trackingId,
        paymentReference,
        uploadedDocuments,
      } = payload

      // Prepare the email content
      const emailHtml = `
        <h2>Récapitulatif de votre demande</h2>
        <p>Cher(e) ${studentFullName},</p>
        <p>Votre demande a été enregistrée avec succès. Voici les détails :</p>
        <ul>
          <li><strong>Nom complet :</strong> ${studentFullName}</li>
          <li><strong>Numéro de matricule :</strong> ${matricule}</li>
          <li><strong>Établissement :</strong> ${etablissement}</li>
          <li><strong>Année d'étude :</strong> ${anneeEtude}</li>
          <li><strong>Année académique :</strong> ${anneeAcademique}</li>
          <li><strong>Type de document :</strong> ${documentType}</li>
          <li><strong>Prix :</strong> ${documentPrice}</li>
          <li><strong>Numéro de suivi :</strong> ${trackingId}</li>
          <li><strong>Référence de paiement :</strong> ${paymentReference}</li>
          <li><strong>Documents fournis :</strong>
            <ul>
              ${uploadedDocuments.length > 0
                ? uploadedDocuments.map(doc => `<li>${doc}</li>`).join('')
                : '<li>Aucun document fourni</li>'}
            </ul>
          </li>
        </ul>
        <p>Vous pouvez suivre l'état de votre demande avec le numéro de suivi. Pour toute question, contactez notre support.</p>
        <p>Cordialement,<br>L'équipe administrative</p>
      `

      // Send the email
      await mail.send((message) => {
        message
          .to(email)
          .from('kathysatera@gmail.com', 'Université Administrative') // Configure your sender
          .subject('Récapitulatif de votre demande')
          .html(emailHtml)
      })

      return response.json({ success: true, message: 'Email envoyé avec succès.' })
    } catch (error) {
      if (error.messages) {
        // Validation errors
        return response.status(422).json({
          success: false,
          message: error.messages.errors[0].message,
        })
      }
      console.error('Erreur lors de l\'envoi de l\'email:', error)
      return response.status(500).json({
        success: false,
        message: 'Une erreur est survenue lors de l\'envoi de l\'email.',
      })
    }
  }
}