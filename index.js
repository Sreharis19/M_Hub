// eslint-disable-next-line no-global-assign
require = require('esm')(module);
require('dotenv').config();
module.exports = require('./src/index.js');
