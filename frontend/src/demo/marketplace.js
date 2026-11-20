function loadMarketDemo() {
  let d;
  try {
    d = JSON.parse(localStorage.getItem('market_demo400'));
  } catch (e) {}
  if (!d) {
    const ps = DEMOS.map((p, i) => ({
      ...p,
      id: 'dp' + i,
      published: i < 3,
      version: 1,
      views: 0,
      insights: i === 1 ? {
        projectName: 'Demo Garden Residences',
        builder: 'Demo Builder',
        constructionStatus: 'Resale / ready',
        areaBasis: 'Super built-up',
        carpetArea: 1100,
        superArea: 1450,
        baths: 3,
        balconies: 2,
        floor: 4,
        totalFloors: 10,
        age: 5,
        parking: 2,
        lifts: 2,
        maintenance: 3000,
        uds: 35,
        rera: 'DEMO-RERA-0000',
        oc: 'Not supplied',
        cc: 'Not supplied',
        water: 'Seller claim: supply available',
        power: 'Seller claim: backup',
        amenities: ['Lift', 'Security', 'Play area']
      } : {
        lengthM: 18,
        widthM: 12,
        roadStatus: 'Seller claim: formed road',
        water: 'Not independently checked',
        power: 'Not independently checked',
        drainage: 'Not supplied',
        landUse: 'Seller claim: residential',
        boundary: 'Site survey pending'
      }
    }));
    d = {
      properties: ps,
      requests: [],
      saved: [],
      profile: {}
    };
    localStorage.setItem('market_demo400', JSON.stringify(d));
  }
  return d;
}
let marketDemo = loadMarketDemo();
function saveMarketDemo() {
  localStorage.setItem('market_demo400', JSON.stringify(marketDemo));
}
