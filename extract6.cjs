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
      if (obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('OrganisationPage.vue') && obj.content.includes('The following code has been modified') && obj.content.includes('Total Bytes: 12461')) {
          let output = obj.content;
          for (let l of output.split('\n')) {
              let match = l.match(/^(\d+):\s(.*)/);
              if (match) {
                  originalLinesMap[match[1]] = match[2];
              }
          }
      }
    } catch (e) {
    }
  }

  let finalLines = [];
  let maxLine = Math.max(...Object.keys(originalLinesMap).map(Number));
  for (let i = 1; i <= maxLine; i++) {
      if (originalLinesMap[i] !== undefined) {
          finalLines.push(originalLinesMap[i]);
      } else {
          finalLines.push('// MISSING LINE ' + i);
      }
  }

  fs.writeFileSync('extracted_original.vue', finalLines.join('\n'), 'utf8');
  console.log('FOUND and WRITTEN, max lines:', maxLine);
}

extractOriginal();
