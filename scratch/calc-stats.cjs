const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');
const htmlFile = path.join(docsDir, 'user-manual.html');
const readmeFile = path.join(docsDir, 'README.md');
const changelogFile = path.join(docsDir, 'CHANGELOG.md');
const pdfFile = path.join(docsDir, 'SDK-Orchestration-Hub-User-Manual-v2.5.pdf');
const screenshotsDir = path.join(docsDir, 'screenshots');

const htmlSize = (fs.statSync(htmlFile).size / 1024).toFixed(1);
const readmeSize = (fs.statSync(readmeFile).size / 1024).toFixed(1);
const changelogSize = (fs.statSync(changelogFile).size / 1024).toFixed(1);
const pdfSize = (fs.statSync(pdfFile).size / (1024 * 1024)).toFixed(2);

const screenshots = fs.readdirSync(screenshotsDir);
let totalImgBytes = 0;
for (const s of screenshots) {
  totalImgBytes += fs.statSync(path.join(screenshotsDir, s)).size;
}
const imgMb = (totalImgBytes / (1024 * 1024)).toFixed(1);

const html = fs.readFileSync(htmlFile, 'utf8');
const h1Matches = html.match(/<h1[^>]*>.*?<\/h1>/gi) || [];
const h2Matches = html.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
const h3Matches = html.match(/<h3[^>]*>.*?<\/h3>/gi) || [];
const stepsMatches = html.match(/<ol class=["']steps["']/gi) || [];
const screenshotMatches = html.match(/<div class=["']screenshot/gi) || [];

console.log(JSON.stringify({
  htmlSizeKb: `${htmlSize} KB`,
  readmeSizeKb: `${readmeSize} KB`,
  changelogSizeKb: `${changelogSize} KB`,
  pdfSizeMb: `${pdfSize} MB`,
  totalScreenshotsCount: screenshots.length,
  screenshotsDirSizeMb: `${imgMb} MB`,
  totalH1: h1Matches.length,
  totalH2: h2Matches.length,
  totalH3: h3Matches.length,
  totalSections: h1Matches.length + h2Matches.length,
  totalStepWorkflows: stepsMatches.length,
  embeddedScreenshotsInHtml: screenshotMatches.length
}, null, 2));
