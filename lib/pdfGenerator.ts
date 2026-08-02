import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportData {
  title: string;
  referenceNo: string;
  date: string;
  category?: string;
}

export function generateOfficialReport(data: ReportData) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SAHAAYAK MUNICIPAL CORPORATION", 105, 20, { align: "center" });
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("OFFICIAL GAZETTE REPORT", 105, 28, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // Section 1: Report Identification
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SECTION 1 — REPORT IDENTIFICATION", 14, 45);
  
  autoTable(doc, {
    startY: 50,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    body: [
      ['Report Reference No.', data.referenceNo || 'PWD/GJ/RJK/2025-26/0042'],
      ['Date of Inspection', data.date || new Date().toLocaleDateString()],
      ['Inspection Type', 'Routine Field Inspection'],
      ['Priority', 'High'],
      ['Division', 'Rajkot Division – Zone B']
    ]
  });

  // Section 2: Technician / Officer Details
  let finalY = (doc as any).lastAutoTable?.finalY || 100;
  doc.text("SECTION 2 — TECHNICIAN / OFFICER DETAILS", 14, finalY + 15);
  
  autoTable(doc, {
    startY: finalY + 20,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    body: [
      ['Name of Technician', 'Sh. Ramesh Kumar Patel'],
      ['Employee ID', 'PWD-GJ-T-4821'],
      ['Designation', 'Junior Engineer (Civil)'],
      ['Official Email', 'r.patel@pwd.guj.gov.in'],
      ['Reporting Officer', 'Sh. D. V. Trivedi, Exe. Eng.']
    ]
  });

  // Section 3: Site Details
  finalY = (doc as any).lastAutoTable?.finalY || 150;
  doc.text("SECTION 3 — SITE / WORK DETAILS", 14, finalY + 15);
  
  autoTable(doc, {
    startY: finalY + 20,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    body: [
      ['Name of Work', data.title],
      ['Location / Site', 'SH-27, Rajkot District, Gujarat – 360 023'],
      ['Type of Work', data.category || 'Road Maintenance & Inspection'],
      ['Contractor / Agency', 'M/s Shreeji Construction Co.']
    ]
  });

  // Section 4: Summary & Recommendations
  finalY = (doc as any).lastAutoTable?.finalY || 200;
  doc.text("SECTION 4 — SUMMARY & RECOMMENDATIONS", 14, finalY + 15);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summaryText = `The inspection reveals significant infrastructure distress warranting urgent remedial action. Resources must be mobilized within 48 hours to prevent cascading public impact. Immediate patching and maintenance are required.`;
  const splitTitle = doc.splitTextToSize(summaryText, 180);
  doc.text(splitTitle, 14, finalY + 22);

  // Section 5: Signatures
  finalY = finalY + 22 + (splitTitle.length * 5) + 20;
  if (finalY > 260) {
    doc.addPage();
    finalY = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SECTION 5 — DECLARATIONS & SIGNATURES", 14, finalY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("I certify that the details reported herein are true and accurate.", 14, finalY + 8);
  
  doc.text("Prepared By:", 14, finalY + 25);
  doc.setFont("helvetica", "bold");
  doc.text("Sh. Ramesh Kumar Patel", 14, finalY + 35);
  doc.setFont("helvetica", "normal");
  doc.text("Junior Engineer (Civil)", 14, finalY + 40);
  
  doc.text("Verified & Approved By:", 120, finalY + 25);
  doc.setFont("helvetica", "bold");
  doc.text("Sh. D. V. Trivedi", 120, finalY + 35);
  doc.setFont("helvetica", "normal");
  doc.text("Executive Engineer (Civil)", 120, finalY + 40);

  // Download
  doc.save(`${data.title.replace(/\s+/g, '_')}_Report.pdf`);
}
