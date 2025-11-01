const fs = require('fs');
const path = require('path');

const terserPath = path.join(process.cwd(), 'node_modules', 'terser-webpack-plugin');
const distPath = path.join(terserPath, 'dist', 'index.js');

console.log('Checking terser-webpack-plugin installation...');
console.log('Package path:', terserPath);
console.log('Dist path:', distPath);

if (!fs.existsSync(terserPath)) {
  console.error('ERROR: terser-webpack-plugin package not found at:', terserPath);
  process.exit(1);
}

// Check what's actually in the package
const packageContents = fs.readdirSync(terserPath);
console.log('Package contents:', packageContents.join(', '));

if (fs.existsSync(distPath)) {
  console.log('✓ terser-webpack-plugin dist/index.js exists');
} else {
  console.error('ERROR: terser-webpack-plugin dist/index.js is missing!');
  console.error('This should not happen - the dist files should be in the published npm package.');
  console.error('Please check:');
  console.error('  1. npm install completed successfully');
  console.error('  2. No errors during installation');
  console.error('  3. Package structure is correct');
  
  // Check if dist folder exists but file is missing
  const distFolder = path.join(terserPath, 'dist');
  if (fs.existsSync(distFolder)) {
    console.error('Dist folder exists but index.js is missing. Contents:', fs.readdirSync(distFolder));
  } else {
    console.error('Dist folder does not exist');
  }
  
  process.exit(1);
}

