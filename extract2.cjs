const fs = require('fs');
const text = fs.readFileSync('scratch_utf8.jsonl', 'utf8').replace(/^\uFEFF/, '');
const lines = text.split('\n');
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.tool_responses) {
      for (const res of obj.tool_responses) {
         if (res.name === 'view_file' || res.name === 'default_api:view_file') {
             if (res.response && res.response.output && res.response.output.includes('OrganisationPage.vue') && res.response.output.includes('Total Lines')) {
                 fs.writeFileSync('extracted_original.txt', res.response.output, 'utf8');
                 console.log('FOUND');
                 return;
             }
         }
      }
    }
  } catch(e) {}
}
