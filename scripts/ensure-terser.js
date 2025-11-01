const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const terserPath = path.join(process.cwd(), 'node_modules', 'terser-webpack-plugin');
const distPath = path.join(terserPath, 'dist', 'index.js');

if (!fs.existsSync(distPath)) {
  console.log('⚠ terser-webpack-plugin dist/index.js is missing, attempting to build...');
  console.log('Path checked:', distPath);
  
  if (!fs.existsSync(terserPath)) {
    console.error('ERROR: terser-webpack-plugin package not found!');
    process.exit(1);
  }
  
  // Try to build the package
  try {
    process.chdir(terserPath);
    console.log('Installing dependencies for terser-webpack-plugin...');
    execSync('npm install --ignore-scripts', { stdio: 'inherit' });
    console.log('Building terser-webpack-plugin...');
    execSync('npm run build:code', { stdio: 'inherit' });
    process.chdir(process.cwd());
    
    // Check again
    if (fs.existsSync(distPath)) {
      console.log('✓ Successfully built terser-webpack-plugin');
    } else {
      throw new Error('Build completed but dist/index.js still missing');
    }
  } catch (error) {
    console.error('ERROR: Failed to build terser-webpack-plugin:', error.message);
    process.exit(1);
  }
} else {
  console.log('✓ terser-webpack-plugin dist/index.js exists');
}

