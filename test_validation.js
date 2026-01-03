const { ProfileManager } = require('./out/ProfileManager');
const fs = require('fs');

// Create a simple mock
const mockReadFile = (data) => {
  fs.promises.readFile = () => Promise.resolve(JSON.stringify(data));
};

const mockAccess = () => {
  fs.promises.access = () => Promise.resolve();
};

async function testValidation() {
  const profileManager = new ProfileManager('/test/global', '/test/project');
  mockAccess();
  
  // Test missing name
  console.log('Testing missing name validation...');
  mockReadFile({ skills: [], agentTemplates: [], autoActivate: {} });
  try {
    await profileManager.resolveActiveProfile('test');
    console.log('❌ ERROR: Should have failed for missing name');
  } catch (e) {
    console.log('✅ Correctly caught missing name:', e.message);
  }
  
  // Test missing skills
  console.log('Testing missing skills validation...');
  mockReadFile({ name: 'test', agentTemplates: [], autoActivate: {} });
  try {
    await profileManager.resolveActiveProfile('test');
    console.log('❌ ERROR: Should have failed for missing skills');
  } catch (e) {
    console.log('✅ Correctly caught missing skills:', e.message);
  }
  
  // Test invalid skills type
  console.log('Testing invalid skills type validation...');
  mockReadFile({ name: 'test', skills: 'not-array', agentTemplates: [], autoActivate: {} });
  try {
    await profileManager.resolveActiveProfile('test');
    console.log('❌ ERROR: Should have failed for invalid skills type');
  } catch (e) {
    console.log('✅ Correctly caught invalid skills type:', e.message);
  }
  
  // Test valid profile
  console.log('Testing valid profile...');
  mockReadFile({ 
    name: 'test', 
    description: 'Test profile',
    skills: ['skill1'], 
    agentTemplates: ['template1'], 
    codingStandards: [],
    autoActivate: { filePatterns: [], dependencies: [], keywords: [] }
  });
  try {
    const result = await profileManager.resolveActiveProfile('test');
    console.log('✅ Valid profile loaded successfully:', result.name);
  } catch (e) {
    console.log('❌ ERROR: Valid profile should have loaded:', e.message);
  }
}

testValidation().catch(console.error);