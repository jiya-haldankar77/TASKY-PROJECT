const fs = require('fs');
const readline = require('readline');

async function extractOriginal() {
  const fileStream = fs.createReadStream('C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\dd490804-87a7-43f6-b8a0-7c8b3129ceac\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let originalLinesMap = {};

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'VIEW_FILE' && obj.content) {
          // Check if this VIEW_FILE is actually for OrganisationPage.vue
          if (obj.content.includes('File Path: `file:///c:/Users/HP/Desktop/Noval/Projects/TASKY-PROJECT-admin%20copy/src/pages/OrganisationPage.vue`')) {
              let output = obj.content;
              for (let l of output.split('\n')) {
                  let match = l.match(/^(\d+):\s(.*)/);
                  if (match) {
                      originalLinesMap[match[1]] = match[2];
                  }
              }
          }
      }
    } catch (e) {
    }
  }

  let finalLines = [];
  let maxLine = Math.max(...Object.keys(originalLinesMap).map(Number));
  if (maxLine > 0) {
      for (let i = 1; i <= maxLine; i++) {
          finalLines.push(originalLinesMap[i] !== undefined ? originalLinesMap[i] : '');
      }
      fs.writeFileSync('src/pages/OrganisationPage.vue', finalLines.join('\n'), 'utf8');
      console.log('SUCCESS! maxLine:', maxLine);
  } else {
      console.log('FAILED');
  }
}

extractOriginal();
