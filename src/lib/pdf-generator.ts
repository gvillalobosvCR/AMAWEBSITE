import { jsPDF } from 'jspdf'
import { formatDateTimeUTC } from './date-utils'

interface PDFData {
  waiverNumber: string
  fullName: string
  idPassport: string
  age: number
  language: 'es' | 'en'
  exactContent: string
  createdAt: string
  version: string
  signatureUrl: string
  email?: string
  // Guardian details if minor
  isMinor: boolean
  guardianName?: string
  guardianIdPassport?: string
  relationship?: string
  guardianSignatureUrl?: string
}

async function getBase64FromUrl(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function generateWaiverPDF(data: PDFData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - 2 * margin
  let currentY = 20

  // 1. HEADER
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(0, 95, 78) // Arenal Corporate Green #005F4E
  doc.text('Arenal Mundo Aventura', margin, currentY)
  
  currentY += 6
  doc.setFontSize(10)
  doc.setTextColor(16, 185, 129) // Emerald-500 #10B981
  doc.text('ACSUFA PARQUE ECOLÓGICO S.A. - COSTA RICA', margin, currentY)

  currentY += 8
  doc.setDrawColor(0, 95, 78)
  doc.setLineWidth(0.5)
  doc.line(margin, currentY, pageWidth - margin, currentY)

  // Title Box
  currentY += 10
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 41, 59) // Slate-800
  const title = 'Formulario de Descargo de Responsabilidad / Liability Waiver'
  doc.text(title, margin, currentY)

  // 2. METADATA SECTION
  currentY += 8
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(9.5) // slightly smaller font for long labels
  doc.setTextColor(71, 85, 105) // Slate-600

  const dateStr = formatDateTimeUTC(data.createdAt)

  // Print left column details
  doc.setFont('Helvetica', 'bold')
  doc.text('Código / Waiver Code:', margin, currentY)
  doc.setFont('Helvetica', 'normal')
  doc.text(data.waiverNumber, margin + 45, currentY)

  doc.setFont('Helvetica', 'bold')
  doc.text('Fecha / Date & Time:', margin + 100, currentY)
  doc.setFont('Helvetica', 'normal')
  doc.text(dateStr, margin + 135, currentY)

  currentY += 6
  doc.setFont('Helvetica', 'bold')
  doc.text('Nombre / Full Name:', margin, currentY)
  doc.setFont('Helvetica', 'normal')
  doc.text(data.fullName, margin + 45, currentY)

  doc.setFont('Helvetica', 'bold')
  doc.text('Versión / Version:', margin + 100, currentY)
  doc.setFont('Helvetica', 'normal')
  doc.text(data.version, margin + 135, currentY)

  currentY += 6
  doc.setFont('Helvetica', 'bold')
  doc.text('Identificación / ID:', margin, currentY)
  doc.setFont('Helvetica', 'normal')
  doc.text(data.idPassport, margin + 45, currentY)

  doc.setFont('Helvetica', 'bold')
  doc.text('Edad / Age:', margin + 100, currentY)
  doc.setFont('Helvetica', 'normal')
  doc.text(`${data.age} años / years old`, margin + 135, currentY)

  currentY += 6
  doc.setFont('Helvetica', 'bold')
  doc.text('Correo / Email:', margin, currentY)
  doc.setFont('Helvetica', 'normal')
  doc.text(data.email || 'N/A', margin + 45, currentY)

  // 3. CONDITIONAL GUARDIAN METADATA
  if (data.isMinor) {
    currentY += 8
    doc.setDrawColor(241, 245, 249) // Slate-100
    doc.rect(margin - 2, currentY - 4, contentWidth + 4, 20, 'F')
    doc.setFillColor(248, 250, 252) // Slate-50 background fill
    doc.rect(margin - 2, currentY - 4, contentWidth + 4, 20)

    doc.setFont('Helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('TUTOR RESPONSABLE / LEGAL GUARDIAN (MENOR DE EDAD / MINOR)', margin, currentY)
    
    currentY += 6
    doc.setFontSize(8.5)
    doc.setFont('Helvetica', 'bold')
    doc.text('Nombre / Guardian Name:', margin, currentY)
    doc.setFont('Helvetica', 'normal')
    doc.text(data.guardianName || '', margin + 45, currentY)

    doc.setFont('Helvetica', 'bold')
    doc.text('ID / Passport:', margin + 100, currentY)
    doc.setFont('Helvetica', 'normal')
    doc.text(data.guardianIdPassport || '', margin + 125, currentY)

    currentY += 5
    doc.setFont('Helvetica', 'bold')
    doc.text('Relación / Relationship:', margin, currentY)
    doc.setFont('Helvetica', 'normal')
    doc.text(data.relationship || '', margin + 45, currentY)
    
    currentY += 5
    doc.setFontSize(10)
  }

  // 4. WAIVER TEXT SECTION
  currentY += 10
  doc.setDrawColor(226, 232, 240) // Slate-200
  doc.setLineWidth(0.2)
  doc.line(margin, currentY, pageWidth - margin, currentY)

  currentY += 8
  doc.setFont('Helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Términos Aceptados / Accepted Terms:', margin, currentY)

  currentY += 6
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(71, 85, 105)

  // Split and draw text paragraph by paragraph to handle multi-page layouts
  const paragraphs = data.exactContent.split('\n')
  for (const para of paragraphs) {
    if (!para.trim()) continue
    const splitLines = doc.splitTextToSize(para, contentWidth)
    
    for (const line of splitLines) {
      if (currentY > pageHeight - 35) {
        doc.addPage()
        currentY = 20
      }
      doc.text(line, margin, currentY)
      currentY += 5
    }
    currentY += 3 // Paragraph spacing
  }

  // 5. SIGNATURES SECTION
  currentY += 10
  if (currentY > pageHeight - 65) {
    doc.addPage()
    currentY = 20
  }

  doc.setDrawColor(226, 232, 240)
  doc.line(margin, currentY, pageWidth - margin, currentY)

  currentY += 8
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text('Firmas Autorizadas / Authorized Signatures:', margin, currentY)

  currentY += 5
  try {
    // Render Client Signature
    const mainSigBase64 = await getBase64FromUrl(data.signatureUrl)
    doc.addImage(mainSigBase64, 'PNG', margin, currentY, 50, 20)
    
    doc.setFontSize(8)
    doc.setFont('Helvetica', 'normal')
    doc.setTextColor(148, 163, 184) // Slate-400
    doc.text('__________________________________', margin, currentY + 23)
    doc.text('Firma del Participante / Participant Signature', margin, currentY + 27)

    // Render Guardian Signature if minor
    if (data.isMinor && data.guardianSignatureUrl) {
      const guardSigBase64 = await getBase64FromUrl(data.guardianSignatureUrl)
      doc.addImage(guardSigBase64, 'PNG', margin + 90, currentY, 50, 20)

      doc.text('__________________________________', margin + 90, currentY + 23)
      doc.text('Firma del Tutor / Legal Guardian Signature', margin + 90, currentY + 27)
    }
  } catch (imgError) {
    console.error('Failed to load signature images for PDF generation:', imgError)
    doc.setFontSize(9)
    doc.setTextColor(239, 68, 68) // Red-500
    doc.text('[Error cargando firmas gráficas para el documento]', margin, currentY + 10)
  }

  // 6. SAVE AND DOWNLOAD
  doc.save(`Waiver_${data.waiverNumber}.pdf`)
}
