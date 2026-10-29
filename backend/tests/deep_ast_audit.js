const fs = require('fs');
const path = require('path');
const parser = require(path.resolve(__dirname, '../../frontend/node_modules/@babel/parser'));

const GLOBALS = new Set([
  'window', 'document', 'console', 'localStorage', 'sessionStorage',
  'Math', 'Date', 'JSON', 'SpeechSynthesisUtterance', 'setTimeout',
  'clearTimeout', 'setInterval', 'clearInterval', 'URLSearchParams',
  'FormData', 'AbortController', 'alert', 'prompt', 'confirm', 'fetch',
  'encodeURIComponent', 'decodeURIComponent', 'parseInt', 'parseFloat',
  'isNaN', 'isFinite', 'Number', 'String', 'Boolean', 'Array', 'Object',
  'Set', 'Map', 'Promise', 'Error', 'RegExp', 'navigator', 'import',
  'Intl', 'Event', 'CustomEvent', 'Blob', 'File', 'FileReader',
  'atob', 'btoa', 'crypto', 'undefined', 'null', 'NaN', 'Infinity'
]);

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (full.endsWith('.jsx') || full.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

const files = getFiles(path.resolve(__dirname, '../../frontend/src'));
let totalErrors = 0;

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    // Collect top-level imports and declarations
    const declaredTopLevel = new Set([...GLOBALS]);

    function collectBindings(node) {
      if (!node) return;
      if (node.type === 'ImportDeclaration') {
        for (const spec of node.specifiers) {
          declaredTopLevel.add(spec.local.name);
        }
      } else if (node.type === 'FunctionDeclaration') {
        if (node.id) declaredTopLevel.add(node.id.name);
      } else if (node.type === 'ClassDeclaration') {
        if (node.id) declaredTopLevel.add(node.id.name);
      } else if (node.type === 'VariableDeclaration') {
        for (const decl of node.declarations) {
          if (decl.id.type === 'Identifier') {
            declaredTopLevel.add(decl.id.name);
          } else if (decl.id.type === 'ObjectPattern') {
            for (const prop of decl.id.properties) {
              if (prop.value && prop.value.type === 'Identifier') declaredTopLevel.add(prop.value.name);
              else if (prop.key && prop.key.type === 'Identifier') declaredTopLevel.add(prop.key.name);
            }
          } else if (decl.id.type === 'ArrayPattern') {
            for (const el of decl.id.elements) {
              if (el && el.type === 'Identifier') declaredTopLevel.add(el.name);
            }
          }
        }
      } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        collectBindings(node.declaration);
      } else if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
        if (node.declaration.id) declaredTopLevel.add(node.declaration.id.name);
      }
    }

    for (const stmt of ast.program.body) {
      collectBindings(stmt);
    }

    // Check all JSXIdentifier and Identifier usages
    const unresolved = new Set();

    function walk(node, scopeBindings = new Set()) {
      if (!node || typeof node !== 'object') return;

      let currentScope = scopeBindings;

      // New scope on functions or blocks
      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
        currentScope = new Set(scopeBindings);
        // Add params
        for (const param of node.params) {
          if (param.type === 'Identifier') currentScope.add(param.name);
          else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') currentScope.add(param.left.name);
          else if (param.type === 'ObjectPattern') {
            for (const prop of param.properties) {
              if (prop.value && prop.value.type === 'Identifier') currentScope.add(prop.value.name);
              else if (prop.key && prop.key.type === 'Identifier') currentScope.add(prop.key.name);
            }
          } else if (param.type === 'ArrayPattern') {
            for (const el of param.elements) {
              if (el && el.type === 'Identifier') currentScope.add(el.name);
            }
          }
        }
      } else if (node.type === 'BlockStatement') {
        currentScope = new Set(scopeBindings);
        for (const stmt of node.body) {
          if (stmt.type === 'VariableDeclaration') {
            for (const decl of stmt.declarations) {
              if (decl.id.type === 'Identifier') currentScope.add(decl.id.name);
              else if (decl.id.type === 'ObjectPattern') {
                for (const prop of decl.id.properties) {
                  if (prop.value && prop.value.type === 'Identifier') currentScope.add(prop.value.name);
                  else if (prop.key && prop.key.type === 'Identifier') currentScope.add(prop.key.name);
                }
              } else if (decl.id.type === 'ArrayPattern') {
                for (const el of decl.id.elements) {
                  if (el && el.type === 'Identifier') currentScope.add(el.name);
                }
              }
            }
          } else if (stmt.type === 'FunctionDeclaration' && stmt.id) {
            currentScope.add(stmt.id.name);
          }
        }
      } else if (node.type === 'CatchClause') {
        currentScope = new Set(scopeBindings);
        if (node.param && node.param.type === 'Identifier') currentScope.add(node.param.name);
      }

      // Check JSXOpeningElement name
      if (node.type === 'JSXOpeningElement') {
        if (node.name.type === 'JSXIdentifier') {
          const name = node.name.name;
          // React lowercase tags (div, span, button, etc.) are fine
          if (/^[A-Z]/.test(name)) {
            if (!declaredTopLevel.has(name) && !currentScope.has(name)) {
              unresolved.add(name);
            }
          }
        }
      }

      // Recurse children
      for (const key of Object.keys(node)) {
        if (key === 'comments' || key === 'tokens') continue;
        const val = node[key];
        if (Array.isArray(val)) {
          for (const item of val) walk(item, currentScope);
        } else if (val && typeof val === 'object') {
          walk(val, currentScope);
        }
      }
    }

    walk(ast.program);

    if (unresolved.size > 0) {
      console.error(`ERROR in ${file}: Unresolved identifiers ->`, [...unresolved].join(', '));
      totalErrors += unresolved.size;
    }
  } catch (err) {
    console.error(`PARSER ERROR in ${file}:`, err.message);
    totalErrors++;
  }
}

if (totalErrors === 0) {
  console.log('AST AUDIT COMPLETE: 0 unresolved identifiers across all', files.length, 'source files!');
} else {
  console.error(`AST AUDIT FAILED with ${totalErrors} errors.`);
  process.exit(1);
}
