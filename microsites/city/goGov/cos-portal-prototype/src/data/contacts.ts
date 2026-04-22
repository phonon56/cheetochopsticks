import type { TopicContact } from '../types';

/**
 * Per-department contact overrides.
 *
 * Sources (2026-04-21):
 * - https://coloradosprings.gov/contact-us  (department directory)
 * - https://coloradosprings.gov/accessibility (ADA Office)
 * - https://coloradosprings.gov/TitleIIADA
 * - https://cspd.coloradosprings.gov (Police subdomain)
 * - https://parks.coloradosprings.gov (Parks subdomain, also hosts fire dept content)
 *
 * Some URLs below are best-guess based on the city's /<slug> pattern and have
 * NOT been individually verified — flagged with VERIFY. Phones are from the
 * scraped directory and are authoritative.
 */

export const ADA_CONTACT = {
  email: 'ADAcompliance@coloradosprings.gov',
  phone: '(719) 385-5175',
  office: 'Office of Accessibility',
  address: '30 S Nevada Ave, Suite 301, Colorado Springs, CO 80903',
  website: 'https://coloradosprings.gov/accessibility',
  grievance: 'https://coloradosprings.gov/office-accessibility/page/grievance-procedure-ada-section-504',
  request: 'https://coloradosprings.gov/office-accessibility/page/request-ada-accommodation-or-service',
};

export const groupContacts: Record<string, TopicContact> = {
  'Accessibility and Language Access': {
    website: ADA_CONTACT.website,
    email: ADA_CONTACT.email,
    phone: ADA_CONTACT.phone,
    notes: 'Office of Accessibility — ADA Title II & Section 504',
  },
  'Contact A City Department': {
    website: 'https://coloradosprings.gov/contact-us',
  },
  'Fire Department': {
    website: 'https://coloradosprings.gov/fire-department', // VERIFY
    phone: '(719) 385-5950',
  },
  'Neighborhood Services/Code Enforcement': {
    website: 'https://coloradosprings.gov/neighborhood-services', // VERIFY
    phone: '(719) 444-7891',
  },
  'Noise Complaint': {
    website: 'https://coloradosprings.gov/neighborhood-services', // VERIFY
    phone: '(719) 444-7891',
  },
  'Other Requests': {
    website: 'https://coloradosprings.gov/contact-us',
  },
  'Parks, Recreation and Cultural Services': {
    website: 'https://parks.coloradosprings.gov',
    phone: '(719) 385-5940',
  },
  Police: {
    website: 'https://cspd.coloradosprings.gov',
    phone: '(719) 444-7000',
    notes: 'Non-emergency line. For emergencies call 911.',
  },
  'Roads and Sidewalks': {
    website: 'https://coloradosprings.gov/public-works',
    phone: '(719) 385-5918',
  },
  Trees: {
    website: 'https://parks.coloradosprings.gov/forestry', // VERIFY
    phone: '(719) 385-5942',
  },
  'Water & Stormwater': {
    website: 'https://coloradosprings.gov/stormwater-enterprise',
    phone: '(719) 385-5980',
  },
  'Colorado Open Records Act Requests (CORA)': {
    website: 'https://coloradosprings.gov/city-clerk', // VERIFY
    phone: '(719) 385-5901',
  },
};

export const topicContacts: Record<string, TopicContact> = {
  // Accessibility
  '61738': { // Title VI / Language Access
    email: ADA_CONTACT.email,
    phone: ADA_CONTACT.phone,
    website: 'https://coloradosprings.gov/TitleIIADA',
    notes: 'Title VI language-access inquiries also route to the Office of Accessibility.',
  },
  '61745': { // Mountain Metro Transit Accommodation
    website: 'https://coloradosprings.gov/mountain-metro-transit', // VERIFY
    phone: '(719) 385-7433',
  },

  // Contact A City Department
  '61640': { email: 'cityatty@coloradosprings.gov', phone: '(719) 385-5909', website: 'https://coloradosprings.gov/city-attorney' }, // VERIFY
  '61641': { email: 'Natalie.Lovell@coloradosprings.gov', phone: '(719) 385-5991', website: 'https://coloradosprings.gov/city-auditor' }, // VERIFY
  '61642': { phone: '(719) 385-5901', website: 'https://coloradosprings.gov/city-clerk' }, // VERIFY
  '61643': { website: 'https://coloradosprings.gov/communications' }, // VERIFY
  '61644': { phone: '(719) 385-5986', website: 'https://coloradosprings.gov/city-council' }, // VERIFY
  '61645': { website: 'https://coloradosprings.gov/city-engineering' }, // VERIFY
  '61646': { phone: '(719) 385-5919', website: 'https://coloradosprings.gov/finance' }, // VERIFY
  '70124': { phone: '(719) 385-5942', website: 'https://parks.coloradosprings.gov/forestry' }, // VERIFY
  '61697': { phone: '(719) 550-1900', website: 'https://flycos.com' },
  '61703': { website: 'https://coloradosprings.gov/cultural-services' }, // VERIFY
  '61710': { phone: '(719) 385-5955', website: 'https://coloradosprings.gov/economic-development' }, // VERIFY
  '61733': { phone: '(719) 385-5912', website: 'https://coloradosprings.gov/housing-homelessness' }, // VERIFY
  '61743': { email: 'yemi.mobolade@coloradosprings.gov', phone: '(719) 385-2489', website: 'https://coloradosprings.gov/mayor' }, // VERIFY
  '61747': { phone: '(719) 385-7433', website: 'https://coloradosprings.gov/mountain-metro-transit' }, // VERIFY
  '61746': { phone: '(719) 385-7433', website: 'https://coloradosprings.gov/mountain-metro-transit' }, // VERIFY
  '61748': { phone: '(719) 385-5928', website: 'https://coloradosprings.gov/municipal-court' }, // VERIFY
  '61760': { email: 'Parking.Office@coloradosprings.gov', phone: '(719) 385-5681', website: 'https://coloradosprings.gov/parking' }, // VERIFY
  '61768': { phone: '(719) 385-5905', website: 'https://coloradosprings.gov/planning-and-development' },
  '61776': { phone: '(719) 385-5910', website: 'https://coloradosprings.gov/procurement' }, // VERIFY
  '61777': { phone: '(719) 385-5918', website: 'https://coloradosprings.gov/public-works' },
  '61778': { email: 'realestateservices@coloradosprings.gov', phone: '(719) 385-5920', website: 'https://coloradosprings.gov/real-estate-services' }, // VERIFY
  '61793': { phone: '(719) 385-5980', website: 'https://coloradosprings.gov/stormwater-enterprise' },
  '61800': { phone: '(719) 385-5908', website: 'https://coloradosprings.gov/traffic-engineering' }, // VERIFY

  // Police
  '61771': {
    website: 'https://cspd.coloradosprings.gov',
    phone: '(719) 444-7000',
    notes: 'For emergencies call 911. This form is for non-emergency matters only.',
  },
  '61651': {
    website: 'https://cspd.coloradosprings.gov',
    notes: 'Complaints about CSPD employees are reviewed by Internal Affairs.',
  },

  // CORA sub-routing
  '61696': { website: 'https://coloradosprings.gov/procurement', phone: '(719) 385-5910' }, // VERIFY
  '61714': { website: 'https://coloradosprings.gov/fire-department', phone: '(719) 385-5950' }, // VERIFY
  '61726': { website: 'https://coloradosprings.gov/city-clerk', phone: '(719) 385-5901' }, // VERIFY
  '61752': { website: 'https://coloradosprings.gov/neighborhood-services', phone: '(719) 444-7891' }, // VERIFY
  '61767': { website: 'https://coloradosprings.gov/planning-and-development', phone: '(719) 385-5905' },
};
