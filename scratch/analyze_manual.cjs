const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'generate-manual.cjs');
const content = fs.readFileSync(filePath, 'utf8');

const sections = content.split(/<h1/i);
sections.slice(1).forEach((sec, i) => {
  const titleMatch = sec.match(/^[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Unknown';
  const h2s = (sec.match(/<h2[^>]*>(.*?)<\/h2>/gi) || []).map(h => h.replace(/<[^>]+>/g, '').trim());
  console.log(`--- CHAPTER ${i + 1}: ${title}`);
  console.log(`    H2 count: ${h2s.length}`);
  h2s.forEach(h => console.log(`      - ${h}`));
});
