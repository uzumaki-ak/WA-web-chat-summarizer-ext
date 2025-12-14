// copy-files.js - Add this file to your root folder
const fs = require('fs-extra');
const path = require('path');

const filesToCopy = [
  { src: 'manifest.json', dest: 'manifest.json' },
  { src: 'src/popup/popup.html', dest: 'popup.html' },
  { src: 'public/icons', dest: 'icons' },
  { src: 'public/content-style.css', dest: 'content-style.css' }
];

async function copyFiles() {
  console.log('Copying extension files...');
  
  for (const file of filesToCopy) {
    const srcPath = path.resolve(__dirname, file.src);
    const destPath = path.resolve(__dirname, 'dist', file.dest);
    
    try {
      await fs.copy(srcPath, destPath);
      console.log(`✓ Copied ${file.src} to dist/${file.dest}`);
    } catch (error) {
      console.error(`✗ Failed to copy ${file.src}:`, error.message);
    }
  }
  
  console.log('All files copied successfully!');
}

copyFiles();