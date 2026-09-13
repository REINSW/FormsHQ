const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * context: 'intake' | 'wizard_principal' | 'wizard_property' | 'wizard_fees' |
 *          'wizard_authority' | 'wizard_trust'
 */
async function extractFields(transcript, context) {
  const schemas = {
    intake: {
      description: 'Agent intake creation — capture client and property basics',
      fields: `{
  "clientName": "Full name of the owner/landlord (string)",
  "clientEmail": "Email address (string)",
  "clientMobile": "Mobile phone number in Australian format (string)",
  "propertyAddress": "Full property address including suburb and state (string)"
}`,
    },

    wizard_principal: {
      description: 'FM00100 wizard — Principal / Owner details',
      fields: `{
  "party_0__ownership_type": "individual | company | trust",
  "party_0__full_name": "Full name if individual (string)",
  "party_0__company_name": "Company or trust name if applicable (string)",
  "party_0__abn": "ABN (string, digits only)",
  "party_0__acn": "ACN (string, digits only)",
  "party_0__registered_for_gst": "true | false (boolean as string)",
  "party_0__email": "Email address (string)",
  "party_0__phone_mobile": "Mobile number (string)",
  "party_0__phone_work": "Work phone (string)",
  "party_0__street_address": "Residential/postal street address (string)",
  "party_0__suburb": "Suburb (string)",
  "party_0__state": "State abbreviation: NSW | VIC | QLD | SA | WA | TAS | ACT | NT (string)",
  "party_0__postcode": "4-digit postcode (string)"
}`,
    },

    wizard_property: {
      description: 'FM00100 wizard — Property details',
      fields: `{
  "property__street_address": "Street address of the property (string)",
  "property__suburb": "Suburb (string)",
  "property__state": "State abbreviation (string)",
  "property__postcode": "Postcode (string)",
  "property__type": "house | apartment | townhouse | villa | unit | duplex | land | commercial (string)",
  "property__bedrooms": "Number of bedrooms (string)",
  "property__bathrooms": "Number of bathrooms (string)",
  "property__parking": "Number of parking spaces (string)",
  "property__strata_lot_no": "Strata lot number if applicable (string)",
  "property__features": "Comma-separated list of features from: swimming_pool, split_system_ac, ducted_ac, dishwasher, ensuite, balcony, fully_fenced, remote_garage, solar_panels, alarm_system (string)"
}`,
    },

    wizard_fees: {
      description: 'FM00100 wizard — Leasing, rent and fees',
      fields: `{
  "leasing__rent_amount": "Weekly or monthly rent amount as number only (string)",
  "leasing__rent_period": "weekly | fortnightly | monthly (string)",
  "leasing__payment_frequency": "weekly | fortnightly | monthly (string)",
  "leasing__lease_term": "6 months | 12 months | 24 months | month-to-month (string)",
  "leasing__start_date": "Preferred start date in YYYY-MM-DD format (string)",
  "fees__management_pct": "Management fee percentage as number only e.g. 8.8 (string)",
  "fees__letting_weeks": "Letting fee in weeks e.g. 1 or 2 (string)",
  "fees__admin_fee": "Admin/sundry fee in dollars (string)"
}`,
    },

    wizard_authority: {
      description: 'FM00100 wizard — Authority limits and disbursements',
      fields: `{
  "authority__repairs_limit": "Repair spend limit in dollars before contacting owner (string)",
  "authority__issue_receipts": "true | false — agent authorised to issue rental receipts (string)",
  "authority__bond_claims": "true | false — agent authorised to make bond claims (string)",
  "authority__re_lease": "true | false — agent authorised to re-lease without referral (string)",
  "authority__review_rent": "true | false — agent authorised to review rent (string)",
  "disb__water": "true | false — disburse water rates (string)",
  "disb__council": "true | false — disburse council rates (string)",
  "disb__insurance": "true | false — disburse insurance (string)",
  "disb__strata": "true | false — disburse strata levies (string)"
}`,
    },

    wizard_trust: {
      description: 'FM00100 wizard — Owner bank account for rental disbursements',
      fields: `{
  "owner_bank__bank_name": "Name of the bank (string)",
  "owner_bank__account_name": "Account name (string)",
  "owner_bank__bsb": "BSB number (string)",
  "owner_bank__account_no": "Account number (string)"
}`,
    },
  };

  const schema = schemas[context] || schemas.intake;

  const prompt = `You are a data extraction assistant for an Australian real estate property management platform.

A property manager has spoken the following transcript. Extract the relevant fields and return ONLY valid JSON matching the schema below.

Rules:
- Only include fields you are confident about from the transcript
- Do not guess or invent values
- For boolean fields, return the string "true" or "false"
- For phone numbers, format as Australian style (e.g. 0412 345 678)
- If a field is not mentioned, omit it from the response entirely
- Return only the JSON object, no explanation

Context: ${schema.description}

Schema (return only a subset of these fields based on what was said):
${schema.fields}

Transcript:
"${transcript}"

JSON response:`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim();

  // Strip markdown code fences if present
  const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${raw.slice(0, 200)}`);
  }
}

module.exports = { extractFields };
