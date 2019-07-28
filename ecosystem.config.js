module.exports = {
  apps: [{
    name: 'botmaker',
    script: './botmaker.js',
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    },
  }],
};
