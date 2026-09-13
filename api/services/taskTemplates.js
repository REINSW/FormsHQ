/**
 * Auto-generate task list for a new transaction based on prefill data.
 * Returns array of task objects ready to INSERT.
 */
function generateTasks(transactionId, agencyId, prefillData = {}, intakeResponses = {}) {
  const p = prefillData;
  const r = intakeResponses;
  const tasks = [];

  const task = (title, description, category, priority = 'normal') => ({
    transaction_id: transactionId,
    agency_id: agencyId,
    title,
    description,
    category,
    priority,
    status: 'pending',
    is_auto_generated: true,
  });

  // ── VERIFICATION ─────────────────────────────────────────────
  const ownerCount = r.owner_count || 1;
  for (let i = 0; i < ownerCount; i++) {
    const prefix = i === 0 ? 'owner' : `owner${i + 1}`;
    const name = r[`${prefix}_full_name`] || r[`${prefix}_company_name`] || `Owner ${i + 1}`;
    tasks.push(task(
      `Send VOI verification — ${name}`,
      'Send identity verification link to confirm the owner\'s identity before signing.',
      'verification', 'high'
    ));
  }

  // ── WIZARD / SIGNING ─────────────────────────────────────────
  tasks.push(task(
    'Complete FM00100 wizard',
    'Review and complete all sections of the Management Agency Agreement wizard.',
    'document', 'high'
  ));

  tasks.push(task(
    'Send FM00100 for signing',
    'Send the completed Management Agency Agreement to all parties for electronic signature.',
    'signing', 'high'
  ));

  // ── REQUIRED DOCUMENTS ───────────────────────────────────────
  tasks.push(task(
    'Landlord Information Statement',
    'Prepare and provide the Landlord Information Statement (NSW Fair Trading requirement).',
    'document', 'high'
  ));

  tasks.push(task(
    'Material Facts Disclosure',
    'Complete the Material Facts Disclosure Statement (RTA s26) — required before leasing.',
    'document', 'high'
  ));

  // ── COMPLIANCE — conditional ──────────────────────────────────
  const hasPool = p.property__has_pool || (p.property__features || []).includes('swimming_pool') || r.property_has_pool;
  if (hasPool) {
    tasks.push(task(
      'Pool Safety Certificate',
      'Obtain a current pool safety certificate from a registered pool safety inspector.',
      'compliance', 'high'
    ));
    tasks.push(task(
      'Register pool on NSW Swimming Pool Register',
      'Confirm the pool is registered at swimmingpoolregister.nsw.gov.au',
      'compliance', 'normal'
    ));
  }

  const isStrata = p.property__is_strata || r.property_strata;
  if (isStrata) {
    tasks.push(task(
      'Strata Information Statement',
      'Obtain and provide the Strata Information Statement to prospective tenants.',
      'compliance', 'normal'
    ));
  }

  const smokeAlarmOk = r.smoke_alarm_compliant;
  if (!smokeAlarmOk) {
    tasks.push(task(
      'Smoke alarm compliance check',
      'Confirm smoke alarms are installed, interconnected where required, and compliant with legislation.',
      'compliance', 'high'
    ));
  }

  const waterEfficiencyOk = r.water_efficiency_cert;
  if (!waterEfficiencyOk) {
    tasks.push(task(
      'Water efficiency certificate',
      'Obtain a current water efficiency certificate to allow charging tenants for water usage.',
      'compliance', 'normal'
    ));
  }

  // ── PROPERTY ACCESS ──────────────────────────────────────────
  tasks.push(task(
    'Arrange property access / keys',
    'Obtain a set of keys or confirm access arrangements for inspections and maintenance.',
    'admin', 'normal'
  ));

  // ── OPTIONAL / CONDITIONAL ───────────────────────────────────
  if (r.plans_for_work === 'Yes') {
    tasks.push(task(
      'Review planned works before leasing',
      'Owner indicated plans for work or improvements — confirm completion before listing.',
      'admin', 'normal'
    ));
  }

  const hasInsuranceDisbursement = r.disb_insurance || p.disb__insurance;
  if (hasInsuranceDisbursement) {
    tasks.push(task(
      'Confirm landlord insurance details',
      'Obtain insurance policy details to set up disbursement payments.',
      'admin', 'low'
    ));
  }

  return tasks;
}

module.exports = { generateTasks };
