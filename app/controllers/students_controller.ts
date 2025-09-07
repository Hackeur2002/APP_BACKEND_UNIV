import { HttpContext } from '@adonisjs/core/http'
import { createStudentValidator } from '#validators/student'
import academicData from '../data/academic_references.js'

export default class StudentController {
  public async verify({ request, response }: HttpContext) {
    // Validation schema for the request payload

    try {
      // Validate request data
      const payload = await request.validateUsing(createStudentValidator)

      const { matricule, etablissement, anneeEtude, anneeAcademique } = payload

      // Find student by matricule
      const student = academicData.find((record) => record.matricule === matricule)

      if (!student) {
        return response.status(400).json({
          success: false,
          message: 'Étudiant non trouvé avec ce matricule.',
        })
      }

      // Verify establishment matches
      if (student.establishment !== etablissement) {
        return response.status(400).json({
          success: false,
          message: "L'établissement ne correspond pas aux données de l'étudiant.",
        })
      }

      // Verify study year matches
      if (student.level !== anneeEtude) {
        return response.status(400).json({
          success: false,
          message: "L'année d'étude ne correspond pas aux données de l'étudiant.",
        })
      }

      // Verify academic year exists in student's records
      const academicYearExists = student.academicYears.some((year) => year.year === anneeAcademique)
      if (!academicYearExists) {
        return response.status(400).json({
          success: false,
          message: "L'année académique ne correspond pas aux données de l'étudiant.",
        })
      }

      // Return success with student's fullName
      return response.json({
        success: true,
        student: {
          fullName: student.fullName,
        },
      })
    } catch (error) {
      if (error.messages) {
        // Validation errors
        return response.status(422).json({
          success: false,
          message: error.messages.errors[0].message,
        })
      }
      console.error('Erreur lors de la vérification:', error)
      return response.status(500).json({
        success: false,
        message: 'Aucune correspondance pour les informations saisies.',
      })
    }

  }
}