const fs = require('fs');
const schema = fs.readFileSync('src/db/schema.js', 'utf8');
const lines = schema.split('\n');
const exportsSeen = new Set();
const cleanLines = [];
let skipMode = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('export const ')) {
    const exportName = line.split(' ')[2];
    if (exportsSeen.has(exportName)) {
      skipMode = true;
      continue;
    } else {
      exportsSeen.add(exportName);
      skipMode = false;
    }
  }
  if (!skipMode) {
    cleanLines.push(line);
  } else {
    if (line === '});' || line === '}));') {
      skipMode = false; // end of skipped block
    }
  }
}

fs.writeFileSync('src/db/schema.js', cleanLines.join('\n'));
