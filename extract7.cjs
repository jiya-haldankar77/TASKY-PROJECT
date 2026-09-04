const fs = require('fs');

function extract() {
  const text = fs.readFileSync('scratch_utf8.jsonl', 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split('\n');
  let orgLines = {};

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('OrganisationPage.vue') && obj.content.includes('Total Bytes: 12461')) {
          const parts = obj.content.split('\n');
          for (let p of parts) {
              let m = p.match(/^(\d+):\s(.*)/);
              if (m) {
                  orgLines[m[1]] = m[2];
              }
          }
      }
    } catch(e) {}
  }

  let finalLines = [];
  let maxLine = Math.max(...Object.keys(orgLines).map(Number));
  if (maxLine > 0) {
      for (let i = 1; i <= maxLine; i++) {
          finalLines.push(orgLines[i] !== undefined ? orgLines[i] : '');
      }
      fs.writeFileSync('src/pages/OrganisationPage.vue', finalLines.join('\n'), 'utf8');
      console.log('SUCCESS! Lines:', finalLines.length);
  } else {
      console.log('FAILED to find lines');
  }
}

extract();
