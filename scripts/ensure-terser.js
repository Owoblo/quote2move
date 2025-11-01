const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const terserPath = path.join(process.cwd(), 'node_modules', 'terser-webpack-plugin');
const distPath = path.join(terserPath, 'dist', 'index.js');

console.log('Checking terser-webpack-plugin installation...');

if (!fs.existsSync(terserPath)) {
  console.error('ERROR: terser-webpack-plugin package not found!');
  process.exit(1);
}

if (fs.existsSync(distPath)) {
  console.log('✓ terser-webpack-plugin dist/index.js exists');
  process.exit(0);
}

console.log('⚠ dist folder missing, extracting from npm tarball...');

// Try to extract from tarball
try {
  const tempDir = path.join(process.cwd(), '.temp-terser');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  
  console.log('Downloading package tarball...');
  execSync(`npm pack terser-webpack-plugin@5.3.14`, { 
    cwd: tempDir, 
    stdio: 'pipe' 
  });
  
  const tarball = fs.readdirSync(tempDir).find(f => f.endsWith('.tgz'));
  if (!tarball) {
    throw new Error('Failed to download tarball');
  }
  
  console.log('Extracting dist folder from tarball...');
  execSync(`tar -xzf ${tarball} package/dist`, { 
    cwd: tempDir,
    stdio: 'pipe'
  });
  
  const extractedDist = path.join(tempDir, 'package', 'dist');
  if (fs.existsSync(extractedDist)) {
    const targetDist = path.join(terserPath, 'dist');
        fs.mkdirSync(targetDist, { recursive: true });
        const files = fs.readdirSync(extractedDist);
        files.forEach(file => {
          const src = path.join(extractedDist, file);
          const dest = path.join(targetDist, file);
          if (fs.statSync(src).isDirectory()) {
            fs.cpSync(src, dest, { recursive: true });
          } else {
            fs.copyFileSync(src, dest);
          }
        });
    
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    if (fs.existsSync(distPath)) {
      console.log('✓ Successfully extracted dist folder');
      process.exit(0);
    }
  }
  
  throw new Error('Extraction completed but dist/index.js still missing');
} catch (error) {
  console.error('ERROR: Failed to extract dist files:', error.message);
  console.error('Package contents:', fs.readdirSync(terserPath).join(', '));
  process.exit(1);
}

