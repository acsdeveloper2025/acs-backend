#!/usr/bin/env node

/**
 * Script to update all verification forms with proper image auto-save functionality
 * This script adds the necessary imports and updates handlers to use the helper functions
 */

const fs = require('fs');
const path = require('path');

// Helper function to read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// Helper function to write file content
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message);
    return false;
  }
}

// Function to update a single form file
function updateFormFile(filePath) {
  console.log(`📝 Updating ${path.basename(filePath)}...`);
  
  let content = readFile(filePath);
  if (!content) return false;

  // Skip if already updated (check for helper imports)
  if (content.includes('imageAutoSaveHelpers')) {
    console.log(`   ✅ Already updated`);
    return true;
  }

  // Add helper imports after FORM_TYPES import
  const formTypesImport = "import { FORM_TYPES } from '../../../constants/formTypes';";
  const helperImports = `import { FORM_TYPES } from '../../../constants/formTypes';
import {
  createImageChangeHandler,
  createSelfieImageChangeHandler,
  createAutoSaveImagesChangeHandler,
  combineImagesForAutoSave,
  createFormDataChangeHandler,
  createDataRestoredHandler
} from '../../../utils/imageAutoSaveHelpers';`;

  if (content.includes(formTypesImport)) {
    content = content.replace(formTypesImport, helperImports);
  }

  // Update handleFormDataChange
  const formDataChangePattern = /const handleFormDataChange = \(formData: [^)]+\) => \{[^}]+updateResidenceReport\([^}]+\};/s;
  const newFormDataChange = `const handleFormDataChange = createFormDataChangeHandler(
    updateResidenceReport,
    caseData.id,
    isReadOnly
  );`;
  
  if (formDataChangePattern.test(content)) {
    content = content.replace(formDataChangePattern, newFormDataChange);
  }

  // Update handleAutoSaveImagesChange
  const autoSaveImagesPattern = /const handleAutoSaveImagesChange = \(images: CapturedImage\[\]\) => \{[^}]+updateResidenceReport\([^}]+\};/s;
  const newAutoSaveImages = `const handleAutoSaveImagesChange = createAutoSaveImagesChangeHandler(
    updateResidenceReport,
    caseData.id,
    report,
    isReadOnly
  );`;
  
  if (autoSaveImagesPattern.test(content)) {
    content = content.replace(autoSaveImagesPattern, newAutoSaveImages);
  }

  // Update handleDataRestored
  const dataRestoredPattern = /const handleDataRestored = \(data: any\) => \{[^}]+updateResidenceReport\([^}]+\};/s;
  const newDataRestored = `const handleDataRestored = createDataRestoredHandler(
    updateResidenceReport,
    caseData.id,
    isReadOnly
  );`;
  
  if (dataRestoredPattern.test(content)) {
    content = content.replace(dataRestoredPattern, newDataRestored);
  }

  // Update handleImagesChange
  const imagesChangePattern = /const handleImagesChange = \(images: CapturedImage\[\]\) => \{[^}]+updateResidenceReport\([^}]+\};/s;
  const newImagesChange = `const handleImagesChange = createImageChangeHandler(
    updateResidenceReport,
    caseData.id,
    report,
    handleAutoSaveImagesChange
  );`;
  
  if (imagesChangePattern.test(content)) {
    content = content.replace(imagesChangePattern, newImagesChange);
  }

  // Update handleSelfieImagesChange
  const selfieImagesChangePattern = /const handleSelfieImagesChange = \(selfieImages: CapturedImage\[\]\) => \{[^}]+updateResidenceReport\([^}]+\};/s;
  const newSelfieImagesChange = `const handleSelfieImagesChange = createSelfieImageChangeHandler(
    updateResidenceReport,
    caseData.id,
    report,
    handleAutoSaveImagesChange
  );`;
  
  if (selfieImagesChangePattern.test(content)) {
    content = content.replace(selfieImagesChangePattern, newSelfieImagesChange);
  }

  // Update AutoSaveFormWrapper images prop
  const imagesArrayPattern = /images=\{\[[\s\S]*?\]\}/;
  const newImagesArray = 'images={combineImagesForAutoSave(report)}';
  
  if (imagesArrayPattern.test(content)) {
    content = content.replace(imagesArrayPattern, newImagesArray);
  } else {
    // Fallback for simple images prop
    const simpleImagesPattern = /images=\{report\?\.images \|\| \[\]\}/;
    if (simpleImagesPattern.test(content)) {
      content = content.replace(simpleImagesPattern, newImagesArray);
    }
  }

  return writeFile(filePath, content);
}

// Function to find all form files
function findFormFiles() {
  const formDirs = [
    'components/forms/residence',
    'components/forms/office', 
    'components/forms/business',
    'components/forms/builder',
    'components/forms/residence-cum-office',
    'components/forms/noc',
    'components/forms/dsa-dst-connector',
    'components/forms/property-apf',
    'components/forms/property-individual'
  ];

  const formFiles = [];
  
  formDirs.forEach(dir => {
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (file.endsWith('.tsx') && !file.includes('index')) {
          formFiles.push(path.join(dir, file));
        }
      });
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }
  });

  return formFiles;
}

// Main execution
console.log('🔧 Starting image auto-save functionality update...');

const formFiles = findFormFiles();
console.log(`📋 Found ${formFiles.length} form files to update`);

let successCount = 0;
let errorCount = 0;

formFiles.forEach(filePath => {
  if (updateFormFile(filePath)) {
    successCount++;
  } else {
    errorCount++;
  }
});

console.log('\n📊 Update Summary:');
console.log(`✅ Successfully updated: ${successCount} files`);
console.log(`❌ Failed to update: ${errorCount} files`);
console.log(`📱 Total forms processed: ${formFiles.length}`);

if (successCount > 0) {
  console.log('\n🎉 Image auto-save functionality has been updated!');
  console.log('🔧 All updated forms now properly trigger auto-save when images are captured');
  console.log('📱 Images will be saved to application\'s local database with proper metadata');
}
