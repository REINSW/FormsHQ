#!/usr/bin/env node
/**
 * REI Forms Prototype Setup Script
 * Run once after cloning: node scripts/setup.js
 * 
 * What it does:
 *  1. Runs the Supabase schema migration
 *  2. Creates Form.io forms (intake + FM00100 wizard)
 *  3. Verifies connectivity
 */

require('dotenv').config({ path: require('path').join(__dirname, '../api/.env') });
const { Pool } = require('pg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const FORMIO_BASE = process.env.FORMIO_BASE_URL;
const API_KEY = process.env.FORMIO_API_KEY;

async function runSetup() {
  console.log('\n🔧 REI Forms Prototype Setup\n');

  // 1. Database
  console.log('1. Running database schema migration...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const schema = fs.readFileSync(path.join(__dirname, '../api/db/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('   ✅ Database schema applied');
  } catch (err) {
    console.error('   ❌ Database error:', err.message);
    console.error('   → Check DATABASE_URL in api/.env');
  } finally {
    await pool.end();
  }

  // 2. Form.io connectivity check
  console.log('\n2. Checking Form.io connectivity...');
  try {
    const res = await axios.get(`${FORMIO_BASE}/form?limit=1`, {
      headers: { 'x-token': API_KEY }
    });
    console.log('   ✅ Form.io connected:', FORMIO_BASE);
  } catch (err) {
    console.error('   ❌ Form.io error:', err.response?.status, err.message);
    console.error('   → Check FORMIO_BASE_URL and FORMIO_API_KEY in api/.env');
  }

  // 3. Form.io - create intake form
  console.log('\n3. Creating Form.io forms...');
  await upsertFormioForm('intake/residential-pm', buildIntakeFormDef());
  await upsertFormioForm('wizard/fm00100', buildWizardFormDef());

  // 4. Template check
  console.log('\n4. Checking PDF template...');
  const templatePath = path.join(__dirname, '../assets/FM00100_template.pdf');
  if (fs.existsSync(templatePath)) {
    console.log('   ✅ FM00100 template found');
  } else {
    console.error('   ❌ Template not found at assets/FM00100_template.pdf');
    console.error('   → Copy the FM00100 PDF to assets/FM00100_template.pdf');
  }

  console.log('\n✅ Setup complete!\n');
  console.log('Next steps:');
  console.log('  cd api && npm install && npm run dev');
  console.log('  cd frontend && npm install && npm start');
  console.log('\nLogin: agent@demopm.com.au / demo1234\n');
}

async function upsertFormioForm(path, definition) {
  const client = axios.create({
    baseURL: FORMIO_BASE,
    headers: { 'x-token': API_KEY, 'Content-Type': 'application/json' }
  });
  try {
    await client.get(`/${path}`);
    console.log(`   ℹ️  Form already exists: ${path}`);
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        await client.post('/form', definition);
        console.log(`   ✅ Form created: ${path}`);
      } catch (createErr) {
        console.error(`   ❌ Failed to create ${path}:`, createErr.response?.data?.message || createErr.message);
      }
    } else {
      console.error(`   ❌ Form.io error for ${path}:`, err.message);
    }
  }
}

function buildIntakeFormDef() {
  return {
    title: 'Residential PM Intake',
    name: 'residentialPmIntake',
    path: 'intake/residential-pm',
    type: 'form',
    components: [
      { type: 'hidden', key: 'intake_token', input: true },
      {
        type: 'panel', title: 'Your Details', key: 'ownerPanel', collapsible: false,
        components: [
          { type: 'textfield', key: 'owner_full_name', label: 'Full Name', validate: { required: true }, placeholder: 'Jane Smith' },
          { type: 'email', key: 'owner_email', label: 'Email Address', validate: { required: true } },
          { type: 'textfield', key: 'owner_mobile', label: 'Mobile Number', validate: { required: true } },
          { type: 'textfield', key: 'owner_phone_work', label: 'Work Phone' },
          { type: 'textfield', key: 'owner_address', label: 'Your Residential Address', validate: { required: true } },
          { type: 'textfield', key: 'owner_suburb', label: 'Suburb' },
          { type: 'textfield', key: 'owner_state', label: 'State', defaultValue: 'NSW' },
          { type: 'textfield', key: 'owner_postcode', label: 'Postcode' },
          { type: 'textfield', key: 'owner_abn', label: 'ABN / ACN (if applicable)' },
          { type: 'checkbox', key: 'owner_gst_registered', label: 'GST Registered' }
        ]
      },
      {
        type: 'panel', title: 'Property to be Managed', key: 'propertyPanel',
        components: [
          { type: 'textfield', key: 'property_address', label: 'Street Address', validate: { required: true } },
          { type: 'textfield', key: 'property_suburb', label: 'Suburb', validate: { required: true } },
          { type: 'textfield', key: 'property_state', label: 'State', defaultValue: 'NSW' },
          { type: 'textfield', key: 'property_postcode', label: 'Postcode' },
          { type: 'checkbox', key: 'property_furnished', label: 'Property is furnished' },
          { type: 'checkbox', key: 'property_strata', label: 'Property is in a strata scheme' },
          { type: 'textfield', key: 'property_strata_plan_no', label: 'Strata Plan No. (if applicable)' },
          { type: 'checkbox', key: 'property_has_pool', label: 'Property has a swimming pool' }
        ]
      },
      {
        type: 'panel', title: 'Rental Preferences', key: 'rentalPanel',
        components: [
          { type: 'number', key: 'expected_rent', label: 'Expected Weekly Rent ($)' },
          { type: 'number', key: 'rental_bond_weeks', label: 'Bond (weeks)', defaultValue: 4 },
          { type: 'textfield', key: 'preferred_lease_term', label: 'Preferred Lease Term' }
        ]
      },
      {
        type: 'panel', title: 'Disbursements', key: 'disbPanel',
        components: [
          { type: 'checkbox', key: 'disb_council_rates', label: 'Pay council rates from rental income' },
          { type: 'checkbox', key: 'disb_water_rates', label: 'Pay water/sewerage rates from rental income' },
          { type: 'checkbox', key: 'disb_insurance', label: 'Pay insurance premiums from rental income' },
          { type: 'checkbox', key: 'disb_strata_levies', label: 'Pay strata levies from rental income' }
        ]
      },
      {
        type: 'panel', title: 'Bank Details for Rental Payments', key: 'bankPanel',
        components: [
          {
            type: 'htmlelement',
            content: '<div style="padding:10px 14px;background:#fff4d6;border:1px solid #fde68a;border-radius:6px;font-size:13px;margin-bottom:12px;"><strong>Secure</strong> — these details are only used to remit your rental income.</div>',
            key: 'bankNote'
          },
          { type: 'textfield', key: 'bank_account_name', label: 'Account Name' },
          { type: 'textfield', key: 'bank_bsb', label: 'BSB' },
          { type: 'textfield', key: 'bank_account_no', label: 'Account Number' }
        ]
      },
      { type: 'button', label: 'Submit', key: 'submit', action: 'submit' }
    ]
  };
}

function buildWizardFormDef() {
  return {
    title: 'FM00100 — Exclusive Management Agency Agreement (Residential)',
    name: 'fm00100Wizard',
    path: 'wizard/fm00100',
    type: 'form', display: 'wizard',
    components: [
      {
        type: 'panel', title: 'Principal (Owner) Details', key: 'page1',
        components: [
          { type: 'textfield', key: 'party_0__full_name', label: 'Full Name', validate: { required: true } },
          { type: 'textfield', key: 'party_0__company_name', label: 'Company Name (if applicable)' },
          { type: 'textfield', key: 'party_0__abn', label: 'ABN / ACN' },
          { type: 'checkbox', key: 'party_0__is_gst_registered', label: 'GST Registered' },
          { type: 'textfield', key: 'party_0__address', label: 'Address', validate: { required: true } },
          { type: 'textfield', key: 'party_0__suburb', label: 'Suburb' },
          { type: 'textfield', key: 'party_0__state', label: 'State', defaultValue: 'NSW' },
          { type: 'textfield', key: 'party_0__postcode', label: 'Postcode' },
          { type: 'textfield', key: 'party_0__phone_work', label: 'Phone (Work)' },
          { type: 'textfield', key: 'party_0__phone_mobile', label: 'Mobile' },
          { type: 'email', key: 'party_0__email', label: 'Email', validate: { required: true } }
        ]
      },
      {
        type: 'panel', title: 'Property', key: 'page2',
        components: [
          { type: 'textfield', key: 'property__street_address', label: 'Street Address', validate: { required: true } },
          { type: 'textfield', key: 'property__suburb', label: 'Suburb' },
          { type: 'textfield', key: 'property__state', label: 'State', defaultValue: 'NSW' },
          { type: 'textfield', key: 'property__postcode', label: 'Postcode' },
          { type: 'checkbox', key: 'property__is_furnished', label: 'Furnished' },
          { type: 'checkbox', key: 'property__has_garage', label: 'Garage / Car Space Included' },
          { type: 'checkbox', key: 'property__is_strata', label: 'Strata Scheme' },
          { type: 'textfield', key: 'property__strata_plan_no', label: 'Strata Plan No.', conditional: { show: true, when: 'property__is_strata', eq: true } }
        ]
      },
      {
        type: 'panel', title: 'Agreement & Leasing', key: 'page3',
        components: [
          { type: 'textfield', key: 'agreement__start_date', label: 'Agreement Commencement Date (DD/MM/YYYY)' },
          { type: 'textfield', key: 'agreement__termination_days', label: 'Termination Notice (days)', defaultValue: '30' },
          { type: 'textfield', key: 'leasing__term', label: 'Term of Tenancy' },
          { type: 'number', key: 'leasing__rent_amount', label: 'Rent Amount ($)' },
          {
            type: 'select', key: 'leasing__rent_period', label: 'Rent Period',
            data: { values: [{ label: 'Weekly', value: 'weekly' }, { label: 'Fortnightly', value: 'fortnightly' }, { label: 'Monthly', value: 'monthly' }] }
          },
          { type: 'number', key: 'leasing__rental_bond_weeks', label: 'Bond (weeks)', defaultValue: 4 }
        ]
      },
      {
        type: 'panel', title: 'Agent Remuneration', key: 'page4',
        components: [
          { type: 'textfield', key: 'fees__letting_fee', label: 'Leasing Fee' },
          { type: 'number', key: 'fees__admin_fee', label: 'Tenancy Preparation Fee ($)' },
          { type: 'number', key: 'fees__management_pct', label: 'Management Fee (%)' },
          { type: 'textfield', key: 'fees__lease_renewal_fee', label: 'Lease Renewal Fee' }
        ]
      },
      {
        type: 'panel', title: 'Authority & Disbursements', key: 'page5',
        components: [
          { type: 'number', key: 'authority__repairs_limit', label: 'Repairs Limit ($)', defaultValue: 500 },
          { type: 'checkbox', key: 'authority__select_tenants', label: 'Select tenants', defaultValue: true },
          { type: 'checkbox', key: 'authority__sign_tenancy', label: 'Sign tenancy agreements', defaultValue: true },
          { type: 'checkbox', key: 'authority__collect_rent', label: 'Collect rent', defaultValue: true },
          { type: 'checkbox', key: 'authority__receive_bond', label: 'Receive and disburse bonds', defaultValue: true },
          { type: 'checkbox', key: 'authority__ncat_proceedings', label: 'NCAT proceedings', defaultValue: true },
          { type: 'checkbox', key: 'disb__council_rates', label: 'Pay council rates' },
          { type: 'checkbox', key: 'disb__water_rates', label: 'Pay water/sewerage rates' },
          { type: 'checkbox', key: 'disb__insurance', label: 'Pay insurance premiums' },
          { type: 'checkbox', key: 'disb__strata_levies', label: 'Pay strata levies' }
        ]
      },
      {
        type: 'panel', title: 'Material Facts & Disclosures', key: 'page6',
        components: [
          {
            type: 'htmlelement', key: 'discNote',
            content: '<div style="padding:12px 16px;background:#fff4d6;border-left:4px solid #f59e0b;border-radius:4px;font-size:13px;margin-bottom:16px;"><strong>Required disclosures</strong> under the Residential Tenancies Act 2010 (NSW)</div>'
          },
          { type: 'radio', key: 'disclosure__flooding', label: 'Flooding or bushfire in last 5 years?', values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], validate: { required: true } },
          { type: 'radio', key: 'disclosure__health_safety', label: 'Significant health or safety risks?', values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], validate: { required: true } },
          { type: 'radio', key: 'disclosure__violent_crime', label: 'Serious violent crime in last 5 years?', values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], validate: { required: true } },
          { type: 'radio', key: 'disclosure__asbestos', label: 'Listed on LFAI (Loose-fill Asbestos) Register?', values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], validate: { required: true } },
          { type: 'radio', key: 'disclosure__proposed_sale', label: 'Proposed sale of the premises?', values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], validate: { required: true } },
          { type: 'radio', key: 'disclosure__water_efficiency', label: 'Premises have prescribed water efficiency measures?', values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], validate: { required: true } },
          { type: 'checkbox', key: 'property__has_pool', label: 'Swimming pool on property' },
          { type: 'radio', key: 'disclosure__pool_registered', label: 'Pool registered on NSW Swimming Pool Register?', values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], conditional: { show: true, when: 'property__has_pool', eq: true } }
        ]
      },
      {
        type: 'panel', title: 'Trust Account & Statements', key: 'page7',
        components: [
          { type: 'textfield', key: 'trust__bank_name', label: 'Bank Name' },
          { type: 'textfield', key: 'trust__account_name', label: 'Account Name' },
          { type: 'textfield', key: 'trust__bsb', label: 'BSB' },
          { type: 'textfield', key: 'trust__account_no', label: 'Account Number' }
        ]
      },
      {
        type: 'panel', title: 'Review & Submit', key: 'page8',
        components: [
          { type: 'htmlelement', key: 'reviewNote', content: '<p style="font-size:14px;line-height:1.6;color:#5B6470;">Please review all details. By clicking Submit, you confirm all information is complete and accurate, and that you have explained the agreement to the Principal.</p>' },
          { type: 'hidden', key: '_transaction_id', input: true },
          { type: 'button', label: 'Submit Management Authority', key: 'submit', action: 'submit' }
        ]
      }
    ]
  };
}

runSetup().catch(console.error);
