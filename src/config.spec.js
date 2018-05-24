const { getConfig, defaultConfig } = require('./config');
const { merge } = require('ramda');

describe('config', () => {
  it('Will return default config when no file is provided', () => {
    const expected = merge(defaultConfig(), { dryRun: false });
    expect(getConfig([])).toEqual(expected);
  });
});
