const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const PDF_TEMPLATE = path.join(__dirname, '../../assets/FM00100_template.pdf');

// Page dimensions from structure analysis: 595 x 841 (A4 in PDF points)
// Our structure uses top-down coords, pdf-lib uses bottom-up
const PAGE_H = 841;

function toY(top) {
  // Convert top-down coord → pdf-lib bottom-up
  return PAGE_H - top;
}

/**
 * Generate a filled FM00100 PDF from form data
 * @param {Object} formData - canonical form data (FM00100 field keys)
 * @param {Object} options
 * @returns {Buffer} PDF buffer
 */
async function generateFM00100PDF(formData, options = {}) {
  // Load template
  let templateBytes;
  try {
    templateBytes = fs.readFileSync(PDF_TEMPLATE);
  } catch (err) {
    throw new Error(`FM00100 template not found at ${PDF_TEMPLATE}. Run setup to copy the template.`);
  }

  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  } catch (e) {
    // Try common REI form passwords
    for (const pwd of ['', 'reinsw', 'REINSW', 'reiforms', 'REIForms']) {
      try {
        pdfDoc = await PDFDocument.load(templateBytes, { password: pwd, ignoreEncryption: true });
        break;
      } catch (_) {}
    }
    if (!pdfDoc) throw new Error('FM00100 template is password protected — cannot generate PDF');
  }
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const d = formData;

  // Helper: draw text on a page at PDF structure coordinates
  const drawText = (pageIndex, text, x, topCoord, opts = {}) => {
    if (!text && text !== 0) return;
    const page = pages[pageIndex];
    page.drawText(String(text), {
      x,
      y: toY(topCoord) - (opts.size || 8),
      size: opts.size || 8,
      font: opts.bold ? helveticaBold : helvetica,
      color: rgb(0, 0, 0),
      maxWidth: opts.maxWidth || 400
    });
  };

  // Helper: draw a checkmark X
  const drawCheck = (pageIndex, x, topCoord, checked) => {
    if (!checked) return;
    const page = pages[pageIndex];
    page.drawText('X', {
      x,
      y: toY(topCoord) - 8,
      size: 8,
      font: helveticaBold,
      color: rgb(0, 0, 0)
    });
  };

  // ── PAGE 4 (index 3): PARTIES ────────────────────────────────────────────
  // Principal 1 name (row ~115, entry starts after "Principal*" label)
  drawText(3, d.party_0__full_name || d.party_0__company_name, 65, 115, { maxWidth: 480 });

  // ABN/ACN row (top ~138)
  drawText(3, d.party_0__abn, 115, 138, { maxWidth: 290 });
  drawCheck(3, 510, 138, d.party_0__is_gst_registered);

  // Address (top ~155)
  drawText(3, d.party_0__address, 65, 155, { maxWidth: 480 });
  drawText(3, d.party_0__postcode, 495, 168);

  // Phone row (top ~183)
  drawText(3, d.party_0__phone_work, 120, 183, { maxWidth: 100 });
  drawText(3, d.party_0__phone_home, 265, 183, { maxWidth: 100 });
  drawText(3, d.party_0__phone_mobile, 380, 183, { maxWidth: 120 });

  // Email (top ~198)
  drawText(3, d.party_0__email, 65, 198, { maxWidth: 480 });

  // Principal 2 (if present)
  if (d.party_1__full_name) {
    drawText(3, d.party_1__full_name, 65, 215, { maxWidth: 480 });
    drawText(3, d.party_1__email, 65, 295, { maxWidth: 480 });
    drawText(3, d.party_1__phone_mobile, 380, 278, { maxWidth: 120 });
  }

  // Agent section (top ~570-690)
  drawText(3, d.agent__licence_no, 200, 590, { maxWidth: 180 });
  drawText(3, d.agent__abn, 65, 610, { maxWidth: 290 });
  drawCheck(3, 510, 610, true); // GST registered

  drawText(3, d.agent__trading_as, 65, 630, { maxWidth: 480 });
  drawText(3, d.agent__address, 65, 650, { maxWidth: 480 });
  drawText(3, d.agent__postcode, 495, 653);

  drawText(3, d.agent__phone_work, 120, 668, { maxWidth: 100 });
  drawText(3, d.agent__email, 65, 683, { maxWidth: 480 });

  // ── PAGE 5 (index 4): PREMISES + AGREEMENT ──────────────────────────────
  // Premises address
  drawText(4, d.property__street_address, 65, 110, { maxWidth: 480 });
  drawText(4, d.property__suburb, 65, 137, { maxWidth: 240 });
  drawText(4, d.property__state || 'NSW', 365, 137, { maxWidth: 60 });
  drawText(4, d.property__postcode, 495, 137, { maxWidth: 80 });

  // Furnished / Unfurnished checkboxes (top ~148)
  drawCheck(4, 95, 148, d.property__is_furnished);
  drawCheck(4, 160, 148, !d.property__is_furnished);
  drawCheck(4, 334, 148, d.property__has_garage);

  // Commencement date (top ~215)
  if (d.agreement__start_date) {
    const [day, month, year] = (d.agreement__start_date || '').split('/');
    drawText(4, day || '', 190, 215);
    drawText(4, month || '', 205, 215);
    drawText(4, year || '', 220, 215);
  }

  // Termination notice (top ~221)
  drawText(4, d.agreement__termination_days || '', 345, 221, { maxWidth: 80 });

  // Leasing section (top ~260-285)
  drawText(4, d.leasing__term, 280, 258, { maxWidth: 250 });
  drawText(4, d.leasing__rent_amount, 120, 271, { maxWidth: 80 });
  drawText(4, d.leasing__rent_period || 'weekly', 200, 271, { maxWidth: 80 });
  drawText(4, d.leasing__rental_bond_weeks || '4', 130, 283, { maxWidth: 80 });

  // Agent's Authority checkboxes (top ~340-360)
  drawCheck(4, 516, 348, d.authority__re_lease !== false);
  drawCheck(4, 540, 348, d.authority__re_lease === false);
  drawCheck(4, 516, 358, d.authority__refer_principal);
  drawCheck(4, 540, 358, !d.authority__refer_principal);
  drawCheck(4, 516, 368, d.authority__review_rent !== false);
  drawCheck(4, 540, 368, d.authority__review_rent === false);

  // Fees (top ~400-470)
  drawText(4, d.fees__letting_fee, 200, 415, { maxWidth: 300 });
  drawText(4, d.fees__admin_fee, 260, 435, { maxWidth: 100 });
  drawText(4, d.fees__management_pct, 200, 451, { maxWidth: 80 });
  drawText(4, d.fees__admin_fee_period || 'month', 400, 460, { maxWidth: 80 });
  drawText(4, d.fees__lease_renewal_fee, 200, 471, { maxWidth: 200 });

  // ── PAGE 6 (index 5): SERVICES, CHARGES ─────────────────────────────────
  drawText(5, d.fees__tribunal_attendance, 310, 162, { maxWidth: 140 });
  drawText(5, d.fees__tribunal_case, 310, 175, { maxWidth: 140 });
  drawText(5, d.fees__repairs_arranging, 310, 187, { maxWidth: 140 });
  drawText(5, d.fees__smoke_alarm_inspection, 310, 225, { maxWidth: 140 });
  drawText(5, d.fees__notice_service, 310, 237, { maxWidth: 140 });

  // Repairs limit (page 7, index 6)
  drawText(6, d.authority__repairs_limit || '500', 85, 370, { maxWidth: 100 });

  // ── PAGE 7 (index 6): AUTHORITY checkboxes ──────────────────────────────
  const authPage = 6;
  const checkPairs = [
    [d.authority__sign_tenancy, 348, 516, 540],
    [d.authority__collect_rent, 364, 516, 540],
    [d.authority__issue_receipts, 380, 516, 540],
    [d.authority__receive_bond !== false, 394, 516, 540],
    [d.authority__bond_claims !== false, 406, 516, 540],
    [d.authority__ncat_proceedings !== false, 419, 516, 540],
    [d.authority__select_tenants !== false, 456, 516, 540],
  ];
  checkPairs.forEach(([val, top, yesX, noX]) => {
    drawCheck(authPage, val ? yesX : noX, top, true);
  });

  // Disbursements checkboxes
  const disbPage = 6;
  const disbRows = [
    [d.disb__repairs_maintenance !== false, 514],
    [d.disb__council_rates, 527],
    [d.disb__water_rates, 540],
    [d.disb__insurance, 553],
    [d.disb__strata_levies, 566],
    [d.disb__maintenance_expenses, 579],
    [d.disb__maintenance_contracts, 592],
    [d.disb__smoke_alarm_costs, 605],
  ];
  disbRows.forEach(([val, top]) => {
    drawCheck(disbPage, val ? 516 : 540, top, true);
  });

  // ── PAGE 15 (index 14): SCHEDULE ────────────────────────────────────────
  // Trust account / EFT
  drawText(14, d.trust__bank_name, 65, 540, { maxWidth: 130 });
  drawText(14, d.trust__account_name, 205, 540, { maxWidth: 130 });
  drawText(14, d.trust__bsb, 345, 540, { maxWidth: 70 });
  drawText(14, d.trust__account_no, 420, 540, { maxWidth: 100 });

  // Strata details
  if (d.property__is_strata) {
    drawText(14, d.property__strata_plan_no, 130, 397, { maxWidth: 80 });
    drawText(14, d.property__strata_lot_no, 320, 397, { maxWidth: 80 });
  }

  // Copy all pages into a fresh unencrypted document so viewers don't ask for a password
  const cleanDoc = await PDFDocument.create();
  const pageIndices = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i);
  const copiedPages = await cleanDoc.copyPages(pdfDoc, pageIndices);
  copiedPages.forEach(page => cleanDoc.addPage(page));

  const pdfBytes = await cleanDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { generateFM00100PDF };
