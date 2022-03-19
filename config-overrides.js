module.exports = function(config, env) {
  config.module.rules.push({
    test: /\.md$/i,
    type: 'asset/source',
    exclude: /node_modules/,
  });

  return config;
}
