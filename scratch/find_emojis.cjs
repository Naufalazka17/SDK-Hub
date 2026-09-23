const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Comprehensive emoji regex matching symbols & pictographs
  const emojiRegex = /[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/u;

  const results = [];
  lines.forEach((line, index) => {
    if (emojiRegex.test(line)) {
      const emojis = line.match(new RegExp(emojiRegex, 'gu')) || [];
      results.push({
        line: index + 1,
        emojis: [...new Set(emojis)].join(' '),
        text: line.trim().substring(0, 100)
      });
    }
  });

  console.log(`[${path.basename(filePath)}] Found ${results.length} lines with emojis.`);
  results.forEach(r => {
    console.log(`  Line ${r.line} [${r.emojis}]: ${r.text}`);
  });
  return results.length;
}

const genCount = checkFile(path.join(__dirname, 'generate-manual.cjs'));
const htmlCount = checkFile(path.join(__dirname, '..', 'docs', 'user-manual.html'));

if (genCount === 0 && htmlCount === 0) {
  console.log('SUCCESS: All files are 100% clean of emojis!');
} else {
  console.error('FAILURE: Emojis still present!');
  process.exit(1);
}
