# FM00100 — Form.io Field Keys (Canonical)

Source of truth: `REI_Forms_NSW_Field_Mapping_v1.xlsx` (FM00100 sheet, 189 rows)
Canonical schema: `REI_Forms_NSW_Canonical_Schema_v2.docx`

**Key convention:**
- Canonical dot notation: `party[0].name_full`, `management_authority.leasing.rent_amount`
- Form.io flattened key: dots → `__`, `[n]` → `_n__`
  - `party[0].name_full` → `party_0__name_full`
  - `management_authority.leasing.rent_amount` → `management_authority__leasing__rent_amount`
  - `fees.service_fees[0].amount` → `fees__service_fees_0__amount`

**SENSITIVE fields** (marked 🔒): must be encrypted at rest — bank account numbers, BSB.

---

## AGENCY / AGENT

| PDF Field Name | Canonical Key (dot) | Form.io Key | Type | Required |
|---|---|---|---|---|
| Agent_Name | agency.name | `agency__name` | string | Y |
| Agent_Trading_As | agency.trading_as | `agency__trading_as` | string | N |
| Agent_ABN_ACN | agency.abn | `agency__abn` | string | Y |
| Agent_Licence_No | agency.licence_no | `agency__licence_no` | string | Y |
| Agent_Address | agency.address_street | `agency__address_street` | string | Y |
| Agent_Address2 | agency.address_suburb | `agency__address_suburb` | string | Y |
| Agent_Postcode | agency.address_postcode | `agency__address_postcode` | string | Y |
| Agent_Phone_Work | agency.phone | `agency__phone` | string | Y |
| Agent_Phone_Mobile | agency.mobile | `agency__mobile` | string | N |
| Agent_Email | agency.email | `agency__email` | email | Y |
| Agent_GST_Reg | agency.gst_registered | `agency__gst_registered` | boolean | Y |
| Agent_NameFull_Signature | agent.name_full | `agent__name_full` | string | Y |
| Company_Name_Signatures | agency.name | `agency__name` | string | N |
| Company_ACN_Signatures | agency.acn | `agency__acn` | string | N |

---

## PRINCIPAL (LANDLORD) — SLOT 1

| PDF Field Name | Canonical Key (dot) | Form.io Key | Type | Required |
|---|---|---|---|---|
| Principal_NameFull | party[0].name_full | `party_0__name_full` | string | Y |
| Principal_ABN | party[0].abn | `party_0__abn` | string | N |
| Principal_GST_Reg | party[0].gst_registered | `party_0__gst_registered` | boolean | N |
| Principal_AddressLine1 | party[0].address.street | `party_0__address__street` | string | Y |
| Principal_AddressLine2 | party[0].address.suburb | `party_0__address__suburb` | string | Y |
| Principal_Postcode | party[0].address.postcode | `party_0__address__postcode` | string | Y |
| Principal_ContactHm | party[0].phone_home | `party_0__phone_home` | string | N |
| Principal_ContactWk | party[0].phone_work | `party_0__phone_work` | string | N |
| Principal_ContactMobile | party[0].mobile | `party_0__mobile` | string | N |
| Principal_ContactEmail | party[0].email | `party_0__email` | email | Y |
| Principal_Director_SO | party[0].company.signing_capacity | `party_0__company__signing_capacity` | enum | N |
| Principal_Director_NameFull_Signature | party[0].company.director_name | `party_0__company__director_name` | string | N |
| Principal (1)_SigningDate | signatory[0].signed_at | `signatory_0__signed_at` | date | N |

---

## PRINCIPAL (LANDLORD) — SLOT 2

| PDF Field Name | Canonical Key (dot) | Form.io Key | Type | Conditional On |
|---|---|---|---|---|
| Principal2_NameFull | party[1].name_full | `party_1__name_full` | string | second owner present |
| Principal2_ABN | party[1].abn | `party_1__abn` | string | |
| Principal2_GST_Reg | party[1].gst_registered | `party_1__gst_registered` | boolean | |
| Principal2_AddressLine1 | party[1].address.street | `party_1__address__street` | string | |
| Principal2_AddressLine2 | party[1].address.suburb | `party_1__address__suburb` | string | |
| Principal2_Postcode | party[1].address.postcode | `party_1__address__postcode` | string | |
| Principal2_ContactEmail | party[1].email | `party_1__email` | email | |
| Principal2_ContactHm | party[1].phone_home | `party_1__phone_home` | string | |
| Principal2_ContactMobile | party[1].mobile | `party_1__mobile` | string | |
| Principal2_ContactWk | party[1].phone_work | `party_1__phone_work` | string | |
| Principal2_Director_NameFull_Signature | party[1].company.director_name | `party_1__company__director_name` | string | |
| Principal (2)_SigningDate | signatory[1].signed_at | `signatory_1__signed_at` | date | |

---

## PROPERTY

| PDF Field Name | Canonical Key (dot) | Form.io Key | Type | Required |
|---|---|---|---|---|
| Premises_Street1 | property.address.street | `property__address__street` | string | Y |
| Premises_Street2 / Premises_Suburb | property.address.suburb | `property__address__suburb` | string | Y |
| Premises_State | property.address.state | `property__address__state` | enum | Y |
| Premises_Postcode | property.address.postcode | `property__address__postcode` | string | Y |
| Premises_Being | property.property_type | `property__property_type` | string | N |
| Garage_Car_Space_included | property.car_spaces | `property__car_spaces` | integer | N |
| Strata_Details_Strata_Plan_No | property.strata_plan_no | `property__strata_plan_no` | string | N |
| Strata_Details_Strata_Plan_No_Lot_No | property.strata_lot_no | `property__strata_lot_no` | string | N |
| Strata_Details_Strata_Plan_No_Lot_No_Garage_Lot_No | property.strata_garage_lot_no | `property__strata_garage_lot_no` | string | N |
| Strata_Details_Strata_Management_Agent | property.strata_manager_name | `property__strata_manager_name` | string | N |
| Strata_Details_Phone_Work | property.strata_manager_phone | `property__strata_manager_phone` | string | N |
| Strata_Details_Email | property.strata_manager_email | `property__strata_manager_email` | email | N |
| Strata_Details_Address | property.strata_manager_address | `property__strata_manager_address` | string | N |
| WithoutRiskCheckbox | property.whs_without_risk | `property__whs_without_risk` | boolean | N |
| Building_Product_Rectification_Order_CB | property.compliance.building_product_rectification | `property__compliance__building_product_rectification` | boolean | Y |
| Building_Product_Rectification_Order_Details | property.compliance.building_product_rectification_detail | `property__compliance__building_product_rectification_detail` | text | N |
| Strata_Rectification_Work_CB | property.compliance.strata_rectification_work | `property__compliance__strata_rectification_work` | boolean | N |
| Strata_Renewal_Committee_Established_CB | property.compliance.strata_renewal_committee | `property__compliance__strata_renewal_committee` | boolean | N |

---

## MANAGEMENT AUTHORITY TERMS

| PDF Field Name | Canonical Key (dot) | Form.io Key | Type | Required |
|---|---|---|---|---|
| Agreement_DD/MM/YYYY | management_authority.start_date | `management_authority__start_date` | date | Y |
| Agreement_written_notice_of_termination | management_authority.termination_notice_days | `management_authority__termination_notice_days` | integer | Y |
| Agents_Appointment_i | management_authority.scope.leasing | `management_authority__scope__leasing` | boolean | Y |
| Agents_Appointment_ii | management_authority.scope.rent_collection | `management_authority__scope__rent_collection` | boolean | Y |
| Agents_Appointment_iii | management_authority.scope.repairs_maintenance | `management_authority__scope__repairs_maintenance` | boolean | Y |
| Agents_Appointment_iv | management_authority.scope.repairs_limit | `management_authority__scope__repairs_limit` | decimal | Y |
| Agents_Appointment_v | management_authority.scope.inspections | `management_authority__scope__inspections` | boolean | Y |
| Agents_Appointment_vi | management_authority.scope.notices | `management_authority__scope__notices` | boolean | Y |
| Leasing_4i_term_of | management_authority.leasing.term | `management_authority__leasing__term` | string | N |
| Leasing_4ii_rent | management_authority.leasing.rent_amount | `management_authority__leasing__rent_amount` | decimal | N |
| Leasing_4ii_rent_per | management_authority.leasing.rent_period | `management_authority__leasing__rent_period` | enum | N |
| Leasing_4iii_Rental_bond | management_authority.leasing.bond_amount | `management_authority__leasing__bond_amount` | decimal | N |
| Special Instructions | management_authority.special_instructions | `management_authority__special_instructions` | text | N |

---

## FEES & REMUNERATION (Clause 7)

| PDF Field Name | Canonical Key (dot) | Form.io Key | Type |
|---|---|---|---|
| (Clause 7i — leasing fee) | fees.letting_fee | `fees__letting_fee` | decimal |
| (Clause 7ii — prep fee) | fees.admin_fee | `fees__admin_fee` | decimal |
| (Clause 7iii — management %) | fees.management_percent | `fees__management_percent` | decimal |
| (Clause 7iv — admin fee) | fees.admin_fee | `fees__admin_fee` | decimal |
| (Clause 7iv — period) | fees.admin_fee_period | `fees__admin_fee_period` | enum |
| Lease_Renewal_Fee | fees.lease_renewal_fee | `fees__lease_renewal_fee` | decimal |
| Lease_Renewal_weekly_percent | fees.lease_renewal_percent | `fees__lease_renewal_percent` | decimal |

---

## SERVICE FEES (Clause 8) — Typed Array

Service fees collapse to a typed array. Each PDF row maps to one array entry.

| PDF Field Group | fees.service_fees[n].type | Form.io Keys |
|---|---|---|
| Service_Fees_Attendance_Fee | `attendance` | `fees__service_fees_0__type`, `fees__service_fees_0__amount`, `fees__service_fees_0__when_due` |
| Service_Fees_Preparation_of_tribunal_case | `tribunal_preparation` | `fees__service_fees_1__*` |
| Service_Fees_Arrangement_of_Repairs | `repairs_arrangement` | `fees__service_fees_2__*` |
| Service_Fees_Calculation_and_Collection | `outgoings_collection` | `fees__service_fees_3__*` |
| Service_Fees_Arrangement_of_smoke_alarm | `smoke_alarm` | `fees__service_fees_4__*` |
| Service_Fees_Processing_Insurance_claims | `insurance_processing` | `fees__service_fees_5__*` |
| Service_Fees_Statements_Administration | `statements_admin` | `fees__service_fees_6__*` |
| Service_Fees_Service_of_any_notice | `notice_service` | `fees__service_fees_7__*` |
| NCAT_Fees | `court_attendance` | `fees__service_fees_8__*` |
| Sheriffs_Fees | `sheriff` | `fees__service_fees_9__*` |
| Service_Fees_Marketing_Fee | `marketing` | `fees__service_fees_10__*` |

---

## DISBURSEMENTS (Clause 17) — Checkbox Array

Disbursement checkboxes collapse to a single string array. Each checked item adds its label.

| PDF Field Name | Canonical Key | Form.io Key | Array Label |
|---|---|---|---|
| Disbursements_from_Principals_Monies_i | management_authority.disbursements | `management_authority__disbursements` | "Council Rates" |
| Disbursements_from_Principals_Monies_ii | management_authority.disbursements | `management_authority__disbursements` | "Water Rates" |
| Disbursements_from_Principals_Monies_iii | management_authority.disbursements | `management_authority__disbursements` | "Strata Levies" |
| Disbursements_from_Principals_Monies_iv | management_authority.disbursements | `management_authority__disbursements` | "Land Tax" |
| Disbursements_from_Principals_Monies_v | management_authority.disbursements | `management_authority__disbursements` | "Insurance Premiums" |
| Disbursements_from_Principals_Monies_vi | management_authority.disbursements | `management_authority__disbursements` | "Mortgage Repayments" |
| Disbursements_from_Principals_Monies_vii | management_authority.disbursements | `management_authority__disbursements` | "Body Corporate Levies" |
| Disbursements_from_Principals_Monies_viii | management_authority.disbursements | `management_authority__disbursements` | "Electricity" |
| Disbursements_from_Principals_Monies_ix | management_authority.disbursements | `management_authority__disbursements` | "Gas" |
| Disbursements_from_Principals_Monies_Smoke_Alarms | management_authority.disbursements | `management_authority__disbursements` | "Smoke Alarm Maintenance" |
| Disbursements_xi_Fill | management_authority.disbursements_other | `management_authority__disbursements_other` | free text |

---

## TRUST ACCOUNT / STATEMENTS

| PDF Field Name | Canonical Key (dot) | Form.io Key | Sensitive |
|---|---|---|---|
| Statements_Cheques_payable_to | agency.trust_account_name | `agency__trust_account_name` | |
| Statements_Cheques_payable_to_or_Bank_to_the_credit_of_account_number_BSB | agency.trust_bsb | `agency__trust_bsb` | 🔒 |
| Statements_Cheques_payable_to_or_Bank_to_the_credit_of_account_number | agency.trust_account_number | `agency__trust_account_number` | 🔒 |
| Statements_Cheques_payable_to_or_Bank_to_the_credit_of_account_number_BSB_Bank | agency.trust_bank_name | `agency__trust_bank_name` | |
| Statements_Forward_To_Name | management_authority.statements_forward_to_name | `management_authority__statements_forward_to_name` | |
| Statements_Forward_To_Email | management_authority.statements_forward_to_email | `management_authority__statements_forward_to_email` | |
| Statements_Forward_To_Address | management_authority.statements_forward_to_address | `management_authority__statements_forward_to_address` | |
| Statements_Copy_To_Name | management_authority.statements_copy_to_name | `management_authority__statements_copy_to_name` | |

---

## INSURANCE (on party[0])

| PDF Field Name | Canonical Key (dot) | Form.io Key |
|---|---|---|
| Insurance_Policies_Building | party[0].insurance.building_insurer | `party_0__insurance__building_insurer` |
| Insurance_Policies_Building_Policy_Number | party[0].insurance.building_policy_no | `party_0__insurance__building_policy_no` |
| Insurance_Policies_Building_Date_Due | party[0].insurance.building_policy_expiry | `party_0__insurance__building_policy_expiry` |
| Insurance_Policies_Landlords_Protection | party[0].insurance.landlords_insurer | `party_0__insurance__landlords_insurer` |
| Insurance_Policies_Landlords_Protection_Policy_Number | party[0].insurance.landlords_policy_no | `party_0__insurance__landlords_policy_no` |
| Insurance_Policies_Landlords_Protection_Date_Due | party[0].insurance.landlords_policy_expiry | `party_0__insurance__landlords_policy_expiry` |
| Insurance_Policies_Contents_Policy_Number | party[0].insurance.contents_policy_no | `party_0__insurance__contents_policy_no` |
| Insurance_Policies_Contents_Date_Due | party[0].insurance.contents_policy_expiry | `party_0__insurance__contents_policy_expiry` |

---

## MATERIAL FACTS / DISCLOSURE (Clause 25)

| PDF Field Name | Canonical Key (dot) | Form.io Key | Required |
|---|---|---|---|
| Material_Fact_i | disclosure.flooding_bushfire | `disclosure__flooding_bushfire` | Y |
| Material_Fact_ii | disclosure.health_safety_risks | `disclosure__health_safety_risks` | Y |
| Material_Fact_iii | disclosure.loose_fill_asbestos | `disclosure__loose_fill_asbestos` | Y |
| Material_Fact_iv | disclosure.murder_manslaughter | `disclosure__murder_manslaughter` | Y |
| Material_Fact_v | disclosure.prohibited_drug | `disclosure__prohibited_drug` | Y |
| Material_Fact_vi | disclosure.other_adverse_matters | `disclosure__other_adverse_matters` | Y |
| Drug_Misuse_CB | disclosure.prohibited_drug | `disclosure__prohibited_drug` | Y |
| Fire_Safety_Order_CB | disclosure.fire_safety_order | `disclosure__fire_safety_order` | N |
| Development_Application_CB | disclosure.combustible_cladding_da | `disclosure__combustible_cladding_da` | N |

---

## REPRESENTATIVE / SOLICITOR

| PDF Field Name | Canonical Key (dot) | Form.io Key |
|---|---|---|
| PrincipalRep_NameFull / PrincipalSol_NameFull | solicitor.name | `solicitor__name` |
| PrincipalRep_AddressLine1 | solicitor.business_address | `solicitor__business_address` |
| PrincipalRep_ContactEmail / PrincipalSol_ContactEmail | solicitor.email | `solicitor__email` |
| PrincipalRep_ContactWk | solicitor.phone_work | `solicitor__phone_work` |
| RTA_Principal_NameFull | party[0].name_full | `party_0__name_full` |
| RTA_Principal_AddressLine1 | party[0].address.street | `party_0__address__street` |
| RTA_Principal_ContactEmail | party[0].email | `party_0__email` |

---

## THIRD PARTY DISCLOSURE (Clause 27)

No canonical mapping — stored as free text in the wizard. Three columns, 7 rows:

| Form.io Key | Description |
|---|---|
| `rebates_0__third_party_name` through `rebates_6__third_party_name` | Name of third party |
| `rebates_0__relationship` through `rebates_6__relationship` | Nature of relationship |
| `rebates_0__value` through `rebates_6__value` | Value of rebate/commission |

---

## KEY TRANSFORMS (from xlsx LEGEND)

| Transform | Meaning |
|---|---|
| `date_assemble_dmy` | Three PDF fields (DD, MM, YYYY) → single ISO 8601 date. On write, split ISO date back into three fields. |
| `ENCRYPT` / `is_sensitive` | Field value must be encrypted at rest. Applies to: `agency__trust_account_number`, `agency__trust_bsb`, and all bank account numbers. |
| `array_from_checkbox` | Disbursement checkboxes: checked → add label to `management_authority__disbursements` array. Write: check each checkbox whose label is in the array. |
| `enum_map` | Map display value to enum constant: "per week" → `weekly`, "Furnished" → `true`, Yes/No → boolean. |
| `strip_spaces` | Remove spaces from ABN/ACN values. |

---

## What was wrong in the prototype prefill.js

| Old key in prefill.js | Correct key per xlsx | Entity change |
|---|---|---|
| `agent__name` | `agency__name` | agency ≠ agent |
| `agent__licence_no` | `agency__licence_no` | agency ≠ agent |
| `agent__abn` | `agency__abn` | agency ≠ agent |
| `agent__address_street` | `agency__address_street` | agency ≠ agent |
| `agent__phone_work` | `agency__phone` | |
| `trust__bank_name` | `agency__trust_bank_name` | trust lives on agency |
| `trust__account_name` | `agency__trust_account_name` | |
| `trust__bsb` | `agency__trust_bsb` 🔒 | |
| `trust__account_no` | `agency__trust_account_number` 🔒 | |
| `management_authority__rent_amount` | `management_authority__leasing__rent_amount` | leasing is sub-object |
| `management_authority__lease_term` | `management_authority__leasing__term` | |
| `management_authority__rental_bond_weeks` | `management_authority__leasing__bond_amount` | |
| `disbursements__council_rates` (boolean) | `management_authority__disbursements` (string[]) | array not individual fields |
| `services__tribunal_amount` | `fees__service_fees_0__amount` + `fees__service_fees_0__type` | typed array |
| `party_0__address_street` | `party_0__address__street` | address is sub-object |
