const path = require('path');

require('ts-node').register({
  project: path.join(__dirname, '..', 'tsconfig.json'),
  compilerOptions: {
    module: 'CommonJS'
  }
});

require(path.join(__dirname, 'seed.ts'));
