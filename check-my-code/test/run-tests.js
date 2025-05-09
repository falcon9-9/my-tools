const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');
const plugin = require('../src/index');

console.log('Running test for check-my-code plugin...');

// Create a test file with comments
const TEST_FILE = path.join(__dirname, 'test-file.js');
const TEST_CODE = `
/**
 * Test file with various comment types
 * @check-my-code test Test the entire file
 */

// Simple function
function add(a, b) {
  // @check-my-code 222233 Ensure correct addition
  // @check-my-code check Ensure correct addition2
  return a + b;
}

// Another function
function multiply(a, b) {
  // @check-my-code remove Remove console.log
  console.log('Multiplying', a, b);
  return a * b;
}

// Export
module.exports = {
  add,
  multiply
};
`;

// Write the test file
try {
  console.log('Attempting to write file to:', TEST_FILE);
  console.log('Current directory:', __dirname);
  fs.writeFileSync(TEST_FILE, TEST_CODE);
  
  // Verify file was created
  if (fs.existsSync(TEST_FILE)) {
    console.log(`Successfully created test file at: ${TEST_FILE}`);
  } else {
    console.error('File was not created despite no errors');
  }
} catch (error) {
  console.error('Error writing test file:', error);
  process.exit(1);
}

// Run Babel with the plugin
console.log('\nRunning Babel transformation...');

try {
  const result = babel.transformSync(TEST_CODE, {
    plugins: [[plugin]],
    filename: TEST_FILE,
    babelrc: false,
    configFile: false,
  });
  
  
  
} catch (error) {
  console.error('Error during transformation:', error);
  
  // Clean up
  if (fs.existsSync(TEST_FILE)) {
    fs.unlinkSync(TEST_FILE);
  }
} 