/**
 * Address form data: countries (named in the shopper's language by Intl), regions where a list is
 * expected, and which countries need a postcode. Pure; tested.
 */

const COUNTRIES =
  'AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FO FR GA GB GD GE GH GI GL GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PR PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW'.split(
    ' ',
  );

/** Countries sorted by their name in `locale`, the store's own country first. */
export function countryOptions(locale: string, first?: string): { code: string; name: string }[] {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([locale], { type: 'region' });
  } catch {
    names = null;
  }
  const list = COUNTRIES.map((code) => ({ code, name: names?.of(code) ?? code })).sort((a, b) =>
    a.name.localeCompare(b.name, locale),
  );
  const head = list.find((c) => c.code === first);
  return head ? [head, ...list.filter((c) => c !== head)] : list;
}

/** Regions offered as a list (code → name); other countries take free text. */
export const REGIONS: Record<string, Record<string, string>> = {
  US: {
    AL: 'Alabama',
    AK: 'Alaska',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    DC: 'District of Columbia',
    FL: 'Florida',
    GA: 'Georgia',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PA: 'Pennsylvania',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming',
    PR: 'Puerto Rico',
  },
  CA: {
    AB: 'Alberta',
    BC: 'British Columbia',
    MB: 'Manitoba',
    NB: 'New Brunswick',
    NL: 'Newfoundland and Labrador',
    NS: 'Nova Scotia',
    NT: 'Northwest Territories',
    NU: 'Nunavut',
    ON: 'Ontario',
    PE: 'Prince Edward Island',
    QC: 'Quebec',
    SK: 'Saskatchewan',
    YT: 'Yukon',
  },
};

/** Countries where couriers need a postcode. */
const POSTCODE_REQUIRED = new Set([
  'US',
  'CA',
  'GB',
  'AU',
  'DE',
  'FR',
  'NL',
  'JP',
  'ES',
  'IT',
  'SE',
  'CH',
  'AT',
  'BE',
  'DK',
  'NO',
  'FI',
  'PL',
  'PT',
  'IE',
  'NZ',
  'SG',
  'KR',
  'IN',
  'BR',
  'MX',
]);

/** Whether the country's couriers need a postcode (the field is then required). */
export const postcodeRequired = (country?: string) => !!country && POSTCODE_REQUIRED.has(country);

export interface AddressInput {
  firstName: string;
  lastName: string;
  company?: string;
  phone: string;
  countryCode: string;
  regionCode?: string;
  city: string;
  postcode?: string;
  line1: string;
  line2?: string;
}

export type AddressField = keyof AddressInput;

/** The shop stores subdivisions as codes (ISO 3166-2 style, e.g. CA, NSW). */
export const REGION_CODE = /^[A-Z0-9-]{1,16}$/;

/** Fields the shopper still has to fill in (or fix). */
export function addressProblems(a: Partial<AddressInput>): AddressField[] {
  const out: AddressField[] = [];
  const blank = (v?: string) => !v || !v.trim();
  for (const f of ['firstName', 'lastName', 'phone', 'countryCode', 'city', 'line1'] as const)
    if (blank(a[f])) out.push(f);
  if (a.countryCode && REGIONS[a.countryCode] && !REGIONS[a.countryCode][a.regionCode ?? ''])
    out.push('regionCode');
  else if (a.regionCode?.trim() && !REGION_CODE.test(a.regionCode.trim().toUpperCase()))
    out.push('regionCode');
  if (a.countryCode && POSTCODE_REQUIRED.has(a.countryCode) && blank(a.postcode))
    out.push('postcode');
  if (a.phone && !/^[+()\d\s.-]{6,20}$/.test(a.phone.trim())) out.push('phone');
  return [...new Set(out)];
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Trimmed values, empty optional fields dropped (the shop treats absent as "none"). */
export function cleanAddress(a: Partial<AddressInput>): Partial<AddressInput> {
  return Object.fromEntries(
    Object.entries(a)
      .map(([k, v]) => [
        k,
        typeof v === 'string' ? (k === 'regionCode' ? v.trim().toUpperCase() : v.trim()) : v,
      ])
      .filter(([, v]) => v !== '' && v !== undefined && v !== null),
  );
}

/**
 * Field errors from a shop validation message ("shipping.regionCode must match …"), so the form can
 * highlight them instead of showing the raw message.
 */
export function fieldsFromApiError(message: string): {
  shipping: AddressField[];
  billing: AddressField[];
} {
  const out = { shipping: [] as AddressField[], billing: [] as AddressField[] };
  for (const m of message.matchAll(/\b(shipping|billing)\.(\w+)/g))
    out[m[1] as 'shipping' | 'billing'].push(m[2] as AddressField);
  return out;
}
