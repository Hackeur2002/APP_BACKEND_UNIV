// app/Services/DocumentGenerator.ts
import PDFDocument from 'pdfkit'
import fs from 'node:fs'
import app from '@adonisjs/core/services/app'
import type DocumentRequest from '#models/document_request'
import Validation from '#models/validation'
import academicData from '../data/academic_references.js'

export default class DocumentGenerator {
  private doc!: typeof PDFDocument
  private readonly margin = 50
  private readonly lineHeight = 24
  private readonly smallLineHeight = 18

  /**
   * Génère le document final
   */
  async generate(
    request: DocumentRequest,
    outputPath: string
  ): Promise<void> {
    this.doc = new PDFDocument({
      size: 'A4',
      margin: this.margin,
      bufferPages: true
    })

    // Gestion des pages multiples
    this.doc.on('pageAdded', () => {
      this.addPageHeader(request)
    })

    const stream = fs.createWriteStream(outputPath)
    this.doc.pipe(stream)

    // En-tête universitaire
    await this.addHeader(request)

    // Contenu principal
    this.addStudentInfo(request)
    this.addDocumentContent(request)

    // Pied de page avec signatures
    await this.addFooter(request)

    this.doc.end()

    return new Promise((resolve) => {
      stream.on('finish', resolve)
    })
  }

  /**
   * En-tête avec logo et informations universitaires
   */
  private async addHeader(request: DocumentRequest) {
    // const logoPath = app.publicPath('university_logo.png')
    // if (fs.existsSync(logoPath)) {
    //   this.doc.image(logoPath, this.margin, this.margin, {
    //     width: 80,
    //     align: 'center'
    //   })
    // }

    this.doc
      // .font('Helvetica-Bold')
      .fontSize(18)
      .text(this.getDocumentTitle(request.documentType), {
        align: 'center',
        underline: true
      })
      .moveDown(1)
  }

  /**
   * En-tête de page supplémentaire
   */
  private addPageHeader(request: DocumentRequest) {
    this.doc
      // .font('Helvetica-Bold')
      .fontSize(10)
      .text(`${request.studentName} - ${request.matricule} - Page ${this.doc.bufferedPageRange().count}`, {
        align: 'right'
      })
      .moveDown(0.5)
  }

  /**
   * Informations étudiant
   */
  private addStudentInfo(request: DocumentRequest) {
    this.doc
      // .font('Helvetica-Bold')
      .fontSize(12)
      .text('INFORMATIONS ÉTUDIANT', { underline: true })
      .moveDown(0.5)

    this.doc
      // .font('Helvetica')
      .text(`Nom complet: ${request.studentName}`)
      .text(`Matricule: ${request.matricule}`)
      .text(`Établissement: ${request.establishment}`)
      // .text(`Filière: ${request.program || 'Non spécifié'}`)
      .text(`Année académique: ${request.academicYear}`)
      .moveDown(1)
  }

  /**
   * Contenu spécifique au type de document
   */
  private addDocumentContent(request: DocumentRequest) {
    switch (request.documentType) {
      case 'diploma':
        this.addDiplomaContent(request)
        break
      case 'bulletin':
        this.addTranscriptContent(request)
        break
      case 'certificate':
        this.addCertificateContent(request)
        break
      default:
        this.doc.text('Document officiel délivré par l\'université')
    }
  }

  /**
   * Contenu pour un diplôme
   */
  private addDiplomaContent(request: DocumentRequest) {
    this.doc
      // .font('Helvetica-Bold')
      .text('DIPLÔME DÉLIVRÉ', { underline: true })
      .moveDown(0.5)

    this.doc
      // .font('Helvetica')
      .text('L\'université confère à:')
      .moveDown(0.5)
      .text(request.studentName, { indent: 50 })
      .moveDown(1)
      .text('Le grade de:')
      .moveDown(0.5)
      .text('Licence/Master en [Spécialité]', { indent: 50 })
  }

  /**
   * Contenu pour un certificat de scolarité
   */
  private addCertificateContent(request: DocumentRequest) {
    const studentRecord = academicData.find(record => record.matricule === request.matricule)

    this.doc
      // .font('Helvetica-Bold')
      .fontSize(14)
      .text('ATTESTATION DE SCOLARITÉ', { align: 'center', underline: true })
      .moveDown(1.5)

    this.doc
      // .font('Helvetica')
      .text('Je soussigné(e), responsable de l\'établissement, certifie que :')
      .moveDown(1.5)

    this.doc
      // .font('Helvetica-Bold')
      .text(`${request.studentName}`, { align: 'center' })
      .moveDown(0.5)

    this.doc
      // .font('Helvetica')
      // .text(`Né(e) le : ${request.birthDate || '--/--/----'}`)
      .text(`De matricule : ${request.matricule}`)
      .text(`Est régulièrement inscrit(e) dans notre établissement pour l'année académique ${request.academicYear}.`)
      .moveDown(1)

    if (studentRecord) {
      this.doc
        // .text(`Filière : ${request.program || studentRecord.program || 'Non spécifié'}`)
        .text(`Niveau : ${studentRecord?.level || 'Non spécifié'}`)
        .moveDown(1)
    }

    this.doc
      .text('La présente attestation est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit.')
      .moveDown(2)

    this.doc
      .text('Fait à ................................., le .................................')
      .moveDown(2)

    // Espace pour signature et cachet
    this.doc
      .text('Le Responsable de l\'établissement', { align: 'right' })
      .moveDown(3)
  }

  /**
   * Contenu pour un relevé de notes par semestre
   */
  private addTranscriptContent(request: DocumentRequest) {
    const studentRecord = academicData.find(record => record.matricule === request.matricule)

    if (!studentRecord) {
      this.doc.text('Aucune donnée académique trouvée pour cet étudiant')
      return
    }

    // Affichage par semestre
    this.doc
      // .font('Helvetica-Bold')
      .fontSize(14)
      .text('RELEVÉ DE NOTES OFFICIEL', { align: 'center', underline: true })
      .moveDown(1)

    // Parcourir chaque semestre
    studentRecord.academicYears.forEach((year: any) => {
      year.semesters.forEach((semester: any) => {
        this.addSemesterSection(semester.number, semester)
      })
    })

    // Moyenne générale
    this.addOverallAverage(studentRecord.overallAverage)
  }

  /**
   * Section pour un semestre spécifique
   */
  private addSemesterSection(semester: number, semesterData: any) {
    this.doc
      // .font('Helvetica-Bold')
      .fontSize(12)
      .text(`SEMESTRE ${semester}`, { underline: true })
      .moveDown(0.5)

    // En-têtes du tableau
    const headers = ['Matière', 'Code', 'Crédits', 'Note']
    const rows = semesterData.courses.map((course: any) => [
      course.name,
      course.code,
      course.credits.toString(),
      course.grade.toFixed(2)
    ])

    // Dessiner le tableau
    this.drawTable(headers, rows)

    // Moyenne du semestre
    this.doc.moveDown(0.5)
    this.doc
      // .font('Helvetica-Bold')
      .text(`Moyenne semestrielle: ${semesterData.average.toFixed(2)}`, {
        align: 'right'
      })
      .moveDown(1.5)
  }

  /**
   * Affichage de la moyenne générale
   */
  private addOverallAverage(average: number) {
    this.doc
      // .font('Helvetica-Bold')
      .fontSize(14)
      .text(`MOYENNE GÉNÉRALE: ${average.toFixed(2)}`, {
        align: 'center',
        underline: true
      })
      .moveDown(1)

    // Mention selon la moyenne
    let mention = ''
    if (average >= 16) mention = 'EXCELLENT'
    else if (average >= 14) mention = 'TRÈS BIEN'
    else if (average >= 12) mention = 'BIEN'
    else if (average >= 10) mention = 'ASSEZ BIEN'

    if (mention) {
      this.doc
        // .font('Helvetica-Bold')
        .fontSize(12)
        .text(`MENTION: ${mention}`, { align: 'center' })
        .moveDown(1)
    }

    // Légende
    this.doc
      .fontSize(10)
      .text('* Ce relevé de notes est un document officiel délivré par l\'université', {
        align: 'center'
      })
  }

  /**
   * Pied de page avec signatures
   */
  private async addFooter(request: DocumentRequest) {
    const signatures = await Validation.query()
      .where('request_id', request.id)
      .whereNotNull('signature_path')
      .preload('staff')

    if (signatures.length > 0) {
      this.doc.moveDown(2)
      this.doc.text('Signatures:', { underline: true })

      const signatureY = this.doc.y
      const signatureWidth = 150
      const spacing = (this.doc.page.width - this.margin * 2 - signatureWidth * signatures.length) / (signatures.length + 1)

      signatures.forEach((validation: any, i: number) => {
        const x = this.margin + spacing + (signatureWidth + spacing) * i

        // Signature
        // const signaturePath = app.tmpPath(validation.signaturePath)
        // if (fs.existsSync(signaturePath)) {
        //   this.doc.image(signaturePath, x, signatureY, {
        //     width: 100,
        //     height: 50
        //   })
        // }

        // Info validateur
        this.doc
          .fontSize(10)
          .text(validation.staff.fullName, x, signatureY + 60, {
            width: signatureWidth,
            align: 'center'
          })
          .text(`(${validation.step})`, x, signatureY + 75, {
            width: signatureWidth,
            align: 'center'
          })
      })
    }

    // Cachet universitaire
    // const sealPath = app.publicPath('university_seal.png')
    // if (fs.existsSync(sealPath)) {
    //   this.doc.image(sealPath, this.doc.page.width - 120, this.doc.page.height - 120, {
    //     width: 80
    //   })
    // }
  }

  /**
   * Helper pour dessiner un tableau
   */
  private drawTable(headers: string[], rows: string[][]) {
    const columnWidth = (this.doc.page.width - this.margin * 2) / headers.length
    const startY = this.doc.y

    // En-têtes avec fond gris
    headers.forEach((header, i) => {
      this.doc
        .rect(this.margin + columnWidth * i, startY, columnWidth, this.lineHeight)
        .fillAndStroke('#f0f0f0', '#000')

      this.doc
        // .font('Helvetica-Bold')
        .fillColor('#000')
        .text(header, this.margin + columnWidth * i + 5, startY + 5, {
          width: columnWidth - 10,
          align: 'left'
        })
    })

    // Lignes du tableau
    rows.forEach((row, rowIndex) => {
      const y = startY + this.lineHeight * (rowIndex + 1)
      const bgColor = rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9'

      row.forEach((cell, colIndex) => {
        this.doc
          .rect(this.margin + columnWidth * colIndex, y, columnWidth, this.lineHeight)
          .fillAndStroke(bgColor, '#000')

        this.doc
          // .font('Helvetica')
          .fillColor('#000')
          .text(cell, this.margin + columnWidth * colIndex + 5, y + 5, {
            width: columnWidth - 10,
            align: colIndex === 3 ? 'right' : 'left'
          })
      })
    })

    this.doc.y = startY + this.lineHeight * (rows.length + 1) + 10
  }

  /**
   * Titres selon le type de document
   */
  private getDocumentTitle(type: string): string {
    const titles: Record<string, string> = {
      diploma: 'COPIE CONFORME DE DIPLÔME',
      transcript: 'RELEVÉ DE NOTES OFFICIEL',
      certificate: 'ATTESTATION DE SCOLARITÉ'
    }
    return titles[type] || 'DOCUMENT UNIVERSITAIRE'
  }
}