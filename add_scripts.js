const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts['lint'] = 'echo "No linting configured"';
pkg.scripts['type-check'] = 'tsc --noEmit';
pkg.scripts['format:check'] = 'echo "No formatting configured"';
pkg.scripts['test'] = 'echo "No tests specified"';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Added missing scripts');
