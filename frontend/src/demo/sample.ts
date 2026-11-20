// Fictional sample data so every native screen renders without a backend.
export type Property = {
  id: string; title: string; type: string; purpose: 'Sale' | 'Rent'; city: string; village: string;
  price: number; area: number; unit: string; facing: string; road: number; bhk?: number;
  published: boolean; views: number; description: string;
};
export type Enquiry = { id: string; propertyId: string; buyer: string; seller: string; message: string; status: 'Pending' | 'Accepted' | 'Declined'; date: string };
export type Visit = { id: string; propertyId: string; who: string; date: string; time: string; status: 'Requested' | 'Confirmed' | 'Completed' };
export type Message = { id: string; threadId: string; from: 'me' | 'them'; text: string; time: string };
export type Lead = { id: string; name: string; phone: string; interest: string; stage: 'New' | 'Contacted' | 'Visit' | 'Closed'; branch: string };
export type Staff = { id: string; name: string; role: string; branch: string; phone: string };
export type Branch = { id: string; name: string; city: string; staff: number };

export const PROPERTIES: Property[] = [
  { id: 'dp0', title: 'Demo Corner Plot', type: 'Plot', purpose: 'Sale', city: 'Vijayawada', village: 'Gannavaram', price: 4500000, area: 200, unit: 'sq yd', facing: 'East', road: 12, published: true, views: 42, description: 'Corner plot near the main road. Seller-stated details.' },
  { id: 'dp1', title: 'Demo Garden Residences 3BHK', type: 'Apartment', purpose: 'Sale', city: 'Guntur', village: 'Brodipet', price: 6200000, area: 1450, unit: 'sq ft', facing: 'North', road: 9, bhk: 3, published: true, views: 31, description: 'Fourth-floor flat in a gated community.' },
  { id: 'dp2', title: 'Demo Farm Land', type: 'Farm land', purpose: 'Sale', city: 'Amaravati', village: 'Thullur', price: 9800000, area: 2, unit: 'acre', facing: 'West', road: 6, published: false, views: 0, description: 'Two acres with borewell access (seller claim).' },
  { id: 'dp3', title: 'Demo Independent House', type: 'House', purpose: 'Rent', city: 'Vijayawada', village: 'Benz Circle', price: 22000, area: 1800, unit: 'sq ft', facing: 'South', road: 10, bhk: 3, published: true, views: 18, description: 'Independent house for family rent.' },
];
export const ENQUIRIES: Enquiry[] = [
  { id: 'e1', propertyId: 'dp0', buyer: 'Demo Buyer A', seller: 'Demo Realty', message: 'Please share documents and a site visit slot.', status: 'Pending', date: '2026-11-10' },
  { id: 'e2', propertyId: 'dp1', buyer: 'Demo Buyer B', seller: 'Demo Realty', message: 'Is the price negotiable?', status: 'Accepted', date: '2026-11-08' },
];
export const VISITS: Visit[] = [
  { id: 'v1', propertyId: 'dp0', who: 'Demo Buyer A', date: '2026-11-20', time: '11:00', status: 'Requested' },
  { id: 'v2', propertyId: 'dp1', who: 'Demo Buyer B', date: '2026-11-18', time: '16:30', status: 'Confirmed' },
];
export const MESSAGES: Message[] = [
  { id: 'm1', threadId: 't1', from: 'them', text: 'Hello, is the plot still available?', time: '10:02' },
  { id: 'm2', threadId: 't1', from: 'me', text: 'Yes, it is. Would you like to visit?', time: '10:05' },
];
export const LEADS: Lead[] = [
  { id: 'l1', name: 'Demo Lead One', phone: '9000000001', interest: 'Plot, Vijayawada', stage: 'New', branch: 'Main' },
  { id: 'l2', name: 'Demo Lead Two', phone: '9000000002', interest: '3BHK flat', stage: 'Contacted', branch: 'Main' },
  { id: 'l3', name: 'Demo Lead Three', phone: '9000000003', interest: 'Farm land', stage: 'Visit', branch: 'Guntur' },
];
export const STAFF: Staff[] = [
  { id: 's1', name: 'Demo Manager', role: 'Manager', branch: 'Main', phone: '9100000001' },
  { id: 's2', name: 'Demo Agent', role: 'Agent', branch: 'Guntur', phone: '9100000002' },
];
export const BRANCHES: Branch[] = [
  { id: 'b1', name: 'Main', city: 'Vijayawada', staff: 4 },
  { id: 'b2', name: 'Guntur', city: 'Guntur', staff: 2 },
];
export const findProperty = (id?: string | string[]) => PROPERTIES.find(p => p.id === (Array.isArray(id) ? id[0] : id));
