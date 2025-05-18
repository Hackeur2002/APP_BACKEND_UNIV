import PDFDocument from 'pdfkit'
import fs from 'node:fs'
import app from '@adonisjs/core/services/app'
import type DocumentRequest from '#models/document_request'
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
    outputPath: string,
    signaturePath: string | null = null
  ): Promise<void> {
    this.doc = new PDFDocument({
      size: 'A4',
      margin: this.margin,
      bufferPages: true,
      info: {
        Title: this.getDocumentTitle(request.documentType),
        Author: request.establishment,
        Subject: `Document for ${request.studentName}`,
        CreationDate: new Date(),
      }
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

    // Pied de page avec signature
    await this.addFooter(request, signaturePath)

    this.doc.end()

    return new Promise((resolve, reject) => {
      stream.on('finish', resolve)
      stream.on('error', reject)
    })
  }

  /**
   * En-tête avec logo et informations universitaires
   */
  private async addHeader(request: DocumentRequest) {
    const logoPath = app.publicPath('university_logo.jpg')
    if (fs.existsSync(logoPath)) {
      this.doc.image(logoPath, this.margin, this.margin, {
        width: 80,
        align: 'center',
      })
    }

    this.doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(this.getDocumentTitle(request.documentType), this.margin + 100, this.margin, {
        align: 'center',
        underline: true,
      })
      .moveDown(1)
  }

  /**
   * En-tête de page supplémentaire
   */
  private addPageHeader(request: DocumentRequest) {
    this.doc
      .font('Helvetica')
      .fontSize(10)
      .text(`${request.studentName} - ${request.matricule} - Page ${this.doc.bufferedPageRange().count}`, {
        align: 'right',
      })
      .moveDown(0.5)
  }

  /**
   * Informations étudiant
   */
  private addStudentInfo(request: DocumentRequest) {
    const studentRecord = academicData.find(record => record.matricule === request.matricule)

    this.doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('INFORMATIONS ÉTUDIANT', { underline: true })
      .moveDown(0.5)

    this.doc
      .font('Helvetica')
      .fontSize(11)
      .text(`Nom complet: ${request.studentName}`)
      .text(`Matricule: ${request.matricule}`)
      .text(`Établissement: ${request.establishment}`)
      .text(`Filière: ${studentRecord?.program || 'Non spécifié'}`)
      .text(`Niveau: ${studentRecord?.level || 'Non spécifié'}`)
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
        this.doc
          .font('Helvetica')
          .fontSize(11)
          .text('Document officiel délivré par l\'université')
    }
  }

  /**
   * Contenu pour un diplôme
   */
  private addDiplomaContent(request: DocumentRequest) {
    const studentRecord = academicData.find(record => record.matricule === request.matricule)

    this.doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('DIPLÔME DÉLIVRÉ', { align: 'center', underline: true })
      .moveDown(1)

    this.doc
      .font('Helvetica')
      .fontSize(12)
      .text('L\'université confère à:')
      .moveDown(0.5)
      .text(request.studentName, { align: 'center' })
      .moveDown(1)
      .text('Le grade de:')
      .moveDown(0.5)
      .text(`${studentRecord?.level || 'Licence'} en ${studentRecord?.program || '[Spécialité]'}`, { align: 'center' })
      .moveDown(1)
      .text(`Mention: ${this.getMention(studentRecord?.overallAverage || 0)}`, { align: 'center' })
  }

  /**
   * Contenu pour un certificat de scolarité
   */
  private addCertificateContent(request: DocumentRequest) {
    const studentRecord = academicData.find(record => record.matricule === request.matricule)

    this.doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('ATTESTATION DE SCOLARITÉ', { align: 'center', underline: true })
      .moveDown(1.5)

    this.doc
      .font('Helvetica')
      .fontSize(11)
      .text('Je soussigné(e), responsable de l\'établissement, certifie que :')
      .moveDown(1.5)

    this.doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(request.studentName, { align: 'center' })
      .moveDown(0.5)

    this.doc
      .font('Helvetica')
      .fontSize(11)
      .text(`Matricule: ${request.matricule}`)
      .text(`Est régulièrement inscrit(e) dans notre établissement pour l'année académique ${request.academicYear}.`)
      .moveDown(1)

    if (studentRecord) {
      this.doc
        .text(`Filière: ${studentRecord.program || 'Non spécifié'}`)
        .text(`Niveau: ${studentRecord.level || 'Non spécifié'}`)
        .moveDown(1)
    }

    this.doc
      .text('La présente attestation est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit.')
      .moveDown(2)

    this.doc
      .font('Helvetica')
      .fontSize(11)
      .text(`Fait à ${request.establishment}, le ${new Date().toLocaleDateString('fr-FR')}`)
      .moveDown(2)
  }

  /**
   * Contenu pour un relevé de notes par semestre
   */
  private addTranscriptContent(request: DocumentRequest) {
    const studentRecord = academicData.find(record => record.matricule === request.matricule)

    if (!studentRecord) {
      this.doc
        .font('Helvetica')
        .fontSize(11)
        .text('Aucune donnée académique trouvée pour cet étudiant')
      return
    }

    this.doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('RELEVÉ DE NOTES OFFICIEL', { align: 'center', underline: true })
      .moveDown(1)

    // Parcourir chaque année académique
    studentRecord.academicYears.forEach((year) => {
      this.doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`Année Académique: ${year.year}`, { underline: true })
        .moveDown(0.5)

      year.semesters.forEach((semester) => {
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
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(`Semestre ${semester}`, { underline: true })
      .moveDown(0.5)

    // En-têtes du tableau
    const headers = ['Matière', 'Code', 'Crédits', 'Note', 'Enseignant']
    const rows = semesterData.courses.map((course: any) => [
      course.name,
      course.code,
      course.credits.toString(),
      course.grade.toFixed(2),
      course.teacher || 'Non spécifié',
    ])

    // Dessiner le tableau
    this.drawTable(headers, rows)

    // Moyenne du semestre et crédits
    this.doc
      .moveDown(0.5)
      .font('Helvetica')
      .fontSize(11)
      .text(`Moyenne semestrielle: ${semesterData.average.toFixed(2)}`, { align: 'right' })
      .text(`Crédits obtenus: ${semesterData.creditsEarned}`, { align: 'right' })
      .moveDown(1)
  }

  /**
   * Affichage de la moyenne générale
   */
  private addOverallAverage(average: number) {
    this.doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`MOYENNE GÉNÉRALE: ${average.toFixed(2)}`, {
        align: 'center',
        underline: true,
      })
      .moveDown(1)

    // Mention selon la moyenne
    const mention = this.getMention(average)
    if (mention) {
      this.doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`MENTION: ${mention}`, { align: 'center' })
        .moveDown(1)
    }

    this.doc
      .font('Helvetica')
      .fontSize(10)
      .text('* Ce relevé de notes est un document officiel délivré par l\'université', {
        align: 'center',
      })
  }

  /**
   * Pied de page avec signature
   */
  private async addFooter(request: DocumentRequest, signaturePath: string | null) {
    this.doc.moveDown(2)

    if (signaturePath) {
      const fullPath = app.tmpPath(signaturePath)
      if (fs.existsSync(fullPath)) {
        this.doc.image(fullPath, this.margin, this.doc.y, {
          width: 100,
          height: 50,
        })
        this.doc
          .font('Helvetica')
          .fontSize(10)
          .text('Signature du Responsable', this.margin, this.doc.y + 55, {
            width: 100,
            align: 'center',
          })
      }
    }

    const sealPath = app.publicPath('university_logo.jpg')
    if (fs.existsSync(sealPath)) {
      this.doc.image(sealPath, this.doc.page.width - 120, this.doc.page.height - 120, {
        width: 80,
      })
    }

    this.doc
      .font('Helvetica')
      .fontSize(10)
      .text(`Document généré pour ${request.studentName} (${request.trackingId})`, {
        align: 'center',
      })
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
        .font('Helvetica-Bold')
        .fillColor('#000')
        .fontSize(10)
        .text(header, this.margin + columnWidth * i + 5, startY + 7, {
          width: columnWidth - 10,
          align: 'left',
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
          .font('Helvetica')
          .fillColor('#000')
          .fontSize(10)
          .text(cell, this.margin + columnWidth * colIndex + 5, y + 7, {
            width: columnWidth - 10,
            align: colIndex === 3 ? 'right' : 'left',
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
      bulletin: 'RELEVÉ DE NOTES OFFICIEL',
      certificate: 'ATTESTATION DE SCOLARITÉ',
    }
    return titles[type] || 'DOCUMENT UNIVERSITAIRE'
  }

  /**
   * Détermine la mention selon la moyenne
   */
  private getMention(average: number): string {
    if (average >= 16) return 'EXCELLENT'
    if (average >= 14) return 'TRÈS BIEN'
    if (average >= 12) return 'BIEN'
    if (average >= 10) return 'ASSEZ BIEN'
    return ''
  }
}