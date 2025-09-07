import vine from '@vinejs/vine'

export const createMailValidator = vine.compile(
    vine.object({
        studentFullName: vine.string().minLength(3).maxLength(255),
        email: vine.string().email(),
        matricule: vine.string().minLength(3).maxLength(255),
        etablissement: vine.string().minLength(3).maxLength(255),
        anneeEtude: vine.string().minLength(2),
        anneeAcademique: vine.string().minLength(2),
        documentType: vine.string().minLength(3).maxLength(255),
        documentPrice: vine.string().minLength(2),
        trackingId: vine.string().minLength(2),
        paymentReference: vine.string().minLength(2),
        uploadedDocuments: vine.array(vine.string()).minLength(1),
    })
)