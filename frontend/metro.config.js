const { getDefaultConfig } = require('expo/metro-config');
const { ensureSellerService } = require('./scripts/seller-service.cjs');

module.exports = async () => {
  // Exports and other config reads must not start a development server.
  if (process.argv.includes('start') && process.env.AGENTMART_SELLER_MANAGED !== '1') {
    await ensureSellerService();
  }
  return getDefaultConfig(__dirname);
};
