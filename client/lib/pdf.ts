/**
 * pdf.ts — Hollyhill Dental · Grayscale Professional PDF Generator
 * Produces clean, elegant, black-and-white print-ready A4 documents
 * (prescription script & e-commerce invoice bills) using jsPDF + jspdf-autotable.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ─── Brand constants (Grayscale Print Design) ─── */
const BRAND = {
  name:    "Hollyhill Dental Clinic",
  tagline: "Creating Beautiful & Confident Smiles",
  address: "Unit 6 Hollyhill Shopping Centre, Co. Cork, T23 E030, Ireland",
  phone:   "+353 21 430 3072",
  email:   "info@hollyhilldental.ie",
  web:     "www.hollyhilldental.ie",
  doctor:  "Dr. Roghay Alizadeh, Principal Cosmetic Dentist",
  reg:     "Dental Council of Ireland Registered Practice",
  black:   [30, 30, 30] as [number, number, number],
  darkGray:[80, 80, 80] as [number, number, number],
  gray:    [120, 120, 120] as [number, number, number],
  light:   [245, 245, 245] as [number, number, number],
  border:  [215, 215, 215] as [number, number, number],
};

/* ─── Helpers ─── */
function fmt(n: number | string) {
  return `€${Number(n || 0).toFixed(2)}`;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ══════════════════════════════════════════════
   1. TAX INVOICE (AMAZON / FLIPKART STYLE BILL)
   ══════════════════════════════════════════════ */
export interface InvoicePDFData {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string | null;
  paidAt?: string | null;
  status: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  items: { description: string; quantity: number; price: number | string }[];
  subtotal: number | string;
  vatAmount?: number | string;
  totalAmount: number | string;
}

export function generateInvoicePDF(data: InvoicePDFData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // 1. Clean Letterhead Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.black);
  doc.text(BRAND.name.toUpperCase(), 14, 18);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.darkGray);
  doc.text("Excellence in Dental Surgery", 14, 23);

  // Right Side: Title Block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.black);
  doc.text("TAX INVOICE", W - 14, 18, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.darkGray);
  doc.text("Original for Recipient", W - 14, 23, { align: "right" });

  // Divider Line
  doc.setDrawColor(...BRAND.black);
  doc.setLineWidth(0.4);
  doc.line(14, 27, W - 14, 27);

  // 2. Two-Column Invoicing Directory (Sold By vs Bill To)
  let ay = 35;
  const colW = (W - 28) / 2;

  // Left Column: Sold By
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.black);
  doc.text("SOLD BY (SELLER):", 14, ay);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.darkGray);
  doc.text([
    BRAND.name,
    BRAND.address,
    `Tel: ${BRAND.phone}`,
    `Email: ${BRAND.email}`,
    "VAT Registration: IE 9876543A",
  ], 14, ay + 4.5);

  // Right Column: Bill To
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.black);
  doc.text("BILL TO (RECIPIENT):", 14 + colW, ay);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.darkGray);
  doc.text([
    data.patientName,
    data.patientEmail || "—",
    `Phone: ${data.patientPhone || "—"}`,
    "Tax Treatment: Client Output VAT",
  ], 14 + colW, ay + 4.5);

  // Section divider
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.25);
  doc.line(14, ay + 30, W - 14, ay + 30);

  // 3. Invoice Reference block (Horizontal Grayscale Grid Row)
  let dy = ay + 35;
  doc.setFillColor(...BRAND.light);
  doc.rect(14, dy, W - 28, 13, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.gray);
  
  doc.text("INVOICE NUMBER", 18, dy + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.black);
  doc.text(data.invoiceNumber, 18, dy + 9.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.gray);
  doc.text("DATE OF ISSUE", 14 + colW - 20, dy + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.black);
  doc.text(fmtDate(data.issueDate), 14 + colW - 20, dy + 9.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.gray);
  doc.text("PAYMENT STATUS", W - 48, dy + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(data.status === "paid" ? 30 : 180, data.status === "paid" ? 120 : 30, 30); // Clean Green for Paid, deep red for unpaid
  doc.text(data.status.toUpperCase(), W - 48, dy + 9.5);

  // 4. Line Items Table (Clean, Grayscale, thin lines)
  autoTable(doc, {
    startY: dy + 18,
    head: [["#", "Item Description", "Qty", "Unit Price", "VAT Rate", "Net Amount"]],
    body: data.items.map((it, i) => [
      String(i + 1),
      it.description,
      String(it.quantity),
      fmt(it.price),
      data.vatAmount ? "13.5%" : "0.0%",
      fmt(Number(it.price) * Number(it.quantity)),
    ]),
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: BRAND.black,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: { fontSize: 8.5, textColor: BRAND.black },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 26, halign: "right" },
      4: { cellWidth: 24, halign: "center" },
      5: { cellWidth: 28, halign: "right" },
    },
    margin: { left: 14, right: 14 },
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.15,
  });

  const afterTable = (doc as any).lastAutoTable.finalY + 6;
  const boxW = 75;
  const boxX = W - 14 - boxW;

  // 5. Grand Totals Grid
  let ty = afterTable + 6;
  const drawTotalRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 9.5 : 8.5);
    doc.setTextColor(...BRAND.black);
    doc.text(label, boxX, ty);
    doc.text(value, W - 14, ty, { align: "right" });
    ty += bold ? 0 : 6;
  };

  const subtotal = Number(data.subtotal || data.totalAmount);
  const vat = Number(data.vatAmount || 0);
  const total = Number(data.totalAmount);

  drawTotalRow("Subtotal (Net)", fmt(subtotal));
  if (vat > 0) drawTotalRow(`VAT (13.5%)`, fmt(vat));
  
  // Totals border divider
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.line(boxX, ty, W - 14, ty);
  ty += 5.5;
  
  drawTotalRow("Grand Total Due", fmt(total), true);

  // 6. Authorized Signatory Block
  const sigY = H - 54;
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.line(W - 80, sigY, W - 14, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.darkGray);
  doc.text("Authorized Signatory", W - 80, sigY + 5);
  doc.text(BRAND.name, W - 80, sigY + 9);

  // 7. Computerized Invoice Disclaimer Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.gray);
  doc.text("Terms: This is a computerized computer-generated invoice. No physical signature is required.", 14, H - 16);
  doc.text("Thank you for choosing Hollyhill Dental Clinic. Payment is due as per contract schedule.", 14, H - 12);

  // Page Numbers
  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.text(`Page ${i} of ${pages}`, W - 14, H - 7, { align: "right" });
  }

  doc.save(`HollyDental-Invoice-${data.invoiceNumber}.pdf`);
}

/* ══════════════════════════════════════════════
   2. CLINICAL MEDICAL PRESCRIPTION SCRIPT
   ══════════════════════════════════════════════ */
export interface PrescriptionPDFData {
  patientName: string;
  patientDob?: string;
  patientPhone?: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  notes?: string;
  issuedAt: string;
}

export function generatePrescriptionPDF(data: PrescriptionPDFData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // 1. Classical letterhead header
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND.black);
  doc.text(BRAND.name.toUpperCase(), 14, 20);

  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.darkGray);
  doc.text("Dr. Roghay Alizadeh, B.D.S. — Principal Dentist", 14, 25);
  doc.text(BRAND.tagline, 14, 29);

  // letterhead address/contacts
  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.darkGray);
  doc.text(BRAND.address, W - 14, 20, { align: "right" });
  doc.text(`Tel: ${BRAND.phone}  |  Email: ${BRAND.email}`, W - 14, 24, { align: "right" });
  doc.text(BRAND.web, W - 14, 28, { align: "right" });

  // Clean dual divider lines under letterhead
  doc.setDrawColor(...BRAND.black);
  doc.setLineWidth(0.6);
  doc.line(14, 33, W - 14, 33);
  doc.setLineWidth(0.2);
  doc.line(14, 34.5, W - 14, 34.5);

  // 2. Patient Details with dotted/underlined clinic inputs
  let py = 46;
  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...BRAND.black);
  
  doc.text("Patient:", 14, py);
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.text(data.patientName, 30, py);
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.25);
  doc.line(30, py + 1.2, 110, py + 1.2);

  doc.setFont("times", "bold");
  doc.text("Date:", W - 60, py);
  doc.setFont("times", "normal");
  doc.text(fmtDate(data.issuedAt), W - 48, py);
  doc.line(W - 48, py + 1.2, W - 14, py + 1.2);

  py += 9;
  doc.setFont("times", "bold");
  doc.text("D.O.B:", 14, py);
  doc.setFont("times", "normal");
  doc.text(data.patientDob ? fmtDate(data.patientDob) : "—", 30, py);
  doc.line(30, py + 1.2, 110, py + 1.2);

  doc.setFont("times", "bold");
  doc.text("Age/Sex:", W - 60, py);
  doc.setFont("times", "normal");
  doc.text("—", W - 44, py);
  doc.line(W - 44, py + 1.2, W - 14, py + 1.2);

  // 3. Medication & Classical large "Rx" symbol
  py += 20;
  
  // Classical fine-drawn Rx Symbol
  doc.setFont("times", "bolditalic");
  doc.setFontSize(40);
  doc.setTextColor(...BRAND.black);
  doc.text("Rx", 14, py + 7);

  // Medication and Strength details
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text(data.drugName, 32, py);

  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...BRAND.darkGray);
  doc.text(`${data.dosage}   |   ${data.duration.toUpperCase()} COURSE`, 32, py + 5.5);

  // Sig/Instructions details
  let sy = py + 16;
  doc.setFont("times", "bolditalic");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.black);
  doc.text("Sig:", 32, sy);
  
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...BRAND.black);
  
  const instLines = doc.splitTextToSize(data.instructions, W - 32 - 14);
  doc.text(instLines, 42, sy);
  
  sy += instLines.length * 5.5 + 4;
  
  // Dispense / Frequency info
  doc.setFont("times", "bolditalic");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.darkGray);
  doc.text("Dispense:", 32, sy);
  doc.setFont("times", "normal");
  doc.text(`${data.duration} course (${data.frequency})`, 48, sy);
  
  sy += 8;

  // Notes
  if (data.notes) {
    doc.setFont("times", "bolditalic");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.darkGray);
    doc.text("Notes:", 32, sy);
    
    doc.setFont("times", "italic");
    doc.setFontSize(9.5);
    const notesLines = doc.splitTextToSize(data.notes, W - 32 - 14);
    doc.text(notesLines, 45, sy);
    sy += notesLines.length * 5 + 4;
  }

  // Divider Dispensary Line
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.25);
  doc.line(14, sy + 6, W - 14, sy + 6);

  // 4. Dentist Signature Line (Bottom Right)
  const sigY = H - 54;
  doc.setDrawColor(...BRAND.black);
  doc.setLineWidth(0.4);
  doc.line(W - 80, sigY, W - 14, sigY);
  
  doc.setFont("times", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.black);
  doc.text("DR. ROGHAY ALIZADEH, B.D.S.", W - 80, sigY + 5.5);
  
  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.darkGray);
  doc.text("Registered Dental Practitioner", W - 80, sigY + 9.5);
  doc.text(BRAND.reg, W - 80, sigY + 13.5);

  // 5. Disclaimer Footer
  doc.setFont("times", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.gray);
  doc.text("This is an official clinical prescription record. Present to any licensed pharmacist.", 14, H - 15);
  doc.text("Hollyhill Shopping Centre Surgery  ·  Tel: +353 21 434 5678", 14, H - 11);

  // Page Numbers
  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.text(`Page ${i} of ${pages}`, W - 14, H - 7, { align: "right" });
  }

  doc.save(`HollyDental-Rx-${data.drugName.replace(/\s+/g, "-")}-${Date.now()}.pdf`);
}

/* ══════════════════════════════════════════════
   3. E-COMMERCE ORDER RECEIPT PDF
   ══════════════════════════════════════════════ */
export interface OrderReceiptPDFData {
  orderId: string;
  productName: string;
  quantity: number;
  unitPrice: number | string;
  totalAmount: number | string;
  paymentMethod: string;
  upiReference?: string | null;
  status: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  createdAt: string;
  paidAt?: string | null;
  patientProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    dateOfBirth?: string | null;
    gender?: string | null;
    bloodGroup?: string | null;
    age?: number | null;
    address?: string | null;
  } | null;
}

export function generateOrderReceiptPDF(data: OrderReceiptPDFData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // 1. Clean Letterhead Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.black);
  doc.text(BRAND.name.toUpperCase(), 14, 18);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.darkGray);
  doc.text("Excellence in Dental Care", 14, 23);

  // Right Side: Title Block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.black);
  doc.text("ORDER RECEIPT", W - 14, 18, { align: "right" });

  // Divider Line
  doc.setDrawColor(...BRAND.black);
  doc.setLineWidth(0.4);
  doc.line(14, 27, W - 14, 27);

  // 2. Address Directories (Sold By vs Ship/Pickup Info)
  let ay = 35;
  const colW = (W - 28) / 2;

  // Left Column: Sold By
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.black);
  doc.text("SOLD BY (SELLER):", 14, ay);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.darkGray);
  doc.text([
    BRAND.name,
    BRAND.address,
    `Tel: ${BRAND.phone}`,
    `Email: ${BRAND.email}`,
  ], 14, ay + 4.5);

  // Right Column: Recipient (Full Patient Details)
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.black);
  doc.text("DELIVER / PICKUP TO:", 14 + colW, ay);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.darkGray);

  const patient = data.patientProfile;
  const recipientDetails = [
    data.customerName || (patient ? `${patient.firstName} ${patient.lastName}`.trim() : "Portal Patient"),
    data.customerEmail || patient?.email || "—",
    `Phone: ${data.customerPhone || patient?.phone || "—"}`,
  ];
  if (patient?.age) {
    recipientDetails.push(`Age: ${patient.age}`);
  }
  if (patient?.gender) {
    recipientDetails.push(`Gender: ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`);
  }
  if (patient?.bloodGroup) {
    recipientDetails.push(`Blood Group: ${patient.bloodGroup}`);
  }
  if (patient?.address) {
    recipientDetails.push(`Address: ${patient.address}`);
  } else {
    recipientDetails.push("Location: Clinic Front Desk Counter");
  }

  doc.text(recipientDetails, 14 + colW, ay + 4.5);

  // Section divider (expanded vertical buffer to account for dynamic rows)
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.25);
  doc.line(14, ay + 38, W - 14, ay + 38);

  // 3. Order Reference row
  let dy = ay + 43;
  doc.setFillColor(...BRAND.light);
  doc.rect(14, dy, W - 28, 13, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.gray);
  doc.text("ORDER NUMBER", 18, dy + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.black);
  doc.text(`ORD-${(data.orderId ?? "UNKNOWN").slice(0, 8).toUpperCase()}`, 18, dy + 9.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.gray);
  doc.text("ORDER DATE", 14 + colW - 20, dy + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.black);
  doc.text(fmtDate(data.createdAt), 14 + colW - 20, dy + 9.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.gray);
  doc.text("ORDER STATUS", W - 48, dy + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(data.status === "completed" ? 30 : 180, data.status === "completed" ? 120 : 30, 30);
  doc.text(data.status.toUpperCase(), W - 48, dy + 9.5);

  // 4. Line Items Table
  autoTable(doc, {
    startY: dy + 18,
    head: [["Product Details", "Qty", "Unit Price", "Total Net Amount"]],
    body: [[
      data.productName,
      String(data.quantity),
      fmt(data.unitPrice),
      fmt(data.totalAmount),
    ]],
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: BRAND.black,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: { fontSize: 8.5, textColor: BRAND.black },
    columnStyles: {
      1: { cellWidth: 16, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
    },
    margin: { left: 14, right: 14 },
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.15,
  });

  const afterTable = (doc as any).lastAutoTable.finalY + 6;
  const boxW = 75;
  const boxX = W - 14 - boxW;

  // 5. Total due
  let ty = afterTable + 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.black);
  doc.text("Subtotal", boxX, ty);
  doc.text(fmt(data.totalAmount), W - 14, ty, { align: "right" });
  
  ty += 6;
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.line(boxX, ty, W - 14, ty);
  ty += 5.5;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Total Paid Amount", boxX, ty);
  doc.text(fmt(data.totalAmount), W - 14, ty, { align: "right" });

  // 6. Authorized Signatory
  const sigY = H - 54;
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.line(W - 80, sigY, W - 14, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.darkGray);
  doc.text("Dispatched By Counter", W - 80, sigY + 5);
  doc.text(BRAND.name, W - 80, sigY + 9);

  // 7. Footer pickup disclaimers
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.gray);
  doc.text("Terms: Bring a digital copy of this receipt at pickup. In-clinic collection only.", 14, H - 16);
  doc.text("Thank you for your order. If you have any inquiries, call our front desk surgery.", 14, H - 12);

  // Page Numbers
  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.text(`Page ${i} of ${pages}`, W - 14, H - 7, { align: "right" });
  }

  doc.save(`HollyDental-Order-${data.orderId.slice(0, 8).toUpperCase()}.pdf`);
}

/* ══════════════════════════════════════════════
   4. UNIVERSAL TABLE EXPORT (ADMIN LISTS)
   ══════════════════════════════════════════════ */
export interface TablePDFData {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  filename: string;
}

export function generateTablePDF(data: TablePDFData) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // 1. Clean Letterhead Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND.black);
  doc.text(BRAND.name.toUpperCase(), 14, 16);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.darkGray);
  doc.text(data.title.toUpperCase(), 14, 21);

  // Right Side: Date
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, W - 14, 16, { align: "right" });

  // Divider Line
  doc.setDrawColor(...BRAND.black);
  doc.setLineWidth(0.4);
  doc.line(14, 25, W - 14, 25);

  // 2. Table Data
  autoTable(doc, {
    startY: 32,
    head: [data.columns],
    body: data.rows,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 4,
      textColor: BRAND.black,
    },
    headStyles: {
      fontStyle: "bold",
      textColor: BRAND.black,
      fillColor: BRAND.light,
      lineColor: BRAND.border,
      lineWidth: { top: 0.2, bottom: 0.6 },
    },
    bodyStyles: {
      lineColor: BRAND.border,
      lineWidth: { bottom: 0.1 },
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // 3. Footer
  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.gray);
    doc.text(`Page ${i} of ${pages}`, W - 14, H - 7, { align: "right" });
    doc.text("Hollyhill Dental Clinic Internal System Export", 14, H - 7);
  }

  doc.save(`${data.filename}.pdf`);
}

/* ══════════════════════════════════════════════
   5. PATIENT GDPR DATA EXPORT (PDF)
   ══════════════════════════════════════════════ */
export function generatePatientDataPDF(data: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.black);
  doc.text(BRAND.name.toUpperCase(), 14, 18);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.darkGray);
  doc.text("GDPR Personal Data Export", 14, 23);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, W - 14, 18, { align: "right" });

  doc.setDrawColor(...BRAND.black);
  doc.setLineWidth(0.4);
  doc.line(14, 27, W - 14, 27);

  let y = 35;
  const addSection = (title: string, obj: any) => {
    if (!obj) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.black);
    doc.text(title.toUpperCase(), 14, y);
    y += 2;
    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(0.1);
    doc.line(14, y, W - 14, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.darkGray);

    for (const [key, value] of Object.entries(obj)) {
      if (y > H - 20) {
        doc.addPage();
        y = 20;
      }
      if (typeof value === "object") continue; // skip nested
      const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
      const valStr = value === null || value === undefined ? "—" : String(value);
      
      doc.setFont("helvetica", "bold");
      doc.text(`${formattedKey}:`, 14, y);
      doc.setFont("helvetica", "normal");
      
      const splitVal = doc.splitTextToSize(valStr, W - 60);
      doc.text(splitVal, 50, y);
      y += (splitVal.length * 4) + 2;
    }
    y += 5;
  };

  addSection("User Account", {
    ID: data.id,
    Email: data.email,
    Role: data.role,
    DisplayName: data.displayName,
    IsActive: data.isActive,
    Joined: data.createdAt,
  });

  if (data.patientProfile) {
    addSection("Patient Profile", data.patientProfile);
  }

  // Footer
  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.gray);
    doc.text(`Page ${i} of ${pages}`, W - 14, H - 7, { align: "right" });
    doc.text("Hollyhill Dental Clinic - GDPR Data Request", 14, H - 7);
  }

  doc.save(`HollyDental-Data-Export.pdf`);
}
