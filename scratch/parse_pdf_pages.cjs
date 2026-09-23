const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const pdfPath = path.join(__dirname, 'test-out.pdf');
const buf = fs.readFileSync(pdfPath);
const str = buf.toString('latin1');

// Match each page object from "N 0 obj" to "endobj"
const pageObjRegex = /(\d+)\s+0\s+obj\s*<<\s*\/Type\s*\/Page\b([\s\S]*?)endobj/g;
let m;
const pages = [];
while ((m = pageObjRegex.exec(str)) !== null) {
  const objId = parseInt(m[1], 10);
  const body = m[2];
  const contentsMatch = body.match(/\/Contents\s+(\d+)\s+0\s+R/);
  const contentsArrayMatch = body.match(/\/Contents\s*\[([^\]]+)\]/);
  let cIds = [];
  if (contentsMatch) {
    cIds.push(parseInt(contentsMatch[1], 10));
  } else if (contentsArrayMatch) {
    cIds = contentsArrayMatch[1].match(/\d+/g).map(Number);
  }
  pages.push({ pageNum: pages.length + 1, objId, cIds });
}

console.log(`Found ${pages.length} pages in PDF.`);

const targets = [
  { key: 'pendahuluan', query: '1. Pendahuluan' },
  { key: 'roles', query: '2. Daftar Role' },
  { key: 'getting-started', query: '3. Panduan Memulai' },
  { key: 'admin', query: '4. Panduan Lengkap' },
  { key: 'project-lead', query: '5. Panduan Project Lead' },
  { key: 'staff', query: '6. Panduan Staff Engineer' },
  { key: 'client', query: '7. Panduan Pengguna Klien' },
  { key: 'flow', query: '8. Alur Kerja Terpadu' },
  { key: 'faq', query: '9. Pertanyaan yang Sering' },
  { key: 'troubleshooting', query: '10. Panduan Troubleshooting' },
  { key: 'contact', query: '11. Kontak & Dukungan' }
];

const results = {};

for (const p of pages) {
  let contentBufs = [];
  for (const cid of p.cIds) {
    const objHeader = `${cid} 0 obj`;
    const objPos = str.indexOf(objHeader);
    if (objPos !== -1) {
      const streamPos = str.indexOf('stream', objPos);
      if (streamPos !== -1) {
        let start = streamPos + 6;
        if (buf[start] === 0x0d && buf[start+1] === 0x0a) start += 2;
        else if (buf[start] === 0x0a) start += 1;
        const endPos = str.indexOf('endstream', start);
        if (endPos !== -1) {
          const streamData = buf.slice(start, endPos);
          try {
            const decompressed = zlib.inflateSync(streamData);
            contentBufs.push(decompressed.toString('latin1'));
          } catch(e) {
            contentBufs.push(streamData.toString('latin1'));
          }
        }
      }
    }
  }

  const pageText = contentBufs.join(' ');
  // Check targets
  for (const t of targets) {
    if (!results[t.key]) {
      const words = t.query.split(' ');
      const matchAll = words.every(w => pageText.includes(w));
      if (matchAll) {
        results[t.key] = p.pageNum;
      }
    }
  }
}

console.log('Detected Chapter Page Numbers:');
console.log(JSON.stringify(results, null, 2));
