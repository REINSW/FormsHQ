/**
 * Pre-fill Service
 * Maps intake form responses + agency profile → FM00100 Form.io component keys
 *
 * Key naming convention (from REI_Forms_NSW_Formio_Integration_v1.docx):
 *   canonical dot notation  →  Form.io key
 *   party[0].name_full      →  party_0__name_full
 *   property.address.street →  property__address_street
 *   Dots become __ and [n] becomes _n
 *
 * SOURCE FIELDS:
 *   Intake (client fills):  owner details, property, basic leasing expectations, bank
 *   Agency profile:         agent/office details, default fees, trust account
 *   Agent completes:        agreement terms, clauses, fees, authority, disclosures, services
 */

/**
 * Build the FM00100 pre-fill payload.
 *
 * @param {object} intakeResponses  - saved in intake_requests.responses
 * @param {object} agency           - row from agencies table
 * @returns {object}                - Form.io data object keyed by canonical Form.io keys
 */
function buildFM00100Prefill(intakeResponses = {}, agency = {}) {
  const r = intakeResponses;
  const a = agency;

  // ── Owner helpers ─────────────────────────────────────────────────────────
  // Intake stores owners as owner_* (index 0) and owner2_* (index 1), etc.
  const ownerField = (idx, field) => {
    const prefix = idx === 0 ? 'owner' : `owner${idx + 1}`;
    return r[`${prefix}_${field}`] ?? '';
  };

  // Ownership type: 'individual' | 'company' | 'trust'
  const ownerType = (idx) => ownerField(idx, 'type') || 'individual';

  // How many owners did the intake identify?
  const ownerCount = (() => {
    if (ownerField(3, 'name_full') || ownerField(3, 'company_name')) return '4';
    if (ownerField(2, 'name_full') || ownerField(2, 'company_name')) return '3';
    if (ownerField(1, 'name_full') || ownerField(1, 'company_name') || ownerField(1, 'email')) return '2';
    return '1';
  })();

  // Build one owner block (0-based index)
  const ownerBlock = (idx) => {
    const prefix = `party_${idx}__`;
    const type = ownerType(idx);
    return {
      [`${prefix}is_company`]:          type,                                   // 'individual' | 'company' | 'trust'
      [`${prefix}name_full`]:           ownerField(idx, 'name_full') || ownerField(idx, 'full_name'),
      [`${prefix}trading_as`]:          ownerField(idx, 'company_name'),
      [`${prefix}abn`]:                 ownerField(idx, 'abn'),
      [`${prefix}acn`]:                 ownerField(idx, 'acn'),
      [`${prefix}gst_registered`]:      ownerField(idx, 'gst_registered') === true || ownerField(idx, 'gst_registered') === 'true',
      [`${prefix}address_street`]:      ownerField(idx, 'address') || ownerField(idx, 'address_street'),
      [`${prefix}address_suburb`]:      ownerField(idx, 'suburb')  || ownerField(idx, 'address_suburb'),
      [`${prefix}address_state`]:       ownerField(idx, 'state')   || ownerField(idx, 'address_state') || 'NSW',
      [`${prefix}address_postcode`]:    ownerField(idx, 'postcode') || ownerField(idx, 'address_postcode'),
      [`${prefix}mobile`]:              ownerField(idx, 'mobile'),
      [`${prefix}phone_work`]:          ownerField(idx, 'phone_work'),
      [`${prefix}phone_home`]:          ownerField(idx, 'phone_home'),
      [`${prefix}email`]:               ownerField(idx, 'email'),
      // Insurance — typically blank from intake, agent fills in
      [`${prefix}insurance_landlords_insurer`]:   ownerField(idx, 'insurance_landlords_insurer'),
      [`${prefix}insurance_landlords_policy_no`]: ownerField(idx, 'insurance_landlords_policy_no'),
      [`${prefix}insurance_landlords_expiry`]:    ownerField(idx, 'insurance_landlords_expiry'),
      [`${prefix}insurance_building_insurer`]:    ownerField(idx, 'insurance_building_insurer'),
      [`${prefix}insurance_building_policy_no`]:  ownerField(idx, 'insurance_building_policy_no'),
      [`${prefix}insurance_building_expiry`]:     ownerField(idx, 'insurance_building_expiry'),
      [`${prefix}insurance_contents_insurer`]:    ownerField(idx, 'insurance_contents_insurer'),
      [`${prefix}insurance_contents_policy_no`]:  ownerField(idx, 'insurance_contents_policy_no'),
      [`${prefix}insurance_contents_expiry`]:     ownerField(idx, 'insurance_contents_expiry'),
    };
  };

  return {
    // ── Owner count (auto-set from how many owners are in intake) ─────────
    'management_authority__owner_count': ownerCount,

    // ── Owner 1 (always present) ──────────────────────────────────────────
    ...ownerBlock(0),

    // ── Owner 2 (only pre-fills if intake had a second owner) ─────────────
    ...ownerBlock(1),

    // ── Owner 3 (only pre-fills if intake had a third owner) ──────────────
    ...ownerBlock(2),

    // ── Owner 4 (only pre-fills if intake had a fourth owner) ─────────────
    ...ownerBlock(3),

    // ── RTA (Residential Tenancies Act) contact ───────────────────────────
    // Defaults to "same as principal" — agent can override
    'management_authority__rta_same_as_principal': true,

    // ── Property ──────────────────────────────────────────────────────────
    'property__address_street':       r.property_address || r.property_street || '',
    'property__address_suburb':       r.property_suburb || '',
    'property__address_state':        r.property_state || 'NSW',
    'property__address_postcode':     r.property_postcode || '',
    'property__type':                 r.property_type || '',
    'property__bedrooms':             r.property_bedrooms || '',
    'property__bathrooms':            r.property_bathrooms || '',
    'property__car_spaces':           r.property_parking || r.property_car_spaces || '',
    'property__is_furnished':         r.property_furnished || r.property_is_furnished || 'no',
    'property__is_strata':            r.property_strata || r.property_is_strata || false,
    'property__strata__plan_no':      r.property_strata_plan_no || '',
    'property__strata__lot_no':       r.property_strata_lot_no || '',
    'property__has_pool':             r.property_has_pool ||
                                      (Array.isArray(r.property_features) && r.property_features.includes('swimming_pool'))
                                        ? 'yes' : 'no',
    'property__whs_without_risk':     r.property_whs_clear || false,
    'property__current_situation':    r.property_current_situation || '',
    'property__access_method':        r.property_access_method || '',

    // ── Agent / Office (from agency profile) ──────────────────────────────
    'agent__name':                    a.trading_as || a.name || '',
    'agent__licence_no':              a.licence_no || '',
    'agent__abn':                     a.abn || '',
    'agent__address_street':          a.address || '',
    'agent__address_suburb':          a.suburb || '',
    'agent__address_state':           a.state || 'NSW',
    'agent__address_postcode':        a.postcode || '',
    'agent__phone_work':              a.phone_work || '',
    'agent__email':                   a.email || '',

    // Trust account (agency's account for receiving rent FROM tenants)
    'trust__bank_name':    a.trust_bank_name    || '',
    'trust__account_name': a.trust_account_name || '',
    'trust__bsb':          a.trust_bsb          || '',
    'trust__account_no':   a.trust_account_no   || '',
    // Also store under management_authority__ namespace as canonical
    'management_authority__trust_bank_name':      a.trust_bank_name    || '',
    'management_authority__trust_account_name':   a.trust_account_name || '',
    'management_authority__trust_bsb':            a.trust_bsb          || '',
    'management_authority__trust_account_no':     a.trust_account_no   || '',

    // ── Agreement terms — agent completes these in the wizard ─────────────
    // Pre-fill expected rent from intake if provided
    'management_authority__rent_amount':          r.expected_rent || r.rent_amount || '',
    'management_authority__rent_period':          r.rent_period || 'per week',
    'management_authority__rental_bond_weeks':    r.rental_bond_weeks || '',
    'management_authority__preferred_start_date': r.preferred_start_date || '',
    'management_authority__lease_term':           r.preferred_lease_term || '',

    // ── Fees — pre-fill from agency defaults, agent adjusts ───────────────
    'fees__management_percent':       a.default_management_fee_pct || '',
    'fees__management_inc_gst':       true,
    'fees__letting_fee_weeks':        a.default_letting_fee || '',
    'fees__admin_fee':                a.default_admin_fee || '',
    'fees__admin_fee_period':         'per month',
    'fees__lease_renewal_fee':        a.default_lease_renewal_fee || '',
    'fees__tribunal_fee':             a.default_tribunal_fee || '',
    // Keep old keys as aliases so wizard can read them
    'fees__management_pct':           a.default_management_fee_pct || '',
    'fees__letting_fee':              a.default_letting_fee || '',

    // ── Disbursements — typical defaults, agent adjusts ───────────────────
    'management_authority__disb_repairs_maintenance':   true,
    'management_authority__disb_council_rates':         r.disb_council_rates || false,
    'management_authority__disb_water_rates':           r.disb_water_rates || false,
    'management_authority__disb_insurance':             r.disb_insurance || false,
    'management_authority__disb_strata_levies':         r.property_strata || r.disb_strata_levies || false,
    'management_authority__disb_maintenance_contracts': r.disb_maintenance_contracts || false,
    'management_authority__payment_method':             r.payment_method || 'eft',

    // ── Owner bank account (for remitting rent to owner) ──────────────────
    'owner_bank__bank_name':          r.bank_name || '',
    'owner_bank__account_name':       r.bank_account_name || '',
    'owner_bank__bsb':                r.bank_bsb || '',
    'owner_bank__account_no':         r.bank_account_no || '',

    // ── Compliance ────────────────────────────────────────────────────────
    'utilities__smoke_alarm__compliant':             r.smoke_alarm_compliant || false,
    'utilities__water__efficiency_cert_obtained':    r.water_efficiency_cert ? 'yes' : 'no',

    // ── Material facts (agent must review and complete — left null/blank) ─
    'disclosure__flooding_bushfire':                null,
    'disclosure__health_safety_risks':              null,
    'disclosure__murder_manslaughter':              null,
    'disclosure__loose_fill_asbestos':              null,
    'disclosure__prohibited_drug':                  null,
    'disclosure__combustible_cladding_order':       null,
    'disclosure__combustible_cladding_da':          null,
    'disclosure__other_adverse_matters':            null,

    // ── Metadata ──────────────────────────────────────────────────────────
    '_prefilled_at':    new Date().toISOString(),
    '_intake_source':   'residential_pm_intake',
    '_agency_id':       a.id || '',
  };
}

/**
 * Extract canonical data from a completed FM00100 Form.io submission
 * (reverse mapping — Form.io keys → canonical storage)
 */
function extractFromSubmission(d = {}) {
  const ownerName = (idx) => {
    const type = d[`party_${idx}__is_company`];
    return (type && type !== 'individual')
      ? d[`party_${idx}__trading_as`]
      : d[`party_${idx}__name_full`];
  };

  return {
    owner: {
      name_full:    ownerName(0),
      email:        d['party_0__email'],
      mobile:       d['party_0__mobile'],
      address:      [
        d['party_0__address_street'],
        d['party_0__address_suburb'],
        d['party_0__address_state'],
        d['party_0__address_postcode'],
      ].filter(Boolean).join(', '),
    },
    owner2: ownerName(1) ? {
      name_full: ownerName(1),
      email:     d['party_1__email'],
      mobile:    d['party_1__mobile'],
    } : null,
    property: {
      address:      d['property__address_street'],
      suburb:       d['property__address_suburb'],
      state:        d['property__address_state'],
      postcode:     d['property__address_postcode'],
      is_furnished: d['property__is_furnished'],
      is_strata:    d['property__is_strata'],
      has_pool:     d['property__has_pool'] === 'yes',
    },
    agreement: {
      start_date:       d['management_authority__start_date'],
      term_fixed:       d['management_authority__term_fixed'],
      termination_days: d['management_authority__termination_notice_days'],
    },
    leasing: {
      rent_amount:  d['management_authority__rent_amount'],
      rent_period:  d['management_authority__rent_period'],
      bond_weeks:   d['management_authority__rental_bond_weeks'],
      lease_term:   d['management_authority__lease_term'],
    },
    fees: {
      management_percent: d['fees__management_percent'],
      letting_fee_weeks:  d['fees__letting_fee_weeks'],
      admin_fee:          d['fees__admin_fee'],
      lease_renewal_fee:  d['fees__lease_renewal_fee'],
    },
    bank: {
      bank_name:    d['owner_bank__bank_name'],
      account_name: d['owner_bank__account_name'],
      bsb:          d['owner_bank__bsb'],
      account_no:   d['owner_bank__account_no'],
    },
  };
}

module.exports = { buildFM00100Prefill, extractFromSubmission };
