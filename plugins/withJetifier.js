const { withGradleProperties } = require('@expo/config-plugins');

module.exports = (config) =>
  withGradleProperties(config, (config) => {
    const exists = config.modResults.some(
      (item) => item.key === 'android.enableJetifier'
    );
    if (!exists) {
      config.modResults.push({
        type: 'property',
        key: 'android.enableJetifier',
        value: 'true',
      });
    }
    return config;
  });
