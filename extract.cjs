const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('scratch_utf8.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      // We want to find the view_file tool output for OrganisationPage.vue
      if (obj.content && obj.content.includes('OrganisationPage.vue') && obj.content.includes('Total Lines')) {
        console.log('Found it!');
        fs.writeFileSync('extracted_original.txt', obj.content, 'utf8');
        return;
      }
    } catch (e) {
    }
  }
}

processLineByLine();
