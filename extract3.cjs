const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\dd490804-87a7-43f6-b8a0-7c8b3129ceac\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      // Let's find TOOL_RESPONSE with OrganisationPage.vue
      if (obj.tool_responses) {
        for (const res of obj.tool_responses) {
           if (res.name === 'view_file' || res.name === 'default_api:view_file' || res.name === 'read_file') {
               if (res.response && res.response.output && res.response.output.includes('OrganisationPage.vue') && res.response.output.includes('Total Lines')) {
                   console.log('FOUND');
                   fs.writeFileSync('extracted_original.txt', res.response.output, 'utf8');
                   return;
               }
           }
        }
      }
    } catch (e) {
    }
  }
}

processLineByLine();
