/**
 * List of countries for dropdown selections
 * Sorted alphabetically with common immigration countries at the top
 */

export interface Country {
  code: string;
  name: string;
  nationality: string;
}

// Most common countries in US immigration cases (shown first)
const PRIORITY_COUNTRIES: Country[] = [
  { code: 'MX', name: 'Mexico', nationality: 'Mexican' },
  { code: 'IN', name: 'India', nationality: 'Indian' },
  { code: 'CN', name: 'China', nationality: 'Chinese' },
  { code: 'PH', name: 'Philippines', nationality: 'Filipino' },
  { code: 'VN', name: 'Vietnam', nationality: 'Vietnamese' },
  { code: 'SV', name: 'El Salvador', nationality: 'Salvadoran' },
  { code: 'GT', name: 'Guatemala', nationality: 'Guatemalan' },
  { code: 'HN', name: 'Honduras', nationality: 'Honduran' },
  { code: 'DO', name: 'Dominican Republic', nationality: 'Dominican' },
  { code: 'CU', name: 'Cuba', nationality: 'Cuban' },
  { code: 'CO', name: 'Colombia', nationality: 'Colombian' },
  { code: 'BR', name: 'Brazil', nationality: 'Brazilian' },
  { code: 'KR', name: 'South Korea', nationality: 'South Korean' },
  { code: 'HT', name: 'Haiti', nationality: 'Haitian' },
  { code: 'JM', name: 'Jamaica', nationality: 'Jamaican' },
];

// All other countries (alphabetically sorted)
const OTHER_COUNTRIES: Country[] = [
  { code: 'AF', name: 'Afghanistan', nationality: 'Afghan' },
  { code: 'AL', name: 'Albania', nationality: 'Albanian' },
  { code: 'DZ', name: 'Algeria', nationality: 'Algerian' },
  { code: 'AR', name: 'Argentina', nationality: 'Argentine' },
  { code: 'AM', name: 'Armenia', nationality: 'Armenian' },
  { code: 'AU', name: 'Australia', nationality: 'Australian' },
  { code: 'AT', name: 'Austria', nationality: 'Austrian' },
  { code: 'AZ', name: 'Azerbaijan', nationality: 'Azerbaijani' },
  { code: 'BD', name: 'Bangladesh', nationality: 'Bangladeshi' },
  { code: 'BY', name: 'Belarus', nationality: 'Belarusian' },
  { code: 'BE', name: 'Belgium', nationality: 'Belgian' },
  { code: 'BZ', name: 'Belize', nationality: 'Belizean' },
  { code: 'BO', name: 'Bolivia', nationality: 'Bolivian' },
  { code: 'BA', name: 'Bosnia and Herzegovina', nationality: 'Bosnian' },
  { code: 'BG', name: 'Bulgaria', nationality: 'Bulgarian' },
  { code: 'KH', name: 'Cambodia', nationality: 'Cambodian' },
  { code: 'CM', name: 'Cameroon', nationality: 'Cameroonian' },
  { code: 'CA', name: 'Canada', nationality: 'Canadian' },
  { code: 'CL', name: 'Chile', nationality: 'Chilean' },
  { code: 'CR', name: 'Costa Rica', nationality: 'Costa Rican' },
  { code: 'HR', name: 'Croatia', nationality: 'Croatian' },
  { code: 'CZ', name: 'Czech Republic', nationality: 'Czech' },
  { code: 'DK', name: 'Denmark', nationality: 'Danish' },
  { code: 'EC', name: 'Ecuador', nationality: 'Ecuadorian' },
  { code: 'EG', name: 'Egypt', nationality: 'Egyptian' },
  { code: 'ER', name: 'Eritrea', nationality: 'Eritrean' },
  { code: 'EE', name: 'Estonia', nationality: 'Estonian' },
  { code: 'ET', name: 'Ethiopia', nationality: 'Ethiopian' },
  { code: 'FI', name: 'Finland', nationality: 'Finnish' },
  { code: 'FR', name: 'France', nationality: 'French' },
  { code: 'GE', name: 'Georgia', nationality: 'Georgian' },
  { code: 'DE', name: 'Germany', nationality: 'German' },
  { code: 'GH', name: 'Ghana', nationality: 'Ghanaian' },
  { code: 'GR', name: 'Greece', nationality: 'Greek' },
  { code: 'GY', name: 'Guyana', nationality: 'Guyanese' },
  { code: 'HU', name: 'Hungary', nationality: 'Hungarian' },
  { code: 'IS', name: 'Iceland', nationality: 'Icelandic' },
  { code: 'ID', name: 'Indonesia', nationality: 'Indonesian' },
  { code: 'IR', name: 'Iran', nationality: 'Iranian' },
  { code: 'IQ', name: 'Iraq', nationality: 'Iraqi' },
  { code: 'IE', name: 'Ireland', nationality: 'Irish' },
  { code: 'IL', name: 'Israel', nationality: 'Israeli' },
  { code: 'IT', name: 'Italy', nationality: 'Italian' },
  { code: 'JP', name: 'Japan', nationality: 'Japanese' },
  { code: 'JO', name: 'Jordan', nationality: 'Jordanian' },
  { code: 'KZ', name: 'Kazakhstan', nationality: 'Kazakhstani' },
  { code: 'KE', name: 'Kenya', nationality: 'Kenyan' },
  { code: 'KW', name: 'Kuwait', nationality: 'Kuwaiti' },
  { code: 'LA', name: 'Laos', nationality: 'Laotian' },
  { code: 'LV', name: 'Latvia', nationality: 'Latvian' },
  { code: 'LB', name: 'Lebanon', nationality: 'Lebanese' },
  { code: 'LR', name: 'Liberia', nationality: 'Liberian' },
  { code: 'LT', name: 'Lithuania', nationality: 'Lithuanian' },
  { code: 'MY', name: 'Malaysia', nationality: 'Malaysian' },
  { code: 'MM', name: 'Myanmar (Burma)', nationality: 'Burmese' },
  { code: 'NP', name: 'Nepal', nationality: 'Nepalese' },
  { code: 'NL', name: 'Netherlands', nationality: 'Dutch' },
  { code: 'NZ', name: 'New Zealand', nationality: 'New Zealander' },
  { code: 'NI', name: 'Nicaragua', nationality: 'Nicaraguan' },
  { code: 'NG', name: 'Nigeria', nationality: 'Nigerian' },
  { code: 'KP', name: 'North Korea', nationality: 'North Korean' },
  { code: 'NO', name: 'Norway', nationality: 'Norwegian' },
  { code: 'PK', name: 'Pakistan', nationality: 'Pakistani' },
  { code: 'PS', name: 'Palestine', nationality: 'Palestinian' },
  { code: 'PA', name: 'Panama', nationality: 'Panamanian' },
  { code: 'PY', name: 'Paraguay', nationality: 'Paraguayan' },
  { code: 'PE', name: 'Peru', nationality: 'Peruvian' },
  { code: 'PL', name: 'Poland', nationality: 'Polish' },
  { code: 'PT', name: 'Portugal', nationality: 'Portuguese' },
  { code: 'PR', name: 'Puerto Rico', nationality: 'Puerto Rican' },
  { code: 'RO', name: 'Romania', nationality: 'Romanian' },
  { code: 'RU', name: 'Russia', nationality: 'Russian' },
  { code: 'SA', name: 'Saudi Arabia', nationality: 'Saudi' },
  { code: 'SN', name: 'Senegal', nationality: 'Senegalese' },
  { code: 'RS', name: 'Serbia', nationality: 'Serbian' },
  { code: 'SG', name: 'Singapore', nationality: 'Singaporean' },
  { code: 'SK', name: 'Slovakia', nationality: 'Slovak' },
  { code: 'SI', name: 'Slovenia', nationality: 'Slovenian' },
  { code: 'SO', name: 'Somalia', nationality: 'Somali' },
  { code: 'ZA', name: 'South Africa', nationality: 'South African' },
  { code: 'ES', name: 'Spain', nationality: 'Spanish' },
  { code: 'LK', name: 'Sri Lanka', nationality: 'Sri Lankan' },
  { code: 'SD', name: 'Sudan', nationality: 'Sudanese' },
  { code: 'SE', name: 'Sweden', nationality: 'Swedish' },
  { code: 'CH', name: 'Switzerland', nationality: 'Swiss' },
  { code: 'SY', name: 'Syria', nationality: 'Syrian' },
  { code: 'TW', name: 'Taiwan', nationality: 'Taiwanese' },
  { code: 'TH', name: 'Thailand', nationality: 'Thai' },
  { code: 'TT', name: 'Trinidad and Tobago', nationality: 'Trinidadian' },
  { code: 'TN', name: 'Tunisia', nationality: 'Tunisian' },
  { code: 'TR', name: 'Turkey', nationality: 'Turkish' },
  { code: 'UA', name: 'Ukraine', nationality: 'Ukrainian' },
  { code: 'AE', name: 'United Arab Emirates', nationality: 'Emirati' },
  { code: 'GB', name: 'United Kingdom', nationality: 'British' },
  { code: 'US', name: 'United States', nationality: 'American' },
  { code: 'UY', name: 'Uruguay', nationality: 'Uruguayan' },
  { code: 'UZ', name: 'Uzbekistan', nationality: 'Uzbek' },
  { code: 'VE', name: 'Venezuela', nationality: 'Venezuelan' },
  { code: 'YE', name: 'Yemen', nationality: 'Yemeni' },
  { code: 'ZW', name: 'Zimbabwe', nationality: 'Zimbabwean' },
];

// Combined list with priority countries first
export const COUNTRIES: Country[] = [
  ...PRIORITY_COUNTRIES,
  { code: 'DIVIDER', name: '──────────────', nationality: '' }, // Visual separator
  ...OTHER_COUNTRIES.filter(c => !PRIORITY_COUNTRIES.some(p => p.code === c.code)),
];

// Get country by code
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

// Get country by name
export function getCountryByName(name: string): Country | undefined {
  return COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase());
}

// Get nationality by country name
export function getNationalityByCountry(countryName: string): string {
  const country = getCountryByName(countryName);
  return country?.nationality || countryName;
}
