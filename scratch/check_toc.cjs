const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'generate-manual.cjs'), 'utf8');
const matches = [...content.matchAll(/<a href="#([^"]+)"><span>([^<]+)<\/span>\s*<span class="page-num">([^<]+)<\/span><\/a>/g)];
console.log('TOC Chapter Entries:');
matches.forEach(m => console.log(`${m[1]} -> ${m[2]} : [${m[3]}]`));
