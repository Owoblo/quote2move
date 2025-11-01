const fs = require('fs');
const path = require('path');

const terserPath = path.join(process.cwd(), 'node_modules', 'terser-webpack-plugin');
const distPath = path.join(terserPath, 'dist', 'index.js');

if (!fs.existsSync(distPath)) {
  console.error('ERROR: terser-webpack-plugin dist/index.js is missing!');
  console.error('Path checked:', distPath);
  console.error('Package exists:', fs.existsSync(terserPath));
  if (fs.existsSync(terserPath)) {
    console.error('Contents:', fs.readdirSync(terserPath));
  }
  process.exit(1);
}

console.log('✓ terser-webpack-plugin dist/index.js exists');

