const fs = require('fs');
const readline = require('readline');

async function extractOriginal() {
  const fileStream = fs.createReadStream('C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\dd490804-87a7-43f6-b8a0-7c8b3129ceac\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let originalLinesMap = {};
  let found = false;

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('Total Bytes: 12461') && obj.content.indexOf('File Path: `file:///c:/Users/HP/Desktop/Noval/Projects/TASKY-PROJECT-admin%20copy/src/pages/OrganisationPage.vue`') < 150 && obj.content.indexOf('File Path: `file:///c:/Users/HP/Desktop/Noval/Projects/TASKY-PROJECT-admin%20copy/src/pages/OrganisationPage.vue`') > -1) {
          let output = obj.content;
          for (let l of output.split('\n')) {
              let match = l.match(/^(\d+):\s(.*)/);
              if (match) {
                  originalLinesMap[match[1]] = match[2];
              }
          }
          found = true;
          // IMPORTANT: DO NOT break immediately because we might have multiple chunks (lines 1-200, 200-364) for the SAME file!
          // But we don't want to process scratch_utf8.jsonl. We can check if obj.content contains 'scratch_utf8.jsonl'.
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
