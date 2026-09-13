import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import AddressPicker from '../components/AddressPicker';
import ChipSelect from '../components/ChipSelect';

const STEPS = ['Ownership', 'Property', 'Rental & Goals', 'Bank Details'];

const FIELD = ({ label, children, required, hint }) => (
  <div className="field">
    <label>
      {label}
      {required && <span style={{ color: 'var(--fhq-error)', marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {hint && <span style={{ fontSize: 12, color: 'var(--fhq-text-soft)' }}>{hint}</span>}
  </div>
);

const defaultOwner = () => ({
  type: 'individual',
  full_name: '', company_name: '', abn: '', acn: '', gst_registered: false,
  email: '', mobile: '', phone_work: '', phone_home: '',
  address: '', suburb: '', state: 'NSW', postcode: '',
});

const STATE_OPTIONS = [
  { value: 'NSW', label: 'NSW' }, { value: 'VIC', label: 'VIC' },
  { value: 'QLD', label: 'QLD' }, { value: 'WA', label: 'WA' },
  { value: 'SA', label: 'SA' }, { value: 'TAS', label: 'TAS' },
  { value: 'ACT', label: 'ACT' }, { value: 'NT', label: 'NT' },
];

const PROPERTY_FEATURES = [
  { value: 'builtin_wardrobe', label: 'Built-in wardrobe/s' },
  { value: 'walkin_wardrobe', label: 'Walk-in wardrobe/s' },
  { value: 'ensuite', label: 'Ensuite' },
  { value: 'split_system_ac', label: 'Split system air-conditioning' },
  { value: 'ducted_ac', label: 'Ducted air-conditioning' },
  { value: 'ceiling_fans', label: 'Ceiling fans' },
  { value: 'bathtub', label: 'Bathtub' },
  { value: 'dishwasher', label: 'Dishwasher' },
  { value: 'remote_garage', label: 'Remote control garage door/s' },
  { value: 'balcony', label: 'Balcony' },
  { value: 'fully_fenced', label: 'Fully-fenced yard' },
  { value: 'outdoor_entertaining', label: 'Outdoor entertaining area' },
  { value: 'solar_panels', label: 'Solar panels' },
  { value: 'alarm_system', label: 'Security / alarm system' },
  { value: 'swimming_pool', label: 'Swimming pool' },
  { value: 'garden_shed', label: 'Garden shed' },
  { value: 'intercom', label: 'Intercom' },
];

const INVESTMENT_GOALS = [
  { value: 'long_term', label: 'Long term investment — hold for steady rental income' },
  { value: 'short_term', label: 'Short term — plan to sell within 5 years' },
  { value: 'renovate', label: 'Renovate and sell' },
  { value: 'owner_return', label: 'Temporarily renting — intend to return' },
  { value: 'undecided', label: 'Undecided / flexible' },
];

const PARKING_OPTIONS = [
  { value: 'single_garage', label: 'Single garage' },
  { value: 'double_garage', label: 'Double garage' },
  { value: 'carport', label: 'Carport' },
  { value: 'off_street', label: 'Off-street parking' },
  { value: 'on_street', label: 'Street parking only' },
  { value: 'none', label: 'No parking' },
];

export default function ClientIntake() {
  const { token } = useParams();
  const [intake, setIntake] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [validationError, setValidationError] = useState('');

  // Step 1: Ownership
  const [ownerCount, setOwnerCount] = useState(1);
  const [owners, setOwners] = useState([defaultOwner()]);

  // Step 2: Property
  const [property, setProperty] = useState({
    address: '', suburb: '', state: 'NSW', postcode: '',
    type: '', bedrooms: '', bathrooms: '', parking: '',
    features: [],
    furnished: false, nbn_ready: false,
    condition_exterior: '', condition_interior: '',
    plans_for_work: '',
    current_situation: '',
    had_tenancy_12mo: '',
    access_method: '',
    strata: false, strata_plan_no: '', strata_lot_no: '',
    has_pool: false,
    anything_else: '',
  });

  // Step 3: Rental & Goals
  const [rental, setRental] = useState({
    expected_rent: '', rent_period: 'weekly',
    rental_bond_weeks: '4', preferred_lease_term: '',
    preferred_start_date: '',
    payment_frequency: '',
    investment_goals: '',
    signboard_consent: '',
    repairs_limit: '',
    disb_council_rates: false, disb_water_rates: false,
    disb_insurance: false, disb_strata_levies: false, disb_maintenance_contracts: false,
    water_efficiency_cert: false, smoke_alarm_compliant: false,
  });

  // Step 4: Bank
  const [bank, setBank] = useState({ bank_name: '', account_name: '', bsb: '', account_no: '' });

  const setOwner = (idx, k, v) => setOwners(prev => {
    const next = [...prev];
    next[idx] = { ...next[idx], [k]: v };
    return next;
  });

  // Sync owners array length when ownerCount changes
  const handleOwnerCountChange = count => {
    setOwnerCount(count);
    setOwners(prev => {
      const next = [...prev];
      while (next.length < count) next.push(defaultOwner());
      return next.slice(0, count);
    });
  };

  useEffect(() => {
    api.get(`/v1/intake/${token}`)
      .then(r => {
        setIntake(r.data);
        if (r.data.clientName) setOwner(0, 'full_name', r.data.clientName);
        if (r.data.clientEmail) setOwner(0, 'email', r.data.clientEmail);
        if (r.data.clientMobile) setOwner(0, 'mobile', r.data.clientMobile);
        if (r.data.propertyAddress) setProperty(p => ({ ...p, address: r.data.propertyAddress }));
      })
      .catch(err => setError(err.response?.data?.error || 'Invalid or expired link'))
      .finally(() => setLoading(false));
  }, [token]);

  // Plain render helpers — called as fn(), not <Fn />, to avoid re-mount/focus loss
  const renderInp = (val, onChange, type = 'text', placeholder = '') => (
    <input className="input" type={type} placeholder={placeholder}
      value={val} onChange={e => onChange(e.target.value)} />
  );

  const renderSel = (val, onChange, options, placeholder = '') => (
    <select className="select" value={val} onChange={e => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  const renderChk = (val, onChange, label) => (
    <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', fontSize: 14 }}>
      <input type="checkbox" checked={val} onChange={e => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: 'var(--fhq-signal-lime)' }} />
      {label}
    </label>
  );

  const renderYesNo = (val, onChange) => (
    <div style={{ display: 'flex', gap: 10 }}>
      {['Yes', 'No'].map(opt => (
        <button key={opt} type="button"
          onClick={() => onChange(opt)}
          style={{
            padding: '8px 24px', borderRadius: 100, border: '1.5px solid',
            borderColor: val === opt ? 'var(--fhq-graphite)' : 'var(--fhq-border)',
            background: val === opt ? 'var(--fhq-signal-lime)' : 'var(--fhq-surface)',
            color: val === opt ? 'var(--fhq-graphite)' : 'var(--fhq-text-muted)',
            fontWeight: val === opt ? 700 : 500, fontSize: 14, cursor: 'pointer',
            fontFamily: 'var(--fhq-font-sans)',
          }}>
          {opt}
        </button>
      ))}
    </div>
  );

  const renderSection = (title, content) => (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--fhq-border)', fontWeight: 700, fontSize: 14 }}>{title}</div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>{content}</div>
    </div>
  );

  const copyAddressFromOwner1 = (idx) => {
    const o1 = owners[0];
    setOwner(idx, 'address', o1.address);
    setOwner(idx, 'suburb', o1.suburb);
    setOwner(idx, 'state', o1.state);
    setOwner(idx, 'postcode', o1.postcode);
  };

  const copyEntityFromOwner1 = (idx) => {
    const o1 = owners[0];
    setOwner(idx, 'abn', o1.abn);
    setOwner(idx, 'acn', o1.acn);
    setOwner(idx, 'gst_registered', o1.gst_registered);
  };

  const renderOwnerForm = (owner, idx) => {
    const lbl = ownerCount > 1 ? `Owner ${idx + 1}` : 'Your Details';
    const isExtra = idx > 0;
    const sameAddressAsO1 = isExtra && owner.address === owners[0].address && owner.suburb === owners[0].suburb;
    const sameEntityAsO1 = isExtra && owner.abn === owners[0].abn && owner.acn === owners[0].acn && owner.gst_registered === owners[0].gst_registered;

    return (
      <div key={idx} className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--fhq-border)', fontWeight: 700, fontSize: 14 }}>{lbl}</div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Ownership type — always shown for every owner */}
          <FIELD label="Ownership type" required>
            {renderSel(owner.type, v => setOwner(idx, 'type', v), [
              { value: 'individual', label: 'Individual' },
              { value: 'company', label: 'Company' },
              { value: 'trust', label: 'Trust' },
            ])}
          </FIELD>

          {owner.type !== 'individual' ? (
            <>
              <FIELD label={owner.type === 'company' ? 'Company Name' : 'Trust Name'} required>
                {renderInp(owner.company_name, v => setOwner(idx, 'company_name', v), 'text', 'ABC Pty Ltd')}
              </FIELD>
              <FIELD label="Contact Person Name">
                {renderInp(owner.full_name, v => setOwner(idx, 'full_name', v), 'text', 'Jane Smith')}
              </FIELD>
            </>
          ) : (
            <FIELD label="Full Legal Name" required>
              {renderInp(owner.full_name, v => setOwner(idx, 'full_name', v), 'text', 'Jane Smith')}
            </FIELD>
          )}

          <div className="grid-2">
            <FIELD label="Email Address" required>
              {renderInp(owner.email, v => setOwner(idx, 'email', v), 'email', 'jane@example.com')}
            </FIELD>
            <FIELD label="Mobile Number" required>
              {renderInp(owner.mobile, v => setOwner(idx, 'mobile', v), 'tel', '0412 345 678')}
            </FIELD>
          </div>

          <div className="grid-2">
            <FIELD label="Work Phone">
              {renderInp(owner.phone_work, v => setOwner(idx, 'phone_work', v), 'tel', '02 9000 0000')}
            </FIELD>
            <FIELD label="Home Phone">
              {renderInp(owner.phone_home, v => setOwner(idx, 'phone_home', v), 'tel', '02 9000 0000')}
            </FIELD>
          </div>

          {/* Address section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fhq-text-muted)' }}>Residential Address</span>
            {isExtra && (
              <button type="button"
                onClick={() => copyAddressFromOwner1(idx)}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '4px 12px',
                  border: `1.5px solid ${sameAddressAsO1 ? 'var(--fhq-signal-lime)' : 'var(--fhq-border)'}`,
                  borderRadius: 100, cursor: 'pointer', background: sameAddressAsO1 ? 'var(--fhq-signal-lime)' : 'var(--fhq-surface)',
                  color: sameAddressAsO1 ? 'var(--fhq-graphite)' : 'var(--fhq-text-muted)',
                  fontFamily: 'var(--fhq-font-sans)',
                }}>
                {sameAddressAsO1 ? '✓ Same as Owner 1' : 'Same as Owner 1'}
              </button>
            )}
          </div>
          {!(isExtra && sameAddressAsO1) && (
            <>
              <AddressPicker
                value={{ street: owner.address, suburb: owner.suburb, state: owner.state, postcode: owner.postcode }}
                onChange={a => {
                  setOwner(idx, 'address', a.street);
                  setOwner(idx, 'suburb', a.suburb || '');
                  setOwner(idx, 'state', a.state || 'NSW');
                  setOwner(idx, 'postcode', a.postcode || '');
                }}
                placeholder="Search address…"
              />
              <div className="grid-3">
                <FIELD label="Suburb">
                  {renderInp(owner.suburb, v => setOwner(idx, 'suburb', v), 'text', 'Sydney')}
                </FIELD>
                <FIELD label="State">
                  {renderSel(owner.state, v => setOwner(idx, 'state', v), STATE_OPTIONS)}
                </FIELD>
                <FIELD label="Postcode">
                  {renderInp(owner.postcode, v => setOwner(idx, 'postcode', v), 'text', '2000')}
                </FIELD>
              </div>
            </>
          )}
          {isExtra && sameAddressAsO1 && (
            <div style={{ fontSize: 13, color: 'var(--fhq-text-muted)', padding: '8px 12px', background: 'var(--fhq-surface-muted)', borderRadius: 6 }}>
              {[owners[0].address, owners[0].suburb, owners[0].state, owners[0].postcode].filter(Boolean).join(', ')}
            </div>
          )}

          {/* ABN/ACN/GST section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fhq-text-muted)' }}>ABN / ACN / GST</span>
            {isExtra && (
              <button type="button"
                onClick={() => copyEntityFromOwner1(idx)}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '4px 12px',
                  border: `1.5px solid ${sameEntityAsO1 ? 'var(--fhq-signal-lime)' : 'var(--fhq-border)'}`,
                  borderRadius: 100, cursor: 'pointer', background: sameEntityAsO1 ? 'var(--fhq-signal-lime)' : 'var(--fhq-surface)',
                  color: sameEntityAsO1 ? 'var(--fhq-graphite)' : 'var(--fhq-text-muted)',
                  fontFamily: 'var(--fhq-font-sans)',
                }}>
                {sameEntityAsO1 ? '✓ Same as Owner 1' : 'Same as Owner 1'}
              </button>
            )}
          </div>
          {!(isExtra && sameEntityAsO1) ? (
            <>
              <div className="grid-2">
                <FIELD label="ABN">
                  {renderInp(owner.abn, v => setOwner(idx, 'abn', v), 'text', '12 345 678 901')}
                </FIELD>
                <FIELD label="ACN" hint="If applicable">
                  {renderInp(owner.acn, v => setOwner(idx, 'acn', v), 'text', '000 000 000')}
                </FIELD>
              </div>
              {renderChk(owner.gst_registered, v => setOwner(idx, 'gst_registered', v), 'Registered for GST')}
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--fhq-text-muted)', padding: '8px 12px', background: 'var(--fhq-surface-muted)', borderRadius: 6 }}>
              {[owners[0].abn && `ABN: ${owners[0].abn}`, owners[0].acn && `ACN: ${owners[0].acn}`, owners[0].gst_registered && 'GST Registered'].filter(Boolean).join(' · ') || 'No ABN/ACN provided for Owner 1'}
            </div>
          )}

        </div>
      </div>
    );
  };

  const validate = () => {
    if (step === 0) {
      for (let i = 0; i < owners.length; i++) {
        const o = owners[i];
        const lbl = owners.length > 1 ? `Owner ${i + 1}: ` : '';
        if (o.type === 'individual' && !o.full_name.trim()) return `${lbl}Full name is required`;
        if (o.type !== 'individual' && !o.company_name.trim()) return `${lbl}Company/trust name is required`;
        if (!o.email.trim()) return `${lbl}Email is required`;
        if (!o.mobile.trim()) return `${lbl}Mobile is required`;
      }
    }
    if (step === 1) {
      if (!property.address.trim()) return 'Property street address is required';
      if (!property.suburb.trim()) return 'Property suburb is required';
    }
    return '';
  };

  const next = () => {
    const err = validate();
    if (err) { setValidationError(err); return; }
    setValidationError('');
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  };

  const back = () => {
    setValidationError('');
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const err = validate();
    if (err) { setValidationError(err); return; }
    setSubmitting(true);
    try {
      await api.post(`/v1/intake/${token}/submit`, { responses: buildResponses() });
      setSubmitted(true);
    } catch (err) {
      setValidationError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const buildResponses = () => {
    const r = {};
    owners.forEach((o, i) => {
      const p = i === 0 ? 'owner' : `owner${i + 1}`;
      r[`${p}_full_name`] = o.full_name;
      r[`${p}_company_name`] = o.company_name;
      r[`${p}_type`] = o.type;
      r[`${p}_abn`] = o.abn;
      r[`${p}_acn`] = o.acn;
      r[`${p}_gst_registered`] = o.gst_registered;
      r[`${p}_email`] = o.email;
      r[`${p}_mobile`] = o.mobile;
      r[`${p}_phone_work`] = o.phone_work;
      r[`${p}_phone_home`] = o.phone_home;
      r[`${p}_address`] = o.address;
      r[`${p}_suburb`] = o.suburb;
      r[`${p}_state`] = o.state;
      r[`${p}_postcode`] = o.postcode;
    });
    r.owner_count = owners.length;
    Object.assign(r, {
      property_address: property.address,
      property_suburb: property.suburb,
      property_state: property.state,
      property_postcode: property.postcode,
      property_type: property.type,
      property_bedrooms: property.bedrooms,
      property_bathrooms: property.bathrooms,
      property_parking: property.parking,
      property_features: property.features,
      property_furnished: property.furnished,
      property_nbn_ready: property.nbn_ready,
      property_condition_exterior: property.condition_exterior,
      property_condition_interior: property.condition_interior,
      property_plans_for_work: property.plans_for_work,
      property_current_situation: property.current_situation,
      property_had_tenancy_12mo: property.had_tenancy_12mo,
      property_access_method: property.access_method,
      property_strata: property.strata,
      property_strata_plan_no: property.strata_plan_no,
      property_strata_lot_no: property.strata_lot_no,
      property_has_pool: property.has_pool,
      property_anything_else: property.anything_else,
    });
    Object.assign(r, {
      expected_rent: rental.expected_rent,
      rent_period: rental.rent_period,
      rental_bond_weeks: rental.rental_bond_weeks,
      preferred_lease_term: rental.preferred_lease_term,
      preferred_start_date: rental.preferred_start_date,
      payment_frequency: rental.payment_frequency,
      investment_goals: rental.investment_goals,
      signboard_consent: rental.signboard_consent,
      repairs_limit: rental.repairs_limit,
      disb_council_rates: rental.disb_council_rates,
      disb_water_rates: rental.disb_water_rates,
      disb_insurance: rental.disb_insurance,
      disb_strata_levies: rental.disb_strata_levies,
      disb_maintenance_contracts: rental.disb_maintenance_contracts,
      water_efficiency_cert: rental.water_efficiency_cert,
      smoke_alarm_compliant: rental.smoke_alarm_compliant,
    });
    Object.assign(r, {
      bank_name: bank.bank_name,
      bank_account_name: bank.account_name,
      bank_bsb: bank.bsb,
      bank_account_no: bank.account_no,
    });
    return r;
  };

  const renderStepContent = () => {
    // ── STEP 0: OWNERSHIP ────────────────────────────────────────────────────
    if (step === 0) return (
      <>
        {renderSection('Ownership', <>
          <FIELD label="How many legal owners are listed on the ownership title?" required>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4].map(n => (
                <button key={n} type="button"
                  onClick={() => handleOwnerCountChange(n)}
                  style={{
                    width: 52, height: 52, borderRadius: 12, border: '1.5px solid',
                    borderColor: ownerCount === n ? 'var(--fhq-graphite)' : 'var(--fhq-border)',
                    background: ownerCount === n ? 'var(--fhq-signal-lime)' : 'var(--fhq-surface)',
                    color: ownerCount === n ? 'var(--fhq-graphite)' : 'var(--fhq-text-muted)',
                    fontWeight: 700, fontSize: 18, cursor: 'pointer',
                    fontFamily: 'var(--fhq-font-sans)',
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </FIELD>
        </>)}

        {owners.map((o, i) => renderOwnerForm(o, i))}

        <div style={{ padding: '14px 18px', background: 'var(--fhq-info-soft)', border: '1px solid var(--fhq-border)', borderRadius: 'var(--fhq-radius-sm)', fontSize: 13, color: 'var(--fhq-info)' }}>
          <strong>Identity verification (VOI)</strong> — Your agent will send you a secure link to complete identity verification separately. No uploads required here.
        </div>
      </>
    );

    // ── STEP 1: PROPERTY ─────────────────────────────────────────────────────
    if (step === 1) return (
      <>
        {renderSection('Property Address', <>
          <FIELD label="Full property address" required hint="Start typing to search, or enter manually">
            <AddressPicker
              value={{ street: property.address, suburb: property.suburb, state: property.state, postcode: property.postcode }}
              onChange={a => setProperty(p => ({
                ...p, address: a.street, suburb: a.suburb || p.suburb,
                state: a.state || p.state, postcode: a.postcode || p.postcode,
              }))}
              placeholder="Search Australian address…"
            />
          </FIELD>
          <div className="grid-3">
            <FIELD label="Suburb" required>
              {renderInp(property.suburb, v => setProperty(p => ({ ...p, suburb: v })), 'text', 'Newtown')}
            </FIELD>
            <FIELD label="State">
              {renderSel(property.state, v => setProperty(p => ({ ...p, state: v })), STATE_OPTIONS)}
            </FIELD>
            <FIELD label="Postcode">
              {renderInp(property.postcode, v => setProperty(p => ({ ...p, postcode: v })), 'text', '2042')}
            </FIELD>
          </div>
        </>)}

        {renderSection('Property Details', <>
          <div className="grid-2">
            <FIELD label="Type of dwelling" required>
              {renderSel(property.type, v => setProperty(p => ({ ...p, type: v })), [
                { value: 'house', label: 'House' },
                { value: 'apartment', label: 'Apartment / Unit' },
                { value: 'townhouse', label: 'Townhouse' },
                { value: 'villa', label: 'Villa' },
                { value: 'land', label: 'Vacant Land' },
                { value: 'other', label: 'Other' },
              ], 'Select type…')}
            </FIELD>
            <FIELD label="Bedrooms">
              {renderSel(property.bedrooms, v => setProperty(p => ({ ...p, bedrooms: v })), [
                { value: '1', label: '1' }, { value: '2', label: '2' },
                { value: '3', label: '3' }, { value: '4', label: '4' },
                { value: '5', label: '5+' },
              ], 'Select…')}
            </FIELD>
          </div>
          <div className="grid-2">
            <FIELD label="Bathrooms">
              {renderSel(property.bathrooms, v => setProperty(p => ({ ...p, bathrooms: v })), [
                { value: '1', label: '1' }, { value: '2', label: '2' },
                { value: '3', label: '3' }, { value: '4+', label: '4+' },
              ], 'Select…')}
            </FIELD>
            <FIELD label="Parking">
              {renderSel(property.parking, v => setProperty(p => ({ ...p, parking: v })),
                PARKING_OPTIONS, 'Select…')}
            </FIELD>
          </div>
        </>)}

        {renderSection('Property Features', <>
          <p style={{ fontSize: 13, color: 'var(--fhq-text-muted)', margin: 0 }}>
            Select all features included in the lease/tenancy:
          </p>
          <ChipSelect
            options={PROPERTY_FEATURES}
            value={property.features}
            onChange={v => setProperty(p => ({ ...p, features: v }))}
          />
          {renderChk(property.nbn_ready, v => setProperty(p => ({ ...p, nbn_ready: v })), 'Property is NBN ready')}
          {renderChk(property.furnished, v => setProperty(p => ({ ...p, furnished: v })), 'Property is furnished')}
          {renderChk(property.strata, v => setProperty(p => ({ ...p, strata: v })), 'Strata title')}
          {property.strata && (
            <div className="grid-2">
              <FIELD label="Strata Plan No.">
                {renderInp(property.strata_plan_no, v => setProperty(p => ({ ...p, strata_plan_no: v })), 'text', 'SP12345')}
              </FIELD>
              <FIELD label="Lot No.">
                {renderInp(property.strata_lot_no, v => setProperty(p => ({ ...p, strata_lot_no: v })), 'text', '12')}
              </FIELD>
            </div>
          )}
        </>)}

        {renderSection('Property Condition', <>
          <FIELD label="How would you describe the condition of the exterior / outside?">
            {renderSel(property.condition_exterior, v => setProperty(p => ({ ...p, condition_exterior: v })), [
              { value: 'new', label: 'Brand new / newly built' },
              { value: 'renovated', label: 'Renovated' },
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'poor', label: 'Needs attention' },
            ], 'Select condition…')}
          </FIELD>
          <FIELD label="How would you describe the condition of the interior?">
            {renderSel(property.condition_interior, v => setProperty(p => ({ ...p, condition_interior: v })), [
              { value: 'new', label: 'Brand new / newly fitted' },
              { value: 'renovated', label: 'Renovated' },
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'poor', label: 'Needs attention' },
            ], 'Select condition…')}
          </FIELD>
          <FIELD label="Do you have any intentions or plans to do work or improvements prior to or during a tenancy?">
            {renderYesNo(property.plans_for_work, v => setProperty(p => ({ ...p, plans_for_work: v })))}
          </FIELD>
        </>)}

        {renderSection('Current Situation', <>
          <FIELD label="What is the current situation with the property?">
            {renderSel(property.current_situation, v => setProperty(p => ({ ...p, current_situation: v })), [
              { value: 'owner_occupied', label: 'We are living in the property' },
              { value: 'vacant', label: 'Vacant / unoccupied' },
              { value: 'tenanted', label: 'Currently tenanted' },
              { value: 'renovating', label: 'Under renovation' },
            ], 'Select…')}
          </FIELD>
          <FIELD label="Has the property had a tenancy in place within the last 12 months?">
            {renderYesNo(property.had_tenancy_12mo, v => setProperty(p => ({ ...p, had_tenancy_12mo: v })))}
          </FIELD>
          <FIELD label="How can we access the property?">
            {renderSel(property.access_method, v => setProperty(p => ({ ...p, access_method: v })), [
              { value: 'keys_provided', label: 'We will provide you with a set of keys' },
              { value: 'agent_has_keys', label: 'Agent already has keys' },
              { value: 'lockbox', label: 'Lock box on property' },
              { value: 'arrange_access', label: 'We will arrange access as required' },
            ], 'Select…')}
          </FIELD>
          <FIELD label="Is there anything else we should know about the property or your preferences?">
            <textarea className="input" rows={3} placeholder="Optional…"
              value={property.anything_else}
              onChange={e => setProperty(p => ({ ...p, anything_else: e.target.value }))}
              style={{ resize: 'vertical' }} />
          </FIELD>
        </>)}
      </>
    );

    // ── STEP 2: RENTAL & GOALS ───────────────────────────────────────────────
    if (step === 2) return (
      <>
        {renderSection('Rental Preferences', <>
          <div className="grid-2">
            <FIELD label="Estimated weekly rent ($)">
              {renderInp(rental.expected_rent, v => setRental(r => ({ ...r, expected_rent: v })), 'number', '650')}
            </FIELD>
            <FIELD label="Rent period">
              {renderSel(rental.rent_period, v => setRental(r => ({ ...r, rent_period: v })), [
                { value: 'weekly', label: 'Weekly' },
                { value: 'fortnightly', label: 'Fortnightly' },
                { value: 'monthly', label: 'Monthly' },
              ])}
            </FIELD>
          </div>
          <div className="grid-2">
            <FIELD label="Bond (weeks)" hint="Usually 4 weeks">
              {renderInp(rental.rental_bond_weeks, v => setRental(r => ({ ...r, rental_bond_weeks: v })), 'number', '4')}
            </FIELD>
            <FIELD label="Preferred lease term">
              {renderSel(rental.preferred_lease_term, v => setRental(r => ({ ...r, preferred_lease_term: v })), [
                { value: '6 months', label: '6 months' },
                { value: '12 months', label: '12 months' },
                { value: '18 months', label: '18 months' },
                { value: '24 months', label: '24 months' },
                { value: 'periodic', label: 'Periodic (month to month)' },
              ], 'No preference')}
            </FIELD>
          </div>
          <div className="grid-2">
            <FIELD label="Preferred management start date">
              {renderInp(rental.preferred_start_date, v => setRental(r => ({ ...r, preferred_start_date: v })), 'date')}
            </FIELD>
            <FIELD label="Payment frequency" hint="How often you'd like rental income paid to you">
              {renderSel(rental.payment_frequency, v => setRental(r => ({ ...r, payment_frequency: v })), [
                { value: 'weekly', label: 'Weekly' },
                { value: 'fortnightly', label: 'Fortnightly' },
                { value: 'monthly_start', label: 'Once a month — start of month' },
                { value: 'monthly_end', label: 'Once a month — end of month' },
              ], 'Select frequency…')}
            </FIELD>
          </div>
          <FIELD label="Emergency repairs limit ($)" hint="Agent can authorise repairs up to this amount without your approval">
            {renderInp(rental.repairs_limit, v => setRental(r => ({ ...r, repairs_limit: v })), 'number', '500')}
          </FIELD>
        </>)}

        {renderSection('Investment Goals', <>
          <FIELD label="What are your current intentions and goals with the investment property?">
            {renderSel(rental.investment_goals, v => setRental(r => ({ ...r, investment_goals: v })),
              INVESTMENT_GOALS, 'Select…')}
          </FIELD>
          <FIELD label="Are you happy for a 'For Lease' signboard to be placed at the front of the property at time of advertising?">
            {renderYesNo(rental.signboard_consent, v => setRental(r => ({ ...r, signboard_consent: v })))}
          </FIELD>
        </>)}

        {renderSection('Disbursements — Pay from Rental Income', <>
          <p style={{ fontSize: 13, color: 'var(--fhq-text-muted)', margin: 0 }}>
            Select any accounts you wish us to receive and pay on your behalf:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {renderChk(rental.disb_council_rates, v => setRental(r => ({ ...r, disb_council_rates: v })), 'Council rates')}
            {renderChk(rental.disb_water_rates, v => setRental(r => ({ ...r, disb_water_rates: v })), 'Sydney Water / water rates')}
            {renderChk(rental.disb_insurance, v => setRental(r => ({ ...r, disb_insurance: v })), 'Insurance premiums')}
            {renderChk(rental.disb_strata_levies, v => setRental(r => ({ ...r, disb_strata_levies: v })), 'Strata levies')}
            {renderChk(rental.disb_maintenance_contracts, v => setRental(r => ({ ...r, disb_maintenance_contracts: v })), 'Maintenance contracts (garden, pool, etc.)')}
          </div>
        </>)}

        {renderSection('Compliance', <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {renderChk(rental.smoke_alarm_compliant, v => setRental(r => ({ ...r, smoke_alarm_compliant: v })), 'Smoke alarms are installed and compliant')}
            {renderChk(rental.water_efficiency_cert, v => setRental(r => ({ ...r, water_efficiency_cert: v })), 'Property has a current water efficiency certificate')}
          </div>
        </>)}
      </>
    );

    // ── STEP 3: BANK DETAILS ─────────────────────────────────────────────────
    if (step === 3) return renderSection('Bank Details for Rental Payments', <>
      <div style={{ padding: '10px 14px', background: '#fff4d6', border: '1px solid #fde68a', borderRadius: 6, fontSize: 13 }}>
        <strong>Secure</strong> — these details are only used to remit your rental income to you.
      </div>
      <FIELD label="Bank Name">
        {renderInp(bank.bank_name, v => setBank(b => ({ ...b, bank_name: v })), 'text', 'Commonwealth Bank')}
      </FIELD>
      <FIELD label="Account Name" required>
        {renderInp(bank.account_name, v => setBank(b => ({ ...b, account_name: v })), 'text', 'J Smith')}
      </FIELD>
      <div className="grid-2">
        <FIELD label="BSB" required>
          {renderInp(bank.bsb, v => setBank(b => ({ ...b, bsb: v })), 'text', '062-000')}
        </FIELD>
        <FIELD label="Account Number" required>
          {renderInp(bank.account_no, v => setBank(b => ({ ...b, account_no: v })), 'text', '12345678')}
        </FIELD>
      </div>
    </>);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fhq-bg)' }}>
      <div style={{ background: 'var(--fhq-graphite)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--fhq-signal-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'var(--fhq-graphite)' }}>FH</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>FormsHQ</div>
          {intake && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{intake.agencyName}</div>}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 60px' }}>
        {loading && <div className="loading-center"><div className="spinner" /><span>Loading…</span></div>}

        {error && (
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ marginBottom: 8 }}>Link unavailable</h2>
            <p style={{ color: 'var(--fhq-text-muted)' }}>{error}</p>
          </div>
        )}

        {submitted && (
          <div className="card card-pad" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--fhq-success-soft)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>✓</div>
            <h2 style={{ marginBottom: 8 }}>Form submitted</h2>
            <p style={{ color: 'var(--fhq-text-muted)', maxWidth: 400, margin: '0 auto' }}>
              Thank you! Your property management intake has been submitted. Your agent will be in touch shortly.
            </p>
          </div>
        )}

        {intake && !submitted && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Property Management Intake</h1>
              <p style={{ color: 'var(--fhq-text-muted)', fontSize: 14 }}>
                {intake.agencyName}
                {intake.clientName && ` · Hi ${intake.clientName.split(' ')[0]}!`}
              </p>
            </div>

            <div className="intake-steps" style={{ marginBottom: 28 }}>
              {STEPS.map((s, i) => (
                <div key={i} className={`intake-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                  <div className="intake-step-dot">{i < step ? '✓' : i + 1}</div>
                  <div className="intake-step-label">{s}</div>
                </div>
              ))}
            </div>

            <form onSubmit={step < STEPS.length - 1 ? e => { e.preventDefault(); next(); } : handleSubmit}>
              {renderStepContent()}

              {validationError && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>
                  {validationError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {step > 0 && (
                  <button type="button" className="btn btn-ghost" onClick={back} style={{ flex: 1 }}>
                    ← Back
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={submitting}
                  style={{ flex: 1, padding: '14px', fontSize: 15 }}>
                  {step < STEPS.length - 1
                    ? `Next: ${STEPS[step + 1]} →`
                    : submitting ? 'Submitting…' : 'Submit Intake Form'}
                </button>
              </div>
            </form>

            <p style={{ fontSize: 12, color: 'var(--fhq-text-soft)', textAlign: 'center', marginTop: 20 }}>
              Powered by FormsHQ · REINSW Forms Platform
            </p>
          </>
        )}
      </div>
    </div>
  );
}
