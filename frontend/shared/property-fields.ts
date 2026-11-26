// Shared public, seller-supplied facts used by listing forms and Buyer details.
// Private notes, contact details, documents and checklist statuses are excluded.
export const propertyDetailLabels: Record<string, string> = {
  projectName: 'Project name', builder: 'Builder / developer', constructionStatus: 'Construction / possession stage', possessionDate: 'Seller-stated possession date',
  areaBasis: 'Area basis', carpetArea: 'Carpet area (sq ft)', builtUpArea: 'Built-up area (sq ft)', superArea: 'Super built-up area (sq ft)',
  baths: 'Bathrooms', balconies: 'Balconies', floor: 'Floor number', totalFloors: 'Total floors', age: 'Building age (years)', parking: 'Parking spaces', lifts: 'Lifts', maintenance: 'Monthly maintenance (INR)', uds: 'Undivided land share (sq yd)',
  rera: 'RERA reference', oc: 'Occupancy certificate availability', cc: 'Completion certificate availability',
  lengthM: 'Plot length (m)', widthM: 'Plot width (m)', roadStatus: 'Road condition', water: 'Water supply', power: 'Power / backup', drainage: 'Drainage', landUse: 'Seller-stated land use', boundary: 'Boundary / survey status', expectedRent: 'Seller-quoted monthly rent (INR)',
  furnishing: 'Furnishing', ownership: 'Ownership type', soil: 'Soil type', irrigation: 'Irrigation', cultivation: 'Cultivation status', commercialType: 'Commercial use', ceilingHeight: 'Ceiling height', frontage: 'Frontage', mortgage: 'Mortgage / charges', disputes: 'Disputes',
};

export const numericPropertyDetails = new Set(['carpetArea', 'builtUpArea', 'superArea', 'baths', 'balconies', 'floor', 'totalFloors', 'age', 'parking', 'lifts', 'maintenance', 'uds', 'lengthM', 'widthM', 'expectedRent', 'ceilingHeight', 'frontage']);

export const propertyDetailGroups = [
  { title: 'Project and building', keys: ['projectName', 'builder', 'constructionStatus', 'possessionDate', 'areaBasis', 'carpetArea', 'builtUpArea', 'superArea', 'floor', 'totalFloors', 'baths', 'balconies', 'age', 'parking', 'lifts', 'maintenance', 'uds', 'furnishing'] },
  { title: 'Plot and utilities', keys: ['lengthM', 'widthM', 'landUse', 'roadStatus', 'water', 'power', 'drainage', 'boundary', 'soil', 'irrigation', 'cultivation', 'commercialType', 'ceilingHeight', 'frontage'] },
  { title: 'Seller-stated references', keys: ['rera', 'oc', 'cc', 'ownership', 'mortgage', 'disputes', 'expectedRent'] },
];

// Which detail fields make sense for each property type (the form only shows these).
const utilities = ['water', 'power', 'drainage'];
const legal = ['ownership', 'mortgage', 'disputes'];
const building = ['projectName', 'builder', 'constructionStatus', 'possessionDate', 'areaBasis', 'carpetArea', 'builtUpArea', 'superArea', 'floor', 'totalFloors', 'baths', 'age', 'parking', 'furnishing'];
export const propertyDetailKeysByType: Record<string, string[]> = {
  'Plot': ['lengthM', 'widthM', 'landUse', 'roadStatus', 'frontage', 'boundary', ...utilities, 'rera', ...legal],
  'Farm land': ['landUse', 'roadStatus', 'frontage', 'boundary', 'soil', 'irrigation', 'cultivation', 'water', 'power', ...legal],
  'Apartment': [...building, 'balconies', 'lifts', 'maintenance', 'uds', 'water', 'power', 'rera', 'oc', 'cc', ...legal],
  'House': ['projectName', 'builder', 'constructionStatus', 'possessionDate', 'carpetArea', 'builtUpArea', 'totalFloors', 'baths', 'balconies', 'age', 'parking', 'furnishing', 'lengthM', 'widthM', 'roadStatus', 'frontage', 'boundary', ...utilities, 'oc', 'cc', ...legal],
  'Commercial': [...building, 'lifts', 'maintenance', 'commercialType', 'ceilingHeight', 'frontage', 'roadStatus', ...utilities, 'rera', 'oc', 'cc', ...legal],
};
export const typesWithBedrooms = new Set(['Apartment', 'House']);

export function propertyDetailGroupsFor(type: string, purpose: string) {
  const allowed = new Set(propertyDetailKeysByType[type] || propertyDetailKeysByType['Plot']);
  if (purpose === 'Rent') allowed.add('expectedRent');
  const rename = (title: string) => title === 'Project and building' ? (type === 'Commercial' ? 'Project and space' : type === 'House' ? 'House and construction' : title) : title === 'Plot and utilities' ? (type === 'Farm land' ? 'Land and utilities' : type === 'Plot' ? title : 'Site and utilities') : title;
  return propertyDetailGroups.map(g => ({ title: rename(g.title), keys: g.keys.filter(k => allowed.has(k)) })).filter(g => g.keys.length);
}

// Details a seller must supply for each property type before the listing can be saved.
export const requiredDetailKeysByType: Record<string, string[]> = {
  'Plot': ['lengthM', 'widthM', 'landUse', 'roadStatus', 'ownership'],
  'Farm land': ['landUse', 'soil', 'irrigation', 'cultivation', 'ownership'],
  'Apartment': ['constructionStatus', 'builtUpArea', 'floor', 'totalFloors', 'baths', 'ownership'],
  'House': ['constructionStatus', 'builtUpArea', 'totalFloors', 'baths', 'ownership'],
  'Commercial': ['commercialType', 'constructionStatus', 'builtUpArea', 'floor', 'ownership'],
};
export const requiredDetailsFor = (type: string) => requiredDetailKeysByType[type] || [];

export function propertyDetailSectionsFor(type: string, purpose: string) {
  const required = requiredDetailsFor(type);
  const optional = propertyDetailGroupsFor(type, purpose).map(g => ({ ...g, keys: g.keys.filter(k => !required.includes(k)) })).filter(g => g.keys.length);
  return [{ title: `Required for ${type.toLowerCase()}`, keys: required }, ...optional.map(g => ({ ...g, title: g.title + ' (optional)' }))];
}
