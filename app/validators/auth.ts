import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
    vine.object({
        email: vine.string().email(),
        password: vine.string().minLength(8),
        fullName: vine.string().minLength(2),
        role: vine.enum(['admin', 'validator1', 'validator2', 'validator3']),
    })
)