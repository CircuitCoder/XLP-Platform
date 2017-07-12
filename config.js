const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const doc = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, './config.yml')));
module.exports = doc;
