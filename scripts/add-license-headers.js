/**
 * Copyright 2025 Kunal Suri — Licensed under the Apache License 2.0 (see LICENSE file)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// License header to add
const licenseHeader = `/**
 * Copyright 2025 Kunal Suri — Licensed under the Apache License 2.0 (see LICENSE file)
 */

`;

// Get all TypeScript and JavaScript files
const output = execSync(
  'find /Users/ks248120/Documents/GitHub/saas-ai-chatbot -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v "node_modules" | grep -v "dist"',
  { encoding: 'utf-8' }
);

const files = output.trim().split('\n');
const updatedFiles = [];
const skippedFiles = [];

files.forEach(filePath => {
  try {
    // Skip the script itself
    if (filePath.endsWith('add-license-headers.js')) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if file already has the license header
    if (content.includes('Copyright 2025 Kunal Suri')) {
      skippedFiles.push(filePath);
      return;
    }
    
    // Add license header
    const updatedContent = licenseHeader + content;
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    updatedFiles.push(filePath);
    
    console.log(`Updated: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log('\nSummary:');
console.log(`Updated ${updatedFiles.length} files`);
console.log(`Skipped ${skippedFiles.length} files (already had license header)`);
