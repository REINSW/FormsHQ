# FM00100 — Canonical Field Key Map

Exclusive Management Agency Agreement (Residential) — Long Version (05/25)
Source: 286 fillable elements across pages 2–15 (pages 16–23 are statutory info, no fields)

Key naming convention:
- Section prefix + double-underscore + field name
- Arrays use `_N__` indexing (0-based): `party_0__name_full`, `party_1__name_full`
- All keys lowercase, words separated by single underscore

---

## INSPECTION REPORT (Pages 2–3)

> Note: The Inspection Report duplicates party/agent/property fields from the main agreement.
> Those sections share the same canonical keys. The unique inspection fields are:

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 33 | Description of Premises | `inspection__premises_description` | text |
| 34 | Exterior condition | `inspection__exterior_condition` | text |
| 35 | Interior condition | `inspection__interior_condition` | text |
| 36 | Fixtures and fittings condition | `inspection__fixtures_condition` | text |
| 37 | Improvements condition | `inspection__improvements_condition` | text |
| 38 | Anything provided with the Premises | `inspection__other_items_condition` | text |
| 39a | Work to be done — row 1 description | `inspection__work_0__description` | text |
| 39b | Work to be done — row 1 completion date | `inspection__work_0__completion_date` | date |
| 39c | Work to be done — row 2 description | `inspection__work_1__description` | text |
| 39d | Work to be done — row 2 completion date | `inspection__work_1__completion_date` | date |
| 39e | Work to be done — row 3 description | `inspection__work_2__description` | text |
| 39f | Work to be done — row 3 completion date | `inspection__work_2__completion_date` | date |
| 40 | Signature of Agent / Authorised Representative | `inspection__agent_signature` | signature |
| 41 | Date of preparation | `inspection__date` | date |
| 42 | Name of Signatory | `inspection__signatory_name` | text |

---

## PARTIES (Pages 2 & 4 — shared keys used in both Inspection Report and Agreement)

### Principal 1 (`party_0__`)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 1 | Principal (name) | `party_0__name_full` | text |
| 2 | ABN / ACN | `party_0__abn` | text |
| 3 | GST Registered | `party_0__gst_registered` | radio yes/no |
| 4 | Address | `party_0__address_street` | text |
| 5 | Postcode | `party_0__address_postcode` | text |
| 6 | Phone: Work | `party_0__phone_work` | text |
| 7 | Phone: Home | `party_0__phone_home` | text |
| 8 | Phone: Mobile | `party_0__mobile` | text |
| 9 | Email | `party_0__email` | text |

### Principal 2 (`party_1__`)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 10 | Principal (name) | `party_1__name_full` | text |
| 11 | ABN / ACN | `party_1__abn` | text |
| 12 | GST Registered | `party_1__gst_registered` | radio yes/no |
| 13 | Address | `party_1__address_street` | text |
| 14 | Postcode | `party_1__address_postcode` | text |
| 15 | Phone: Work | `party_1__phone_work` | text |
| 16 | Phone: Home | `party_1__phone_home` | text |
| 17 | Phone: Mobile | `party_1__mobile` | text |
| 18 | Email | `party_1__email` | text |

> Additional owners use `party_2__` and `party_3__` with the same field suffixes.

### Agent / Licensee (`agent__`)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 19 | Agent (name) | `agent__name` | text |
| 20 | Licensee's Licence No. | `agent__licence_no` | text |
| 21 | ABN / ACN | `agent__abn` | text |
| 22 | GST Registered | `agent__gst_registered` | radio yes/no |
| 23 | Trading as | `agent__trading_as` | text |
| 24 | Business address | `agent__address_street` | text |
| 25 | Postcode | `agent__address_postcode` | text |
| 26 | Phone: Work | `agent__phone_work` | text |
| 27 | Phone: Mobile | `agent__phone_mobile` | text |
| 28 | Email | `agent__email` | text |

### RTA Contact — Principal(s) contact for Residential Tenancy Agreements (Page 4)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 70 | Same as above (tick) | `management_authority__rta_same_as_principal` | checkbox |
| 71 | Name(s) | `management_authority__rta_name` | text |
| 72 | Phone: Work | `management_authority__rta_phone_work` | text |
| 73 | Phone: Home | `management_authority__rta_phone_home` | text |
| 74 | Phone: Mobile | `management_authority__rta_phone_mobile` | text |
| 75 | Email | `management_authority__rta_email` | text |
| 76 | State/Territory of ordinary residence | `management_authority__rta_state` | text |
| 77 | Address | `management_authority__rta_address_street` | text |
| 78 | Postcode | `management_authority__rta_address_postcode` | text |
| 79 | Email (corporation) | `management_authority__rta_email_corp` | text |

---

## PREMISES (Page 5)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 80 | Address of Premises | `property__address_street` | text |
| 81 | Suburb | `property__address_suburb` | text |
| 82 | State | `property__address_state` | text |
| 83 | Postcode | `property__address_postcode` | text |
| 84 | Furnished / Unfurnished | `property__is_furnished` | radio furnished/unfurnished |
| 85 | Garage/Car Space included | `property__has_garage` | radio yes/no |

---

## CLAUSE 3 — Commencement (Page 5)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 86 | Agreement commences on | `management_authority__start_date` | date |
| 87 | Written notice period (days) | `management_authority__termination_notice_days` | text |

---

## CLAUSE 4 — Leasing Conditions (Page 5)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 88 | Term of tenancy agreement | `management_authority__lease_term` | text |
| 89 | Rent $ | `management_authority__rent_amount` | number |
| 90 | Rent per (period) | `management_authority__rent_period` | text |
| 91 | Rental bond $ | `management_authority__rental_bond_amount` | number |
| 92 | Rental bond — equivalent to ___ weeks rent | `management_authority__rental_bond_weeks` | number |

---

## CLAUSE 5 — Special Instructions (Page 5)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 93 | Special Instructions | `management_authority__special_instructions` | textarea |

---

## CLAUSE 6 — Agent's Authority at End of Tenancy (Page 5)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 94 | Re-lease max term | `management_authority__authority_re_lease_max_term` | text |
| 95 | i. Re-lease at market rent | `management_authority__authority_re_lease` | radio yes/no |
| 96 | ii. Refer to Principal for re-leasing instructions | `management_authority__authority_refer_principal` | radio yes/no |
| 97 | iii. Review rent when appropriate | `management_authority__authority_review_rent` | radio yes/no |

---

## CLAUSE 7 — Agent's Remuneration (Page 5)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 98 | i. Leasing fee | `fees__letting_fee_weeks` | text |
| 99 | ii. Tenancy agreement preparation fee $ | `fees__admin_fee` | number |
| 100 | iii. Management fee % of monies collected | `fees__management_percent` | number |
| 101 | iv. Administration fee $ | `fees__admin_fee_per_period` | number |
| 102 | iv. Per (period) | `fees__admin_fee_period` | text |
| 103 | v. Lease Renewal Fee per signing | `fees__lease_renewal_fee` | number |
| 104 | vi. Other fees | `fees__other` | text |

---

## CLAUSE 8 — Services, Charges and Expenses (Page 6)

### Part A — Services

| # | Form Label | Canonical Key (amount) | Canonical Key (when due) |
|---|-----------|------------------------|--------------------------|
| 105–106 | Attendance at tribunal/court | `services__tribunal_amount` | `services__tribunal_when_due` |
| 107–108 | Preparation of tribunal/court case | `services__tribunal_prep_amount` | `services__tribunal_prep_when_due` |
| 109–110 | Arranging repairs and maintenance | `services__repairs_amount` | `services__repairs_when_due` |
| 111–112 | Water/sewerage usage charges (% of cost) | `services__water_sewerage_amount` | `services__water_sewerage_when_due` |
| 113–114 | Arrangement of refurbishment/improvements | `services__refurbishment_amount` | `services__refurbishment_when_due` |
| 115–116 | Processing insurance claims ($ per hour) | `services__insurance_claims_amount` | `services__insurance_claims_when_due` |
| 117–118 | Disaster/emergency management (% of cost) | `services__disaster_management_amount` | `services__disaster_management_when_due` |
| 119–120 | Other (Part A) | `services__other_a_amount` | `services__other_a_when_due` |
| 121–122 | Smoke alarm inspection | `services__smoke_alarm_inspection_amount` | `services__smoke_alarm_inspection_when_due` |
| 123–124 | Service of any notice | `services__notice_service_amount` | `services__notice_service_when_due` |

### Part B — Reimbursement of miscellaneous expenses

| # | Form Label | Canonical Key (amount) | Canonical Key (when due) |
|---|-----------|------------------------|--------------------------|
| 125–126 | Marketing/promotional expenses per letting | `services__marketing_amount` | `services__marketing_when_due` |
| 127–128 | Statement/administration fees | `services__statement_admin_amount` | `services__statement_admin_when_due` |
| 129–130 | Office expenses (postage, phone, out-of-pocket) | `services__office_expenses_amount` | `services__office_expenses_when_due` |
| 131–132 | Other (Part B, line 1) | `services__other_b1_amount` | `services__other_b1_when_due` |
| 133 | NCAT fees (note) | `services__ncat_fees_note` | — |
| 134 | Sheriff's fees (note) | `services__sheriff_fees_note` | — |
| 135–136 | Other (Part B, line 2) | `services__other_b2_amount` | `services__other_b2_when_due` |

---

## CLAUSE 10 — Promotional Activities (Page 6)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 137 | Advertising description / method | `promotion__advertising_description` | text |
| 138 | Promotional fee per leasing $ | `promotion__fee_amount` | number |
| 139 | Promotional fee — when due | `promotion__fee_when_due` | text |
| 140 | Permission to erect "For Lease" sign | `promotion__for_lease_sign` | radio yes/no |

---

## CLAUSE 11 — Administration of Tenancy Agreement (Pages 6–7)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 141 | i. Arrange inspections and show prospective tenants | `authority__inspect_show_tenants` | radio yes/no |
| 142 | ii. Obtain references from prospective tenants | `authority__obtain_references` | radio yes/no |
| 143 | iii.a. Select tenants | `authority__select_tenants` | radio yes/no |
| 144 | iii.b. Recommend tenants | `authority__recommend_tenants` | radio yes/no |
| 145 | iv. Enter into and sign tenancy agreements | `authority__sign_tenancy` | radio yes/no |
| 146 | v. Collect rent and other amounts | `authority__collect_rent` | radio yes/no |
| 147 | vi. Issue receipts for monies received | `authority__issue_receipts` | radio yes/no |
| 148 | vii. Receive and disburse rental bonds | `authority__receive_bond` | radio yes/no |
| 149 | viii. Make claims for refund of bond monies | `authority__claim_bond_refund` | radio yes/no |
| 150 | ix. Respond to NCAT applications and represent Principal | `authority__respond_ncat` | radio yes/no |
| 151 | x. Enforce or terminate tenancy agreements, serve notices | `authority__enforce_terminate` | radio yes/no |
| 152 | xi. Forward copies of documents to Principal | `authority__forward_copies` | radio yes/no |
| 153 | xii. Undertake inspections at Agent's discretion | `authority__undertake_inspections` | radio yes/no |
| 154 | xiii. Obtain by-laws / management statement for strata | `authority__obtain_bylaws` | radio yes/no |

---

## CLAUSE 12 — NCAT Authority (Page 7)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 155 | i. Recovery of possession from tenants | `ncat__authority_possession` | radio yes/no |
| 156 | ii. Recovery of monies due | `ncat__authority_recover_monies` | radio yes/no |

---

## CLAUSE 13 — S.5A Lease (Page 7)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 157 | Released from rent control by 5A Lease / vacant after 1 Jan 1986 | `management_authority__s5a_released` | radio yes/no |

---

## CLAUSE 14 — Inventories (Page 7)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 158 | Inventory prepared by | `management_authority__inventory_prepared_by` | radio principal/agent |

---

## CLAUSE 16 — Repairs and Maintenance (Page 7)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 159 | Expenditure limit without prior approval $ | `management_authority__repairs_limit` | number |

---

## CLAUSE 17 — Disbursements from Principal's Monies (Page 7)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 160 | i. Repairs and maintenance | `disbursements__repairs_maintenance` | radio yes/no |
| 161 | ii. Council rates | `disbursements__council_rates` | radio yes/no |
| 162 | iii. Water, sewerage and drainage rates | `disbursements__water_rates` | radio yes/no |
| 163 | iv. Insurance premiums | `disbursements__insurance` | radio yes/no |
| 164 | v. Owners corporation levies | `disbursements__owners_corp_levies` | radio yes/no |
| 165 | vi. Maintenance expenses (caretaking/cleaning/gardening) | `disbursements__maintenance_expenses` | radio yes/no |
| 166 | vii. Maintenance contracts for installed services | `disbursements__maintenance_contracts` | radio yes/no |
| 167 | viii. Smoke alarm compliance costs | `disbursements__smoke_alarm_costs` | radio yes/no |
| 168 | ix. NCAT fees | `disbursements__ncat_fees` | radio yes/no |
| 169 | x. Writ of execution | `disbursements__writ_of_execution` | radio yes/no |
| 170 | xi. Sheriff's fees | `disbursements__sheriff_fees` | radio yes/no |
| 171 | xii. Fee to obtain by-law or management statement | `disbursements__bylaw_fee` | radio yes/no |
| 172 | xiii. Custom disbursement 1 (label) | `disbursements__custom_0__label` | text |
| 172 | xiii. Custom disbursement 1 (yes/no) | `disbursements__custom_0__authorised` | radio yes/no |
| 173 | xiv. Custom disbursement 2 (label) | `disbursements__custom_1__label` | text |
| 173 | xiv. Custom disbursement 2 (yes/no) | `disbursements__custom_1__authorised` | radio yes/no |

---

## CLAUSE 24 — Disclosure of Information to Tenants (Page 8)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 174 | i.a. Contract for sale prepared? | `disclosure__sale_contract_prepared` | radio yes/no |
| 175 | i.b. Proposal to sell? | `disclosure__proposal_to_sell` | radio yes/no |
| 176 | i.c. Mortgagee commenced proceedings? | `disclosure__mortgagee_proceedings` | radio yes/no |
| 177 | — Mortgagee taking action for possession? | `disclosure__mortgagee_possession` | radio yes/no |
| 178 | i.d. Strata renewal committee established? | `disclosure__strata_renewal_committee` | radio yes/no |

---

## CLAUSE 25 — Material Facts (Pages 8–9)

| # | Form Label | Canonical Key (radio) | Canonical Key (details) |
|---|-----------|----------------------|-------------------------|
| 179–180 | i.a. Flooding / bush fire within last 5 years | `disclosure__flooding_bushfire` | `disclosure__flooding_bushfire__details` |
| 181–182 | i.b. Significant health or safety risks | `disclosure__health_safety_risks` | `disclosure__health_safety_risks__details` |
| 183–184 | i.c. Listed on LFAI Register | `disclosure__loose_fill_asbestos` | `disclosure__loose_fill_asbestos__details` |
| 185–186 | i.d. Scene of serious violent crime within last 5 years | `disclosure__violent_crime` | `disclosure__violent_crime__details` |
| 187–188 | i.e. Used for manufacture/cultivation of prohibited drug/plant within last 2 years | `disclosure__prohibited_drug` | `disclosure__prohibited_drug__details` |
| 189–190 | i.f. Council waste services on different basis | `disclosure__council_waste` | `disclosure__council_waste__details` |
| 191–192 | i.g. Residential parking permit not obtainable | `disclosure__residential_parking` | `disclosure__residential_parking__details` |
| 193–194 | i.h. Shared driveway or walkway | `disclosure__shared_driveway` | `disclosure__shared_driveway__details` |
| 195–196 | i.i. Scheduled strata rectification work during fixed term | `disclosure__strata_rectification` | `disclosure__strata_rectification__details` |
| 197–198 | i.j. Fire safety order re: external combustible cladding | `disclosure__combustible_cladding_fire_order` | `disclosure__combustible_cladding_fire_order__details` |
| 199–200 | i.k. Building product rectification order re: cladding | `disclosure__combustible_cladding_rectification_order` | `disclosure__combustible_cladding_rectification_order__details` |
| 201–202 | i.l. DA / CDC lodged for cladding rectification | `disclosure__combustible_cladding_da` | `disclosure__combustible_cladding_da__details` |

---

## CLAUSE 26 — Privacy (Page 10)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 203 | Opt out of marketing communications | `privacy__opt_out` | checkbox |

---

## CLAUSE 27 — Disclosure of Rebates (Page 10)

Table — 7 rows. Keys use `_N__` indexing (0–6):

| Canonical Key | Type |
|---------------|------|
| `rebates__0__third_party_name` through `rebates__6__third_party_name` | text |
| `rebates__0__relationship` through `rebates__6__relationship` | text |
| `rebates__0__value` through `rebates__6__value` | currency |

---

## CLAUSE 28 — Work, Health and Safety (Page 11)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 205 | a. Without risk to WHS | `whs__without_risk` | radio yes/no |
| 206 | b. Subject to risks and controls as advised in writing | `whs__subject_to_risks` | radio yes/no |

---

## CLAUSE 32 — Last Rent Increase (Page 11)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 207 | Premises not being leased to a tenant | `last_rent__not_leased` | checkbox |
| 208 | Premises are leased — date of last rent increase | `last_rent__is_leased` | checkbox |
| 209 | Date of last rent increase | `last_rent__increase_date` | date |

---

## CLAUSE 33 — Tenancy Exclusion Period (Page 11)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 210 | a. Not subject to a Tenancy Exclusion Period | `tenancy_exclusion__not_subject` | radio yes/no |
| 211 | b. Subject but approved early entry | `tenancy_exclusion__approved_early` | radio yes/no |
| 212 | c. Subject — period expires on (date) | `tenancy_exclusion__expires_on` | radio yes/no |
| 213 | Tenancy Exclusion Period expiry date | `tenancy_exclusion__expiry_date` | date |

---

## CLAUSE 34 — Schemes and Accommodation (Page 12)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 214 | a. NSW Government key worker housing scheme | `schemes__key_worker` | radio yes/no |
| 215 | b. Affordable housing scheme | `schemes__affordable_housing` | radio yes/no |
| 216 | Affordable housing — operated for limited period? | `schemes__affordable_limited_period` | radio yes/no |
| 217 | Affordable housing scheme end date | `schemes__affordable_end_date` | date |
| 218 | c. Transitional housing program | `schemes__transitional_housing` | radio yes/no |
| 219 | Transitional — operated for limited period? | `schemes__transitional_limited_period` | radio yes/no |
| 220 | Transitional program end date | `schemes__transitional_end_date` | date |
| 221 | d. Purpose-built student accommodation | `schemes__student_accommodation` | radio yes/no |

---

## CLAUSE 37 — Water Efficiency Measures (Page 12)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 222 | Water efficiency measures in place (per RTA 2010) | `water_efficiency__compliant` | radio yes/no |

---

## CLAUSE 45 — Swimming Pool (Page 13)

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 223 | Swimming pool on property? | `pool__has_pool` | radio yes/no |
| 224 | i. Registered on NSW Swimming Pool Register? | `pool__registered` | radio yes/no |
| 225 | ii.a. Valid certificate of compliance (< 3 years) | `pool__compliance_cert` | radio yes/no |
| 226 | ii.b. Valid occupation certificate (< 3 years) | `pool__occupation_cert` | radio yes/no |

---

## SIGNATURES (Page 14)

### Principal — Individual

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 227 | Signature — 1st Principal | `signatures__party_0__signature` | signature |
| 228 | Date — 1st Principal | `signatures__party_0__date` | date |
| 229 | Name of Signatory — 1st | `signatures__party_0__name` | text |
| 230 | Authority of Signatory — 1st | `signatures__party_0__authority` | text |
| 231 | Signature — 2nd Principal | `signatures__party_1__signature` | signature |
| 232 | Date — 2nd Principal | `signatures__party_1__date` | date |
| 233 | Name of Signatory — 2nd | `signatures__party_1__name` | text |
| 234 | Authority of Signatory — 2nd | `signatures__party_1__authority` | text |

### Principal — Corporation

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 235 | Executed for and on behalf of (corp name) | `signatures__corp__name` | text |
| 236 | ACN | `signatures__corp__acn` | text |
| 237 | Signature — Corporate signatory 1 | `signatures__corp__signatory_0__signature` | signature |
| 238 | Date — Corporate signatory 1 | `signatures__corp__signatory_0__date` | date |
| 239 | Name — Corporate signatory 1 | `signatures__corp__signatory_0__name` | text |
| 240 | Authority — Corporate signatory 1 | `signatures__corp__signatory_0__authority` | text |
| 241 | Signature — Corporate signatory 2 | `signatures__corp__signatory_1__signature` | signature |
| 242 | Date — Corporate signatory 2 | `signatures__corp__signatory_1__date` | date |
| 243 | Name — Corporate signatory 2 | `signatures__corp__signatory_1__name` | text |
| 244 | Authority — Corporate signatory 2 | `signatures__corp__signatory_1__authority` | text |

### Agent

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 245 | Signature of Agent / Authorised Representative | `signatures__agent__signature` | signature |
| 246 | Name of Signatory | `signatures__agent__name` | text |
| 247 | Date | `signatures__agent__date` | date |

---

## SCHEDULE (Page 15)

### Council / Water Rates

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 248 | Council rates details | `schedule__council_rates_details` | text |
| 249 | Water/sewerage rates details | `schedule__water_rates_details` | text |

### Insurance

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 250 | Company | `schedule__insurance_company` | text |
| 251 | Broker / Agent | `schedule__insurance_broker` | text |
| 252 | Other information | `schedule__insurance_other_info` | text |

### Insurance Policies Table

| Policy | Canonical Key (insurer) | Canonical Key (policy no) | Canonical Key (date due) |
|--------|------------------------|--------------------------|--------------------------|
| Building | `schedule__insurance_building__insurer` | `schedule__insurance_building__policy_no` | `schedule__insurance_building__date_due` |
| Contents | `schedule__insurance_contents__insurer` | `schedule__insurance_contents__policy_no` | `schedule__insurance_contents__date_due` |
| Landlord's Protection | `schedule__insurance_landlords__insurer` | `schedule__insurance_landlords__policy_no` | `schedule__insurance_landlords__date_due` |
| Other | `schedule__insurance_other__insurer` | `schedule__insurance_other__policy_no` | `schedule__insurance_other__date_due` |

### Strata Details

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 254 | Strata Plan No. | `schedule__strata__plan_no` | text |
| 255 | Lot No. | `schedule__strata__lot_no` | text |
| 256 | Garage Lot No. | `schedule__strata__garage_lot_no` | text |
| 257 | Strata Management Agent name | `schedule__strata__agent_name` | text |
| 258 | Address | `schedule__strata__address_street` | text |
| 259 | Postcode | `schedule__strata__address_postcode` | text |
| 260 | Phone: Work | `schedule__strata__phone_work` | text |
| 261 | Phone: Mobile | `schedule__strata__phone_mobile` | text |
| 262 | Phone: Home | `schedule__strata__phone_home` | text |
| 263 | Email | `schedule__strata__email` | text |

### Statements

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 264 | Statement in name of | `schedule__statements__in_name_of` | text |
| 265 | Forward to — Name | `schedule__statements__forward_name` | text |
| 266 | Forward to — Address | `schedule__statements__forward_address` | text |
| 267 | Forward to — Postcode | `schedule__statements__forward_postcode` | text |
| 268 | Copy to — Email | `schedule__statements__copy_email` | text |
| 269 | Copy to — Name | `schedule__statements__copy_name` | text |
| 270 | Copy to — Address | `schedule__statements__copy_address` | text |
| 271 | Copy to — Postcode | `schedule__statements__copy_postcode` | text |
| 272 | Cheques payable to | `schedule__statements__cheques_payable_to` | text |

### EFT Account Details Table (2 rows)

| Row | Canonical Key (bank) | Canonical Key (account name) | Canonical Key (BSB) | Canonical Key (account no) | Canonical Key (proportion) |
|-----|----------------------|------------------------------|---------------------|----------------------------|----------------------------|
| 0 | `schedule__eft_0__bank_name` | `schedule__eft_0__account_name` | `schedule__eft_0__bsb` | `schedule__eft_0__account_no` | `schedule__eft_0__payment_proportion` |
| 1 | `schedule__eft_1__bank_name` | `schedule__eft_1__account_name` | `schedule__eft_1__bsb` | `schedule__eft_1__account_no` | `schedule__eft_1__payment_proportion` |

> Note: EFT row 0 maps to `owner_bank__*` fields in the wizard. Row 1 supports co-ownership split disbursements.

### Principal's Representative

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 274 | Name | `schedule__representative__name` | text |
| 275 | Address | `schedule__representative__address` | text |
| 276 | Postcode | `schedule__representative__postcode` | text |
| 277 | Phone: Work | `schedule__representative__phone_work` | text |
| 278 | Phone: Home | `schedule__representative__phone_home` | text |
| 279 | Email | `schedule__representative__email` | text |

### Principal's Solicitor

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 280 | Name | `schedule__solicitor__name` | text |
| 281 | Address | `schedule__solicitor__address` | text |
| 282 | Postcode | `schedule__solicitor__postcode` | text |
| 283 | Phone: Work | `schedule__solicitor__phone_work` | text |
| 284 | Phone: Home | `schedule__solicitor__phone_home` | text |
| 285 | Email | `schedule__solicitor__email` | text |

### Special Instructions

| # | Form Label | Canonical Key | Type |
|---|-----------|---------------|------|
| 286 | Special Instructions | `schedule__special_instructions` | textarea |

---

## Summary by namespace prefix

| Prefix | Covers | Field count |
|--------|--------|-------------|
| `party_0__` … `party_3__` | Principal owners (up to 4) | ~9 × 4 = 36 |
| `agent__` | Agent / Licensee | 10 |
| `management_authority__` | Clauses 3, 4, 5, 6, RTA contact, misc | ~22 |
| `property__` | Premises description | 6 |
| `inspection__` | Inspection report | 15 |
| `fees__` | Clause 7 remuneration | 7 |
| `services__` | Clause 8 services & charges | ~24 |
| `promotion__` | Clause 10 promotional | 4 |
| `authority__` | Clause 11 powers | 14 |
| `ncat__` | Clause 12 NCAT authority | 2 |
| `disbursements__` | Clause 17 disbursements | 16 |
| `disclosure__` | Clauses 24 & 25 | 29 |
| `privacy__` | Clause 26 | 1 |
| `rebates__` | Clause 27 (7 rows × 3 cols) | 21 |
| `whs__` | Clause 28 | 2 |
| `last_rent__` | Clause 32 | 3 |
| `tenancy_exclusion__` | Clause 33 | 4 |
| `schemes__` | Clause 34 | 8 |
| `water_efficiency__` | Clause 37 | 1 |
| `pool__` | Clause 45 | 4 |
| `signatures__` | Page 14 signatures | 21 |
| `schedule__` | Page 15 schedule | ~55 |
| **Total** | | **~286** |

---

## What was missing from the earlier wizard build

The following sections existed in the PDF but had **no fields** in the previous Form.io wizard schema:

| Missing section | Fields | Canonical prefix |
|----------------|--------|-----------------|
| Inspection Report | 15 | `inspection__` |
| RTA Contact (Cl. 4 continuation) | 10 | `management_authority__rta_*` |
| Garage/Car space on premises | 1 | `property__has_garage` |
| Clause 6 — Re-lease authority | 3 | `management_authority__authority_re_lease*` |
| Clause 8 — All service fees table | 24 | `services__` |
| Clause 10 — Promotional | 4 | `promotion__` |
| Clause 12 — NCAT authority | 2 | `ncat__` |
| Clause 13 — S.5A Lease | 1 | `management_authority__s5a_released` |
| Clause 14 — Inventories | 1 | `management_authority__inventory_prepared_by` |
| Clause 24 — Disclosure to tenants | 5 | `disclosure__sale_contract_prepared` etc |
| Clause 25 — 7 of 12 material facts missing | 14 | `disclosure__council_waste` etc |
| Clause 26 — Privacy opt-out | 1 | `privacy__opt_out` |
| Clause 27 — Rebates table | 21 | `rebates__` |
| Clause 28 — WHS | 2 | `whs__` |
| Clause 32 — Last rent increase | 3 | `last_rent__` |
| Clause 33 — Tenancy exclusion period | 4 | `tenancy_exclusion__` |
| Clause 34 — Schemes | 8 | `schemes__` |
| Clause 37 — Water efficiency | 1 | `water_efficiency__compliant` |
| Clause 45 — Swimming pool | 4 | `pool__` |
| Signatures page | 21 | `signatures__` |
| Schedule (full page) | ~55 | `schedule__` |
