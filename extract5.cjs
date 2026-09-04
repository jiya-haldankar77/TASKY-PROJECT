const fs = require('fs');
const readline = require('readline');

async function extractOriginal() {
  const fileStream = fs.createReadStream('C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\dd490804-87a7-43f6-b8a0-7c8b3129ceac\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('OrganisationPage.vue') && obj.content.includes('The following code has been modified')) {
          let output = obj.content;
          let originalLines = [];
          for (let l of output.split('\n')) {
              let match = l.match(/^\d+:\s?(.*)/);
              if (match) {
                  originalLines.push(match[1]);
              }
          }
          if (originalLines.length > 50) {
              fs.writeFileSync('extracted_original.vue', originalLines.join('\n'), 'utf8');
              console.log('FOUND and WRITTEN, lines:', originalLines.length);
              return;
          }
      }
    } catch (e) {
    }
  }
}

extractOriginal();
