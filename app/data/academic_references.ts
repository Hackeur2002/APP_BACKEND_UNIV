// app/Data/academic_references.ts

interface Course {
    name: string
    code: string
    credits: number
    grade: number
    teacher?: string
    semester?: number
  }
  
  interface AcademicYear {
    year: string // Format: "2023-2024"
    semesters: {
      number: number // 1 ou 2
      courses: Course[]
      average: number
      creditsEarned: number
      rank?: number
    }[]
    overallAverage: number
    creditsCompleted: number
  }
  
  interface StudentAcademicRecord {
    matricule: string
    fullName: string
    program: string
    level: string
    establishment: string
    academicYears: AcademicYear[]
    totalCredits: number
    graduationEligible: boolean
    overallAverage: number
  }
  
    const academicData: StudentAcademicRecord[] = [
    {
      matricule: "MAT123",
      fullName: "Jean Dupont",
      program: "Informatique",
      level: "Licence 3",
      establishment: "Faculté des Sciences",
      totalCredits: 180,
      graduationEligible: true,
      overallAverage: 14.5,
      academicYears: [
        {
          year: "2022-2023",
          overallAverage: 14.2,
          creditsCompleted: 60,
          semesters: [
            {
              number: 1,
              average: 15.33,
              creditsEarned: 30,
              rank: 5,
              courses: [
                {
                  name: "Mathématiques Avancées",
                  code: "MATH101",
                  credits: 4,
                  grade: 15.5,
                  teacher: "Prof. Martin",
                  semester: 1
                },
                {
                  name: "Physique Quantique",
                  code: "PHYS201",
                  credits: 3,
                  grade: 14.0,
                  teacher: "Prof. Durand",
                  semester: 1
                }
              ]
            },
            {
              number: 2,
              average: 13.67,
              creditsEarned: 30,
              rank: 8,
              courses: [
                {
                  name: "Base de Données",
                  code: "BD501",
                  credits: 4,
                  grade: 13.5,
                  teacher: "Prof. Leroy",
                  semester: 2
                }
              ]
            }
          ]
        },
        {
          year: "2023-2024",
          overallAverage: 14.8,
          creditsCompleted: 60,
          semesters: [
            {
              number: 1,
              average: 15.0,
              creditsEarned: 30,
              courses: [
                {
                  name: "Algorithmique",
                  code: "ALGO301",
                  credits: 5,
                  grade: 16.5,
                  teacher: "Prof. Dubois",
                  semester: 1
                }
              ]
            }
          ]
        }
      ]
    },
    {
      matricule: "MAT456",
      fullName: "Marie Lambert",
      program: "Mathématiques",
      level: "Master 1",
      establishment: "Faculté des Sciences",
      totalCredits: 240,
      graduationEligible: true,
      overallAverage: 16.2,
      academicYears: [
        {
          year: "2023-2024",
          overallAverage: 16.2,
          creditsCompleted: 60,
          semesters: [
            {
              number: 1,
              average: 16.5,
              creditsEarned: 30,
              rank: 2,
              courses: [
                {
                  name: "Algèbre Linéaire",
                  code: "MATH202",
                  credits: 6,
                  grade: 17.0,
                  teacher: "Prof. Girard",
                  semester: 1
                },
                {
                  name: "Analyse Complexe",
                  code: "MATH205",
                  credits: 5,
                  grade: 16.0,
                  teacher: "Prof. Lefèvre",
                  semester: 1
                }
              ]
            },
            {
              number: 2,
              average: 15.9,
              creditsEarned: 30,
              rank: 3,
              courses: [
                {
                  name: "Probabilités Avancées",
                  code: "MATH210",
                  credits: 6,
                  grade: 15.5,
                  teacher: "Prof. Roux",
                  semester: 2
                },
                {
                  name: "Topologie",
                  code: "MATH215",
                  credits: 4,
                  grade: 16.3,
                  teacher: "Prof. Blanc",
                  semester: 2
                }
              ]
            }
          ]
        }
      ]
    },
    {
      matricule: "MAT789",
      fullName: "Ahmed Khan",
      program: "Génie Civil",
      level: "Licence 2",
      establishment: "École d'Ingénieurs",
      totalCredits: 120,
      graduationEligible: false,
      overallAverage: 12.8,
      academicYears: [
        {
          year: "2023-2024",
          overallAverage: 12.8,
          creditsCompleted: 60,
          semesters: [
            {
              number: 1,
              average: 12.5,
              creditsEarned: 30,
              rank: 15,
              courses: [
                {
                  name: "Mécanique des Structures",
                  code: "GC101",
                  credits: 5,
                  grade: 13.0,
                  teacher: "Prof. Martinez",
                  semester: 1
                },
                {
                  name: "Géotechnique",
                  code: "GC102",
                  credits: 4,
                  grade: 12.0,
                  teacher: "Prof. Nguyen",
                  semester: 1
                }
              ]
            }
          ]
        }
      ]
    },
    {
      matricule: "MAT321",
      fullName: "Sophie Dubois",
      program: "Physique",
      level: "Licence 3",
      establishment: "Faculté des Sciences",
      totalCredits: 180,
      graduationEligible: true,
      overallAverage: 15.9,
      academicYears: [
        {
          year: "2022-2023",
          overallAverage: 15.7,
          creditsCompleted: 60,
          semesters: [
            {
              number: 1,
              average: 15.5,
              creditsEarned: 30,
              rank: 4,
              courses: [
                {
                  name: "Électromagnétisme",
                  code: "PHYS301",
                  credits: 5,
                  grade: 16.0,
                  teacher: "Prof. Einstein",
                  semester: 1
                }
              ]
            }
          ]
        },
        {
          year: "2023-2024",
          overallAverage: 16.1,
          creditsCompleted: 60,
          semesters: [
            {
              number: 1,
              average: 16.3,
              creditsEarned: 30,
              rank: 2,
              courses: [
                {
                  name: "Mécanique Quantique",
                  code: "PHYS305",
                  credits: 6,
                  grade: 16.5,
                  teacher: "Prof. Curie",
                  semester: 1
                }
              ]
            }
          ]
        }
      ]
    }
  ]

  export default academicData