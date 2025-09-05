const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

if (isTest) {
  module.exports = {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }]
    ]
  };
} else {
  module.exports = {
    presets: [
      '@vue/cli-plugin-babel/preset'
    ],
    plugins: [
      '@babel/plugin-transform-class-static-block'
    ]
  };
}
