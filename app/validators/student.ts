import vine from '@vinejs/vine'

export const createStudentValidator = vine.compile(
    vine.object({
        matricule: vine.string().minLength(3).maxLength(255),
        etablissement: vine.string().minLength(3).maxLength(255),
        anneeEtude: vine.string().minLength(2),
        anneeAcademique: vine.string().minLength(2),
    })
)