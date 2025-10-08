import fs from 'fs';
import path from 'path';

const distDir = './dist/assets';
const backendUrl = 'http://localhost:3001';

// Read all JS files in the dist/assets directory
const files = fs.readdirSync(distDir).filter(file => file.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(distDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace relative API URLs with absolute URLs
  content = content.replace(/(['"`])\/api\//g, `$1${backendUrl}/api/`);
  
  // Write the modified content back
  fs.writeFileSync(filePath, content);
  console.log(`Patched ${file}`);
});

console.log('API URLs patched successfully!');