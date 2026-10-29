const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all import statements
  const allImportsMatch = [...content.matchAll(/import\s+(?:\{([^}]+)\}|([A-Za-z0-9_]+)|\*\s+as\s+([A-Za-z0-9_]+))\s+from/g)];
  let importedNames = [];
  for (const m of allImportsMatch) {
    if (m[1]) {
      m[1].split(',').forEach(s => {
        const parts = s.trim().split(/\s+as\s+/);
        const name = parts[parts.length - 1].trim();
        if (name) importedNames.push(name);
      });
    } else if (m[2]) {
      importedNames.push(m[2].trim());
    } else if (m[3]) {
      importedNames.push(m[3].trim());
    }
  }

  // Find declared functions/classes/constants
  const declared = [...content.matchAll(/(?:const|let|var|function|class)\s+([A-Za-z0-9_]+)/g)].map(m => m[1]);

  // Built-in or dynamic
  const known = new Set([
    ...importedNames,
    ...declared,
    'React',
    'Fragment',
    'Icon',
    'Component',
    'BadgeIcon',
  ]);

  // Find all JSX tags: <Tag or <Tag.Sub
  const jsxTags = [...content.matchAll(/<([A-Z][a-zA-Z0-9_]*)/g)].map(m => m[1]);
  const uniqueTags = [...new Set(jsxTags)];

  const missing = uniqueTags.filter(tag => !known.has(tag));
  if (missing.length > 0) {
    console.error('ERROR in', filePath, '-> Missing:', missing.join(', '));
    return missing.length;
  }
  return 0;
}

function scanDir(dir) {
  let errors = 0;
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      errors += scanDir(p);
    } else if (p.endsWith('.jsx')) {
      errors += checkFile(p);
    }
  }
  return errors;
}

console.log('Verifying all JSX components across frontend/src...');
const totalErrors = scanDir('./carbonkatha/frontend/src');
if (totalErrors === 0) {
  console.log('SUCCESS: All JSX tags in all files are properly imported and declared!');
} else {
  console.error(`FAILED: Found ${totalErrors} missing tags.`);
  process.exit(1);
}
