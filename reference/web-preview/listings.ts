export type BuyerListing = {
  id: string;
  title: string;
  type: string;
  purpose: 'Sale' | 'Rent';
  price: number;
  area: number;
  unit: string;
  city: string;
  locality: string;
  facing: string;
  bedrooms?: number;
  description: string;
  highlights: string[];
};

// Fictional catalogue for UI preview. Never reads private seller workspace data.
export const listings: BuyerListing[] = [
  { id: 'buyer-sample-1', title: 'A fresh start in Thullur', type: 'Plot', purpose: 'Sale', price: 7200000, area: 267, unit: 'sq yd', city: 'Amaravati', locality: 'Thullur', facing: 'East', description: 'Imagine a home shaped around your life. This fictional residential plot illustrates the space and location information available in a buyer listing.', highlights: ['Residential plot', '12 m approach road', 'East facing'] },
  { id: 'buyer-sample-2', title: 'Room for your next chapter', type: 'Apartment', purpose: 'Sale', price: 8500000, area: 1450, unit: 'sq ft', city: 'Vijayawada', locality: 'Tadepalli', facing: 'North', bedrooms: 3, description: 'A fictional three-bedroom apartment with space for slow mornings, family dinners and everything in between.', highlights: ['3 bedrooms', 'Fourth floor', '2 parking spaces'] },
  { id: 'buyer-sample-3', title: 'A place to settle into', type: 'House', purpose: 'Rent', price: 28000, area: 1800, unit: 'sq ft', city: 'Guntur', locality: 'Mangalagiri', facing: 'West', bedrooms: 3, description: 'Explore this sample independent home, designed to show how a rental listing looks in your buyer workspace.', highlights: ['3 bedrooms', 'Independent house', 'Monthly rent'] },
  { id: 'buyer-sample-4', title: 'Space for your big idea', type: 'Commercial', purpose: 'Sale', price: 14500000, area: 2200, unit: 'sq ft', city: 'Vijayawada', locality: 'Benz Circle', facing: 'North', description: 'A fictional commercial space for imagining your next business address. Suitability and permissions require independent review.', highlights: ['Commercial space', 'City location', 'North facing'] },
  { id: 'buyer-sample-5', title: 'A little closer to nature', type: 'Farm land', purpose: 'Sale', price: 4800000, area: 1.5, unit: 'acre', city: 'Guntur', locality: 'Tadikonda', facing: 'East', description: 'Open skies and room to dream. This fictional agricultural listing demonstrates the farm land browsing experience.', highlights: ['Agricultural land', '1.5 acre parcel', 'Rural setting'] },
  { id: 'buyer-sample-6', title: 'Your own quiet corner', type: 'Apartment', purpose: 'Rent', price: 18000, area: 1100, unit: 'sq ft', city: 'Amaravati', locality: 'Rayapudi', facing: 'South', bedrooms: 2, description: 'A fictional two-bedroom rental for exploring a simpler everyday routine. All details are illustrative.', highlights: ['2 bedrooms', 'Monthly rent', 'South facing'] },
];
