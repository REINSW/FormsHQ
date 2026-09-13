/**
 * FM00100Template
 * Full HTML rendering of the Exclusive Management Agency Agreement (Residential)
 * Matches REI NSW FM00100 (05/25) layout as closely as possible.
 *
 * Props:
 *   data  — flat canonical field map (Form.io wizard submission or prefill data)
 *   tx    — transaction record (for fallback client_name, property_address etc.)
 */
export default function FM00100Template({ data = {}, tx = {} }) {
  const f = data;

  // ── Value helpers ───────────────────────────────────────────────────────────
  const v = (key, fallback = '') => {
    const val = f[key];
    if (val === null || val === undefined || val === '') return fallback;
    return val;
  };

  // Address line from parts
  const addr = (...parts) => parts.filter(Boolean).join(', ') || '—';

  // Yes / No from boolean or 'yes'/'no' string
  const yn = (key) => {
    const val = f[key];
    if (val === true  || val === 'yes') return 'Yes';
    if (val === false || val === 'no')  return 'No';
    return '—';
  };

  const $ = (key, fallback = '—') => {
    const val = f[key];
    if (!val && val !== 0) return fallback;
    return `$${Number(val).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`;
  };

  const pct = (key, fallback = '—') => {
    const val = f[key];
    if (!val && val !== 0) return fallback;
    return `${val}%`;
  };

  // Owner name — individual or company
  const ownerName = (n) => {
    const name = v(`party_${n}__name_full`);
    const company = v(`party_${n}__trading_as`);
    if (name) return name;
    if (company) return company;
    if (n === 0) return v('client_name', tx.client_name || '—');
    return '';
  };

  // Owner count
  const ownerCount = parseInt(v('management_authority__owner_count', '1'));

  // ── Style tokens ────────────────────────────────────────────────────────────
  const S = {
    doc: {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: 10,
      lineHeight: 1.5,
      color: '#000',
      background: '#fff',
      maxWidth: 800,
      margin: '0 auto',
      padding: '0 0 40px',
    },
    pageHeader: {
      background: '#2c2c2c',
      color: '#fff',
      padding: '12px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 0,
    },
    formTitle: {
      fontSize: 15,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      lineHeight: 1.2,
    },
    formMeta: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.65)',
      textAlign: 'right',
    },
    body: {
      padding: '24px 32px',
    },
    actNote: {
      fontSize: 9,
      color: '#555',
      borderBottom: '1px solid #000',
      paddingBottom: 6,
      marginBottom: 16,
      fontStyle: 'italic',
    },
    sectionBar: {
      background: '#2c2c2c',
      color: '#fff',
      fontWeight: 700,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      padding: '5px 10px',
      marginTop: 18,
      marginBottom: 0,
    },
    sectionBody: {
      border: '1px solid #bbb',
      borderTop: 'none',
      padding: '10px 12px',
      marginBottom: 12,
    },
    clauseNum: {
      fontWeight: 700,
      marginRight: 6,
      flexShrink: 0,
      minWidth: 18,
    },
    clauseRow: {
      display: 'flex',
      marginBottom: 6,
      alignItems: 'flex-start',
    },
    subItem: {
      display: 'flex',
      marginBottom: 4,
      paddingLeft: 24,
      alignItems: 'flex-start',
    },
    subNum: {
      minWidth: 20,
      flexShrink: 0,
      fontStyle: 'italic',
      color: '#333',
    },
    fieldRow: {
      display: 'flex',
      alignItems: 'flex-end',
      marginBottom: 5,
      gap: 8,
    },
    fieldLabel: {
      fontSize: 9,
      color: '#555',
      flexShrink: 0,
      marginBottom: 2,
    },
    fieldValue: {
      borderBottom: '1px solid #999',
      minHeight: 16,
      flex: 1,
      fontSize: 10,
      fontWeight: 500,
      paddingBottom: 1,
      paddingLeft: 2,
    },
    fieldBlock: {
      marginBottom: 6,
    },
    twoCol: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0 16px',
    },
    threeCol: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '0 12px',
    },
    fourCol: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gap: '0 10px',
    },
    ynBox: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      marginRight: 14,
      fontSize: 10,
    },
    checkbox: (checked) => ({
      width: 10,
      height: 10,
      border: '1px solid #555',
      display: 'inline-block',
      background: checked ? '#000' : '#fff',
      marginRight: 3,
      flexShrink: 0,
      position: 'relative',
    }),
    tableHeader: {
      background: '#e8e8e8',
      fontWeight: 700,
      fontSize: 9,
      padding: '4px 8px',
      border: '1px solid #bbb',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
    tableCell: {
      fontSize: 10,
      padding: '5px 8px',
      border: '1px solid #ddd',
      verticalAlign: 'top',
    },
    signBox: {
      border: '1px solid #bbb',
      borderRadius: 2,
      padding: '12px',
      marginBottom: 10,
    },
    signLine: {
      borderBottom: '1px solid #999',
      minHeight: 28,
      marginTop: 4,
      marginBottom: 8,
    },
    pageFooter: {
      borderTop: '1px solid #bbb',
      marginTop: 24,
      paddingTop: 6,
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 9,
      color: '#777',
    },
  };

  // ── Micro-components ────────────────────────────────────────────────────────

  const Field = ({ label, value, style }) => (
    <div style={{ ...S.fieldBlock, ...style }}>
      <div style={S.fieldLabel}>{label}</div>
      <div style={S.fieldValue}>{value || ' '}</div>
    </div>
  );

  const YN = ({ value }) => {
    const isYes = value === 'Yes' || value === true || value === 'yes';
    const isNo  = value === 'No'  || value === false || value === 'no';
    return (
      <span>
        <span style={S.ynBox}>
          <span style={S.checkbox(isYes)} />
          Yes
        </span>
        <span style={S.ynBox}>
          <span style={S.checkbox(isNo)} />
          No
        </span>
      </span>
    );
  };

  const ClauseRow = ({ num, text, children }) => (
    <div style={S.clauseRow}>
      <span style={S.clauseNum}>{num}.</span>
      <div style={{ flex: 1 }}>
        {text && <span>{text}</span>}
        {children}
      </div>
    </div>
  );

  const SubItem = ({ num, text, yn: ynKey }) => (
    <div style={S.subItem}>
      <span style={S.subNum}>{num}</span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ flex: 1, paddingRight: 12 }}>{text}</span>
        {ynKey && <YN value={yn(ynKey)} />}
      </div>
    </div>
  );

  const SectionBar = ({ title }) => (
    <div style={S.sectionBar}>{title}</div>
  );

  const SectionBody = ({ children, style }) => (
    <div style={{ ...S.sectionBody, ...style }}>{children}</div>
  );

  // ── Party block ─────────────────────────────────────────────────────────────
  const PartyBlock = ({ n }) => {
    const name = ownerName(n);
    if (!name && n > 0) return null;
    const p = (field) => v(`party_${n}__${field}`);
    const label = n === 0 ? 'Principal' : `Principal ${n + 1}`;
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 4 }}>{label}</div>
        <div style={S.twoCol}>
          <Field label="Full Name / Company Name" value={name} />
          <div style={S.twoCol}>
            <Field label="ABN / ACN" value={p('abn') || p('acn')} />
            <div style={{ paddingTop: 14 }}>
              <span style={{ fontSize: 9, color: '#555' }}>GST Registered </span>
              <YN value={p('gst_registered') ? 'Yes' : 'No'} />
            </div>
          </div>
        </div>
        <Field label="Address" value={addr(p('address_street'), p('address_suburb'), p('address_state'), p('address_postcode'))} />
        <div style={S.threeCol}>
          <Field label="Phone: Work" value={p('phone_work')} />
          <Field label="Home" value={p('phone_home')} />
          <Field label="Mobile" value={p('mobile')} />
        </div>
        <Field label="Email" value={p('email')} />
      </div>
    );
  };

  // ── Fee table row ───────────────────────────────────────────────────────────
  const FeeRow = ({ label, amount, when, isPct }) => {
    if (!amount) return null;
    return (
      <tr>
        <td style={S.tableCell}>{label}</td>
        <td style={{ ...S.tableCell, textAlign: 'right', whiteSpace: 'nowrap' }}>
          {isPct ? `${amount}% of cost` : `$${amount}`}
        </td>
        <td style={S.tableCell}>{when || ''}</td>
      </tr>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div style={S.doc}>

      {/* ── DOCUMENT HEADER ─────────────────────────────────────────── */}
      <div style={S.pageHeader}>
        <div>
          <div style={S.formTitle}>Exclusive Management Agency Agreement</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
            Residential Property — NSW
          </div>
        </div>
        <div style={S.formMeta}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#b7ff4a' }}>FM00100</div>
          <div>05/25 · Property and Stock Agents Act 2002 (NSW)</div>
          <div style={{ marginTop: 2 }}>
            {v('agency__trading_as', v('agency__name', tx.agency_name || ''))}
          </div>
        </div>
      </div>

      <div style={S.body}>
        <div style={S.actNote}>
          The <em>Property and Stock Agents Act 2002</em> (NSW) and Regulation require all agents'
          instructions to be in the form of a written agreement. &nbsp;
          1st Copy: Agent's copy. &nbsp; 2nd Copy: Principal's copy.
        </div>

        {/* ── PARTIES ──────────────────────────────────────────────── */}
        <SectionBar title="Parties" />
        <SectionBody>
          {Array.from({ length: ownerCount }, (_, i) => (
            <PartyBlock key={i} n={i} />
          ))}

          <div style={{ borderTop: '1px solid #ddd', marginTop: 10, paddingTop: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 4 }}>Agent</div>
            <div style={S.twoCol}>
              <Field label="Trading As" value={v('agency__trading_as', v('agency__name'))} />
              <div style={S.twoCol}>
                <Field label="Licensee's Licence No." value={v('agency__licence_no')} />
                <div style={{ paddingTop: 14 }}>
                  <span style={{ fontSize: 9, color: '#555' }}>GST Reg </span>
                  <YN value={v('agency__gst_registered') ? 'Yes' : 'No'} />
                </div>
              </div>
            </div>
            <div style={S.twoCol}>
              <Field label="ABN / ACN" value={v('agency__abn')} />
              <Field label="Business Address" value={addr(v('agency__address'), v('agency__address_suburb'), v('agency__address_state'), v('agency__address_postcode'))} />
            </div>
            <div style={S.threeCol}>
              <Field label="Phone: Work" value={v('agency__phone')} />
              <Field label="Mobile" value={v('agency__mobile')} />
              <Field label="Email" value={v('agency__email')} />
            </div>
          </div>
        </SectionBody>

        {/* ── PREMISES ─────────────────────────────────────────────── */}
        <SectionBar title="Premises" />
        <SectionBody>
          <Field
            label="Address of Premises to be leased"
            value={addr(
              v('property__address_street'),
              v('property__address_suburb'),
              v('property__address_state'),
              v('property__address_postcode')
            )}
          />
          <div style={{ display: 'flex', gap: 32, marginTop: 6, fontSize: 10 }}>
            <span>Being: <YN value={v('property__is_furnished') === 'yes' ? 'Yes' : 'No'} /> Furnished &nbsp; <YN value={v('property__is_furnished') === 'no' ? 'Yes' : 'No'} /> Unfurnished</span>
            <span>Garage/Car Space included: <YN value={yn('property__has_garage')} /></span>
          </div>
        </SectionBody>

        {/* ── AGREEMENT ────────────────────────────────────────────── */}
        <SectionBar title="Agreement" />
        <SectionBody>
          <ClauseRow num="1" text="The Principal hereby appoints the Agent exclusively to lease and to manage the Premises in accordance with this agreement." />
          <ClauseRow num="2" text="It is agreed that the Agent may from time to time delegate to the Agent's employees all or any of the authority vested in the Agent by this agreement." />
          <ClauseRow num="3">
            <span>This agreement shall commence on the </span>
            <span style={{ borderBottom: '1px solid #999', minWidth: 100, display: 'inline-block', padding: '0 4px', fontWeight: 600 }}>
              {v('management_authority__start_date', '               ')}
            </span>
            <span> and may be terminated by either party giving not less than </span>
            <span style={{ borderBottom: '1px solid #999', minWidth: 40, display: 'inline-block', padding: '0 4px', fontWeight: 600 }}>
              {v('management_authority__termination_notice_days', '     ')}
            </span>
            <span> days written notice of termination.</span>
          </ClauseRow>

          {/* Clause 4 — Leasing */}
          <ClauseRow num="4" text="The Agent is authorised to lease all or any part of the Premises on the following conditions:">
            <div style={{ marginTop: 4 }}>
              <SubItem num="i" text={<span>Term of the tenancy agreement: <strong>{v('management_authority__leasing_term', '          ')}</strong></span>} />
              <SubItem num="ii" text={<span>Rent <strong>{$(v('management_authority__rent_amount') ? 'management_authority__rent_amount' : '', v('management_authority__rent_amount') ? undefined : '—')}</strong> per <strong>{v('management_authority__rent_period', '—')}</strong> payable in advance.</span>} />
              <SubItem num="iii" text={<span>Rental bond <strong>{$(v('management_authority__bond_amount') ? 'management_authority__bond_amount' : '', v('management_authority__bond_amount') ? undefined : '—')}</strong> or equivalent to <strong>{v('management_authority__bond_weeks', '4')}</strong> weeks rent.</span>} />
            </div>
          </ClauseRow>

          {/* Clause 5 — Special Instructions */}
          {v('management_authority__special_instructions') && (
            <ClauseRow num="5" text="Special Instructions:">
              <div style={{ borderLeft: '2px solid #ddd', paddingLeft: 8, marginTop: 4, fontStyle: 'italic', fontSize: 10 }}>
                {v('management_authority__special_instructions')}
              </div>
            </ClauseRow>
          )}

          {/* Clause 6 — Agent's Authority */}
          <ClauseRow num="6" text="At the end of each tenancy, the Agent is authorised to:">
            <div style={{ marginTop: 4 }}>
              <SubItem num="i" text={<span>Re-lease the Premises at market rent for a term not exceeding <strong>{v('management_authority__re_lease_max_term', '12 months')}</strong></span>} yn="management_authority__scope_re_lease" />
              <SubItem num="ii" text="Refer to the Principal for instructions concerning re-leasing" yn="management_authority__scope_refer_principal" />
              <SubItem num="iii" text="Review the rent when in the opinion of the Agent such a review is appropriate" yn="management_authority__scope_review_rent" />
            </div>
          </ClauseRow>
        </SectionBody>

        {/* ── AGENT'S REMUNERATION ─────────────────────────────────── */}
        <SectionBar title="Agent's Remuneration" />
        <SectionBody>
          <ClauseRow num="7" text="The Agent shall be entitled to the following fees: (GST inclusive)">
            <div style={{ marginTop: 6 }}>
              <SubItem num="i" text={<span>A leasing fee upon leasing of <strong>{v('fees__letting_fee', '—')} weeks rent</strong></span>} />
              <SubItem num="ii" text={<span>A tenancy agreement preparation fee of <strong>{$('fees__tenancy_prep_fee')}</strong></span>} />
              <SubItem num="iii" text={<span>A management fee of <strong>{pct('fees__management_percent')}</strong> of all monies collected on behalf of the Principal</span>} />
              <SubItem num="iv" text={<span>An administration fee of <strong>{$('fees__admin_fee')}</strong> per <strong>{v('fees__admin_fee_period', '—')}</strong></span>} />
              <SubItem num="v" text={<span>Lease Renewal Fee of <strong>{$('fees__lease_renewal_fee')}</strong> — {v('fees__lease_renewal_when_due', 'per lease renewal signing')}</span>} />
            </div>
          </ClauseRow>
        </SectionBody>

        {/* ── SERVICES, CHARGES AND EXPENSES ──────────────────────── */}
        <SectionBar title="Services, Charges and Expenses" />
        <SectionBody>
          <ClauseRow num="8" text="If the Agent performs any of the services below, the Agent is entitled to remuneration as set out." />
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Part A — Services</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr>
                  <th style={S.tableHeader}>Service</th>
                  <th style={{ ...S.tableHeader, width: 100 }}>Amount (GST incl.)</th>
                  <th style={{ ...S.tableHeader, width: 150 }}>When Due</th>
                </tr>
              </thead>
              <tbody>
                <FeeRow label="Attendance at tribunal/court" amount={v('fees__service_fee_court_attendance')} when={v('fees__service_fee_court_attendance_when')} />
                <FeeRow label="Preparation of tribunal/court case" amount={v('fees__service_fee_tribunal_preparation')} when={v('fees__service_fee_tribunal_preparation_when')} />
                <FeeRow label="Arranging repairs and maintenance" amount={v('fees__service_fee_repairs_arrangement')} when={v('fees__service_fee_repairs_arrangement_when')} />
                <FeeRow label="Arranging smoke alarm compliance inspections" amount={v('fees__service_fee_smoke_alarm')} when={v('fees__service_fee_smoke_alarm_when')} />
                <FeeRow label="Arrangement of refurbishment or improvements" amount={v('fees__service_fee_refurbishment')} when={v('fees__service_fee_refurbishment_when')} />
                <FeeRow label="Processing insurance claims (incl. valuations)" amount={v('fees__service_fee_insurance_processing')} when={v('fees__service_fee_insurance_processing_when')} />
                <FeeRow label="Disaster / emergency management fee" amount={v('fees__service_fee_disaster_management')} when={v('fees__service_fee_disaster_management_when')} />
                <FeeRow label="Statement / administration fees" amount={v('fees__service_fee_statements_admin')} when={v('fees__service_fee_statements_admin_when')} />
                <FeeRow label="Office expenses (postage, phone, out-of-pocket)" amount={v('fees__service_fee_office_expenses')} when={v('fees__service_fee_office_expenses_when')} />
                <FeeRow label="Service of any notice" amount={v('fees__service_fee_notice_service')} when={v('fees__service_fee_notice_service_when')} />
                {v('fees__service_fee_outgoings_collection_pct') && (
                  <tr>
                    <td style={S.tableCell}>Calculation and collection of water/sewerage usage charges</td>
                    <td style={{ ...S.tableCell, textAlign: 'right' }}>{v('fees__service_fee_outgoings_collection_pct')}% of cost</td>
                    <td style={S.tableCell}>{v('fees__service_fee_outgoings_collection_when')}</td>
                  </tr>
                )}
                {v('fees__marketing_fee') && (
                  <tr>
                    <td style={S.tableCell}>Marketing / promotional expenses per letting</td>
                    <td style={{ ...S.tableCell, textAlign: 'right' }}>${v('fees__marketing_fee')}</td>
                    <td style={S.tableCell}>{v('fees__marketing_fee_when_due')}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 10, marginBottom: 4 }}>Part B — Reimbursement of Miscellaneous Expenses</div>
            <div style={{ fontSize: 10, color: '#555', paddingLeft: 8 }}>
              NCAT fees in connection with NCAT proceedings · Sheriff's fees in connection with recovery of possession
            </div>
          </div>

          <ClauseRow num="10">
            <span>Promotional activities: </span>
            <strong>{v('management_authority__promotion_type') === 'none' ? 'Not advertised' : v('management_authority__promotion_type') === 'schedule' ? 'As per attached schedule' : v('management_authority__promotion_details', '—')}</strong>
            <span style={{ marginLeft: 16 }}>For Lease sign: <YN value={yn('management_authority__signboard_consent')} /></span>
          </ClauseRow>
        </SectionBody>

        {/* ── AUTHORITY CLAUSES 11–12 ──────────────────────────────── */}
        <SectionBar title="Agent's Authority" />
        <SectionBody>
          <ClauseRow num="11" text="In respect of each tenancy, the Agent is authorised and directed on behalf of the Principal to:">
            <div style={{ marginTop: 4 }}>
              <SubItem num="i"   text="Arrange inspections and show prospective tenants"               yn="management_authority__scope_arrange_inspections" />
              <SubItem num="ii"  text="Obtain references from prospective tenants"                     yn="management_authority__scope_obtain_references" />
              <SubItem num="iii" text="Sign residential tenancy agreements"                            yn="management_authority__scope_sign_tenancy" />
              <SubItem num="iv"  text="Collect rent and other monies from tenants"                    yn="management_authority__scope_collect_rent" />
              <SubItem num="v"   text="Issue receipts for monies received from tenants"               yn="management_authority__scope_issue_receipts" />
              <SubItem num="vi"  text="Receive and disburse rental bonds (including lodgement)"       yn="management_authority__scope_receive_bond" />
              <SubItem num="vii" text="Make claims for refund of bond monies"                         yn="management_authority__scope_bond_claims" />
              <SubItem num="viii" text="Respond to NCAT applications and represent the Principal"     yn="management_authority__scope_ncat_proceedings" />
              <SubItem num="ix"  text="Enforce or terminate tenancy agreements, sign and serve notices" yn="management_authority__scope_enforce_terminate" />
              <SubItem num="x"   text="Forward to the Principal copies of documents signed on their behalf" yn="management_authority__scope_forward_copies" />
              <SubItem num="xi"  text="Undertake inspections at the Agent's discretion"              yn="management_authority__scope_inspections" />
              <SubItem num="xii" text="Obtain copies of by-laws (strata/community scheme)"           yn="management_authority__scope_obtain_bylaws" />
            </div>
          </ClauseRow>
          <ClauseRow num="12" text="In respect of each tenancy, the Agent is authorised for NCAT proceedings for:">
            <div style={{ marginTop: 4 }}>
              <SubItem num="i"  text="The recovery of possession of the Premises from tenants"   yn="management_authority__scope_ncat_proceedings" />
              <SubItem num="ii" text="The recovery of monies due"                                yn="management_authority__scope_ncat_proceedings" />
            </div>
          </ClauseRow>
          <ClauseRow num="13">
            <span>S.5A Lease — Released from rent control: </span>
            <YN value={yn('management_authority__s5a_released')} />
          </ClauseRow>
          <ClauseRow num="14">
            <span>Inventories (Furnished Premises) — Inventory prepared by: </span>
            <strong>{v('management_authority__inventory_by') === 'agent' ? 'Agent' : v('management_authority__inventory_by') === 'principal' ? 'Principal' : '—'}</strong>
          </ClauseRow>
          <ClauseRow num="16">
            <span>Repairs and Maintenance — Agent authorised to engage tradespersons up to </span>
            <strong>{$('fees__repairs_limit', '—')}</strong>
            <span> per item without prior approval.</span>
          </ClauseRow>
        </SectionBody>

        {/* ── MATERIAL FACTS DISCLOSURE ────────────────────────────── */}
        <SectionBar title="Material Facts — Clause 24 Disclosures" />
        <SectionBody>
          <div style={{ fontSize: 9, color: '#555', marginBottom: 8, fontStyle: 'italic' }}>
            Under the Residential Tenancies Act 2010 (NSW), the agent must disclose all material facts to prospective tenants.
          </div>
          {[
            ['a', 'Has the Principal prepared a contract for sale?', 'disclosure__proposed_sale'],
            ['b', 'Is there any proposal to sell the premises?', 'disclosure__sale_proposal'],
            ['c', 'Have mortgagee proceedings commenced?', 'disclosure__mortgagee_proceedings'],
            ['d', 'Has the property been subject to flooding or bushfire in the last 5 years?', 'disclosure__flooding_bushfire'],
            ['e', 'Are there significant health or safety risks?', 'disclosure__health_safety_risks'],
            ['f', 'Has a murder or manslaughter occurred at the property?', 'disclosure__murder_manslaughter'],
            ['g', 'Is the property listed on the Loose-fill Asbestos Insulation Register?', 'disclosure__loose_fill_asbestos'],
            ['h', 'Has the property been used for prohibited drug manufacture/supply (last 2 years)?', 'disclosure__prohibited_drug'],
            ['i', 'Is there a fire safety order or combustible cladding order?', 'disclosure__combustible_cladding_order'],
            ['j', 'Is there a combustible cladding DA/CDC lodged?', 'disclosure__combustible_cladding_da'],
            ['k', 'Will the tenant be unable to obtain a residential parking permit?', 'disclosure__no_residential_parking'],
            ['l', 'Are there different council waste services at this property?', 'disclosure__council_waste_different'],
            ['m', 'Is there a shared driveway or walkway?', 'disclosure__shared_driveway'],
            ['n', 'Are there scheduled strata rectification works during the lease?', 'disclosure__strata_rectification_work'],
          ].map(([letter, text, key]) => (
            <div key={letter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, fontSize: 10, borderBottom: '1px solid #f0f0f0', paddingBottom: 3 }}>
              <span style={{ flex: 1, paddingRight: 16 }}><strong>{letter}.</strong> {text}</span>
              <YN value={yn(key)} />
            </div>
          ))}
          {v('disclosure__other_adverse_matters_details') && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: '#fafafa', border: '1px solid #e0e0e0', fontSize: 10 }}>
              <strong>Details: </strong>{v('disclosure__other_adverse_matters_details')}
            </div>
          )}
        </SectionBody>

        {/* ── SIGNATURE BLOCKS ─────────────────────────────────────── */}
        <SectionBar title="Signatures" />
        <SectionBody>
          <div style={{ fontSize: 9, color: '#555', marginBottom: 12 }}>
            I agree to be legally bound by the terms of this agreement even if I sign this agreement electronically.
          </div>
          {Array.from({ length: ownerCount }, (_, i) => (
            <div key={i} style={{ ...S.signBox, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 8 }}>
                PRINCIPAL {ownerCount > 1 ? i + 1 : ''} — {ownerName(i)}
              </div>
              <div style={S.twoCol}>
                <div>
                  <div style={S.fieldLabel}>Signature of Principal / Authorised Representative</div>
                  <div style={{ ...S.signLine, minHeight: 36 }} />
                </div>
                <div>
                  <div style={S.twoCol}>
                    <div>
                      <div style={S.fieldLabel}>Name of Signatory</div>
                      <div style={S.signLine} />
                    </div>
                    <div>
                      <div style={S.fieldLabel}>Date</div>
                      <div style={S.signLine} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div style={S.signBox}>
            <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 8 }}>
              AGENT — {v('agency__trading_as', v('agency__name', '—'))}
            </div>
            <div style={S.twoCol}>
              <div>
                <div style={S.fieldLabel}>Signature of Agent / Authorised Representative</div>
                <div style={{ ...S.signLine, minHeight: 36 }} />
              </div>
              <div style={S.twoCol}>
                <div>
                  <div style={S.fieldLabel}>Name of Signatory</div>
                  <div style={S.signLine} />
                </div>
                <div>
                  <div style={S.fieldLabel}>Date</div>
                  <div style={S.signLine} />
                </div>
              </div>
            </div>
          </div>
        </SectionBody>

        {/* ── SCHEDULE ─────────────────────────────────────────────── */}
        <SectionBar title="Schedule" />
        <SectionBody>

          {/* Disbursements */}
          <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Disbursements &amp; Particulars</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 0' }}>
            {[
              ['Council Rates', 'management_authority__disb_council_rates'],
              ['Water / Sewerage Rates', 'management_authority__disb_water_rates'],
              ['Strata Levies', 'management_authority__disb_strata_levies'],
              ['Land Tax', 'management_authority__disb_land_tax'],
              ['Insurance Premiums', 'management_authority__disb_insurance'],
              ['Mortgage Repayments', 'management_authority__disb_mortgage'],
              ['Body Corporate Levies', 'management_authority__disb_body_corporate'],
              ['Electricity', 'management_authority__disb_electricity'],
              ['Gas', 'management_authority__disb_gas'],
              ['Smoke Alarms', 'management_authority__disb_smoke_alarms'],
            ].map(([label, key]) => (
              <div key={key} style={{ width: '50%', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, fontSize: 10 }}>
                <span style={S.checkbox(!!f[key])} />
                {label}
              </div>
            ))}
          </div>
          {v('management_authority__disbursements_other') && (
            <div style={{ fontSize: 10, marginTop: 4 }}>Other: <strong>{v('management_authority__disbursements_other')}</strong></div>
          )}

          <div style={{ borderTop: '1px solid #ddd', marginTop: 12, paddingTop: 10 }}>

            {/* Insurance Policies */}
            <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Insurance Policies</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr>
                  <th style={S.tableHeader}>Type</th>
                  <th style={S.tableHeader}>Name of Insurer</th>
                  <th style={S.tableHeader}>Policy Number</th>
                  <th style={S.tableHeader}>Date Due</th>
                </tr>
              </thead>
              <tbody>
                {[['Building', 'insurance_building'], ["Landlord's Protection", 'insurance_landlords'], ['Contents', 'insurance_contents']].map(([label, keyPrefix]) => (
                  <tr key={label}>
                    <td style={S.tableCell}>{label}</td>
                    <td style={S.tableCell}>{v(`party_0__${keyPrefix}_insurer`)}</td>
                    <td style={S.tableCell}>{v(`party_0__${keyPrefix}_policy_no`)}</td>
                    <td style={S.tableCell}>{v(`party_0__${keyPrefix}_expiry`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Strata Details */}
          {f['property__is_strata'] && (
            <div style={{ borderTop: '1px solid #ddd', marginTop: 12, paddingTop: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Strata Details</div>
              <div style={S.threeCol}>
                <Field label="Strata Plan No." value={v('property__strata__plan_no')} />
                <Field label="Lot No." value={v('property__strata__lot_no')} />
                <Field label="Garage Lot No." value={v('property__strata__garage_lot_no')} />
              </div>
              <Field label="Strata Management Agent" value={v('property__strata__manager_name')} />
              <div style={S.twoCol}>
                <Field label="Address" value={addr(v('property__strata__manager_address'), v('property__strata__manager_suburb'), v('property__strata__manager_postcode'))} />
                <div style={S.threeCol}>
                  <Field label="Phone: Work" value={v('property__strata__manager_phone')} />
                  <Field label="Email" value={v('property__strata__manager_email')} />
                </div>
              </div>
            </div>
          )}

          {/* Statements & Bank */}
          <div style={{ borderTop: '1px solid #ddd', marginTop: 12, paddingTop: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Statements</div>
            <div style={S.threeCol}>
              <Field label="Statement in Name of" value={v('management_authority__statements_in_name')} />
              <Field label="Forward To" value={v('management_authority__statements_forward_to_name')} />
              <Field label="Copy To" value={v('management_authority__statements_copy_to_name')} />
            </div>
            <div style={S.twoCol}>
              <Field label="Forward To Address" value={v('management_authority__statements_forward_to_address')} />
              <Field label="Email" value={v('management_authority__statements_forward_to_email')} />
            </div>
          </div>

          {/* Bank account */}
          <div style={{ borderTop: '1px solid #ddd', marginTop: 12, paddingTop: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              {v('management_authority__payment_method') === 'cheque' ? 'Cheques Payable To' : 'Electronic Funds Transfer (EFT)'}
            </div>
            <div style={S.fourCol}>
              <Field label="Bank Name" value={v('owner_bank__bank_name')} />
              <Field label="Account Name" value={v('owner_bank__account_name')} />
              <Field label="BSB" value={v('owner_bank__bsb')} />
              <Field label="Account No." value={v('owner_bank__account_no') ? '••••••' : '—'} />
            </div>
            {v('owner_bank__payment_proportion') && v('owner_bank__payment_proportion') !== '100' && (
              <div style={{ fontSize: 10, marginTop: 4 }}>Payment Proportion: <strong>{v('owner_bank__payment_proportion')}%</strong></div>
            )}
          </div>

          {/* Principal's Representative */}
          {v('management_authority__principal_rep_name') && (
            <div style={{ borderTop: '1px solid #ddd', marginTop: 12, paddingTop: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Principal's Representative</div>
              <div style={S.twoCol}>
                <Field label="Name" value={v('management_authority__principal_rep_name')} />
                <Field label="Email" value={v('management_authority__principal_rep_email')} />
              </div>
              <div style={S.threeCol}>
                <Field label="Phone: Work" value={v('management_authority__principal_rep_phone_work')} />
                <Field label="Home" value={v('management_authority__principal_rep_phone_home')} />
                <Field label="Address" value={addr(v('management_authority__principal_rep_address'), v('management_authority__principal_rep_suburb'), v('management_authority__principal_rep_postcode'))} />
              </div>
            </div>
          )}

          {/* Solicitor */}
          {v('solicitor__name') && (
            <div style={{ borderTop: '1px solid #ddd', marginTop: 12, paddingTop: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Principal's Solicitor</div>
              <div style={S.twoCol}>
                <Field label="Name" value={v('solicitor__name')} />
                <Field label="Email" value={v('solicitor__email')} />
              </div>
              <div style={S.twoCol}>
                <Field label="Phone: Work" value={v('solicitor__phone_work')} />
                <Field label="Business Address" value={v('solicitor__business_address')} />
              </div>
            </div>
          )}

          {/* Special Instructions */}
          {v('management_authority__special_instructions_schedule') && (
            <div style={{ borderTop: '1px solid #ddd', marginTop: 12, paddingTop: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Special Instructions</div>
              <div style={{ fontSize: 10, padding: '6px 8px', background: '#fafafa', border: '1px solid #eee', minHeight: 40 }}>
                {v('management_authority__special_instructions_schedule')}
              </div>
            </div>
          )}
        </SectionBody>

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <div style={S.pageFooter}>
          <span>Originated by the Real Estate Institute of NSW · www.reinsw.com.au</span>
          <span>FM00100 - 05/25 · COPYRIGHT MAY 2025</span>
        </div>
      </div>
    </div>
  );
}
