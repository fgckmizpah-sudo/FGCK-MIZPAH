const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'routes');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
for (const file of files) {
  const filePath = path.join(dir, file);
  let text = fs.readFileSync(filePath, 'utf8');
  const original = text;

  // Convert route handlers to async arrow functions
  text = text.replace(/(router\.(get|post|put|delete)\([^,]+,\s*)\(req,\s*res\)\s*=>/g, '$1async (req, res) =>');
  text = text.replace(/(router\.(get|post|put|delete)\([^,]+,\s*)function\s*\(req,\s*res\)/g, '$1async function (req, res)');

  // Convert auth route handlers with middleware where necessary
  text = text.replace(/(router\.(post|get|put|delete)\([^,]+,\s*authMiddleware,\s*)\(req,\s*res\)\s*=>/g, '$1async (req, res) =>');
  text = text.replace(/(router\.(post|get|put|delete)\([^,]+,\s*authMiddleware,\s*)function\s*\(req,\s*res\)/g, '$1async function (req, res)');

  // Await database functions
  text = text.replace(/\bconst\s+data\s*=\s*readData\(\)\s*;/g, 'const data = await readData();');
  text = text.replace(/\bdata\s*=\s*readData\(\)\s*;/g, 'data = await readData();');
  text = text.replace(/\bwriteData\(data\)\s*;/g, 'await writeData(data);');

  if (text !== original) {
    fs.writeFileSync(filePath, text, 'utf8');
    console.log(`Patched ${file}`);
  }
}
