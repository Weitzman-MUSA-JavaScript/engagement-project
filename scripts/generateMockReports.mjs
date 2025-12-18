import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'data');
const PUBLIC_OUTPUT_DIR = join(__dirname, '..', 'public', 'data');
const OUTPUT_FILE = join(OUTPUT_DIR, 'mockReports.json');
const PUBLIC_OUTPUT_FILE = join(PUBLIC_OUTPUT_DIR, 'mockReports.json');
const REPORT_COUNT = 150;

const addresses = [
  {
    address: '1417 W Girard Ave',
    neighborhood: 'Francisville',
    councilDistrict: 'District 5',
    coordinates: [-75.1612, 39.9726],
  },
  {
    address: '2230 N 16th St',
    neighborhood: 'Sharswood',
    councilDistrict: 'District 5',
    coordinates: [-75.157, 39.9892],
  },
  {
    address: '501 W Norris St',
    neighborhood: 'Ludlow',
    councilDistrict: 'District 7',
    coordinates: [-75.1407, 39.9814],
  },
  {
    address: '722 Tasker St',
    neighborhood: 'Passyunk Square',
    councilDistrict: 'District 1',
    coordinates: [-75.1575, 39.9298],
  },
  {
    address: '1816 Dickinson St',
    neighborhood: 'Point Breeze',
    councilDistrict: 'District 2',
    coordinates: [-75.1756, 39.9344],
  },
  {
    address: '3131 Kensington Ave',
    neighborhood: 'Kensington',
    councilDistrict: 'District 7',
    coordinates: [-75.1209, 39.9928],
  },
  {
    address: '4824 Germantown Ave',
    neighborhood: 'Germantown',
    councilDistrict: 'District 8',
    coordinates: [-75.1688, 40.0242],
  },
  {
    address: '5522 Woodland Ave',
    neighborhood: 'Kingsessing',
    councilDistrict: 'District 3',
    coordinates: [-75.2259, 39.9313],
  },
  {
    address: '901 N 63rd St',
    neighborhood: 'Overbrook',
    councilDistrict: 'District 4',
    coordinates: [-75.2524, 39.973],
  },
  {
    address: '1120 N American St',
    neighborhood: 'Northern Liberties',
    councilDistrict: 'District 7',
    coordinates: [-75.1418, 39.9674],
  },
  {
    address: '1813 N 6th St',
    neighborhood: 'West Kensington',
    councilDistrict: 'District 7',
    coordinates: [-75.1391, 39.9788],
  },
  {
    address: '2024 N 53rd St',
    neighborhood: 'Wynnefield',
    councilDistrict: 'District 4',
    coordinates: [-75.2316, 39.9957],
  },
  {
    address: '600 W Rockland St',
    neighborhood: 'Feltonville',
    councilDistrict: 'District 7',
    coordinates: [-75.1297, 40.0239],
  },
  {
    address: '3901 N 5th St',
    neighborhood: 'Hunting Park',
    councilDistrict: 'District 7',
    coordinates: [-75.1399, 40.0127],
  },
  {
    address: '4108 Lancaster Ave',
    neighborhood: 'Belmont',
    councilDistrict: 'District 3',
    coordinates: [-75.2108, 39.9655],
  },
  {
    address: '2100 S 9th St',
    neighborhood: 'Bella Vista',
    councilDistrict: 'District 1',
    coordinates: [-75.1615, 39.9237],
  },
  {
    address: '6234 Market St',
    neighborhood: 'Cobbs Creek',
    councilDistrict: 'District 3',
    coordinates: [-75.244, 39.9626],
  },
  {
    address: '1430 W Allegheny Ave',
    neighborhood: 'Tioga',
    councilDistrict: 'District 5',
    coordinates: [-75.1572, 40.0061],
  },
  {
    address: '1900 E Tioga St',
    neighborhood: 'Port Richmond',
    councilDistrict: 'District 1',
    coordinates: [-75.1023, 39.9879],
  },
  {
    address: '2701 W Lehigh Ave',
    neighborhood: 'Strawberry Mansion',
    councilDistrict: 'District 5',
    coordinates: [-75.1773, 39.9977],
  },
];

const priorityLevels = [
  {
    level: 'low',
    topics: ['zoning'],
    caseTypes: ['Exterior maintenance'],
  },
  {
    level: 'medium',
    topics: ['exterior maintenance', 'sidewalk issue', 'overgrown weeds'],
    caseTypes: ['Exterior maintenance', 'Nuisance property'],
  },
  {
    level: 'high',
    topics: ['nuisance property', 'neglected vacant lot'],
    caseTypes: ['Nuisance property', 'Public safety'],
  },
  {
    level: 'urgent',
    topics: [
      'threat to public safety',
      'unsecured vacant building',
      'plumbing/electric issues',
      'heating/cooling issues',
      'structural problem',
      'mold',
      'pests',
      'infestation',
    ],
    caseTypes: ['Public safety', 'Structural issue'],
  },
];

const caseStatuses = [
  'unread',
  'under review',
  'urgent',
  'referred',
  'in progress',
  'closed',
  'needs follow up',
];

const agencies = [
  'Licenses & Inspections',
  'Philadelphia Department of Public Health',
  'Philadelphia Water Department',
  'Philadelphia Housing Authority',
  'PECO Emergency Line',
  'PGW Emergency Response',
  'Neighborhood Services Unit',
];

const noteSnippets = [
  'Neighbors reported worsening conditions after rainfall.',
  'Photos uploaded by tenant captain via hotline submission.',
  'Requesting legal triage to prep notice of violation.',
  'Block captain ready to canvass residents this weekend.',
  'Needs translator for follow-up conversation with residents.',
  'Resident shared that seniors on site need heaters delivered.',
  'Coordinating with mutual aid partner for temporary repairs.',
  'Awaiting contractor quote; will update once scheduled.',
  'Escalated to safety committee for additional monitoring.',
  'Community group offering weekend clean-up support.',
];

const contactNames = [
  'D. Alvarez',
  'K. Martin',
  'R. Nguyen',
  'S. Patel',
  'M. Robinson',
  'L. Carter',
  'E. Thompson',
  'G. Jenkins',
  'A. Santiago',
  'C. Lee',
];

const domains = ['mutualaid.org', 'neighborsunited.org', 'tenantsolidarity.net'];

const BASE_DATE = new Date('2025-10-30T12:00:00Z');

const reports = Array.from({ length: REPORT_COUNT }, (_, idx) =>
  createReport(idx),
);

const dataset = {
  generatedAt: new Date().toISOString(),
  count: reports.length,
  reports,
};

await mkdir(OUTPUT_DIR, { recursive: true });
await mkdir(PUBLIC_OUTPUT_DIR, { recursive: true });
await writeFile(OUTPUT_FILE, JSON.stringify(dataset, null, 2));
await writeFile(PUBLIC_OUTPUT_FILE, JSON.stringify(dataset, null, 2));
console.log(`Mock dataset written to ${OUTPUT_FILE} and ${PUBLIC_OUTPUT_FILE}`);

function createReport(index) {
  const location = pickRandom(addresses);
  const priority = pickRandom(priorityLevels);
  const caseLevelTopic = pickRandom(priority.topics);
  const createdAt = randomDateWithin(90);
  const lastEngaged = new Date(
    Math.min(
      createdAt.getTime() + randomInt(12, 240) * 60 * 60 * 1000,
      BASE_DATE.getTime(),
    ),
  );
  const status = pickRandom(caseStatuses);
  const contactedAnotherAgency = Math.random() < 0.35;
  const notes = Math.random() < 0.6 ? pickRandom(noteSnippets) : '';
  const haveContactInfo = Math.random() < 0.4;
  const contactName = haveContactInfo ? pickRandom(contactNames) : '';

  return {
    id: `R-${10000 + index}`,
    caseNumber: generateCaseNumber(),
    createdAt: createdAt.toISOString(),
    lastEngaged: lastEngaged.toISOString(),
    location,
    caseType:
      pickRandom(priority.caseTypes) ??
      pickRandom(['Exterior maintenance', 'Structural issue', 'Nuisance property', 'Public safety']),
    casePriority: {
      level: priority.level,
      focus: caseLevelTopic,
    },
    notes,
    contactedAnotherAgency,
    contactedAgency: contactedAnotherAgency ? pickRandom(agencies) : '',
    optionalContact: haveContactInfo
      ? {
          name: contactName,
          email: `${contactName.toLowerCase().replace(/\s/g, '')}@${pickRandom(
            domains,
          )}`,
          phone: formatPhone(randomInt(2152000000, 2679999999)),
        }
      : null,
    status,
    unread: status === 'unread',
  };
}

function generateCaseNumber() {
  return Math.floor(10000 + Math.random() * 90000);
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateWithin(daysBack) {
  const offset = Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(BASE_DATE.getTime() - offset);
}

function formatPhone(num) {
  const digits = num.toString();
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
