const fs = require('fs');
const package = require('./luckysheet/package.json');
package.name = 'luckysheet-nightly';
package.version = package.version + '-' + new Date().toISOString().replace(/T.*/, '').replace(/-/g, '')
fs.writeFileSync('package.json', JSON.stringify(package, undefined, 2), 'utf8')
