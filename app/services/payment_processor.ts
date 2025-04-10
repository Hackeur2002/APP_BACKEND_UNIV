import Payment from '#models/payment'
import DocumentRequest from '#models/document_request'
import axios from 'axios'
import env from '#start/env'

export default class PaymentProcessor {
  private readonly FEDAPAY_API_KEY = env.get('SECRET_KEY_FEDAPAY') // Remplacez par votre clé API sandbox
  private readonly FEDAPAY_BASE_URL = 'https://sandbox-api.fedapay.com/v1'
  private readonly CALLBACK_BASE_URL = 'http://localhost:3333/api/v1' // Remplacez par votre domaine réel

  async initiatePayment(request: DocumentRequest, method: string) {
    const amount = this.calculateAmount(request.documentType)
    
    const transactionData = {
      description: `Paiement pour ${request.documentType} - ${request.trackingId}`,
      amount,
      callback_url: `${this.CALLBACK_BASE_URL}/payments/PAY-${Date.now()}/callback`, // URL dynamique temporaire
      currency: { iso: 'XOF' },
      customer: {
        email: request.studentEmail,
        phone_number: { number: request.studentPhone, country: 'BJ' }
      }
    }

    try {
      const response = await axios.post(
        `${this.FEDAPAY_BASE_URL}/transactions`,
        transactionData,
        {
          headers: {
            Authorization: `Bearer ${this.FEDAPAY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const transaction = response.data

      const payment = await Payment.create({
        requestId: request.id,
        reference: transaction.reference,
        amount,
        method: method as 'card' | 'mobile_money' | 'bank_transfer' | 'cash',
        status: transaction.status
      })

      // Mettre à jour l'URL de callback avec la référence réelle
      const callbackUrl = `${this.CALLBACK_BASE_URL}/payments/${transaction.reference}/callback`
      await axios.put(
        `${this.FEDAPAY_BASE_URL}/transactions/${transaction.id}`,
        { callback_url: callbackUrl },
        {
          headers: {
            Authorization: `Bearer ${this.FEDAPAY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const paymentUrl = await this.generatePaymentUrl(transaction.id)

      return {
        payment,
        paymentUrl
      }
    } catch (error) {
      throw new Error(`Erreur lors de l'initiation du paiement: ${error.message}`)
    }
  }

  private async generatePaymentUrl(transactionId: number): Promise<string> {
    try {
      const response = await axios.post(
        `${this.FEDAPAY_BASE_URL}/transactions/${transactionId}/token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.FEDAPAY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const token = response.data.token
      return `https://sandbox-checkout.fedapay.com/${token}`
    } catch (error) {
      throw new Error(`Erreur lors de la génération de l'URL de paiement: ${error.message}`)
    }
  }

  private calculateAmount(documentType: string): number {
    const prices = {
      diploma: 5000,
      transcript: 2000,
      certificate: 1000
    } as const
    return prices[documentType as keyof typeof prices] || 0
  }
}