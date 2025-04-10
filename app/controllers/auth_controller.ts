import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import { createUserValidator } from '#validators/auth'

export default class AuthController {
  async login({ auth, request, response }: HttpContext) {
    try {
      const isAthentified = await auth.check()
      // Vérifier si l'utilisateur est déjà connecté
      if (isAthentified) {
        return response
          .status(500)
          .json({ message: 'Vous êtes déjà connecté !', error: 'USER_ALREADY_CONNECTED' })
      }
      // Récupérer l'email et le mot de passe de la requête de connexion
      const { email, password } = request.only(['email', 'password'])

      // Vérifier si l'utilisateur existe dans la table User
      const userInUserTable = await User.findBy('email', email)
      if (!userInUserTable) {
        if (isAthentified) await auth.use('web').logout()
        return response
          .status(404)
          .json({ message: "Cet email n'existe pas !", error: 'USER_NOT_EXIST' })
      }

      // Vérifier les identifiants de l'utilisateur
      const verified = await User.verifyCredentials(email, password)
      if (!verified) {
        return response.status(401).json({ message: 'Mot de passe incorrect !' })
      }

      // Connecter l'utilisateur et enregistrer sa session
      await auth.use('web').login(userInUserTable)

      // Envoyer une réponse de succès
      return response.status(200).json({
        data: verified,
        message: 'Connexion réussie',
      })
    } catch (error) {
      console.log(error.message)
      return response.status(500).json({
        message: "Une erreur s'est produite lors de la connexion",
        error: error.message,
      })
    }
  }

  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(createUserValidator)
    
    // Vérifier si l'utilisateur existe déjà dans la table User
    const verifyIfUserExist = await User.findBy('email', data.email)

    // S'il existe alors renvoyer une erreur pour dire qu'il existe déjà
    if (verifyIfUserExist) {
      return response
        .status(500)
        .json({ message: 'Cet email existe déjà !', error: 'USER_ALREADY_EXIST' })
    }
    
    const user = await User.create(data)

    // Si l'utilisateur est bien créé renvoyé une réponse positive
    return response.status(201).json({
      data: user,
      message: 'Inscription réussie',
    })
  }

  async logout({ auth, response }: HttpContext) {
    try {
      // Déconnecter l'utilisateur et détruire sa session
      await auth.use('web').logout()

      return response.status(201).json({
        message: 'Déconnexion réussie',
      })
    } catch (error) {
      throw error
    }
  }

  // Récupérer les infos de l'utilisateur connecté
  async me({ auth, response }: HttpContext) {
    console.log('Auth User:', auth.user) // Vérifie si l'utilisateur est bien récupéré
  
    const user = auth.user
    if (!user) return response.unauthorized()
  
    const userInfo = await User.query()
      .where('id', user.id) // `Number(user.id)` est inutile si `id` est déjà un nombre
      .first()
  
    console.log('User Info:', userInfo) // Vérifie si l'utilisateur est bien trouvé en base
  
    if (userInfo) {
      return response.status(200).json({
        message: 'User found successfully',
        data: userInfo,
      })
    }
  
    return response.notFound({ message: 'User not found' })
  }
  
}