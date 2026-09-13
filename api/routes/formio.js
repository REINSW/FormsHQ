const express = require('express');
const { authenticate } = require('../middleware/auth');
const { upsertForm, formioClient } = require('../services/formio');
const { query } = require('../db');
const router = express.Router();

// POST /v1/formio/setup — create the Form.io forms for the prototype
router.post('/setup', authenticate, async (req, res) => {
  const results = {};

  // 1. Create Residential PM Intake Form
  try {
    const intakeForm = await upsertForm('intake/residential-pm', {
      title: 'Residential PM Intake',
      name: 'residentialPmIntake',
      path: 'intake/residential-pm',
      type: 'form',
      components: buildIntakeFormComponents()
    });
    results.intakeForm = { success: true, id: intakeForm._id, path: intakeForm.path };
  } catch (err) {
    results.intakeForm = { success: false, error: err.message };
  }

  // 2. Create FM00100 Wizard
  try {
    const wizardForm = await upsertForm('wizard/fm00100', {
      title: 'FM00100 — Exclusive Management Agency Agreement (Residential)',
      name: 'fm00100Wizard',
      path: 'wizard/fm00100',
      type: 'wizard',
      components: buildFM00100WizardComponents()
    });
    results.wizardForm = { success: true, id: wizardForm._id, path: wizardForm.path };
  } catch (err) {
    results.wizardForm = { success: false, error: err.message };
  }

  res.json({ message: 'Form.io setup complete', results });
});

// POST /v1/formio/webhook/intake — receive intake form submissions from Form.io
router.post('/webhook/intake', express.json(), async (req, res) => {
  try {
    const { data, _id: submissionId } = req.body;
    if (!data || !data.intake_token) {
      return res.status(200).json({ received: true });
    }

    await query(
      `UPDATE intake_requests
       SET status = 'submitted', responses = $1, formio_submission_id = $2, submitted_at = NOW(), updated_at = NOW()
       WHERE token = $3 AND status = 'pending'`,
      [JSON.stringify(data), submissionId, data.intake_token]
    );

    res.json({ received: true });
  } catch (err) {
    console.error('Intake webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// POST /v1/formio/webhook/fm00100 — receive completed FM00100 wizard submissions
router.post('/webhook/fm00100', express.json(), async (req, res) => {
  try {
    const { data, _id: submissionId } = req.body;

    if (data && data._transaction_id) {
      await query(
        `UPDATE transactions
         SET form_data = $1, formio_submission_id = $2, status = 'completed', completed_at = NOW(), updated_at = NOW()
         WHERE id = $3`,
        [JSON.stringify(data), submissionId, data._transaction_id]
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error('FM00100 webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ── Form Component Builders ──────────────────────────────────────────────────

/**
 * Residential PM Intake Form — field keys match what prefill.js reads.
 *
 * prefill.js reads intake responses via ownerField(idx, field):
 *   idx=0 prefix = 'owner', so owner_name_full, owner_email, owner_mobile, etc.
 *   idx=1 prefix = 'owner2', so owner2_name_full, etc.
 *
 * Property keys: property_address, property_suburb, property_state, property_postcode
 * Leasing keys:  expected_rent, rent_period, rental_bond_weeks, preferred_lease_term
 * Bank keys:     bank_name, bank_account_name, bank_bsb, bank_account_no
 */
function buildIntakeFormComponents() {
  const stateOptions = ['NSW','VIC','QLD','WA','SA','TAS','ACT','NT']
    .map(s => ({ label: s, value: s }));

  return [
    // Hidden token (passed in URL, identifies which intake request this is)
    { type: 'hidden', key: 'intake_token', input: true },

    // ── Owner 1 ─────────────────────────────────────────────────────────
    {
      type: 'panel', title: 'Your Details', key: 'ownerPanel',
      components: [
        {
          type: 'select', key: 'owner_type', label: 'You are the', defaultValue: 'individual',
          data: { values: [
            { label: 'Individual owner', value: 'individual' },
            { label: 'Company / Corporation', value: 'company' },
            { label: 'Trustee of a trust', value: 'trust' },
          ]},
        },
        // Individual fields
        { type: 'textfield', key: 'owner_name_full', label: 'Full Legal Name', validate: { required: true },
          conditional: { show: true, when: 'owner_type', eq: 'individual' } },
        // Company/trust fields
        { type: 'textfield', key: 'owner_company_name', label: 'Company / Trust Name',
          conditional: { show: false, when: 'owner_type', eq: 'individual' } },
        { type: 'textfield', key: 'owner_abn', label: 'ABN' },
        { type: 'email', key: 'owner_email', label: 'Email Address', validate: { required: true } },
        {
          type: 'columns', key: 'ownerPhonesRow',
          columns: [
            { components: [{ type: 'phoneNumber', key: 'owner_mobile', label: 'Mobile', validate: { required: true } }], width: 6 },
            { components: [{ type: 'phoneNumber', key: 'owner_phone_work', label: 'Work / Home Phone' }], width: 6 },
          ]
        },
        { type: 'textfield', key: 'owner_address', label: 'Your Residential / Postal Address', validate: { required: true } },
        {
          type: 'columns', key: 'ownerAddrRow',
          columns: [
            { components: [{ type: 'textfield', key: 'owner_suburb', label: 'Suburb' }], width: 5 },
            { components: [{ type: 'select', key: 'owner_state', label: 'State', defaultValue: 'NSW', data: { values: stateOptions } }], width: 3 },
            { components: [{ type: 'textfield', key: 'owner_postcode', label: 'Postcode' }], width: 4 },
          ]
        },
      ]
    },

    // ── Additional owners ────────────────────────────────────────────────
    {
      type: 'panel', title: 'Additional Owner (if applicable)', key: 'owner2Panel', collapsed: true,
      components: [
        { type: 'textfield', key: 'owner2_name_full', label: 'Full Name' },
        { type: 'email', key: 'owner2_email', label: 'Email Address' },
        { type: 'phoneNumber', key: 'owner2_mobile', label: 'Mobile' },
        { type: 'textfield', key: 'owner2_address', label: 'Address (if different)' },
      ]
    },

    // ── Property ─────────────────────────────────────────────────────────
    {
      type: 'panel', title: 'Property to be Managed', key: 'propertyPanel',
      components: [
        { type: 'textfield', key: 'property_address', label: 'Street Address', validate: { required: true } },
        {
          type: 'columns', key: 'propAddrRow',
          columns: [
            { components: [{ type: 'textfield', key: 'property_suburb', label: 'Suburb', validate: { required: true } }], width: 5 },
            { components: [{ type: 'select', key: 'property_state', label: 'State', defaultValue: 'NSW', data: { values: stateOptions } }], width: 3 },
            { components: [{ type: 'textfield', key: 'property_postcode', label: 'Postcode' }], width: 4 },
          ]
        },
        {
          type: 'columns', key: 'propTypeRow',
          columns: [
            { components: [{
              type: 'select', key: 'property_type', label: 'Property Type',
              data: { values: [
                { label: 'House', value: 'house' },
                { label: 'Unit / Apartment', value: 'unit' },
                { label: 'Townhouse', value: 'townhouse' },
                { label: 'Villa', value: 'villa' },
                { label: 'Other', value: 'other' },
              ]}
            }], width: 4 },
            { components: [{ type: 'number', key: 'property_bedrooms', label: 'Bedrooms' }], width: 2 },
            { components: [{ type: 'number', key: 'property_bathrooms', label: 'Bathrooms' }], width: 2 },
            { components: [{ type: 'number', key: 'property_car_spaces', label: 'Car Spaces' }], width: 4 },
          ]
        },
        { type: 'checkbox', key: 'property_furnished', label: 'Property is furnished' },
        { type: 'checkbox', key: 'property_strata', label: 'Property is in a strata scheme' },
        { type: 'checkbox', key: 'property_has_pool', label: 'Property has a swimming pool or spa' },
        {
          type: 'select', key: 'property_current_situation', label: 'Current situation',
          data: { values: [
            { label: 'Vacant — ready to rent', value: 'vacant' },
            { label: 'Owner occupied', value: 'owner_occupied' },
            { label: 'Currently tenanted', value: 'tenanted' },
          ]}
        },
      ]
    },

    // ── Rental expectations ──────────────────────────────────────────────
    {
      type: 'panel', title: 'Rental Expectations', key: 'rentalPanel',
      components: [
        {
          type: 'columns', key: 'rentRow',
          columns: [
            { components: [{ type: 'number', key: 'expected_rent', label: 'Expected Rent ($)', placeholder: '600' }], width: 5 },
            { components: [{
              type: 'select', key: 'rent_period', label: 'Per', defaultValue: 'per week',
              data: { values: [
                { label: 'per week', value: 'per week' },
                { label: 'per fortnight', value: 'per fortnight' },
                { label: 'per month', value: 'per month' },
              ]}
            }], width: 4 },
            { components: [{ type: 'number', key: 'rental_bond_weeks', label: 'Bond (weeks)', defaultValue: 4 }], width: 3 },
          ]
        },
        { type: 'textfield', key: 'preferred_lease_term', label: 'Preferred Lease Term (e.g. 12 months)' },
        { type: 'datetime', key: 'preferred_start_date', label: 'Preferred Tenancy Start Date', format: 'dd/MM/yyyy', enableDate: true, enableTime: false },
      ]
    },

    // ── Disbursements ────────────────────────────────────────────────────
    {
      type: 'panel', title: 'Pay from Rental Income', key: 'disbPanel', collapsed: true,
      components: [
        {
          type: 'htmlelement', key: 'disbNote',
          content: '<p style="font-size:12px;color:#6b7280">Optional — tick any outgoings you\'d like the agent to pay from your rental income before remitting the balance to you.</p>'
        },
        { type: 'checkbox', key: 'disb_council_rates', label: 'Council rates' },
        { type: 'checkbox', key: 'disb_water_rates', label: 'Water and sewerage rates' },
        { type: 'checkbox', key: 'disb_insurance', label: 'Insurance premiums' },
        { type: 'checkbox', key: 'disb_strata_levies', label: 'Strata levies' },
        { type: 'checkbox', key: 'disb_maintenance_contracts', label: 'Maintenance / service contracts' },
      ]
    },

    // ── Bank account ─────────────────────────────────────────────────────
    {
      type: 'panel', title: 'Your Bank Account — Rent Remittance', key: 'bankPanel',
      components: [
        {
          type: 'htmlelement', key: 'bankNote',
          content: '<p style="font-size:12px;color:#6b7280;margin-bottom:12px">Where the agent should deposit your rental income. This will be included in your management agreement.</p>'
        },
        {
          type: 'columns', key: 'bankRow1',
          columns: [
            { components: [{ type: 'textfield', key: 'bank_name', label: 'Bank Name', placeholder: 'Commonwealth Bank' }], width: 6 },
            { components: [{ type: 'textfield', key: 'bank_account_name', label: 'Account Name' }], width: 6 },
          ]
        },
        {
          type: 'columns', key: 'bankRow2',
          columns: [
            { components: [{ type: 'textfield', key: 'bank_bsb', label: 'BSB', placeholder: '062-000' }], width: 4 },
            { components: [{ type: 'textfield', key: 'bank_account_no', label: 'Account Number', placeholder: '12345678' }], width: 8 },
          ]
        },
      ]
    },

    // ── Submit ────────────────────────────────────────────────────────────
    {
      type: 'htmlelement', key: 'submitNote',
      content: '<p style="font-size:12px;color:#6b7280;margin-bottom:8px">By submitting this form you confirm the information is accurate. Your agent will use these details to prepare the management agreement.</p>'
    },
    { type: 'button', label: 'Submit Intake Form', key: 'submit', action: 'submit', theme: 'primary' },
  ];
}

/**
 * FM00100 Wizard — Form.io component schema (v2)
 *
 * Field keys match canonical keys in api/services/prefill.js exactly.
 * Convention: dots → __, array index → _N__ (e.g. party_0__name_full)
 *
 * Steps:
 *   1. Principal (Owner)        — party_0__ ... party_3__
 *   2. Property                 — property__
 *   3. Agreement & Rent         — management_authority__
 *   4. Fees & Remuneration      — fees__
 *   5. Authority & Disbursements— management_authority__ (authority/disb)
 *   6. Disclosures              — disclosure__
 *   7. Bank Accounts            — owner_bank__ + trust__
 *   8. Review & Submit
 */
function buildFM00100WizardComponents() {

  // ── Reusable owner panel builder (index 0–3) ────────────────────────────
  const ownerPanel = (idx) => {
    const p = `party_${idx}__`;
    const n = idx + 1;
    const label = idx === 0 ? 'Primary Owner / Principal' : `Additional Owner ${n}`;
    // Owners 2-4 are only shown when management_authority__owner_count says so
    const conditional = idx === 0 ? {} : {
      conditional: { show: true, when: 'management_authority__owner_count', eq: String(n) }
    };
    return {
      type: 'panel',
      title: label,
      key: `ownerPanel${n}`,
      ...conditional,
      components: [
        {
          type: 'select', key: `${p}is_company`, label: 'Owner Type',
          data: { values: [
            { label: 'Individual', value: 'individual' },
            { label: 'Company', value: 'company' },
            { label: 'Trust', value: 'trust' },
          ]},
          defaultValue: 'individual',
        },
        // Individual name (shown when individual)
        {
          type: 'textfield', key: `${p}name_full`, label: 'Full Name',
          validate: idx === 0 ? { required: true } : {},
          conditional: { show: true, when: `${p}is_company`, eq: 'individual' },
        },
        // Company/trust name (shown for company or trust)
        {
          type: 'textfield', key: `${p}trading_as`, label: 'Company / Trust Name',
          conditional: { show: false, when: `${p}is_company`, eq: 'individual' },
        },
        {
          type: 'columns', key: `${p}identifiersRow`,
          columns: [
            { components: [{ type: 'textfield', key: `${p}abn`, label: 'ABN' }], width: 6 },
            { components: [{ type: 'textfield', key: `${p}acn`, label: 'ACN' }], width: 6 },
          ]
        },
        { type: 'checkbox', key: `${p}gst_registered`, label: 'GST Registered' },
        // Address
        { type: 'textfield', key: `${p}address_street`, label: 'Street Address' },
        {
          type: 'columns', key: `${p}addrRow`,
          columns: [
            { components: [{ type: 'textfield', key: `${p}address_suburb`, label: 'Suburb' }], width: 5 },
            { components: [{
              type: 'select', key: `${p}address_state`, label: 'State', defaultValue: 'NSW',
              data: { values: ['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s => ({ label: s, value: s })) }
            }], width: 3 },
            { components: [{ type: 'textfield', key: `${p}address_postcode`, label: 'Postcode' }], width: 4 },
          ]
        },
        // Contact
        {
          type: 'columns', key: `${p}contactRow`,
          columns: [
            { components: [{ type: 'phoneNumber', key: `${p}mobile`, label: 'Mobile' }], width: 6 },
            { components: [{ type: 'phoneNumber', key: `${p}phone_work`, label: 'Work Phone' }], width: 6 },
          ]
        },
        { type: 'email', key: `${p}email`, label: 'Email Address' },
        // Insurance (agent fills — pre-populated if available)
        {
          type: 'panel', title: 'Insurance Details', key: `${p}insurancePanel`, collapsed: true,
          components: [
            { type: 'htmlelement', key: `${p}insNote`,
              content: '<p style="font-size:12px;color:#6b7280">Optional — agent can complete during the agreement. Required on the final FM00100.</p>' },
            {
              type: 'columns', key: `${p}insLandlordRow`,
              columns: [
                { components: [{ type: 'textfield', key: `${p}insurance_landlords_insurer`, label: "Landlord's Insurance — Insurer" }], width: 6 },
                { components: [{ type: 'textfield', key: `${p}insurance_landlords_policy_no`, label: 'Policy No.' }], width: 4 },
                { components: [{ type: 'textfield', key: `${p}insurance_landlords_expiry`, label: 'Expiry' }], width: 2 },
              ]
            },
            {
              type: 'columns', key: `${p}insBuildingRow`,
              columns: [
                { components: [{ type: 'textfield', key: `${p}insurance_building_insurer`, label: 'Building Insurance — Insurer' }], width: 6 },
                { components: [{ type: 'textfield', key: `${p}insurance_building_policy_no`, label: 'Policy No.' }], width: 4 },
                { components: [{ type: 'textfield', key: `${p}insurance_building_expiry`, label: 'Expiry' }], width: 2 },
              ]
            },
            {
              type: 'columns', key: `${p}insContentsRow`,
              columns: [
                { components: [{ type: 'textfield', key: `${p}insurance_contents_insurer`, label: 'Contents Insurance — Insurer' }], width: 6 },
                { components: [{ type: 'textfield', key: `${p}insurance_contents_policy_no`, label: 'Policy No.' }], width: 4 },
                { components: [{ type: 'textfield', key: `${p}insurance_contents_expiry`, label: 'Expiry' }], width: 2 },
              ]
            },
          ]
        },
      ]
    };
  };

  return [
    // ── Step 1: Principal (Owner) ───────────────────────────────────────────
    {
      type: 'panel', title: 'Step 1 — Principal (Owner)', key: 'step1',
      components: [
        {
          type: 'htmlelement', key: 'step1Note',
          content: '<p style="font-size:13px;color:#6b7280;margin-bottom:16px">Details of the owner(s) authorising the agent to manage this property. Pre-filled from the client intake form.</p>'
        },
        // How many owners?
        {
          type: 'select', key: 'management_authority__owner_count', label: 'Number of Owners',
          defaultValue: '1',
          data: { values: [
            { label: '1', value: '1' },
            { label: '2', value: '2' },
            { label: '3', value: '3' },
            { label: '4', value: '4' },
          ]},
        },
        ownerPanel(0),
        ownerPanel(1),
        ownerPanel(2),
        ownerPanel(3),
        // RTA contact
        {
          type: 'checkbox', key: 'management_authority__rta_same_as_principal',
          label: 'Person to be notified under the Residential Tenancies Act is same as Principal',
          defaultValue: true,
        },
      ]
    },

    // ── Step 2: Property ───────────────────────────────────────────────────
    {
      type: 'panel', title: 'Step 2 — Property', key: 'step2',
      components: [
        { type: 'textfield', key: 'property__address_street', label: 'Street Address', validate: { required: true } },
        {
          type: 'columns', key: 'propAddrRow',
          columns: [
            { components: [{ type: 'textfield', key: 'property__address_suburb', label: 'Suburb' }], width: 5 },
            { components: [{
              type: 'select', key: 'property__address_state', label: 'State', defaultValue: 'NSW',
              data: { values: ['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s => ({ label: s, value: s })) }
            }], width: 3 },
            { components: [{ type: 'textfield', key: 'property__address_postcode', label: 'Postcode' }], width: 4 },
          ]
        },
        {
          type: 'columns', key: 'propDetailsRow',
          columns: [
            { components: [{
              type: 'select', key: 'property__type', label: 'Property Type',
              data: { values: [
                { label: 'House', value: 'house' },
                { label: 'Unit/Apartment', value: 'unit' },
                { label: 'Townhouse', value: 'townhouse' },
                { label: 'Villa', value: 'villa' },
                { label: 'Duplex', value: 'duplex' },
                { label: 'Rural', value: 'rural' },
                { label: 'Commercial', value: 'commercial' },
              ]}
            }], width: 4 },
            { components: [{ type: 'number', key: 'property__bedrooms', label: 'Bedrooms' }], width: 2 },
            { components: [{ type: 'number', key: 'property__bathrooms', label: 'Bathrooms' }], width: 2 },
            { components: [{ type: 'number', key: 'property__car_spaces', label: 'Car Spaces' }], width: 4 },
          ]
        },
        {
          type: 'columns', key: 'propFeaturesRow',
          columns: [
            { components: [{
              type: 'select', key: 'property__is_furnished', label: 'Furnished?',
              defaultValue: 'no',
              data: { values: [
                { label: 'No — unfurnished', value: 'no' },
                { label: 'Fully furnished', value: 'fully' },
                { label: 'Partially furnished', value: 'partial' },
              ]}
            }], width: 4 },
            { components: [{ type: 'checkbox', key: 'property__is_strata', label: 'Strata Scheme' }], width: 4 },
            { components: [{ type: 'checkbox', key: 'property__has_pool', label: 'Swimming Pool' }], width: 4 },
          ]
        },
        // Strata details (conditional)
        {
          type: 'columns', key: 'strataRow',
          conditional: { show: true, when: 'property__is_strata', eq: 'true' },
          columns: [
            { components: [{ type: 'textfield', key: 'property__strata__plan_no', label: 'Strata Plan No.' }], width: 6 },
            { components: [{ type: 'textfield', key: 'property__strata__lot_no', label: 'Lot No.' }], width: 6 },
          ]
        },
        {
          type: 'select', key: 'property__current_situation', label: 'Current Situation',
          data: { values: [
            { label: 'Vacant', value: 'vacant' },
            { label: 'Owner occupied', value: 'owner_occupied' },
            { label: 'Tenanted', value: 'tenanted' },
          ]}
        },
        { type: 'textfield', key: 'property__access_method', label: 'Key / Access Method' },
        { type: 'checkbox', key: 'property__whs_without_risk', label: 'Property can be inspected without work health and safety risks' },
      ]
    },

    // ── Step 3: Agreement & Rent ───────────────────────────────────────────
    {
      type: 'panel', title: 'Step 3 — Agreement & Rent', key: 'step3',
      components: [
        {
          type: 'htmlelement', key: 'step3AgmtNote',
          content: '<h4 style="font-size:13px;font-weight:700;margin-bottom:8px">Agreement Period</h4>'
        },
        {
          type: 'columns', key: 'agmtDatesRow',
          columns: [
            { components: [{ type: 'datetime', key: 'management_authority__start_date', label: 'Agreement Start Date', format: 'dd/MM/yyyy', enableDate: true, enableTime: false }], width: 6 },
            { components: [{ type: 'datetime', key: 'management_authority__end_date', label: 'Agreement End Date (if fixed)', format: 'dd/MM/yyyy', enableDate: true, enableTime: false }], width: 6 },
          ]
        },
        {
          type: 'columns', key: 'agmtTermRow',
          columns: [
            { components: [{
              type: 'select', key: 'management_authority__term_fixed', label: 'Agreement Term',
              data: { values: [
                { label: 'Fixed term', value: 'fixed' },
                { label: 'Continuing (no end date)', value: 'continuing' },
              ]}
            }], width: 6 },
            { components: [{ type: 'number', key: 'management_authority__termination_notice_days', label: 'Termination Notice Period (days)', defaultValue: 30 }], width: 6 },
          ]
        },
        {
          type: 'htmlelement', key: 'step3RentNote',
          content: '<h4 style="font-size:13px;font-weight:700;margin:16px 0 8px">Proposed Tenancy & Rent</h4>'
        },
        {
          type: 'columns', key: 'rentRow',
          columns: [
            { components: [{ type: 'number', key: 'management_authority__rent_amount', label: 'Rent Amount ($)', validate: { required: true } }], width: 5 },
            { components: [{
              type: 'select', key: 'management_authority__rent_period', label: 'Per',
              defaultValue: 'per week',
              data: { values: [
                { label: 'per week', value: 'per week' },
                { label: 'per fortnight', value: 'per fortnight' },
                { label: 'per month', value: 'per month' },
              ]}
            }], width: 4 },
            { components: [{ type: 'number', key: 'management_authority__rental_bond_weeks', label: 'Bond (weeks)', defaultValue: 4 }], width: 3 },
          ]
        },
        {
          type: 'columns', key: 'leaseRow',
          columns: [
            { components: [{ type: 'textfield', key: 'management_authority__lease_term', label: 'Preferred Lease Term (e.g. 12 months)' }], width: 6 },
            { components: [{ type: 'datetime', key: 'management_authority__preferred_start_date', label: 'Preferred Tenancy Start', format: 'dd/MM/yyyy', enableDate: true, enableTime: false }], width: 6 },
          ]
        },
      ]
    },

    // ── Step 4: Fees & Remuneration ────────────────────────────────────────
    {
      type: 'panel', title: 'Step 4 — Fees & Remuneration', key: 'step4',
      components: [
        {
          type: 'htmlelement', key: 'feesNote',
          content: '<p style="font-size:12px;color:#6b7280;margin-bottom:16px">Pre-filled from agency defaults. Adjust per transaction where needed. All amounts should be inclusive of GST (PSBA Act 2002).</p>'
        },
        {
          type: 'columns', key: 'mgmtFeeRow',
          columns: [
            { components: [{ type: 'number', key: 'fees__management_percent', label: 'Management Fee (%)', placeholder: '8.80' }], width: 5 },
            { components: [{ type: 'checkbox', key: 'fees__management_inc_gst', label: 'Includes GST', defaultValue: true }], width: 7 },
          ]
        },
        {
          type: 'columns', key: 'lettingRow',
          columns: [
            { components: [{ type: 'textfield', key: 'fees__letting_fee_weeks', label: 'Letting / Leasing Fee', placeholder: '1 weeks rent + GST' }], width: 6 },
            { components: [{ type: 'number', key: 'fees__admin_fee', label: 'Admin / Sundry Fee ($)', placeholder: '15.00' }], width: 3 },
            { components: [{
              type: 'select', key: 'fees__admin_fee_period', label: 'Period', defaultValue: 'per month',
              data: { values: [{ label: 'per month', value: 'per month' }, { label: 'per annum', value: 'per annum' }] }
            }], width: 3 },
          ]
        },
        {
          type: 'columns', key: 'renewalFeeRow',
          columns: [
            { components: [{ type: 'number', key: 'fees__lease_renewal_fee', label: 'Lease Renewal Fee ($)', placeholder: '330.00' }], width: 6 },
            { components: [{ type: 'number', key: 'fees__tribunal_fee', label: 'Tribunal / NCAT Fee ($)', placeholder: '110.00' }], width: 6 },
          ]
        },
        {
          type: 'htmlelement', key: 'otherFeesNote',
          content: '<h4 style="font-size:13px;font-weight:700;margin:16px 0 8px">Other Fees (if applicable)</h4>'
        },
        {
          type: 'datagrid', key: 'fees__other', label: 'Other Fees',
          addAnotherPosition: 'bottom',
          components: [
            { type: 'textfield', key: 'description', label: 'Description' },
            { type: 'number', key: 'amount', label: 'Amount ($)' },
          ]
        },
      ]
    },

    // ── Step 5: Authority & Disbursements ──────────────────────────────────
    {
      type: 'panel', title: 'Step 5 — Authority & Disbursements', key: 'step5',
      components: [
        // Repairs limit
        {
          type: 'htmlelement', key: 'repairsNote',
          content: '<h4 style="font-size:13px;font-weight:700;margin-bottom:8px">Repairs Authority (Clause 16)</h4>'
        },
        {
          type: 'number', key: 'management_authority__repairs_limit',
          label: 'Agent may authorise repairs up to ($) without owner approval',
          placeholder: '500',
        },
        // Powers
        {
          type: 'htmlelement', key: 'powersNote',
          content: '<h4 style="font-size:13px;font-weight:700;margin:16px 0 8px">Authority Granted to Agent</h4>'
        },
        { type: 'checkbox', key: 'management_authority__authority_select_tenants', label: 'Select tenants', defaultValue: true },
        { type: 'checkbox', key: 'management_authority__authority_sign_tenancy', label: 'Execute tenancy agreements on owner\'s behalf', defaultValue: true },
        { type: 'checkbox', key: 'management_authority__authority_collect_rent', label: 'Collect rent', defaultValue: true },
        { type: 'checkbox', key: 'management_authority__authority_receive_bond', label: 'Receive and disburse rental bonds', defaultValue: true },
        { type: 'checkbox', key: 'management_authority__authority_serve_notices', label: 'Serve notices under the Residential Tenancies Act', defaultValue: true },
        { type: 'checkbox', key: 'management_authority__authority_commence_proceedings', label: 'Commence proceedings in NCAT on owner\'s behalf', defaultValue: false },
        // Disbursements
        {
          type: 'htmlelement', key: 'disbNote',
          content: '<h4 style="font-size:13px;font-weight:700;margin:16px 0 8px">Disbursements — Pay from Rental Income</h4>'
        },
        { type: 'checkbox', key: 'management_authority__disb_repairs_maintenance', label: 'Repairs and maintenance', defaultValue: true },
        { type: 'checkbox', key: 'management_authority__disb_council_rates', label: 'Council rates' },
        { type: 'checkbox', key: 'management_authority__disb_water_rates', label: 'Water and sewerage rates' },
        { type: 'checkbox', key: 'management_authority__disb_insurance', label: 'Insurance premiums' },
        { type: 'checkbox', key: 'management_authority__disb_strata_levies', label: 'Strata levies' },
        { type: 'checkbox', key: 'management_authority__disb_maintenance_contracts', label: 'Maintenance service contracts (e.g. pest control, gardening)' },
        // Utilities
        {
          type: 'htmlelement', key: 'utilitiesNote',
          content: '<h4 style="font-size:13px;font-weight:700;margin:16px 0 8px">Smoke Alarms & Water Efficiency</h4>'
        },
        { type: 'checkbox', key: 'utilities__smoke_alarm__compliant', label: 'Smoke alarms are installed and compliant with legislation' },
        {
          type: 'select', key: 'utilities__water__efficiency_cert_obtained', label: 'Water efficiency certificate obtained?',
          data: { values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }, { label: 'N/A', value: 'na' }] }
        },
        // Payment method
        {
          type: 'htmlelement', key: 'paymentNote',
          content: '<h4 style="font-size:13px;font-weight:700;margin:16px 0 8px">Rental Disbursement Method</h4>'
        },
        {
          type: 'select', key: 'management_authority__payment_method', label: 'Disburse rent to owner via',
          defaultValue: 'eft',
          data: { values: [
            { label: 'EFT (bank transfer)', value: 'eft' },
            { label: 'Cheque', value: 'cheque' },
          ]}
        },
        {
          type: 'select', key: 'management_authority__disbursement_frequency', label: 'Disbursement Frequency',
          defaultValue: 'monthly',
          data: { values: [
            { label: 'Monthly', value: 'monthly' },
            { label: 'Fortnightly', value: 'fortnightly' },
            { label: 'Weekly', value: 'weekly' },
          ]}
        },
      ]
    },

    // ── Step 6: Disclosures ────────────────────────────────────────────────
    {
      type: 'panel', title: 'Step 6 — Material Facts & Disclosures', key: 'step6',
      components: [
        {
          type: 'htmlelement', key: 'disclosureNote',
          content: `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:12px 14px;font-size:12px;color:#92400e;margin-bottom:16px">
            <strong>⚠ Mandatory disclosure</strong> — The Property, Stock and Business Agents Act 2002 (NSW) requires
            the agent to disclose material facts to the owner before entering into this agreement.
            All questions must be answered.
          </div>`
        },
        {
          type: 'radio', key: 'disclosure__flooding_bushfire',
          label: 'In the 5 years before this agreement, has the property been subject to flooding or bush fire?',
          values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
          validate: { required: true }
        },
        {
          type: 'radio', key: 'disclosure__health_safety_risks',
          label: 'Are there any health or safety risks that are not immediately apparent on inspection of the property?',
          values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
          validate: { required: true }
        },
        {
          type: 'radio', key: 'disclosure__murder_manslaughter',
          label: 'Has there been a murder or manslaughter at the property in the last 5 years?',
          values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
          validate: { required: true }
        },
        {
          type: 'radio', key: 'disclosure__loose_fill_asbestos',
          label: 'Is the property listed on the Loose-Fill Asbestos Insulation Register?',
          values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
          validate: { required: true }
        },
        {
          type: 'radio', key: 'disclosure__prohibited_drug',
          label: 'Has the property been used for the manufacture of a prohibited drug or plant within the last 2 years?',
          values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
          validate: { required: true }
        },
        {
          type: 'radio', key: 'disclosure__combustible_cladding_order',
          label: 'Is there a rectification order or fire safety order related to combustible cladding on this property?',
          values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
          validate: { required: true }
        },
        {
          type: 'radio', key: 'disclosure__combustible_cladding_da',
          label: 'Is there an approved development application for rectification of combustible cladding on this property?',
          values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
          validate: { required: true }
        },
        {
          type: 'radio', key: 'disclosure__other_adverse_matters',
          label: 'Are there any other matters that may adversely affect the use and enjoyment of the property?',
          values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
          validate: { required: true }
        },
        // Notes for any Yes answers
        {
          type: 'textarea', key: 'disclosure__notes',
          label: 'If any answer is Yes, please provide details:',
          conditional: {
            show: true,
            json: { or: [
              { '===': [{ var: 'disclosure__flooding_bushfire' }, 'yes'] },
              { '===': [{ var: 'disclosure__health_safety_risks' }, 'yes'] },
              { '===': [{ var: 'disclosure__murder_manslaughter' }, 'yes'] },
              { '===': [{ var: 'disclosure__loose_fill_asbestos' }, 'yes'] },
              { '===': [{ var: 'disclosure__prohibited_drug' }, 'yes'] },
              { '===': [{ var: 'disclosure__combustible_cladding_order' }, 'yes'] },
              { '===': [{ var: 'disclosure__combustible_cladding_da' }, 'yes'] },
              { '===': [{ var: 'disclosure__other_adverse_matters' }, 'yes'] },
            ]}
          }
        },
      ]
    },

    // ── Step 7: Bank Accounts ──────────────────────────────────────────────
    {
      type: 'panel', title: 'Step 7 — Bank Accounts', key: 'step7',
      components: [
        // Owner bank — where rent is remitted to
        {
          type: 'panel', title: "Owner's Bank Account — Rent Remittance", key: 'ownerBankPanel',
          components: [
            {
              type: 'htmlelement', key: 'ownerBankNote',
              content: '<p style="font-size:12px;color:#6b7280;margin-bottom:12px">Pre-filled from client intake. This is where the agent remits rent to the owner after deducting management fees.</p>'
            },
            {
              type: 'columns', key: 'ownerBankRow1',
              columns: [
                { components: [{ type: 'textfield', key: 'owner_bank__bank_name', label: 'Bank Name', placeholder: 'Commonwealth Bank' }], width: 6 },
                { components: [{ type: 'textfield', key: 'owner_bank__account_name', label: 'Account Name' }], width: 6 },
              ]
            },
            {
              type: 'columns', key: 'ownerBankRow2',
              columns: [
                { components: [{ type: 'textfield', key: 'owner_bank__bsb', label: 'BSB', placeholder: '062-000' }], width: 4 },
                { components: [{ type: 'textfield', key: 'owner_bank__account_no', label: 'Account Number', placeholder: '12345678' }], width: 8 },
              ]
            },
          ]
        },
        // Agency trust account — where rent is received from tenants
        {
          type: 'panel', title: 'Agency Trust Account — Rent Collection', key: 'trustPanel',
          components: [
            {
              type: 'htmlelement', key: 'trustNote',
              content: '<p style="font-size:12px;color:#6b7280;margin-bottom:12px">The agency trust account is pre-filled from the agency profile. Tenants pay rent into this account.</p>'
            },
            {
              type: 'columns', key: 'trustRow1',
              columns: [
                { components: [{ type: 'textfield', key: 'trust__bank_name', label: 'Bank Name' }], width: 6 },
                { components: [{ type: 'textfield', key: 'trust__account_name', label: 'Account Name' }], width: 6 },
              ]
            },
            {
              type: 'columns', key: 'trustRow2',
              columns: [
                { components: [{ type: 'textfield', key: 'trust__bsb', label: 'BSB' }], width: 4 },
                { components: [{ type: 'textfield', key: 'trust__account_no', label: 'Account Number' }], width: 8 },
              ]
            },
          ]
        },
      ]
    },

    // ── Step 8: Review & Submit ────────────────────────────────────────────
    {
      type: 'panel', title: 'Step 8 — Review & Submit', key: 'step8',
      components: [
        {
          type: 'htmlelement', key: 'reviewNote',
          content: `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:14px 16px;font-size:13px;color:#166534;margin-bottom:16px">
            <strong>✓ Almost done</strong> — Review all details below before submitting.
            The completed FM00100 will be generated and available for download and e-signature.
          </div>`
        },
        // Hidden metadata fields
        { type: 'hidden', key: '_transaction_id', input: true },
        { type: 'hidden', key: '_prefilled_at', input: true },
        { type: 'hidden', key: '_agency_id', input: true },
        // Agreement date
        { type: 'datetime', key: 'management_authority__agreement_date', label: 'Agreement Date', format: 'dd/MM/yyyy', enableDate: true, enableTime: false, defaultValue: 'today' },
        // Signatory details
        {
          type: 'htmlelement', key: 'signatoryNote',
          content: '<h4 style="font-size:13px;font-weight:700;margin:16px 0 8px">Agent / Licensee</h4>'
        },
        {
          type: 'columns', key: 'agentRow',
          columns: [
            { components: [{ type: 'textfield', key: 'agent__name', label: 'Agency Name' }], width: 6 },
            { components: [{ type: 'textfield', key: 'agent__licence_no', label: 'Licence No.' }], width: 6 },
          ]
        },
        {
          type: 'columns', key: 'agentContactRow',
          columns: [
            { components: [{ type: 'textfield', key: 'agent__abn', label: 'ABN' }], width: 4 },
            { components: [{ type: 'email', key: 'agent__email', label: 'Agent Email' }], width: 4 },
            { components: [{ type: 'phoneNumber', key: 'agent__phone_work', label: 'Phone' }], width: 4 },
          ]
        },
        { type: 'button', label: 'Submit & Generate FM00100', key: 'submit', action: 'submit', theme: 'primary' },
      ]
    },
  ];
}

module.exports = router;
