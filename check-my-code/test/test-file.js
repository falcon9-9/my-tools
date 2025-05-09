
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
