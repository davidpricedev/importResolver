jest.dontMock('../config');
const realConfig = require('../config');

module.exports = {
  defaultConfig: realConfig.defaultConfig,
  getConfig: () => realConfig.defaultConfig,
};
