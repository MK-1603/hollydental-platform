/**
 * fix-consoles.mjs — Replaces remaining multi-line console.error + res.status(500)
 * patterns in route files with next(err).
 * Run: node scripts/fix-consoles.mjs
 */
import fs from "fs";

// Regex: console.error(...); on one line,
// then optional whitespace + (return)? res\n.status(5xx)\n.json({...});
const pattern = /console\.error\([^;]+\);\s*\n(\s*)(return\s+)?res\s*\n(\s*)\.status\(5\d\d\)\s*\n(\s*)\.json\(\{[^}]+\}\s*\)\s*;/g;
const singleLine = /console\.error\([^;]+\);\s*\n(\s*)(return\s+)?res\.status\(5\d\d\)\.json\(\{[^}]+\}\)\s*;/g;

const files = [
  "src/routes/admin.js",
  "src/routes/ai.js",
  "src/routes/analytics.js",
  "src/routes/appointments.js",
  "src/routes/auth.js",
  "src/routes/blog.js",
  "src/routes/files.js",
  "src/routes/patients.js",
  "src/routes/prescriptions.js",
];

let grand = 0;
for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const before = content;
  
  // Replace multi-line chained pattern
  content = content.replace(pattern, (m, i1) => `${i1}next(error);`);
  // Replace single-line pattern
  content = content.replace(singleLine, (m, i1) => `${i1}next(error);`);
  
  if (content !== before) {
    fs.writeFileSync(file, content);
    // Count replacements roughly
    const count = (before.match(/console\.error/g) || []).length 
                - (content.match(/console\.error/g) || []).length;
    console.log(`  ✔ ${file}  (${count} fixed)`);
    grand += count;
  } else {
    console.log(`  · ${file}  (no match)`);
  }
}
console.log(`\nTotal: ${grand} console.error blocks replaced`);
