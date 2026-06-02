// Helping Hands directory — local + national community resources.
// Data sourced from the City of Colorado Springs Helping-Hands-Directory.pdf
// and the standalone /microsites/city/community-resources-list/helping-hands.html.
// Search logic (expandQuery / scoreMatch) ported from portal-walkthrough.html.

export interface Resource {
  /** Resource name */
  n: string;
  /** Primary phone */
  p: string;
  /** Secondary phone */
  p2: string;
  /** Categories */
  c: string[];
  /** Hours */
  h: string;
  /** Description */
  d: string;
  /** Speed score 1-5 (5 = 24/7) */
  s: number;
  /** Website URL */
  w: string;
  /** Address */
  a: string;
  /** Tags for search */
  t: string[];
  /** Verified flag — false = unverified, please confirm by phone */
  v: boolean;
  /** 24/7 flag */
  tf: boolean;
}

export const RESOURCES: Resource[] = [
  {
    "n": "911 Emergency",
    "p": "911",
    "p2": "",
    "c": [
      "Emergency Services",
      "Crisis Services"
    ],
    "h": "24/7",
    "d": "Police, fire, ambulance — life-threatening emergencies.",
    "s": 5,
    "w": "",
    "a": "",
    "t": [
      "emergency",
      "fire",
      "police",
      "ambulance",
      "help now",
      "dying",
      "accident"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "988 Suicide & Crisis Lifeline",
    "p": "988",
    "p2": "",
    "c": [
      "Crisis Services",
      "Mental Health"
    ],
    "h": "24/7",
    "d": "Free, confidential mental health crisis support. Call, text, or chat.",
    "s": 5,
    "w": "https://988lifeline.org",
    "a": "",
    "t": [
      "suicide",
      "kill myself",
      "crisis",
      "mental health",
      "want to die",
      "hopeless",
      "despair",
      "self harm"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "211 — United Way Resource Line",
    "p": "211",
    "p2": "719-955-0742",
    "c": [
      "Emergency Services"
    ],
    "h": "24/7",
    "d": "Statewide line that connects you to the right local service for any need: food, shelter, utilities, mental health, eldercare.",
    "s": 5,
    "w": "https://211colorado.org",
    "a": "",
    "t": [
      "help",
      "need",
      "find",
      "resource",
      "information",
      "referral",
      "what do i do",
      "i don't know"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Veterans Crisis Line",
    "p": "988 (press 1)",
    "p2": "",
    "c": [
      "Crisis Services",
      "Veterans Services",
      "Mental Health"
    ],
    "h": "24/7",
    "d": "Confidential support for veterans and their families in crisis.",
    "s": 5,
    "w": "https://veteranscrisisline.net",
    "a": "",
    "t": [
      "veteran",
      "vet",
      "military",
      "suicide",
      "crisis",
      "ptsd"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "TESSA — Domestic Violence & Sexual Assault",
    "p": "719-633-3819",
    "p2": "719-633-1462",
    "c": [
      "Crisis Services",
      "Domestic Violence Services",
      "Legal Information & Advice"
    ],
    "h": "24/7 crisis line",
    "d": "Safe House, advocacy, legal help, counseling for survivors of domestic violence and sexual assault.",
    "s": 5,
    "w": "https://tessacs.org",
    "a": "",
    "t": [
      "domestic violence",
      "abuse",
      "beaten",
      "hit",
      "rape",
      "sexual assault",
      "scared of partner",
      "unsafe at home",
      "abusive"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Colorado Crisis Services",
    "p": "1-844-493-8255",
    "p2": "",
    "c": [
      "Crisis Services",
      "Mental Health"
    ],
    "h": "24/7",
    "d": "Free statewide mental health crisis support. Walk-in centers also available.",
    "s": 5,
    "w": "https://coloradocrisisservices.org",
    "a": "",
    "t": [
      "crisis",
      "mental health",
      "suicide",
      "panic",
      "breakdown"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Pikes Peak Suicide Prevention Partnership",
    "p": "1-844-493-8255",
    "p2": "719-573-7447",
    "c": [
      "Crisis Services",
      "Mental Health"
    ],
    "h": "24/7 crisis line",
    "d": "Local suicide prevention coalition with crisis line, trainings, and survivor support.",
    "s": 5,
    "w": "https://pikespeaksuicideprevention.org",
    "a": "",
    "t": [
      "suicide",
      "prevention",
      "crisis"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Safe2Tell",
    "p": "1-877-542-7233",
    "p2": "",
    "c": [
      "Crisis Services"
    ],
    "h": "24/7 anonymous",
    "d": "Anonymous reporting for school violence, bullying, threats, abuse — for kids, teens, parents.",
    "s": 5,
    "w": "https://safe2tell.org",
    "a": "",
    "t": [
      "bullying",
      "school",
      "threat",
      "report",
      "anonymous",
      "kids",
      "teen"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "National Runaway Safeline",
    "p": "1-800-786-2929",
    "p2": "",
    "c": [
      "Crisis Services"
    ],
    "h": "24/7",
    "d": "Crisis support for youth who have run away or are thinking about it. Family reunification help.",
    "s": 5,
    "w": "https://1800runaway.org",
    "a": "",
    "t": [
      "runaway",
      "ran away",
      "teen",
      "youth",
      "missing kid"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Trans Lifeline",
    "p": "1-877-565-8860",
    "p2": "",
    "c": [
      "Crisis Services",
      "Mental Health"
    ],
    "h": "24/7",
    "d": "Peer support hotline run by and for trans people in crisis.",
    "s": 5,
    "w": "https://translifeline.org",
    "a": "",
    "t": [
      "trans",
      "transgender",
      "lgbtq",
      "crisis",
      "gender"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "The Trevor Project (LGBTQ+)",
    "p": "1-866-488-7386",
    "p2": "",
    "c": [
      "Crisis Services",
      "Mental Health"
    ],
    "h": "24/7",
    "d": "Crisis intervention and suicide prevention for LGBTQ+ youth under 25.",
    "s": 5,
    "w": "https://thetrevorproject.org",
    "a": "",
    "t": [
      "lgbtq",
      "gay",
      "lesbian",
      "bi",
      "trans",
      "queer",
      "youth",
      "teen",
      "suicide"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Call Blackline (BIPOC LGBTQ+)",
    "p": "1-800-604-5841",
    "p2": "",
    "c": [
      "Crisis Services",
      "Mental Health"
    ],
    "h": "24/7",
    "d": "Peer support for Black, brown, native, and muslim LGBTQ+ folks.",
    "s": 5,
    "w": "https://callblackline.com",
    "a": "",
    "t": [
      "bipoc",
      "black",
      "brown",
      "lgbtq",
      "crisis",
      "racism"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Boys Town Hotline (parenting)",
    "p": "1-800-448-3000",
    "p2": "",
    "c": [
      "Crisis Services",
      "Parenting & Pregnancy"
    ],
    "h": "24/7",
    "d": "Crisis line for parents, kids, and families in any kind of trouble.",
    "s": 5,
    "w": "https://boystown.org",
    "a": "",
    "t": [
      "parent",
      "kid",
      "child",
      "help",
      "family",
      "crisis"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Never Use Alone Hotline",
    "p": "1-800-484-3731",
    "p2": "",
    "c": [
      "Crisis Services",
      "Substance Use"
    ],
    "h": "24/7",
    "d": "If you're going to use alone, call. They stay on the line and call EMS if you stop responding.",
    "s": 5,
    "w": "https://neverusealone.com",
    "a": "",
    "t": [
      "overdose",
      "drugs",
      "heroin",
      "fentanyl",
      "using alone",
      "addiction"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Mental Health Emergency",
    "p": "988",
    "p2": "",
    "c": [
      "Crisis Services",
      "Mental Health"
    ],
    "h": "24/7",
    "d": "Same as 988 lifeline.",
    "s": 5,
    "w": "",
    "a": "",
    "t": [
      "mental health",
      "emergency",
      "crisis"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Cedar Springs Hospital",
    "p": "719-633-4114",
    "p2": "1-800-888-1088",
    "c": [
      "Crisis Services",
      "Mental Health"
    ],
    "h": "24/7 admissions",
    "d": "Inpatient and outpatient mental health for kids, teens, adults — civilian, military, and veteran.",
    "s": 4,
    "w": "https://cedarspringsbhs.com",
    "a": "2135 Southgate Road, Colorado Springs, CO 80906",
    "t": [
      "mental health",
      "inpatient",
      "psychiatric",
      "hospital",
      "crisis"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Crossroads Detox Center",
    "p": "719-203-6550",
    "p2": "",
    "c": [
      "Crisis Services",
      "Substance Use"
    ],
    "h": "24/7 admissions",
    "d": "Medical detox for alcohol, opioids, benzodiazepines.",
    "s": 4,
    "w": "",
    "a": "",
    "t": [
      "detox",
      "alcohol",
      "drugs",
      "withdrawal",
      "addiction"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Diversus Health (Lighthouse — crisis)",
    "p": "719-572-6100",
    "p2": "",
    "c": [
      "Crisis Services",
      "Mental Health"
    ],
    "h": "Walk-in crisis center 24/7",
    "d": "Walk-in mental health crisis stabilization. No appointment.",
    "s": 5,
    "w": "https://diversushealth.org",
    "a": "115 S Parkside Drive",
    "t": [
      "mental health",
      "crisis",
      "walk in",
      "stabilization"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Peak View Behavioral Health (crisis)",
    "p": "1-888-235-9475",
    "p2": "",
    "c": [
      "Crisis Services",
      "Mental Health"
    ],
    "h": "24/7 admissions",
    "d": "Inpatient and partial-hospitalization mental health programs.",
    "s": 4,
    "w": "https://peakviewbh.com",
    "a": "",
    "t": [
      "mental health",
      "inpatient",
      "hospital"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Kingdom Builder's (DV crisis)",
    "p": "719-464-4647",
    "p2": "",
    "c": [
      "Crisis Services",
      "Domestic Violence Services"
    ],
    "h": "24/7 crisis",
    "d": "Domestic violence crisis line and family life center.",
    "s": 5,
    "w": "https://kingdombuildersfamily.org",
    "a": "",
    "t": [
      "domestic violence",
      "abuse",
      "crisis"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Adult Protective Services hotline",
    "p": "719-444-5755",
    "p2": "",
    "c": [
      "Emergency Services"
    ],
    "h": "Business hours; after-hours via 911",
    "d": "Report suspected abuse, neglect, or exploitation of an at-risk adult.",
    "s": 4,
    "w": "",
    "a": "",
    "t": [
      "abuse",
      "elderly",
      "disabled",
      "neglect",
      "report",
      "adult"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Child Abuse hotline",
    "p": "1-844-264-5437",
    "p2": "",
    "c": [
      "Emergency Services",
      "Parenting & Pregnancy"
    ],
    "h": "24/7",
    "d": "Statewide hotline to report suspected child abuse or neglect.",
    "s": 5,
    "w": "https://co4kids.org",
    "a": "",
    "t": [
      "child abuse",
      "kid",
      "report",
      "neglect"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Colorado Safe Haven for Newborns",
    "p": "1-888-510-2229",
    "p2": "",
    "c": [
      "Parenting & Pregnancy",
      "Crisis Services"
    ],
    "h": "24/7",
    "d": "Surrender a newborn (under 72 hours) anonymously and safely at any fire station or hospital. No questions, no charges.",
    "s": 5,
    "w": "https://coloradosafehaven.org",
    "a": "",
    "t": [
      "newborn",
      "baby",
      "surrender",
      "safe haven",
      "pregnancy"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Colorado Springs Fire Department",
    "p": "719-385-5950",
    "p2": "",
    "c": [
      "Emergency Services"
    ],
    "h": "Non-emergency line; 911 for emergencies",
    "d": "Non-emergency contact for CSFD.",
    "s": 3,
    "w": "https://coloradosprings.gov/fire",
    "a": "",
    "t": [
      "fire",
      "csfd"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "CSFD Community & Public Health",
    "p": "719-385-2273",
    "p2": "",
    "c": [
      "Emergency Services",
      "Medical"
    ],
    "h": "Mon-Fri business hours",
    "d": "Falls prevention, smoke alarms, community paramedic visits.",
    "s": 3,
    "w": "https://coloradosprings.gov/fire",
    "a": "",
    "t": [
      "fire",
      "health",
      "paramedic",
      "fall",
      "smoke alarm"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Springs Police Department",
    "p": "719-444-7000",
    "p2": "",
    "c": [
      "Emergency Services"
    ],
    "h": "Non-emergency line",
    "d": "CSPD non-emergency dispatch and reporting.",
    "s": 3,
    "w": "https://coloradosprings.gov/police",
    "a": "",
    "t": [
      "police",
      "report",
      "cspd"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "CSPD Homeless Outreach Team",
    "p": "719-444-7666",
    "p2": "",
    "c": [
      "Emergency Services",
      "Shelter & Housing"
    ],
    "h": "Business hours",
    "d": "Police-led team that connects unhoused residents with shelter and services.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "homeless",
      "outreach",
      "police",
      "unhoused"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "CSPD Victim Advocacy",
    "p": "719-444-7777",
    "p2": "",
    "c": [
      "Emergency Services",
      "Domestic Violence Services",
      "Legal Information & Advice"
    ],
    "h": "24/7 callback",
    "d": "Crisis support, court accompaniment, and resources for victims of crime.",
    "s": 4,
    "w": "",
    "a": "",
    "t": [
      "victim",
      "crime",
      "advocacy",
      "court",
      "domestic violence"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado State Patrol",
    "p": "303-239-4500",
    "p2": "",
    "c": [
      "Emergency Services"
    ],
    "h": "24/7 dispatch",
    "d": "State troopers — highway, traffic, and statewide enforcement.",
    "s": 3,
    "w": "https://csp.colorado.gov",
    "a": "",
    "t": [
      "state patrol",
      "highway",
      "trooper"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "El Paso County Sheriff's Office",
    "p": "719-390-5555",
    "p2": "",
    "c": [
      "Emergency Services"
    ],
    "h": "24/7 dispatch (non-emergency)",
    "d": "Sheriff non-emergency reporting and inquiries.",
    "s": 3,
    "w": "https://epcsheriffsoffice.com",
    "a": "",
    "t": [
      "sheriff",
      "county",
      "report"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "El Paso County Department of Human Services",
    "p": "719-636-0000",
    "p2": "",
    "c": [
      "Emergency Services",
      "Financial Assistance",
      "Medical"
    ],
    "h": "Mon-Fri 8am-5pm",
    "d": "Apply for SNAP (food stamps), Medicaid, TANF cash assistance, child care assistance, child support.",
    "s": 2,
    "w": "https://dhs.elpasoco.com",
    "a": "",
    "t": [
      "snap",
      "food stamps",
      "medicaid",
      "cash assistance",
      "welfare",
      "tanf"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "KPC Respite Center",
    "p": "719-634-5439",
    "p2": "",
    "c": [
      "Emergency Services",
      "Mental Health"
    ],
    "h": "Walk-in",
    "d": "Short-term respite for adults in mental health distress.",
    "s": 4,
    "w": "",
    "a": "",
    "t": [
      "respite",
      "mental health",
      "walk in"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Planned Parenthood",
    "p": "719-475-7162",
    "p2": "",
    "c": [
      "Medical",
      "Parenting & Pregnancy",
      "Emergency Services"
    ],
    "h": "Mon-Sat varies",
    "d": "Reproductive health, contraception, STI testing, abortion services, gender-affirming care.",
    "s": 3,
    "w": "https://plannedparenthood.org",
    "a": "3480 Centennial Blvd",
    "t": [
      "birth control",
      "contraception",
      "sti",
      "abortion",
      "reproductive",
      "gender",
      "plan b"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Catholic Charities — Family Connections @ Helen Hunt Campus (families)",
    "p": "719-636-2345",
    "p2": "",
    "c": [
      "Emergency Services",
      "Clothing & Hygiene",
      "Miscellaneous Counseling & Assistance"
    ],
    "h": "Mon-Fri",
    "d": "Case management, financial help, child care, computers, gas/bus passes for families with kids.",
    "s": 3,
    "w": "https://ccharitiescc.org",
    "a": "",
    "t": [
      "family",
      "kids",
      "case management",
      "financial",
      "child care"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Catholic Charities — Marian House (adult individuals)",
    "p": "719-475-7314",
    "p2": "",
    "c": [
      "Emergency Services",
      "Financial Assistance",
      "Food"
    ],
    "h": "Daily — soup kitchen 10:30am-12:30pm",
    "d": "Daily hot meals, ID help, mail service, employment, financial assistance for low-income adults, working poor, seniors, veterans.",
    "s": 4,
    "w": "https://ccharitiescc.org/marianhouse",
    "a": "14 W Bijou St",
    "t": [
      "meal",
      "food",
      "homeless",
      "adult",
      "case management",
      "id"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Care and Share Food Bank",
    "p": "719-528-1247",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Mon-Fri 8am-4:30pm",
    "d": "Regional food bank — find a pantry, mobile food market schedule, summer meals for kids.",
    "s": 3,
    "w": "https://careandshare.org",
    "a": "2605 Preamble Point",
    "t": [
      "food",
      "hungry",
      "pantry",
      "kids",
      "summer meals"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Catholic Charities — Marian House Soup Kitchen",
    "p": "719-475-7314",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Daily 10:30am-12:30pm",
    "d": "Free hot lunch every single day — no questions, no ID required.",
    "s": 4,
    "w": "https://ccharitiescc.org/marianhouse",
    "a": "14 W Bijou St",
    "t": [
      "meal",
      "hungry",
      "lunch",
      "soup",
      "hot food",
      "daily",
      "walk in"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Catholic Charities — Market Place Food Pantry",
    "p": "719-636-2345",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Tue/Wed/Thu 9am-3pm",
    "d": "Choice-style food pantry — pick what your family needs.",
    "s": 3,
    "w": "https://ccharitiescc.org",
    "a": "",
    "t": [
      "food",
      "pantry",
      "groceries",
      "family"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Springs Rescue Mission",
    "p": "719-632-1822",
    "p2": "",
    "c": [
      "Food",
      "Shelter & Housing",
      "Clothing & Hygiene"
    ],
    "h": "Daily meals; 24/7 shelter intake",
    "d": "Three meals daily, 346-bed men's shelter, women's shelter, addiction recovery, day services.",
    "s": 4,
    "w": "https://springsrescuemission.org",
    "a": "5 W Las Vegas St",
    "t": [
      "food",
      "meal",
      "shelter",
      "homeless",
      "men",
      "addiction",
      "recovery"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Mercy's Gate",
    "p": "719-277-7470",
    "p2": "",
    "c": [
      "Food",
      "Financial Assistance",
      "Clothing & Hygiene",
      "Weatherization & Utilities"
    ],
    "h": "Tue/Wed/Thu by appointment",
    "d": "Rent, mortgage, utility assistance, food pantry, transportation, faith community nurse, legal help. Northeast COS.",
    "s": 2,
    "w": "https://mercysgate.org",
    "a": "4360 Montebello Dr, Suite 300",
    "t": [
      "rent",
      "mortgage",
      "utilities",
      "food",
      "help",
      "emergency"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Westside CARES",
    "p": "719-389-0759",
    "p2": "",
    "c": [
      "Food",
      "Financial Assistance",
      "Medical",
      "Clothing & Hygiene"
    ],
    "h": "Mon-Thu 9am-12pm",
    "d": "Food pantry, financial help, medical/dental clinic for the westside community.",
    "s": 3,
    "w": "https://westsidecares.org",
    "a": "Westside Colorado Springs",
    "t": [
      "food",
      "financial",
      "medical",
      "westside",
      "help"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Tri-Lakes Cares",
    "p": "719-481-4864",
    "p2": "",
    "c": [
      "Food",
      "Financial Assistance",
      "Medical"
    ],
    "h": "Mon-Fri varies",
    "d": "Food, financial assistance, medical/dental for Tri-Lakes/D38 area only.",
    "s": 3,
    "w": "https://tri-lakescares.org",
    "a": "235 Jefferson St, Monument",
    "t": [
      "food",
      "tri lakes",
      "monument",
      "palmer lake",
      "help"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Silver Key Senior Services",
    "p": "719-884-2300",
    "p2": "",
    "c": [
      "Food",
      "Senior Services",
      "Transportation",
      "Financial Assistance"
    ],
    "h": "Mon-Fri 8am-5pm",
    "d": "Meals on wheels, dining centers, transportation, food pantry, financial help — seniors 60+.",
    "s": 3,
    "w": "https://silverkey.org",
    "a": "1625 S Murray Blvd",
    "t": [
      "senior",
      "elderly",
      "meals on wheels",
      "food",
      "transportation",
      "old"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Action in Action Ministries",
    "p": "719-619-9412",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Verify hours",
    "d": "Food assistance.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Bethany Baptist Church food pantry",
    "p": "719-634-7232",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Verify hours",
    "d": "Church-run food pantry.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food",
      "church"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Black Forest Lutheran Church",
    "p": "719-495-2221",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "",
    "d": "Food pantry serving the Black Forest area.",
    "s": 3,
    "w": "",
    "a": "Black Forest 80908",
    "t": [
      "food",
      "black forest",
      "church"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Charity's Hope Food & Clothing Pantry",
    "p": "719-332-2360",
    "p2": "",
    "c": [
      "Food",
      "Clothing & Hygiene",
      "Financial Assistance"
    ],
    "h": "Verify hours",
    "d": "Food, clothing, school supplies, and financial assistance.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food",
      "clothing",
      "school supplies",
      "help"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Crossfire Ministries",
    "p": "719-447-1806",
    "p2": "",
    "c": [
      "Food",
      "Clothing & Hygiene"
    ],
    "h": "Verify hours",
    "d": "Food pantry and clothing closet.",
    "s": 3,
    "w": "https://crossfireministries.org",
    "a": "",
    "t": [
      "food",
      "clothing",
      "pantry"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Deerfield Hills Community Center",
    "p": "719-385-5996",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Mon-Fri",
    "d": "City community center — food distribution and youth programs.",
    "s": 3,
    "w": "https://coloradosprings.gov/parks/page/deerfield-hills-community-center",
    "a": "4290 Deerfield Hills Rd",
    "t": [
      "food",
      "community center",
      "kids"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Divine Redeemer Catholic Church",
    "p": "719-633-5559",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Verify hours",
    "d": "Parish food pantry.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food",
      "church"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Eastborough Food Pantry",
    "p": "719-596-1929",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Verify hours",
    "d": "Neighborhood food pantry.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food",
      "pantry"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Eastern Plains Community Pantry (Calhan)",
    "p": "719-347-3062",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "",
    "d": "Food pantry for the eastern plains.",
    "s": 3,
    "w": "",
    "a": "Calhan",
    "t": [
      "food",
      "calhan",
      "eastern plains",
      "rural"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Food to Power Hillside Hub",
    "p": "719-470-2737",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Tue/Thu/Sat varies",
    "d": "No-cost grocery program plus urban farm and community kitchen on the Hillside.",
    "s": 4,
    "w": "https://foodtopower.org",
    "a": "2330 N Hancock Ave",
    "t": [
      "food",
      "groceries",
      "hillside",
      "free",
      "farm"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Fresh Start Center",
    "p": "719-495-3123",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "",
    "d": "Food assistance for the Falcon and Peyton areas.",
    "s": 3,
    "w": "",
    "a": "Falcon/Peyton area",
    "t": [
      "food",
      "falcon",
      "peyton",
      "rural"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "God's Pantry (Fountain)",
    "p": "719-382-0643",
    "p2": "",
    "c": [
      "Food",
      "Clothing & Hygiene"
    ],
    "h": "",
    "d": "Food and clothing pantry for the Fountain area.",
    "s": 3,
    "w": "",
    "a": "Fountain",
    "t": [
      "food",
      "fountain",
      "clothing"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Good News Foundation",
    "p": "719-638-8985",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Verify hours",
    "d": "Food assistance.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Good Shepherd United Methodist Church",
    "p": "719-392-5782",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Verify hours",
    "d": "Church-run food pantry.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food",
      "church"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Holy Cross Lutheran Church",
    "p": "719-596-0661",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "",
    "d": "Food pantry for the east side.",
    "s": 3,
    "w": "",
    "a": "East side 80909/15/16",
    "t": [
      "food",
      "church",
      "east"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Lord of Glory Church Manna",
    "p": "719-635-1057",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Verify hours",
    "d": "Manna ministry food distribution.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food",
      "church",
      "manna"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Meadows Park Community Center",
    "p": "719-385-7940",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Mon-Fri",
    "d": "City community center — food and youth services.",
    "s": 3,
    "w": "https://coloradosprings.gov/parks",
    "a": "1943 S Chelton Rd",
    "t": [
      "food",
      "community center",
      "kids"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Project Angel Heart",
    "p": "719-323-0084",
    "p2": "",
    "c": [
      "Food",
      "Medical"
    ],
    "h": "Mon-Fri",
    "d": "Free medically-tailored meals delivered to people with serious illness.",
    "s": 2,
    "w": "https://projectangelheart.org",
    "a": "",
    "t": [
      "food",
      "meal delivery",
      "sick",
      "cancer",
      "hiv",
      "illness"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Salvation Army Colorado Springs",
    "p": "719-636-3891",
    "p2": "",
    "c": [
      "Food",
      "Financial Assistance",
      "Weatherization & Utilities"
    ],
    "h": "Mon-Fri 9am-12pm, 1-3pm",
    "d": "Food pantry, utility help, rent assistance, holiday programs.",
    "s": 3,
    "w": "https://rmsalvationarmy.org",
    "a": "908 Yuma St",
    "t": [
      "food",
      "utility",
      "rent",
      "help"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Salvation Army — Fountain Valley",
    "p": "719-382-1182",
    "p2": "",
    "c": [
      "Food",
      "Financial Assistance",
      "Weatherization & Utilities"
    ],
    "h": "Verify hours",
    "d": "Fountain Valley branch — food, utilities, rent help.",
    "s": 3,
    "w": "https://rmsalvationarmy.org",
    "a": "Fountain",
    "t": [
      "food",
      "fountain",
      "utility",
      "rent"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Sanctuary Church",
    "p": "719-634-7232",
    "p2": "",
    "c": [
      "Food",
      "Clothing & Hygiene"
    ],
    "h": "Verify hours",
    "d": "Food pantry and shower house.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food",
      "shower",
      "church"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Seventh Day Adventist Community Center",
    "p": "719-578-5616",
    "p2": "",
    "c": [
      "Food",
      "Clothing & Hygiene"
    ],
    "h": "Verify hours",
    "d": "Food and clothing for community.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food",
      "clothing"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Solid Rock Community Food Bank",
    "p": "719-985-8935",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Verify hours",
    "d": "Community food bank.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "St. Dominic Catholic Church (Security-Widefield)",
    "p": "719-392-7653",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "",
    "d": "Parish food pantry for south county.",
    "s": 3,
    "w": "",
    "a": "Security-Widefield",
    "t": [
      "food",
      "security",
      "widefield",
      "church"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "St. John's Food Pantry",
    "p": "719-634-5388",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Verify hours",
    "d": "Food pantry.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food",
      "pantry"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "St. Patrick's Catholic Church",
    "p": "719-598-3595",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Verify hours",
    "d": "Parish food pantry.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food",
      "church"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Trinity United Methodist Church",
    "p": "719-633-9295",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Verify hours",
    "d": "Church-run food pantry.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food",
      "church"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "True Spirit Baptist Church",
    "p": "719-575-9287",
    "p2": "",
    "c": [
      "Food"
    ],
    "h": "Verify hours",
    "d": "Church-run food pantry.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "food",
      "church"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Voces Unidas for Justice",
    "p": "720-588-8219",
    "p2": "",
    "c": [
      "Food",
      "Domestic Violence Services",
      "Employment & Training",
      "Miscellaneous Counseling & Assistance"
    ],
    "h": "Mon-Fri",
    "d": "Latine-led organization — food, DV advocacy, immigration, workforce support in Spanish and English.",
    "s": 3,
    "w": "https://vocesunidasforjustice.org",
    "a": "",
    "t": [
      "latino",
      "spanish",
      "food",
      "immigration",
      "domestic violence",
      "work"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "WIC Program — El Paso County Health",
    "p": "719-578-3199",
    "p2": "",
    "c": [
      "Food",
      "Parenting & Pregnancy",
      "Medical"
    ],
    "h": "Mon-Fri 7:30am-4:30pm",
    "d": "Food benefits, breastfeeding support, nutrition education for pregnant/postpartum women and kids under 5.",
    "s": 2,
    "w": "https://elpasocountyhealth.org/wic",
    "a": "",
    "t": [
      "wic",
      "baby",
      "pregnant",
      "kids",
      "nutrition",
      "food",
      "breastfeeding"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Springs Rescue Mission (shelter)",
    "p": "719-632-1822",
    "p2": "",
    "c": [
      "Shelter & Housing",
      "Food"
    ],
    "h": "24/7 intake; check-in late afternoon",
    "d": "Largest emergency shelter — 346 men's beds, women's wing, day services, addiction recovery.",
    "s": 4,
    "w": "https://springsrescuemission.org",
    "a": "5 W Las Vegas St",
    "t": [
      "shelter",
      "homeless",
      "sleep",
      "bed",
      "tonight",
      "men",
      "women"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Salvation Army RJ Montgomery Center (family shelter)",
    "p": "719-578-9190",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "24/7 intake — call first",
    "d": "Emergency shelter for families with children experiencing homelessness.",
    "s": 4,
    "w": "https://rmsalvationarmy.org",
    "a": "",
    "t": [
      "shelter",
      "family",
      "kids",
      "homeless"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Salvation Army (transitional housing)",
    "p": "719-635-1287",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Application required",
    "d": "Longer-term transitional housing for individuals and families.",
    "s": 1,
    "w": "https://rmsalvationarmy.org",
    "a": "",
    "t": [
      "transitional",
      "housing",
      "apartment"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "The Place (youth shelter, ages 15-20)",
    "p": "719-244-3959",
    "p2": "719-205-7129",
    "c": [
      "Shelter & Housing",
      "Crisis Services"
    ],
    "h": "24/7 — call after-hours line outside business hours",
    "d": "Emergency shelter and drop-in for homeless and at-risk youth ages 15-20.",
    "s": 4,
    "w": "https://theplacecos.org",
    "a": "",
    "t": [
      "youth",
      "teen",
      "shelter",
      "homeless",
      "kicked out",
      "runaway"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "TESSA Safe House",
    "p": "719-633-3819",
    "p2": "",
    "c": [
      "Shelter & Housing",
      "Domestic Violence Services",
      "Crisis Services"
    ],
    "h": "24/7",
    "d": "Confidential emergency shelter for survivors of domestic violence.",
    "s": 5,
    "w": "https://tessacs.org",
    "a": "",
    "t": [
      "shelter",
      "domestic violence",
      "abuse",
      "safe",
      "tonight"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Family Promise (transitional housing for families)",
    "p": "719-329-1244",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Mon-Fri 9am-5pm",
    "d": "Transitional shelter for families with kids using a network of host congregations.",
    "s": 2,
    "w": "https://familypromisecs.com",
    "a": "",
    "t": [
      "family",
      "shelter",
      "transitional",
      "kids"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Partners in Housing (families)",
    "p": "719-473-8890",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Mon-Fri",
    "d": "Transitional and supportive housing for families experiencing homelessness.",
    "s": 1,
    "w": "https://partnersinhousing.org",
    "a": "",
    "t": [
      "family",
      "housing",
      "transitional"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Greccio Housing",
    "p": "719-475-1422",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Mon-Fri 8am-5pm",
    "d": "Affordable rental housing across the Pikes Peak region — apply through their portfolio.",
    "s": 1,
    "w": "https://greccio.org",
    "a": "",
    "t": [
      "housing",
      "apartment",
      "affordable",
      "rent"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Homeward Pikes Peak",
    "p": "719-473-5557",
    "p2": "",
    "c": [
      "Shelter & Housing",
      "Substance Use"
    ],
    "h": "Mon-Fri",
    "d": "Housing-first services and addiction recovery for chronically homeless adults.",
    "s": 2,
    "w": "https://homewardpikespeak.org",
    "a": "",
    "t": [
      "homeless",
      "housing first",
      "addiction",
      "recovery"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Springs Housing Authority",
    "p": "719-387-6700",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Mon-Fri 8am-5pm",
    "d": "Public housing and Section 8 vouchers in Colorado Springs.",
    "s": 1,
    "w": "https://csha.us",
    "a": "",
    "t": [
      "section 8",
      "public housing",
      "voucher",
      "affordable"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Fountain Housing Authority",
    "p": "719-382-5639",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Mon-Fri",
    "d": "Public housing and vouchers for Fountain residents.",
    "s": 1,
    "w": "",
    "a": "Fountain",
    "t": [
      "section 8",
      "public housing",
      "fountain",
      "voucher"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Housing & Finance Authority (CHFA)",
    "p": "1-800-877-2432",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Mon-Fri 8am-5pm",
    "d": "Statewide housing finance — first-time homebuyer loans, down payment assistance, rental help.",
    "s": 1,
    "w": "https://chfainfo.com",
    "a": "",
    "t": [
      "mortgage",
      "first time buyer",
      "down payment",
      "loan"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Pikes Peak Habitat for Humanity",
    "p": "719-475-7800",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Mon-Fri 9am-5pm",
    "d": "Builds and sells homes to qualifying low-income families. Sweat-equity required.",
    "s": 1,
    "w": "https://pikespeakhabitat.org",
    "a": "",
    "t": [
      "habitat",
      "home",
      "ownership",
      "build"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Rocky Mountain Community Land Trust",
    "p": "719-447-9300",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Mon-Fri",
    "d": "Permanently-affordable home ownership through community land trust model.",
    "s": 1,
    "w": "https://rmclt.org",
    "a": "",
    "t": [
      "affordable",
      "home",
      "ownership",
      "land trust"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Ascending to Health Respite Care",
    "p": "719-635-7639",
    "p2": "",
    "c": [
      "Shelter & Housing",
      "Medical"
    ],
    "h": "24/7 intake",
    "d": "Medical respite for homeless people discharged from hospitals.",
    "s": 3,
    "w": "https://ascendingtohealth.org",
    "a": "",
    "t": [
      "homeless",
      "medical",
      "respite",
      "hospital"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Dale House Project (youth)",
    "p": "719-471-0642",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Application required",
    "d": "Residential program for youth ages 16-20 transitioning to independence.",
    "s": 2,
    "w": "https://dalehouse.org",
    "a": "",
    "t": [
      "youth",
      "teen",
      "residential",
      "independence"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Dream Centers Mary's Home (single mothers)",
    "p": "719-301-5411",
    "p2": "",
    "c": [
      "Shelter & Housing",
      "Parenting & Pregnancy"
    ],
    "h": "Application required",
    "d": "Long-term supportive housing for single mothers and their kids.",
    "s": 1,
    "w": "https://dreamcenters.org",
    "a": "",
    "t": [
      "single mother",
      "mom",
      "kids",
      "housing"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Family Life Services (single mothers)",
    "p": "719-632-4661",
    "p2": "",
    "c": [
      "Shelter & Housing",
      "Parenting & Pregnancy"
    ],
    "h": "Referral only",
    "d": "Maternity home for pregnant women and new mothers.",
    "s": 1,
    "w": "",
    "a": "",
    "t": [
      "pregnant",
      "single mother",
      "maternity",
      "baby"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Gospel Homes for Women",
    "p": "719-291-3406",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Application required",
    "d": "Christian residential program for women.",
    "s": 1,
    "w": "",
    "a": "",
    "t": [
      "women",
      "christian",
      "residential"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Ithaka Housing",
    "p": "719-578-1629",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Mon-Fri",
    "d": "Affordable housing development in central Colorado Springs.",
    "s": 1,
    "w": "https://ithakaland.org",
    "a": "",
    "t": [
      "affordable",
      "housing",
      "central"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Kingdom Builders Family Life Center (DV)",
    "p": "719-247-8190",
    "p2": "",
    "c": [
      "Shelter & Housing",
      "Domestic Violence Services"
    ],
    "h": "Mon-Fri; 24h crisis: 719-464-4647",
    "d": "Shelter and services for survivors of domestic violence and human trafficking.",
    "s": 3,
    "w": "https://kingdombuildersfamily.org",
    "a": "",
    "t": [
      "domestic violence",
      "shelter",
      "trafficking"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Sarah's Home (sex trafficking survivors)",
    "p": "719-347-3026",
    "p2": "",
    "c": [
      "Shelter & Housing"
    ],
    "h": "Application required",
    "d": "Residential recovery home for adolescent girls who have survived sex trafficking.",
    "s": 1,
    "w": "https://sarahshome.com",
    "a": "",
    "t": [
      "trafficking",
      "girls",
      "teen",
      "recovery"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Rocky Mountain Human Services (veterans)",
    "p": "1-855-838-7428",
    "p2": "719-323-2600",
    "c": [
      "Shelter & Housing",
      "Veterans Services",
      "Financial Assistance"
    ],
    "h": "Mon-Fri 8am-5pm",
    "d": "Homelessness prevention and rapid rehousing for veterans (HUD-VASH partner).",
    "s": 2,
    "w": "https://rmhumanservices.org",
    "a": "",
    "t": [
      "veteran",
      "housing",
      "homeless",
      "rapid rehousing"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Catholic Charities — Family Connections (kids' clothing)",
    "p": "719-636-2345",
    "p2": "",
    "c": [
      "Clothing & Hygiene"
    ],
    "h": "Mon-Fri",
    "d": "Children's clothing closet for low-income families.",
    "s": 3,
    "w": "https://ccharitiescc.org",
    "a": "",
    "t": [
      "kids clothing",
      "children",
      "family"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Community Outreach Center (Calhan)",
    "p": "719-347-7638",
    "p2": "",
    "c": [
      "Clothing & Hygiene",
      "Food",
      "Weatherization & Utilities",
      "Miscellaneous Counseling & Assistance"
    ],
    "h": "",
    "d": "Food, clothing, utility help for the Calhan / eastern plains area.",
    "s": 3,
    "w": "",
    "a": "Calhan",
    "t": [
      "calhan",
      "clothing",
      "food",
      "rural"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Connie's Cupboard (Fountain)",
    "p": "719-205-5853",
    "p2": "",
    "c": [
      "Clothing & Hygiene"
    ],
    "h": "",
    "d": "Clothing closet in Fountain.",
    "s": 3,
    "w": "",
    "a": "Fountain",
    "t": [
      "clothing",
      "fountain"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Goodwill Stores",
    "p": "719-635-4483",
    "p2": "",
    "c": [
      "Clothing & Hygiene",
      "Employment & Training"
    ],
    "h": "Daily 9am-9pm typical",
    "d": "Affordable clothing and household goods. Multiple locations.",
    "s": 4,
    "w": "https://discovermygoodwill.org",
    "a": "",
    "t": [
      "clothing",
      "cheap",
      "thrift",
      "household"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Laundry Love",
    "p": "719-440-8235",
    "p2": "",
    "c": [
      "Clothing & Hygiene"
    ],
    "h": "Monthly events",
    "d": "Free laundry events at participating laundromats.",
    "s": 3,
    "w": "https://laundrylove.org",
    "a": "",
    "t": [
      "laundry",
      "wash clothes",
      "free"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Life Network — Family Thrift Store",
    "p": "719-344-9904",
    "p2": "",
    "c": [
      "Clothing & Hygiene"
    ],
    "h": "Tue-Sat",
    "d": "Thrift store and family resource center.",
    "s": 3,
    "w": "https://elifenetwork.com",
    "a": "",
    "t": [
      "thrift",
      "clothing",
      "family"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "The Place — Drop In Center (youth)",
    "p": "719-244-3959",
    "p2": "",
    "c": [
      "Clothing & Hygiene",
      "Shelter & Housing"
    ],
    "h": "Mon-Fri drop-in hours",
    "d": "Showers, laundry, food, case management for youth up to age 24.",
    "s": 4,
    "w": "https://theplacecos.org",
    "a": "",
    "t": [
      "youth",
      "teen",
      "shower",
      "laundry",
      "drop in"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Salvation Army (clothing - no vouchers)",
    "p": "719-574-4335",
    "p2": "",
    "c": [
      "Clothing & Hygiene"
    ],
    "h": "Daily store hours",
    "d": "Affordable clothing at thrift store. Note: no clothing vouchers issued.",
    "s": 4,
    "w": "https://rmsalvationarmy.org",
    "a": "",
    "t": [
      "clothing",
      "thrift",
      "cheap"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Sanctuary Church — Shower House",
    "p": "719-634-7232",
    "p2": "",
    "c": [
      "Clothing & Hygiene"
    ],
    "h": "Verify hours",
    "d": "Free showers.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "shower",
      "wash",
      "hygiene",
      "homeless"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Catholic Charities — Marian House (financial)",
    "p": "719-866-6285",
    "p2": "",
    "c": [
      "Financial Assistance"
    ],
    "h": "By appointment",
    "d": "Limited emergency financial assistance for low-income individuals.",
    "s": 2,
    "w": "https://ccharitiescc.org/marianhouse",
    "a": "",
    "t": [
      "financial",
      "emergency",
      "help",
      "money"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Mt. Carmel Veterans Service Center",
    "p": "719-772-7000",
    "p2": "",
    "c": [
      "Financial Assistance",
      "Veterans Services",
      "Employment & Training"
    ],
    "h": "Mon-Fri 8am-5pm",
    "d": "One-stop center for veterans — benefits navigation, employment, financial help, mental health.",
    "s": 2,
    "w": "https://veteranscenter.org",
    "a": "530 Communication Cir",
    "t": [
      "veteran",
      "benefits",
      "financial",
      "employment"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Pikes Peak Veteran Housing Fund",
    "p": "719-323-2600",
    "p2": "",
    "c": [
      "Financial Assistance",
      "Veterans Services",
      "Shelter & Housing"
    ],
    "h": "Mon-Fri",
    "d": "Emergency housing assistance for veterans facing eviction or homelessness.",
    "s": 2,
    "w": "https://rmhumanservices.org",
    "a": "",
    "t": [
      "veteran",
      "housing",
      "eviction"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "The Place (youth financial help)",
    "p": "719-244-3959",
    "p2": "",
    "c": [
      "Financial Assistance"
    ],
    "h": "Mon-Fri",
    "d": "Limited financial assistance for youth up to age 24.",
    "s": 2,
    "w": "https://theplacecos.org",
    "a": "",
    "t": [
      "youth",
      "teen",
      "money",
      "help"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Volunteers of America (veterans)",
    "p": "719-491-1974",
    "p2": "",
    "c": [
      "Financial Assistance",
      "Veterans Services",
      "Shelter & Housing"
    ],
    "h": "Mon-Fri",
    "d": "Veteran-focused services including housing and supportive services.",
    "s": 2,
    "w": "https://voacolorado.org",
    "a": "",
    "t": [
      "veteran",
      "housing",
      "help"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Southern Colorado Health Network (HIV)",
    "p": "719-578-9092",
    "p2": "",
    "c": [
      "Financial Assistance",
      "Medical"
    ],
    "h": "Mon-Fri",
    "d": "Financial, housing, and medical support for individuals living with HIV.",
    "s": 2,
    "w": "https://s-chn.org",
    "a": "",
    "t": [
      "hiv",
      "aids",
      "medical",
      "housing"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Peak Vista Community Health Centers",
    "p": "719-632-5700",
    "p2": "",
    "c": [
      "Medical",
      "Mental Health"
    ],
    "h": "Mon-Fri 7am-7pm; Sat AM at some sites",
    "d": "Federally Qualified Health Center — primary care, dental, behavioral health on sliding fee scale. Accepts Medicaid and uninsured.",
    "s": 2,
    "w": "https://peakvista.org",
    "a": "Multiple locations",
    "t": [
      "doctor",
      "clinic",
      "sliding fee",
      "medicaid",
      "uninsured",
      "primary care"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Peak Vista Dental Health Center",
    "p": "719-475-0783",
    "p2": "",
    "c": [
      "Medical"
    ],
    "h": "Mon-Fri",
    "d": "Sliding-fee dental for kids and adults. Medicaid accepted.",
    "s": 2,
    "w": "https://peakvista.org",
    "a": "",
    "t": [
      "dental",
      "teeth",
      "cavity",
      "cleaning"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Mission Medical Clinic",
    "p": "719-219-3402",
    "p2": "",
    "c": [
      "Medical"
    ],
    "h": "Mon-Thu 8am-5pm",
    "d": "Free primary care for adults without insurance, working poor.",
    "s": 2,
    "w": "https://missionmedical.net",
    "a": "2125 E La Salle St",
    "t": [
      "free",
      "clinic",
      "uninsured",
      "doctor"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Open Bible Medical Clinic",
    "p": "719-475-0972",
    "p2": "",
    "c": [
      "Medical"
    ],
    "h": "Tue 5-9pm, Thu 10am-2pm, Sat 9am-1pm",
    "d": "Free Christian medical clinic for working uninsured adults.",
    "s": 2,
    "w": "https://openbibleclinic.com",
    "a": "824 S Union Blvd",
    "t": [
      "free",
      "clinic",
      "uninsured",
      "christian"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Community Dental Health",
    "p": "719-310-3315",
    "p2": "",
    "c": [
      "Medical"
    ],
    "h": "Mon-Fri",
    "d": "Sliding-scale dental clinic.",
    "s": 2,
    "w": "https://communitydentalhealth.org",
    "a": "",
    "t": [
      "dental",
      "sliding fee",
      "teeth"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Eye Love Care",
    "p": "719-596-2020",
    "p2": "",
    "c": [
      "Medical"
    ],
    "h": "By appointment",
    "d": "Free glasses for low-income people on a fixed income.",
    "s": 2,
    "w": "https://eyelovecare.org",
    "a": "",
    "t": [
      "glasses",
      "eye",
      "vision",
      "free"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Health First Colorado (Medicaid & CHP+)",
    "p": "1-800-221-3943",
    "p2": "",
    "c": [
      "Medical",
      "Financial Assistance"
    ],
    "h": "Mon-Fri 7:30am-5:15pm",
    "d": "State Medicaid program — apply for free/low-cost health coverage.",
    "s": 1,
    "w": "https://healthfirstcolorado.com",
    "a": "",
    "t": [
      "medicaid",
      "health insurance",
      "chp+",
      "kids",
      "apply"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Memorial Hospital Health Link (info)",
    "p": "719-444-2273",
    "p2": "",
    "c": [
      "Medical"
    ],
    "h": "Mon-Fri",
    "d": "Find a UCHealth doctor or service.",
    "s": 3,
    "w": "https://uchealth.org",
    "a": "",
    "t": [
      "doctor",
      "referral",
      "memorial",
      "uchealth"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Memorial Hospital Central",
    "p": "719-365-5000",
    "p2": "",
    "c": [
      "Medical",
      "Emergency Services"
    ],
    "h": "24/7 ER",
    "d": "Full-service hospital with ER. Operated by UCHealth.",
    "s": 4,
    "w": "https://uchealth.org",
    "a": "1400 E Boulder St",
    "t": [
      "hospital",
      "emergency",
      "er",
      "memorial",
      "uchealth"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Penrose Hospital (CommonSpirit)",
    "p": "719-776-5000",
    "p2": "",
    "c": [
      "Medical",
      "Emergency Services"
    ],
    "h": "24/7 ER",
    "d": "Full-service Catholic hospital with ER.",
    "s": 4,
    "w": "https://commonspirit.org",
    "a": "2222 N Nevada Ave",
    "t": [
      "hospital",
      "emergency",
      "er",
      "penrose",
      "catholic"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "St. Francis Hospital (CommonSpirit)",
    "p": "719-571-1000",
    "p2": "",
    "c": [
      "Medical",
      "Emergency Services"
    ],
    "h": "24/7 ER",
    "d": "Full-service hospital with ER and Level III trauma center on the north side.",
    "s": 4,
    "w": "https://commonspirit.org",
    "a": "6001 E Woodmen Rd",
    "t": [
      "hospital",
      "emergency",
      "er",
      "st francis",
      "north"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Grandview Hospital (UCHealth)",
    "p": "719-365-3300",
    "p2": "",
    "c": [
      "Medical",
      "Emergency Services"
    ],
    "h": "24/7 ER",
    "d": "Orthopedic, sports medicine, and emergency care.",
    "s": 4,
    "w": "https://uchealth.org",
    "a": "5623 Pulpit Peak View",
    "t": [
      "hospital",
      "emergency",
      "orthopedic",
      "sports"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "El Paso County Public Health",
    "p": "719-578-3199",
    "p2": "",
    "c": [
      "Medical",
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri 7:30am-4:30pm",
    "d": "Immunizations, STI testing, family planning, TB testing, tobacco cessation. Sliding fee. Spanish providers.",
    "s": 3,
    "w": "https://elpasocountyhealth.org",
    "a": "",
    "t": [
      "immunization",
      "vaccine",
      "sti",
      "family planning",
      "tb"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "El Paso County DHS — Family Medical (apply)",
    "p": "719-444-5349",
    "p2": "",
    "c": [
      "Medical",
      "Financial Assistance"
    ],
    "h": "Mon-Fri",
    "d": "Apply for Medicaid, CHP+, family medical assistance.",
    "s": 1,
    "w": "https://dhs.elpasoco.com",
    "a": "",
    "t": [
      "medicaid",
      "apply",
      "family",
      "kids"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "NAMI (mental health support)",
    "p": "719-473-8477",
    "p2": "",
    "c": [
      "Medical",
      "Mental Health"
    ],
    "h": "Mon-Fri",
    "d": "Family support groups, peer-led classes, education, and advocacy for mental illness.",
    "s": 3,
    "w": "https://namicoloradosprings.org",
    "a": "",
    "t": [
      "mental health",
      "support group",
      "family",
      "schizophrenia",
      "bipolar"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Community Health Alliance (CCHA Medicaid RAE)",
    "p": "719-598-1540",
    "p2": "",
    "c": [
      "Medical",
      "Mental Health",
      "Substance Use"
    ],
    "h": "Mon-Fri",
    "d": "Care coordination for Medicaid members in Region 7. Find PCP, behavioral health, transportation.",
    "s": 2,
    "w": "https://cchacares.com",
    "a": "",
    "t": [
      "medicaid",
      "care coordination",
      "find doctor"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Rocky Mountain Health Care Services",
    "p": "719-314-2327",
    "p2": "",
    "c": [
      "Medical",
      "Senior Services"
    ],
    "h": "Mon-Fri",
    "d": "PACE program for elderly + brain injury services.",
    "s": 2,
    "w": "https://rmhcare.org",
    "a": "",
    "t": [
      "pace",
      "senior",
      "brain injury",
      "elderly"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "SET Family Medical Clinics",
    "p": "719-776-8850",
    "p2": "",
    "c": [
      "Medical"
    ],
    "h": "Mon-Fri",
    "d": "Family medicine clinics across the region.",
    "s": 3,
    "w": "https://setclinic.org",
    "a": "",
    "t": [
      "doctor",
      "family",
      "clinic"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "SET Homeless Clinic",
    "p": "719-475-7314",
    "p2": "",
    "c": [
      "Medical",
      "Shelter & Housing"
    ],
    "h": "Days vary",
    "d": "Medical care for people experiencing homelessness, at Marian House.",
    "s": 3,
    "w": "https://setclinic.org",
    "a": "Marian House",
    "t": [
      "homeless",
      "clinic",
      "doctor"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Springs Pregnancy Center (Galley)",
    "p": "719-679-3105",
    "p2": "",
    "c": [
      "Medical",
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "Free pregnancy tests, ultrasounds, options counseling, baby supplies. Christian-affiliated.",
    "s": 3,
    "w": "https://cspregnancy.org",
    "a": "Galley Rd",
    "t": [
      "pregnant",
      "pregnancy test",
      "baby",
      "ultrasound"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Springs Pregnancy Center (Fountain)",
    "p": "719-695-7030",
    "p2": "",
    "c": [
      "Medical",
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "Pregnancy services in Fountain.",
    "s": 3,
    "w": "https://cspregnancy.org",
    "a": "Fountain",
    "t": [
      "pregnant",
      "fountain",
      "baby"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Springs Pregnancy Center (Westside)",
    "p": "719-451-7586",
    "p2": "",
    "c": [
      "Medical",
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "Pregnancy services on the westside.",
    "s": 3,
    "w": "https://cspregnancy.org",
    "a": "Westside",
    "t": [
      "pregnant",
      "westside",
      "baby"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Dream Center Women's Clinic",
    "p": "719-388-1594",
    "p2": "",
    "c": [
      "Medical",
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "Free women's health, pregnancy, and family planning services.",
    "s": 3,
    "w": "https://dreamcenters.org/womens-clinic",
    "a": "",
    "t": [
      "women",
      "pregnancy",
      "clinic",
      "free"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Genetic Counseling (Memorial Hospital)",
    "p": "719-365-6845",
    "p2": "",
    "c": [
      "Medical",
      "Miscellaneous Counseling & Assistance"
    ],
    "h": "Mon-Fri by referral",
    "d": "Counseling for inherited conditions, prenatal screening.",
    "s": 2,
    "w": "https://uchealth.org",
    "a": "",
    "t": [
      "genetic",
      "prenatal",
      "inherited"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "DNA Testing (El Paso County Child Support)",
    "p": "719-457-6331",
    "p2": "",
    "c": [
      "Medical",
      "Legal Information & Advice"
    ],
    "h": "Mon-Fri",
    "d": "DNA paternity testing through child support services.",
    "s": 2,
    "w": "https://elpasoco.com",
    "a": "",
    "t": [
      "dna",
      "paternity",
      "child support"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Cheyenne Village (adults with disabilities)",
    "p": "719-592-0200",
    "p2": "",
    "c": [
      "Medical",
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Personal care, supported living, and day programs for adults with intellectual/developmental disabilities.",
    "s": 2,
    "w": "https://cheyennevillage.org",
    "a": "",
    "t": [
      "disability",
      "intellectual",
      "developmental",
      "supported living"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "The Independence Center (disabled medical)",
    "p": "719-471-8181",
    "p2": "",
    "c": [
      "Medical",
      "Disability Resources",
      "Veterans Services"
    ],
    "h": "Mon-Fri 8am-5pm",
    "d": "Independent living center — home health, advocacy, peer support, equipment loans.",
    "s": 3,
    "w": "https://the-ic.org",
    "a": "729 S Tejon St",
    "t": [
      "disability",
      "independent living",
      "wheelchair",
      "home health"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Next Chapter (veterans)",
    "p": "1-888-719-8387",
    "p2": "",
    "c": [
      "Medical",
      "Veterans Services",
      "Mental Health"
    ],
    "h": "Mon-Fri",
    "d": "PTSD and TBI treatment for post-9/11 veterans.",
    "s": 2,
    "w": "https://nextchapter.org",
    "a": "",
    "t": [
      "veteran",
      "ptsd",
      "tbi",
      "brain injury"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "PPACG — AAA Senior Insurance Assistance (SHIP)",
    "p": "719-471-2096",
    "p2": "",
    "c": [
      "Medical",
      "Senior Services"
    ],
    "h": "Mon-Fri",
    "d": "Free Medicare counseling — benefits, plans, drug coverage.",
    "s": 2,
    "w": "https://ppacg.org",
    "a": "",
    "t": [
      "medicare",
      "senior",
      "insurance",
      "drug"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Diversus Health",
    "p": "719-572-6100",
    "p2": "1-844-493-8255",
    "c": [
      "Mental Health",
      "Substance Use"
    ],
    "h": "Mon-Fri 8am-5pm; 24/7 walk-in crisis",
    "d": "Region's largest community mental health provider — therapy, psychiatry, substance use treatment, crisis services.",
    "s": 3,
    "w": "https://diversushealth.org",
    "a": "Multiple sites",
    "t": [
      "therapy",
      "counseling",
      "psychiatrist",
      "mental health",
      "crisis"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Insight Services",
    "p": "719-447-0370",
    "p2": "",
    "c": [
      "Mental Health",
      "Substance Use",
      "Miscellaneous Counseling & Assistance"
    ],
    "h": "Mon-Fri",
    "d": "Outpatient mental health and substance use counseling, including DUI classes.",
    "s": 2,
    "w": "https://insightservices.org",
    "a": "",
    "t": [
      "counseling",
      "therapy",
      "dui",
      "substance"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "LifeStance Health",
    "p": "970-310-3406",
    "p2": "",
    "c": [
      "Mental Health",
      "Miscellaneous Counseling & Assistance"
    ],
    "h": "Mon-Fri varies by clinician",
    "d": "Outpatient therapy and psychiatry, multiple Colorado Springs locations.",
    "s": 2,
    "w": "https://lifestance.com",
    "a": "",
    "t": [
      "therapy",
      "counseling",
      "psychiatrist"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Peak View Behavioral Health",
    "p": "719-444-8484",
    "p2": "",
    "c": [
      "Mental Health"
    ],
    "h": "Mon-Fri intake",
    "d": "Inpatient psychiatric and addiction treatment.",
    "s": 2,
    "w": "https://peakviewbh.com",
    "a": "",
    "t": [
      "psychiatric",
      "inpatient",
      "addiction"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "The Patterson Center for Resiliency",
    "p": "719-300-5735",
    "p2": "",
    "c": [
      "Mental Health"
    ],
    "h": "By appointment",
    "d": "Trauma-focused therapy for first responders and military.",
    "s": 2,
    "w": "https://pattersoncenter.org",
    "a": "",
    "t": [
      "trauma",
      "first responder",
      "military",
      "ptsd"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Another Life Foundation",
    "p": "719-216-7238",
    "p2": "",
    "c": [
      "Mental Health"
    ],
    "h": "Verify hours",
    "d": "Mental illness and suicide prevention support; minority mental health.",
    "s": 3,
    "w": "https://anotherlifefoundation.org",
    "a": "",
    "t": [
      "mental health",
      "suicide",
      "minority"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Dos Madres — RESTORE",
    "p": "719-510-6981",
    "p2": "",
    "c": [
      "Mental Health",
      "Miscellaneous Counseling & Assistance"
    ],
    "h": "Verify hours",
    "d": "Trauma counseling.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "trauma",
      "counseling"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Colorado Springs Alcoholics Anonymous",
    "p": "719-573-5020",
    "p2": "",
    "c": [
      "Substance Use"
    ],
    "h": "24/7 hotline; meetings daily",
    "d": "Free peer-support meetings for anyone wanting to stop drinking.",
    "s": 4,
    "w": "https://coloradospringsaa.org",
    "a": "",
    "t": [
      "alcohol",
      "aa",
      "drinking",
      "meeting",
      "sober"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Pikes Peak Area of Narcotics Anonymous",
    "p": "719-637-1580",
    "p2": "",
    "c": [
      "Substance Use"
    ],
    "h": "24/7 hotline; meetings daily",
    "d": "Free peer-support meetings for people in recovery from addiction.",
    "s": 4,
    "w": "https://ppana.org",
    "a": "",
    "t": [
      "narcotics",
      "na",
      "drugs",
      "recovery",
      "meeting",
      "sober"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "Achieve Whole Recovery",
    "p": "719-373-9703",
    "p2": "",
    "c": [
      "Substance Use"
    ],
    "h": "Mon-Fri",
    "d": "Outpatient addiction treatment with MAT.",
    "s": 2,
    "w": "https://achievewholerecovery.com",
    "a": "",
    "t": [
      "addiction",
      "mat",
      "outpatient"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Front Range Clinic",
    "p": "719-419-7735",
    "p2": "",
    "c": [
      "Substance Use",
      "Medical"
    ],
    "h": "Mon-Fri",
    "d": "Medication-assisted treatment for opioid and alcohol use disorder.",
    "s": 2,
    "w": "https://frontrangeclinic.com",
    "a": "",
    "t": [
      "mat",
      "opioid",
      "suboxone",
      "methadone"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Phoenix Multisport (drug & alcohol)",
    "p": "719-434-3387",
    "p2": "",
    "c": [
      "Substance Use"
    ],
    "h": "Daily classes",
    "d": "Free sober-active community — fitness, climbing, CrossFit, social events. 48 hours sober required.",
    "s": 4,
    "w": "https://thephoenix.org",
    "a": "",
    "t": [
      "sober",
      "fitness",
      "community",
      "recovery"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Recovery Unlimited",
    "p": "719-358-7338",
    "p2": "",
    "c": [
      "Substance Use"
    ],
    "h": "Verify hours",
    "d": "Substance use treatment.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "substance",
      "treatment"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Sandstone Care",
    "p": "720-674-7380",
    "p2": "",
    "c": [
      "Substance Use",
      "Mental Health"
    ],
    "h": "Mon-Fri",
    "d": "Teen and young-adult substance use and mental health treatment.",
    "s": 2,
    "w": "https://sandstonecare.com",
    "a": "",
    "t": [
      "teen",
      "young adult",
      "substance",
      "treatment"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Serenity Recovery Connection",
    "p": "719-465-2295",
    "p2": "",
    "c": [
      "Substance Use"
    ],
    "h": "Mon-Fri",
    "d": "Peer recovery coaching, recovery community center.",
    "s": 3,
    "w": "https://serenityrecoveryconnection.org",
    "a": "",
    "t": [
      "peer",
      "recovery",
      "sober",
      "coaching"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Love Alive",
    "p": "719-283-6197",
    "p2": "",
    "c": [
      "Substance Use"
    ],
    "h": "Verify hours",
    "d": "Faith-based recovery program.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "faith",
      "recovery"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Oxford House (sober living)",
    "p": "1-800-689-6411",
    "p2": "",
    "c": [
      "Substance Use",
      "Shelter & Housing"
    ],
    "h": "Apply by phone",
    "d": "Self-run sober living houses across Colorado Springs.",
    "s": 2,
    "w": "https://oxfordhouse.org",
    "a": "",
    "t": [
      "sober living",
      "recovery",
      "housing"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Homeward Pikes Peak Addiction Recovery",
    "p": "719-473-5557",
    "p2": "",
    "c": [
      "Substance Use",
      "Shelter & Housing"
    ],
    "h": "Mon-Fri",
    "d": "Recovery + housing for chronically homeless adults.",
    "s": 2,
    "w": "https://homewardpikespeak.org",
    "a": "",
    "t": [
      "recovery",
      "housing",
      "homeless"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Pikes Peak Workforce Center",
    "p": "719-667-3700",
    "p2": "",
    "c": [
      "Employment & Training"
    ],
    "h": "Mon-Fri 8am-5pm",
    "d": "Free job search help, resume support, training programs, employer connections.",
    "s": 3,
    "w": "https://ppwfc.org",
    "a": "1675 Garden of the Gods Rd",
    "t": [
      "job",
      "work",
      "career",
      "resume",
      "unemployed",
      "training"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Catholic Charities — Hanifen Employment Center",
    "p": "719-866-6285",
    "p2": "",
    "c": [
      "Employment & Training",
      "Legal Information & Advice"
    ],
    "h": "Mon-Fri",
    "d": "Job coaching, resume help, computer access for adults — including those with barriers.",
    "s": 3,
    "w": "https://ccharitiescc.org",
    "a": "At Marian House",
    "t": [
      "job",
      "employment",
      "resume",
      "barriers"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Center for Employment Opportunities (re-entry)",
    "p": "719-694-5450",
    "p2": "",
    "c": [
      "Employment & Training",
      "Justice Involved Services"
    ],
    "h": "Mon-Fri",
    "d": "Same-day work, training, and full-time job placement for people recently released from incarceration.",
    "s": 3,
    "w": "https://ceoworks.org",
    "a": "",
    "t": [
      "job",
      "reentry",
      "prison",
      "incarceration",
      "felon"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Goodwill Career Development Program",
    "p": "719-635-4483",
    "p2": "",
    "c": [
      "Employment & Training",
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Free job training, certifications, resume help, paid work experience.",
    "s": 3,
    "w": "https://discovermygoodwill.org",
    "a": "",
    "t": [
      "job",
      "training",
      "resume",
      "career",
      "certification"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Division of Vocational Rehabilitation",
    "p": "719-635-3585",
    "p2": "",
    "c": [
      "Employment & Training",
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Help people with disabilities prepare for, get, and keep jobs.",
    "s": 1,
    "w": "https://dvr.colorado.gov",
    "a": "",
    "t": [
      "disability",
      "job",
      "vocational",
      "work"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Community Works Colorado Springs",
    "p": "719-203-4758",
    "p2": "",
    "c": [
      "Employment & Training"
    ],
    "h": "Mon-Fri",
    "d": "Workforce development for people with barriers to employment.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "job",
      "barriers",
      "workforce"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "PCs for People",
    "p": "720-278-7725",
    "p2": "",
    "c": [
      "Employment & Training"
    ],
    "h": "By appointment",
    "d": "Low-cost computers and internet for low-income individuals and families.",
    "s": 2,
    "w": "https://pcsforpeople.org",
    "a": "",
    "t": [
      "computer",
      "internet",
      "low income",
      "technology"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "PPLD Adult Education",
    "p": "719-531-6333 ext 2225",
    "p2": "",
    "c": [
      "Employment & Training"
    ],
    "h": "Mon-Sat library hours",
    "d": "Free GED prep, ESL, online high school diploma, basic computer skills.",
    "s": 3,
    "w": "https://ppld.org/adult-education",
    "a": "",
    "t": [
      "ged",
      "high school",
      "esl",
      "english",
      "diploma"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Senior Community Service Employment Program (SCSEP/AARP)",
    "p": "719-635-3579",
    "p2": "",
    "c": [
      "Employment & Training",
      "Senior Services"
    ],
    "h": "Mon-Fri",
    "d": "Paid training program for low-income job seekers age 55+.",
    "s": 2,
    "w": "https://aarp.org/scsep",
    "a": "",
    "t": [
      "senior",
      "job",
      "aarp",
      "55",
      "training"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Urban League of Pikes Peak Region",
    "p": "719-634-1525",
    "p2": "",
    "c": [
      "Employment & Training"
    ],
    "h": "Mon-Fri",
    "d": "Workforce development, financial empowerment, and advocacy for Black community and underserved populations.",
    "s": 3,
    "w": "https://ulppr.org",
    "a": "",
    "t": [
      "job",
      "black",
      "minority",
      "financial",
      "advocacy"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Child Care Resource and Referral (Colorado Shines)",
    "p": "1-877-338-2273",
    "p2": "",
    "c": [
      "Child Care Information"
    ],
    "h": "Mon-Fri 8am-5pm",
    "d": "Find licensed child care, quality ratings, and parent resources statewide.",
    "s": 3,
    "w": "https://coloradoshines.org",
    "a": "",
    "t": [
      "child care",
      "daycare",
      "preschool",
      "babysitter"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Child Care Assistance Program (CCAP)",
    "p": "719-444-8178",
    "p2": "",
    "c": [
      "Child Care Information",
      "Financial Assistance"
    ],
    "h": "Mon-Fri",
    "d": "Pays for child care for low-income working / training families. Apply through DHS.",
    "s": 1,
    "w": "https://dhs.elpasoco.com",
    "a": "",
    "t": [
      "ccap",
      "child care",
      "subsidy",
      "apply"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "CPCD giving children a head start",
    "p": "719-635-1536",
    "p2": "",
    "c": [
      "Child Care Information"
    ],
    "h": "Mon-Fri",
    "d": "Free Head Start preschool for income-eligible families with kids 0-5.",
    "s": 2,
    "w": "https://cpcdheadstart.org",
    "a": "",
    "t": [
      "head start",
      "preschool",
      "free",
      "kids"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Pikes Peak Region Family Child Care Association",
    "p": "719-475-8828",
    "p2": "",
    "c": [
      "Child Care Information"
    ],
    "h": "Verify hours",
    "d": "Network of in-home licensed family child care providers.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "child care",
      "daycare",
      "home",
      "family"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Catholic Charities Counseling Services",
    "p": "719-866-6535",
    "p2": "",
    "c": [
      "Parenting & Pregnancy",
      "Mental Health",
      "Miscellaneous Counseling & Assistance"
    ],
    "h": "Mon-Fri by appointment",
    "d": "Sliding-fee individual, couples, and family counseling.",
    "s": 2,
    "w": "https://ccharitiescc.org",
    "a": "",
    "t": [
      "counseling",
      "therapy",
      "family",
      "couples"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Center on Fathering",
    "p": "719-634-7797",
    "p2": "",
    "c": [
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "Programs and support for fathers — visitation, mediation, parenting classes.",
    "s": 2,
    "w": "https://centeronfathering.org",
    "a": "",
    "t": [
      "father",
      "dad",
      "custody",
      "visitation",
      "parenting"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Life Network",
    "p": "719-591-2609",
    "p2": "",
    "c": [
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "Pregnancy resource center — free testing, ultrasounds, parenting education, baby supplies.",
    "s": 3,
    "w": "https://elifenetwork.com",
    "a": "",
    "t": [
      "pregnant",
      "pregnancy",
      "baby",
      "christian"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Lutheran Family Services",
    "p": "719-227-7571",
    "p2": "",
    "c": [
      "Parenting & Pregnancy",
      "Miscellaneous Counseling & Assistance"
    ],
    "h": "Mon-Fri",
    "d": "Adoption, foster care, counseling, refugee resettlement.",
    "s": 2,
    "w": "https://lfsrm.org",
    "a": "",
    "t": [
      "adoption",
      "foster",
      "counseling",
      "refugee"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Lutheran Family Services — Refugee & Asylee",
    "p": "719-227-8899",
    "p2": "",
    "c": [
      "Miscellaneous Counseling & Assistance"
    ],
    "h": "Mon-Fri",
    "d": "Resettlement, ESL, employment, and case management for refugees and asylum seekers.",
    "s": 2,
    "w": "https://lfsrm.org/refugee",
    "a": "",
    "t": [
      "refugee",
      "asylum",
      "immigrant",
      "resettlement"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Safe Families for Children",
    "p": "719-357-7080",
    "p2": "",
    "c": [
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "Volunteer host families care for kids when parents face crisis — without involving CPS.",
    "s": 2,
    "w": "https://safe-families.org",
    "a": "",
    "t": [
      "foster",
      "host",
      "family",
      "crisis",
      "kids"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Springs Senior Center",
    "p": "719-955-3400",
    "p2": "",
    "c": [
      "Senior Services"
    ],
    "h": "Mon-Fri 8am-4pm",
    "d": "Classes, fitness, dining, social events for adults 50+.",
    "s": 3,
    "w": "https://csseniorcenter.com",
    "a": "1514 N Hancock Ave",
    "t": [
      "senior",
      "activities",
      "dining",
      "fitness"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Fountain Valley Senior Center",
    "p": "719-600-2644",
    "p2": "",
    "c": [
      "Senior Services",
      "Transportation"
    ],
    "h": "Mon-Fri",
    "d": "Activities, meals, transportation for seniors in Fountain.",
    "s": 3,
    "w": "",
    "a": "Fountain",
    "t": [
      "senior",
      "fountain"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "PPACG Area Agency on Aging",
    "p": "719-471-2096",
    "p2": "",
    "c": [
      "Senior Services"
    ],
    "h": "Mon-Fri",
    "d": "Aging information, benefits counseling, ombudsman, caregiver support.",
    "s": 2,
    "w": "https://ppacg.org/aging",
    "a": "",
    "t": [
      "aging",
      "senior",
      "caregiver",
      "ombudsman"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "AAA Family Caregiver Support Center",
    "p": "719-886-7526",
    "p2": "",
    "c": [
      "Senior Services"
    ],
    "h": "Mon-Fri",
    "d": "Support, training, respite for family caregivers.",
    "s": 2,
    "w": "https://ppacg.org/aging",
    "a": "",
    "t": [
      "caregiver",
      "family",
      "respite"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Rocky Mountain PACE",
    "p": "719-314-2327",
    "p2": "",
    "c": [
      "Senior Services",
      "Medical"
    ],
    "h": "Mon-Fri",
    "d": "All-inclusive day program for seniors who would otherwise need a nursing home.",
    "s": 1,
    "w": "https://rmhcare.org/pace",
    "a": "",
    "t": [
      "pace",
      "senior",
      "nursing home",
      "day program"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "UCCS Aging Center",
    "p": "719-255-8002",
    "p2": "",
    "c": [
      "Senior Services",
      "Mental Health"
    ],
    "h": "Mon-Fri",
    "d": "Sliding-fee mental health and counseling for older adults.",
    "s": 2,
    "w": "https://uccs.edu/aging",
    "a": "",
    "t": [
      "senior",
      "counseling",
      "mental health"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Mountain Metro Mobility",
    "p": "719-385-7433",
    "p2": "",
    "c": [
      "Transportation",
      "Disability Resources"
    ],
    "h": "Daily; book in advance",
    "d": "ADA paratransit for people who can't use the regular bus.",
    "s": 2,
    "w": "https://mmtransit.com",
    "a": "",
    "t": [
      "paratransit",
      "disabled",
      "wheelchair",
      "transportation"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Envida (transportation)",
    "p": "719-633-4677",
    "p2": "",
    "c": [
      "Transportation",
      "Disability Resources",
      "Senior Services"
    ],
    "h": "Mon-Fri; book ahead",
    "d": "Door-through-door transportation for seniors and people with disabilities.",
    "s": 2,
    "w": "https://envidacares.org",
    "a": "",
    "t": [
      "transportation",
      "senior",
      "disabled",
      "ride"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "GoodWheels — Goodwill",
    "p": "719-442-2077",
    "p2": "",
    "c": [
      "Transportation",
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Affordable transportation for seniors and people with disabilities.",
    "s": 2,
    "w": "https://discovermygoodwill.org/goodwheels",
    "a": "",
    "t": [
      "transportation",
      "senior",
      "disabled",
      "ride"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "IntelliRide — Health First Colorado",
    "p": "719-766-4660",
    "p2": "",
    "c": [
      "Transportation",
      "Medical"
    ],
    "h": "Mon-Fri; book 48hr ahead",
    "d": "Free non-emergency medical transportation for Medicaid members.",
    "s": 2,
    "w": "https://gointelliride.com/colorado",
    "a": "",
    "t": [
      "medicaid",
      "transportation",
      "medical",
      "ride",
      "appointment"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Silver Key Para Transit",
    "p": "719-884-2300",
    "p2": "",
    "c": [
      "Transportation",
      "Senior Services"
    ],
    "h": "Mon-Fri; book ahead",
    "d": "Transportation for seniors 60+.",
    "s": 2,
    "w": "https://silverkey.org",
    "a": "",
    "t": [
      "senior",
      "transportation",
      "ride"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "El Paso County Veterans Services",
    "p": "719-520-7750",
    "p2": "",
    "c": [
      "Veterans Services"
    ],
    "h": "Mon-Fri 8am-5pm",
    "d": "Help filing VA benefits claims, navigation, advocacy.",
    "s": 2,
    "w": "https://elpasoco.com/veterans",
    "a": "",
    "t": [
      "veteran",
      "va",
      "benefits",
      "claim"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Veterans Administration",
    "p": "719-471-9992",
    "p2": "",
    "c": [
      "Veterans Services",
      "Medical"
    ],
    "h": "Mon-Fri",
    "d": "VA benefits, healthcare enrollment, claims.",
    "s": 2,
    "w": "https://va.gov",
    "a": "",
    "t": [
      "veteran",
      "va",
      "benefits",
      "healthcare"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "PFC Floyd K. Lindstrom VA Outpatient Clinic",
    "p": "719-327-5660",
    "p2": "",
    "c": [
      "Veterans Services",
      "Medical"
    ],
    "h": "Mon-Fri 7am-4:30pm",
    "d": "Primary care, mental health, lab, pharmacy for enrolled veterans.",
    "s": 2,
    "w": "https://va.gov/eastern-colorado-health-care",
    "a": "3141 Centennial Blvd",
    "t": [
      "veteran",
      "va",
      "clinic",
      "doctor"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Home Front Military Care Network",
    "p": "719-577-7417",
    "p2": "",
    "c": [
      "Veterans Services"
    ],
    "h": "Mon-Fri",
    "d": "Financial assistance and support for active-duty and veteran families.",
    "s": 2,
    "w": "https://homefrontcares.org",
    "a": "",
    "t": [
      "veteran",
      "military",
      "family",
      "financial"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "UCCS Veterans Health & Trauma Clinic",
    "p": "719-255-8003",
    "p2": "",
    "c": [
      "Veterans Services",
      "Mental Health"
    ],
    "h": "By appointment",
    "d": "Free counseling for veterans, active-duty, and family members.",
    "s": 2,
    "w": "https://uccs.edu/vhtc",
    "a": "",
    "t": [
      "veteran",
      "counseling",
      "trauma",
      "ptsd",
      "free"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Legal Services",
    "p": "719-471-0380",
    "p2": "",
    "c": [
      "Legal Information & Advice"
    ],
    "h": "Mon-Fri intake",
    "d": "Free civil legal aid for low-income — eviction, family law, public benefits, consumer.",
    "s": 2,
    "w": "https://coloradolegalservices.org",
    "a": "",
    "t": [
      "lawyer",
      "legal",
      "free",
      "eviction",
      "family law"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Public Defenders Office",
    "p": "719-475-1235",
    "p2": "",
    "c": [
      "Legal Information & Advice",
      "Justice Involved Services"
    ],
    "h": "Mon-Fri",
    "d": "Court-appointed defense for those who cannot afford a lawyer in criminal cases.",
    "s": 2,
    "w": "https://coloradodefenders.us",
    "a": "30 E Pikes Peak Ave",
    "t": [
      "lawyer",
      "criminal",
      "defense",
      "arrested"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "The Justice Center",
    "p": "719-473-6212",
    "p2": "",
    "c": [
      "Legal Information & Advice"
    ],
    "h": "Mon-Fri",
    "d": "Court information.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "court",
      "legal"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Pro Se Self-Help Center",
    "p": "719-452-5000",
    "p2": "",
    "c": [
      "Legal Information & Advice"
    ],
    "h": "Mon-Fri",
    "d": "Help filling out court forms when representing yourself.",
    "s": 3,
    "w": "https://courts.state.co.us",
    "a": "270 S Tejon St",
    "t": [
      "court",
      "self help",
      "forms",
      "pro se"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Family Court Facilitators",
    "p": "719-452-5104",
    "p2": "",
    "c": [
      "Legal Information & Advice",
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "Help with divorce, custody, and parenting plan forms.",
    "s": 2,
    "w": "https://courts.state.co.us",
    "a": "",
    "t": [
      "divorce",
      "custody",
      "parenting plan",
      "family court"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Child Support Services (El Paso County)",
    "p": "719-457-6331",
    "p2": "",
    "c": [
      "Legal Information & Advice",
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "Establish, enforce, and collect child support.",
    "s": 2,
    "w": "https://dhs.elpasoco.com",
    "a": "",
    "t": [
      "child support",
      "custody",
      "paternity"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Neighborhood Justice Center (mediation)",
    "p": "719-520-6000",
    "p2": "",
    "c": [
      "Legal Information & Advice",
      "Miscellaneous Counseling & Assistance"
    ],
    "h": "Mon-Fri",
    "d": "Free mediation for neighbor disputes, landlord-tenant, family.",
    "s": 2,
    "w": "https://elpasoco.com",
    "a": "",
    "t": [
      "mediation",
      "dispute",
      "neighbor",
      "landlord"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Catholic Charities — Legal Immigration Counseling",
    "p": "719-636-2345",
    "p2": "",
    "c": [
      "Legal Information & Advice"
    ],
    "h": "Mon-Fri",
    "d": "DOJ-accredited immigration legal services.",
    "s": 2,
    "w": "https://ccharitiescc.org",
    "a": "",
    "t": [
      "immigration",
      "green card",
      "citizenship",
      "daca",
      "asylum"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Disability Law Colorado",
    "p": "303-722-0300",
    "p2": "",
    "c": [
      "Legal Information & Advice",
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Legal advocacy for people with disabilities — discrimination, services, benefits.",
    "s": 2,
    "w": "https://disabilitylawco.org",
    "a": "",
    "t": [
      "disability",
      "legal",
      "discrimination",
      "ada"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Cross-Disability Coalition",
    "p": "303-869-1775",
    "p2": "",
    "c": [
      "Legal Information & Advice",
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Civil rights advocacy for people with all disabilities.",
    "s": 2,
    "w": "https://ccdconline.org",
    "a": "",
    "t": [
      "disability",
      "civil rights",
      "advocacy"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Rocky Mountain Victim Law Center",
    "p": "303-295-2001",
    "p2": "",
    "c": [
      "Legal Information & Advice",
      "Domestic Violence Services"
    ],
    "h": "Mon-Fri",
    "d": "Free legal representation for victims of crime — privacy, protection orders, restitution.",
    "s": 2,
    "w": "https://rmvictimlaw.org",
    "a": "",
    "t": [
      "victim",
      "crime",
      "protection order",
      "privacy"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Child Protection Ombudsman",
    "p": "720-625-8640",
    "p2": "",
    "c": [
      "Legal Information & Advice",
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "Independent oversight of child welfare system. Investigates concerns about CPS.",
    "s": 2,
    "w": "https://coloradocpo.org",
    "a": "",
    "t": [
      "child protection",
      "cps",
      "ombudsman",
      "kids"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "The ARC of the Pikes Peak Region",
    "p": "1-855-828-8476",
    "p2": "",
    "c": [
      "Legal Information & Advice",
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Advocacy and rights protection for people with intellectual / developmental disabilities.",
    "s": 2,
    "w": "https://thearcppr.org",
    "a": "",
    "t": [
      "disability",
      "intellectual",
      "developmental",
      "advocacy"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "ComCor, Inc.",
    "p": "719-473-4460",
    "p2": "",
    "c": [
      "Justice Involved Services"
    ],
    "h": "Mon-Fri",
    "d": "Community corrections — residential supervision, treatment for adults transitioning from prison.",
    "s": 2,
    "w": "https://comcor.org",
    "a": "",
    "t": [
      "community corrections",
      "prison",
      "reentry"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Community Alternatives of El Paso County",
    "p": "719-390-1303",
    "p2": "",
    "c": [
      "Justice Involved Services"
    ],
    "h": "Mon-Fri",
    "d": "Community-based alternative to incarceration.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "alternative",
      "corrections",
      "sentencing"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Department of Corrections — Community Re-Entry",
    "p": "719-633-1469 ext 2325",
    "p2": "",
    "c": [
      "Justice Involved Services"
    ],
    "h": "Mon-Fri",
    "d": "Re-entry services for people leaving Colorado state prison.",
    "s": 2,
    "w": "https://doc.colorado.gov",
    "a": "",
    "t": [
      "reentry",
      "prison",
      "parole"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Forge Evolution",
    "p": "719-475-7815",
    "p2": "",
    "c": [
      "Justice Involved Services",
      "Substance Use"
    ],
    "h": "Mon-Fri",
    "d": "Mentorship and support for justice-involved men.",
    "s": 2,
    "w": "https://forgeevolution.org",
    "a": "",
    "t": [
      "mentorship",
      "reentry",
      "men"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Gateway Through the Rockies",
    "p": "719-390-2129",
    "p2": "",
    "c": [
      "Justice Involved Services"
    ],
    "h": "Mon-Fri",
    "d": "Re-entry services and transitional housing.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "reentry",
      "transitional housing"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Mercy Today Ministries (Cañon City)",
    "p": "719-276-9242",
    "p2": "",
    "c": [
      "Justice Involved Services"
    ],
    "h": "",
    "d": "Faith-based prison ministry and re-entry support.",
    "s": 2,
    "w": "",
    "a": "Cañon City",
    "t": [
      "prison",
      "faith",
      "reentry"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "My Precious Hope",
    "p": "915-319-6481",
    "p2": "",
    "c": [
      "Justice Involved Services",
      "Domestic Violence Services"
    ],
    "h": "Verify hours",
    "d": "Support for women coming out of incarceration or trafficking.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "women",
      "reentry",
      "trafficking"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Remerg",
    "p": "303-993-3551",
    "p2": "",
    "c": [
      "Justice Involved Services"
    ],
    "h": "Online directory",
    "d": "Statewide re-entry resource directory.",
    "s": 3,
    "w": "https://remerg.com",
    "a": "",
    "t": [
      "reentry",
      "directory",
      "resources"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Zebulon Pike Youth Service Center",
    "p": "719-385-3370",
    "p2": "",
    "c": [
      "Justice Involved Services"
    ],
    "h": "Mon-Fri",
    "d": "Youth detention and assessment center.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "youth",
      "detention",
      "juvenile"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Colorado Laser Clinic — Gang Tattoo Removal (under 25)",
    "p": "719-596-4000",
    "p2": "",
    "c": [
      "Justice Involved Services"
    ],
    "h": "By appointment",
    "d": "Free gang tattoo removal for people under age 25.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "tattoo",
      "gang",
      "removal",
      "youth",
      "free"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Colorado School for the Deaf and Blind",
    "p": "719-578-2100",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "School year",
    "d": "K-12 education for deaf, blind, and deaf-blind students statewide.",
    "s": 2,
    "w": "https://csdb.org",
    "a": "33 N Institute St",
    "t": [
      "deaf",
      "blind",
      "school",
      "kids",
      "education"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Springs Down Syndrome Association",
    "p": "719-633-1133",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Family support, advocacy, and education for the Down syndrome community.",
    "s": 3,
    "w": "https://csdsa.org",
    "a": "",
    "t": [
      "down syndrome",
      "family",
      "advocacy"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Springs Therapeutic Recreation Program",
    "p": "719-385-5940",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "City recreation programs adapted for people with disabilities.",
    "s": 3,
    "w": "https://coloradosprings.gov/parks",
    "a": "",
    "t": [
      "recreation",
      "disability",
      "sports"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Colorado Springs Therapeutic Riding Center",
    "p": "719-634-4173",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "By appointment",
    "d": "Therapeutic horseback riding for kids and adults with disabilities.",
    "s": 2,
    "w": "https://cstrc.org",
    "a": "",
    "t": [
      "horse",
      "therapy",
      "disability"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Special Kids Special Families",
    "p": "719-447-8983",
    "p2": "",
    "c": [
      "Disability Resources",
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "Respite, foster care, family support for kids with special needs.",
    "s": 2,
    "w": "https://sksfcolorado.org",
    "a": "",
    "t": [
      "special needs",
      "kids",
      "respite",
      "foster"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "PEAK Parent Center",
    "p": "719-531-9400",
    "p2": "",
    "c": [
      "Disability Resources",
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "Parent training and information on special education and disability rights.",
    "s": 2,
    "w": "https://peakparent.org",
    "a": "",
    "t": [
      "parent",
      "disability",
      "iep",
      "special education"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "P2P: Parent to Parent of Colorado",
    "p": "1-877-472-7201",
    "p2": "",
    "c": [
      "Disability Resources",
      "Parenting & Pregnancy"
    ],
    "h": "Mon-Fri",
    "d": "One-to-one peer support for parents of kids with disabilities.",
    "s": 3,
    "w": "https://p2p-co.org",
    "a": "",
    "t": [
      "parent",
      "disability",
      "peer support",
      "kids"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "The Resource Exchange",
    "p": "719-380-1100",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Community-Centered Board for IDD — case management, services for kids and adults.",
    "s": 2,
    "w": "https://tre.org",
    "a": "",
    "t": [
      "idd",
      "developmental",
      "case management",
      "ccb"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "PASCO",
    "p": "719-960-4995",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "In-home support services for people with disabilities, including CDASS.",
    "s": 2,
    "w": "https://pascohh.com",
    "a": "",
    "t": [
      "home health",
      "disability",
      "cdass"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Empowered Care",
    "p": "719-465-3905",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Adult day program for people with developmental disabilities.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "day program",
      "disability",
      "adults"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "PlayDate Behavioral Interventions",
    "p": "719-465-3989",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "ABA therapy for kids with autism.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "autism",
      "aba",
      "therapy",
      "kids"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Roundup School",
    "p": "719-447-9333",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "School year",
    "d": "School for kids with significant developmental disabilities.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "school",
      "disability",
      "kids"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "StableStrides",
    "p": "719-495-3908",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Sat",
    "d": "Equine-assisted therapy and learning for kids and adults.",
    "s": 2,
    "w": "https://stablestrides.org",
    "a": "",
    "t": [
      "horse",
      "therapy",
      "disability",
      "equine"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Cerebral Palsy Association of Colorado Springs",
    "p": "719-638-0808",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Family support, advocacy, services for people with cerebral palsy.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "cerebral palsy",
      "cp",
      "disability"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Colorado Network for Developmental Disabilities",
    "p": "719-344-8015",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Coordination and advocacy network.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "developmental",
      "disability",
      "network"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Achilles Pikes Peak",
    "p": "828-712-3737",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Run club meetings",
    "d": "Adaptive running and athletics for people with disabilities.",
    "s": 3,
    "w": "https://achillesinternational.org",
    "a": "",
    "t": [
      "running",
      "sports",
      "disability",
      "athlete"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Assistance League of Colorado Springs",
    "p": "719-475-1029",
    "p2": "",
    "c": [
      "Disability Resources",
      "Clothing & Hygiene"
    ],
    "h": "Mon-Fri",
    "d": "Operation School Bell — clothing for kids; assault survivor kits; senior outreach.",
    "s": 3,
    "w": "https://assistanceleague.org/colorado-springs",
    "a": "",
    "t": [
      "school",
      "clothing",
      "kids",
      "assault"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Cheyenne Village",
    "p": "719-592-0200",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Personal care, supported living, day programs for adults with IDD.",
    "s": 2,
    "w": "https://cheyennevillage.org",
    "a": "",
    "t": [
      "disability",
      "supported living",
      "adult"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "CaptionCall",
    "p": "833-691-1600",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Free captioned phone for people with hearing loss.",
    "s": 3,
    "w": "https://captioncall.com",
    "a": "",
    "t": [
      "hearing",
      "deaf",
      "phone",
      "caption"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Sign Language Network",
    "p": "719-599-4517",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "ASL interpreting services.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "asl",
      "sign language",
      "interpreter",
      "deaf"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Relay Colorado",
    "p": "711",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "24/7",
    "d": "Free phone relay service for deaf, hard-of-hearing, deaf-blind, speech-disabled callers.",
    "s": 5,
    "w": "https://relaycolorado.com",
    "a": "",
    "t": [
      "deaf",
      "relay",
      "phone",
      "hearing"
    ],
    "v": true,
    "tf": true
  },
  {
    "n": "HEARS of El Paso County",
    "p": "719-352-5124",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Hearing equipment and resource sharing.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "hearing",
      "deaf",
      "equipment"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "HEARSCOSP",
    "p": "719-314-8605",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Hearing services.",
    "s": 3,
    "w": "",
    "a": "",
    "t": [
      "hearing",
      "deaf"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Colorado Department of Education (SWAAAC)",
    "p": "303-315-1276",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Statewide assistive technology assessment and assistance.",
    "s": 2,
    "w": "https://swaaac.com",
    "a": "",
    "t": [
      "assistive technology",
      "at",
      "disability",
      "school"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Peak Vista Developmental Disabilities Health Center",
    "p": "719-632-5700",
    "p2": "",
    "c": [
      "Disability Resources",
      "Medical"
    ],
    "h": "Mon-Fri",
    "d": "Medical home for adults with intellectual and developmental disabilities.",
    "s": 2,
    "w": "https://peakvista.org",
    "a": "",
    "t": [
      "disability",
      "medical",
      "developmental"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Special Olympics of Colorado",
    "p": "720-359-3100",
    "p2": "",
    "c": [
      "Disability Resources"
    ],
    "h": "Mon-Fri",
    "d": "Year-round sports training and competition for athletes with intellectual disabilities.",
    "s": 3,
    "w": "https://specialolympicsco.org",
    "a": "",
    "t": [
      "sports",
      "disability",
      "athlete",
      "olympics"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Social Security Administration (SSDI & SSI)",
    "p": "1-800-772-1213",
    "p2": "",
    "c": [
      "Disability Resources",
      "Financial Assistance"
    ],
    "h": "Mon-Fri 8am-7pm",
    "d": "Apply for disability benefits, retirement, survivors.",
    "s": 1,
    "w": "https://ssa.gov",
    "a": "",
    "t": [
      "ssi",
      "ssdi",
      "disability",
      "benefits",
      "retirement"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Department of Human Services (AND & VA benefits)",
    "p": "719-636-0000",
    "p2": "",
    "c": [
      "Disability Resources",
      "Financial Assistance"
    ],
    "h": "Mon-Fri",
    "d": "Aid to the Needy Disabled (AND), state disability benefits.",
    "s": 1,
    "w": "https://dhs.elpasoco.com",
    "a": "",
    "t": [
      "and",
      "disability",
      "cash",
      "aid"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Centro de la Familia",
    "p": "719-227-9170",
    "p2": "",
    "c": [
      "Domestic Violence Services"
    ],
    "h": "Mon-Fri",
    "d": "Spanish-language domestic violence advocacy and counseling.",
    "s": 2,
    "w": "",
    "a": "",
    "t": [
      "latino",
      "spanish",
      "domestic violence",
      "family"
    ],
    "v": false,
    "tf": false
  },
  {
    "n": "Haseya Advocate Program (Native Americans)",
    "p": "719-600-3939",
    "p2": "",
    "c": [
      "Domestic Violence Services"
    ],
    "h": "Mon-Fri",
    "d": "Culturally-grounded advocacy for Native American survivors of violence.",
    "s": 2,
    "w": "https://haseyaadvocate.com",
    "a": "",
    "t": [
      "native american",
      "indigenous",
      "domestic violence",
      "advocacy"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Benefits in Action",
    "p": "1-888-496-4252",
    "p2": "",
    "c": [
      "Miscellaneous Counseling & Assistance",
      "Senior Services"
    ],
    "h": "Mon-Fri",
    "d": "Helps elderly and underserved access SNAP, Medicare, Medicaid, and other benefits.",
    "s": 2,
    "w": "https://benefitsinaction.org",
    "a": "",
    "t": [
      "snap",
      "medicare",
      "medicaid",
      "benefits",
      "apply"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Envision: You (LGBTQ behavioral health)",
    "p": "303-214-2119",
    "p2": "",
    "c": [
      "Miscellaneous Counseling & Assistance",
      "Mental Health"
    ],
    "h": "Mon-Fri",
    "d": "Behavioral health support and resources for LGBTQ+ Coloradans.",
    "s": 3,
    "w": "https://envision-you.org",
    "a": "",
    "t": [
      "lgbtq",
      "mental health",
      "behavioral"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Inside Out Youth Services (LGBTQ+)",
    "p": "719-328-1056",
    "p2": "",
    "c": [
      "Miscellaneous Counseling & Assistance",
      "Crisis Services"
    ],
    "h": "Mon-Fri drop-in",
    "d": "Drop-in space, support groups, advocacy for LGBTQ+ youth ages 13-24.",
    "s": 3,
    "w": "https://insideoutys.org",
    "a": "343 N Tejon St",
    "t": [
      "lgbtq",
      "youth",
      "teen",
      "drop in"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Servicios de la Raza",
    "p": "303-458-5851",
    "p2": "",
    "c": [
      "Miscellaneous Counseling & Assistance"
    ],
    "h": "Mon-Fri",
    "d": "Latine cultural services — counseling, victim advocacy, financial wellness.",
    "s": 2,
    "w": "https://serviciosdelaraza.org",
    "a": "",
    "t": [
      "latino",
      "spanish",
      "counseling",
      "family"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "LEAP (Low-Income Energy Assistance)",
    "p": "1-866-432-8435",
    "p2": "",
    "c": [
      "Weatherization & Utilities",
      "Financial Assistance"
    ],
    "h": "Apply Nov 1 - Apr 30",
    "d": "Helps pay heating bills for low-income households during winter.",
    "s": 1,
    "w": "https://cdhs.colorado.gov/leap",
    "a": "",
    "t": [
      "leap",
      "heat",
      "utility",
      "winter",
      "apply",
      "gas",
      "electric"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Energy Resource Center",
    "p": "719-591-0772",
    "p2": "",
    "c": [
      "Weatherization & Utilities"
    ],
    "h": "Mon-Fri",
    "d": "Free home weatherization and furnace repair for low-income homeowners and renters.",
    "s": 1,
    "w": "https://erc-co.org",
    "a": "",
    "t": [
      "weatherization",
      "furnace",
      "insulation",
      "free"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Brothers Redevelopment",
    "p": "719-888-9134",
    "p2": "",
    "c": [
      "Weatherization & Utilities",
      "Shelter & Housing"
    ],
    "h": "Mon-Fri",
    "d": "Home repair, weatherization, and housing counseling.",
    "s": 1,
    "w": "https://brothersredevelopment.org",
    "a": "",
    "t": [
      "home repair",
      "weatherization",
      "housing counseling"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Project COPE",
    "p": "719-448-4800",
    "p2": "",
    "c": [
      "Weatherization & Utilities"
    ],
    "h": "Mon-Fri",
    "d": "Utility bill assistance.",
    "s": 2,
    "w": "https://projectcope.com",
    "a": "",
    "t": [
      "utility",
      "bill",
      "help"
    ],
    "v": true,
    "tf": false
  },
  {
    "n": "Red Cross",
    "p": "719-632-3563",
    "p2": "",
    "c": [
      "Weatherization & Utilities",
      "Emergency Services"
    ],
    "h": "24/7 disaster response",
    "d": "Emergency disaster assistance — fires, floods, displacement.",
    "s": 4,
    "w": "https://redcross.org",
    "a": "",
    "t": [
      "disaster",
      "fire",
      "flood",
      "emergency"
    ],
    "v": true,
    "tf": true
  }
];

export const NEED_CHIPS: string[] = ["I'm hungry","place to sleep tonight","help with rent","mental health crisis","domestic violence","job training","addiction help","veteran benefits"];

export const CAT_COLOR: Record<string,string> = {
  "Emergency Services": "#ff8c8c",
  "Crisis Services": "#ff8c8c",
  "Mental Health": "#b6a4ff",
  "Substance Use": "#c98cff",
  "Domestic Violence Services": "#ff8cc6",
  "Food": "#8fe0b4",
  "Shelter & Housing": "#ffb46b",
  "Weatherization & Utilities": "#ffd36b",
  "Financial Assistance": "#c8a84b",
  "Medical": "#3fd0c9",
  "Clothing & Hygiene": "#8ec6ff",
  "Parenting & Pregnancy": "#ffb4d8",
  "Child Care Information": "#ffc4a3",
  "Senior Services": "#bdb39d",
  "Disability Resources": "#7fb5ff",
  "Veterans Services": "#8fe0b4",
  "Employment & Training": "#9ec9ff",
  "Legal Information & Advice": "#b6a4ff",
  "Justice Involved Services": "#c0b0ff",
  "Transportation": "#3fd0c9",
  "Miscellaneous Counseling & Assistance": "#cbb89a"
};

export const SYNONYMS: Record<string,string[]> = {
  "hungry": [
    "food",
    "meal",
    "pantry",
    "starving",
    "eat",
    "feed",
    "kids hungry"
  ],
  "food": [
    "hungry",
    "meal",
    "pantry",
    "groceries",
    "eat"
  ],
  "sleep": [
    "shelter",
    "homeless",
    "bed",
    "tonight",
    "place to stay",
    "kicked out",
    "no home"
  ],
  "shelter": [
    "sleep",
    "homeless",
    "bed",
    "tonight",
    "place to stay"
  ],
  "homeless": [
    "shelter",
    "sleep",
    "bed",
    "tonight",
    "unhoused"
  ],
  "abused": [
    "domestic violence",
    "beaten",
    "hit",
    "scared of partner",
    "unsafe at home",
    "abusive",
    "hurt",
    "being hurt",
    "violence"
  ],
  "abuse": [
    "domestic violence",
    "beaten",
    "hit",
    "abusive",
    "hurt"
  ],
  "domestic violence": [
    "abused",
    "beaten",
    "hit",
    "abusive",
    "scared of partner",
    "hurt",
    "being hurt at home"
  ],
  "hit": [
    "domestic violence",
    "abused",
    "beaten",
    "violence",
    "hurt"
  ],
  "hurt": [
    "domestic violence",
    "abused",
    "beaten",
    "violence",
    "hit",
    "abuse"
  ],
  "being hurt": [
    "domestic violence",
    "abused",
    "abuse",
    "hit"
  ],
  "hurt at home": [
    "domestic violence",
    "abused",
    "abuse",
    "hit"
  ],
  "rape": [
    "sexual assault",
    "abused",
    "domestic violence"
  ],
  "violence": [
    "domestic violence",
    "abused",
    "abuse",
    "hit"
  ],
  "suicide": [
    "kill myself",
    "want to die",
    "crisis",
    "mental health",
    "hopeless"
  ],
  "kill myself": [
    "suicide",
    "want to die",
    "crisis",
    "hopeless"
  ],
  "crisis": [
    "suicide",
    "mental health",
    "emergency",
    "panic",
    "breakdown"
  ],
  "mental health": [
    "therapy",
    "counseling",
    "crisis",
    "suicide",
    "psychiatrist",
    "depressed",
    "anxious"
  ],
  "depressed": [
    "mental health",
    "therapy",
    "counseling",
    "sad"
  ],
  "anxious": [
    "mental health",
    "therapy",
    "counseling",
    "panic"
  ],
  "drugs": [
    "addiction",
    "detox",
    "withdrawal",
    "substance",
    "heroin",
    "fentanyl",
    "using",
    "opioid",
    "opiate",
    "clinic",
    "methadone",
    "suboxone"
  ],
  "addiction": [
    "drugs",
    "detox",
    "alcohol",
    "recovery",
    "substance",
    "opioid",
    "opiate",
    "clinic",
    "rehab",
    "sober",
    "narcotics",
    "methadone",
    "suboxone",
    "mat"
  ],
  "opioid": [
    "drugs",
    "addiction",
    "substance",
    "opiate",
    "heroin",
    "fentanyl",
    "detox",
    "clinic",
    "methadone",
    "suboxone",
    "mat",
    "overdose",
    "narcan"
  ],
  "substance": [
    "drugs",
    "addiction",
    "alcohol",
    "detox",
    "recovery",
    "opioid",
    "opiate",
    "clinic",
    "rehab",
    "sober"
  ],
  "substance abuse": [
    "drugs",
    "addiction",
    "substance",
    "detox",
    "recovery",
    "opioid",
    "clinic",
    "rehab",
    "sober"
  ],
  "drinking": [
    "alcohol",
    "aa",
    "addiction",
    "sober"
  ],
  "alcohol": [
    "drinking",
    "aa",
    "addiction",
    "detox",
    "sober"
  ],
  "rent": [
    "financial",
    "utility",
    "mortgage",
    "help",
    "emergency",
    "eviction"
  ],
  "eviction": [
    "rent",
    "financial",
    "housing",
    "emergency",
    "legal"
  ],
  "utility": [
    "heat",
    "gas",
    "electric",
    "leap",
    "weatherization",
    "bill"
  ],
  "heat": [
    "utility",
    "gas",
    "leap",
    "winter",
    "weatherization"
  ],
  "veteran": [
    "va",
    "military",
    "benefits",
    "ptsd"
  ],
  "vet": [
    "veteran",
    "va",
    "military"
  ],
  "military": [
    "veteran",
    "va",
    "ptsd",
    "family"
  ],
  "kids": [
    "child",
    "children",
    "family",
    "parenting",
    "teen",
    "youth"
  ],
  "child": [
    "kids",
    "children",
    "family",
    "parenting",
    "teen"
  ],
  "daycare": [
    "child care",
    "preschool",
    "kids"
  ],
  "job": [
    "work",
    "career",
    "employment",
    "training",
    "unemployed",
    "resume"
  ],
  "work": [
    "job",
    "career",
    "employment",
    "unemployed"
  ],
  "training": [
    "job",
    "career",
    "employment",
    "education"
  ],
  "elderly": [
    "senior",
    "aging",
    "old",
    "caregiver",
    "grandma",
    "grandpa",
    "grandparent"
  ],
  "senior": [
    "elderly",
    "aging",
    "old",
    "caregiver",
    "grandma",
    "grandpa",
    "grandparent",
    "60+",
    "55+"
  ],
  "old": [
    "senior",
    "elderly",
    "aging",
    "grandma",
    "grandpa"
  ],
  "grandma": [
    "senior",
    "elderly",
    "aging",
    "caregiver",
    "grandparent"
  ],
  "grandpa": [
    "senior",
    "elderly",
    "aging",
    "caregiver",
    "grandparent"
  ],
  "grandparent": [
    "senior",
    "elderly",
    "aging",
    "caregiver"
  ],
  "mom": [
    "mother",
    "parent",
    "family",
    "kids"
  ],
  "dad": [
    "father",
    "parent",
    "family",
    "kids"
  ],
  "disabled": [
    "disability",
    "wheelchair",
    "deaf",
    "blind",
    "developmental"
  ],
  "disability": [
    "disabled",
    "wheelchair",
    "deaf",
    "blind",
    "developmental"
  ],
  "deaf": [
    "disability",
    "hearing",
    "asl",
    "sign language"
  ],
  "blind": [
    "disability",
    "vision"
  ],
  "lgbtq": [
    "gay",
    "lesbian",
    "trans",
    "queer",
    "bi",
    "gender"
  ],
  "gay": [
    "lgbtq",
    "queer",
    "lesbian"
  ],
  "trans": [
    "transgender",
    "lgbtq",
    "gender",
    "queer"
  ],
  "doctor": [
    "clinic",
    "medical",
    "health",
    "sick",
    "medicine"
  ],
  "sick": [
    "doctor",
    "clinic",
    "medical",
    "health"
  ],
  "medicine": [
    "doctor",
    "clinic",
    "medical",
    "prescription"
  ],
  "lawyer": [
    "legal",
    "court",
    "rights",
    "attorney",
    "free legal"
  ],
  "court": [
    "legal",
    "lawyer",
    "rights",
    "custody",
    "divorce"
  ],
  "divorce": [
    "family law",
    "custody",
    "court",
    "legal",
    "family court",
    "parenting plan"
  ],
  "custody": [
    "divorce",
    "family law",
    "court",
    "legal",
    "child support",
    "parenting plan"
  ],
  "pregnant": [
    "pregnancy",
    "baby",
    "prenatal",
    "wic"
  ],
  "baby": [
    "pregnant",
    "pregnancy",
    "wic",
    "newborn",
    "kids"
  ],
  "immigration": [
    "refugee",
    "green card",
    "citizenship",
    "daca",
    "asylum",
    "spanish",
    "latino"
  ],
  "spanish": [
    "latino",
    "immigration",
    "refugee"
  ],
  "felon": [
    "reentry",
    "prison",
    "incarceration",
    "jail"
  ],
  "prison": [
    "reentry",
    "incarceration",
    "felon",
    "jail",
    "corrections"
  ],
  "reentry": [
    "prison",
    "felon",
    "incarceration",
    "jail"
  ]
};

export const ALL_CATEGORIES: string[] = (() => {
  const s = new Set<string>();
  for (const r of RESOURCES) for (const c of r.c) s.add(c);
  return [...s].sort();
})();

// Convert a free-text query to a set of matching tokens via SYNONYMS.
// Special-cases substance/drug/alcohol "abuse" so the generic "abuse"
// expansion (which goes to domestic violence) does not dominate.
export function expandQuery(q: string): Set<string> {
  let lower = q.toLowerCase().trim();
  if (!lower) return new Set();
  const substanceAbuse = /\b(substance|drug|drugs|alcohol)\s+abuse\b/.test(lower);
  if (substanceAbuse) {
    lower = lower.replace(/\b(substance|drug|drugs|alcohol)\s+abuse\b/g, "substance addiction");
  }
  const tokens = new Set<string>();
  lower.split(/[^a-z0-9']+/).filter(w => w.length > 2).forEach(w => tokens.add(w));
  tokens.add(lower);
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (substanceAbuse && key === "abuse") continue;
    if (lower.includes(key)) {
      tokens.add(key);
      for (const s of syns) tokens.add(s);
    }
    for (const s of syns) {
      if (lower.includes(s)) {
        tokens.add(s);
        tokens.add(key);
      }
    }
  }
  return tokens;
}

export function scoreMatch(r: Resource, tokens: Set<string>): number {
  if (tokens.size === 0) return 0;
  let tagHits = 0;
  let hayHits = 0;
  const haystack = " " + (r.n + " " + r.d + " " + r.c.join(" ")).toLowerCase() + " ";
  for (const tok of tokens) {
    if ((r.t || []).includes(tok)) {
      tagHits++;
    } else {
      const safe = tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp("\\b" + safe + "\\b", "i");
      if (re.test(haystack)) hayHits++;
    }
  }
  // Tag hits are editor-curated intent — weigh heavily. Multiple incidental
  // body hits also qualify; a single unscoped body hit does not.
  if (tagHits === 0 && hayHits < 2) return 0;
  return tagHits * 5 + hayHits * 2 + r.s * 0.3;
}

export function dotString(s: number): string {
  return "\u25cf".repeat(s) + "\u25cb".repeat(5 - s);
}
