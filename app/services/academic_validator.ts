// app/services/academic_validator.ts
import academicData from '../data/academic_references.js'
import { HttpContext } from '@adonisjs/core/http'

export default class AcademicValidator {
  async validateStudentData(data: {
    matricule: string
    establishment: string
    studyYear: string
    academicYear: string
  }) {
    const student = academicData.find(
      (record: { matricule: string }) => record.matricule === data.matricule
    )

    if (!student) {
      throw new Error('Matricule non reconnu')
    }

    if (student.establishment !== data.establishment) {
      throw new Error("L'établissement ne correspond pas au matricule")
    }

    const yearData = student.academicYears.find(
      (y: { year: string }) => y.year === data.academicYear
    )

    if (!yearData) {
      throw new Error('Année académique non trouvée pour cet étudiant')
    }

    // if (yearData.studyLevel !== data.studyYear) {
    //   throw new Error("Le niveau d'étude ne correspond pas")
    // }

    return {
      isValid: true,
      studentInfo: {
        fullName: student.fullName,
        grades: yearData.semesters.flatMap((s: { courses: any }) => s.courses)
      }
    }
  }
}