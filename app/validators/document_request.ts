import vine from '@vinejs/vine'

export const createDocumentRequestValidator = vine.compile(
    vine.object({
        matricule: vine.string().minLength(3).maxLength(255),
        establishment: vine.string().minLength(3).maxLength(255),
        studyYear: vine.string().minLength(2),
        academicYear: vine.string().minLength(2),
        documentType: vine.string().minLength(2),
        studentEmail: vine.string().minLength(2),
        studentPhone: vine.string().minLength(2),
        paymentMethod: vine.string().minLength(2),
        documentPrice: vine.string(),
        paymentReference: vine.string().minLength(2),
        acteNaissance: vine.file({
            size: '2mb', // Taille maximale de 2 Mo
            extnames: ['jpg', 'JPG', 'png', 'jpeg', 'webp', 'pdf', 'PDF'], // Formats acceptés
        }),
        carteEtudiant: vine.file({
            size: '2mb', // Taille maximale de 2 Mo
            extnames: ['jpg', 'JPG', 'png', 'jpeg', 'webp', 'pdf', 'PDF'], // Formats acceptés
        }),
        fichePreinscription: vine.file({
            size: '2mb', // Taille maximale de 2 Mo
            extnames: ['jpg', 'JPG', 'png', 'jpeg', 'webp', 'pdf', 'PDF'], // Formats acceptés
        }),
        diplomeBac: vine.file({
            size: '2mb', // Taille maximale de 2 Mo
            extnames: ['jpg', 'JPG', 'png', 'jpeg', 'webp', 'pdf', 'PDF'], // Formats acceptés
        }),
        demandeManuscrite: vine.file({
            size: '2mb', // Taille maximale de 2 Mo
            extnames: ['jpg', 'JPG', 'png', 'jpeg', 'webp', 'pdf', 'PDF'], // Formats acceptés
        }),
    })
)