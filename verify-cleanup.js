// Simple test runner for our webview cleanup verification
const fs = require('fs');
const path = require('path');

console.log('=== RUNNING WEBVIEW CLEANUP VERIFICATION TEST ===');
console.log();

let testsPassed = 0;
let testsFailed = 0;

function test(name, condition) {
    if (condition) {
        console.log('✅', name);
        testsPassed++;
    } else {
        console.log('❌', name);
        testsFailed++;
    }
}

// Test: Directories should not exist after cleanup
test('webview-src directory should not exist', !fs.existsSync('webview-src'));
test('webview-dist directory should not exist', !fs.existsSync('webview-dist'));
test('tests/webview directory should not exist', !fs.existsSync('tests/webview'));

// Test: Files should not exist after cleanup
test('src/webview/SkillComposerPanel.ts should not exist', !fs.existsSync('src/webview/SkillComposerPanel.ts'));

// Test: Package.json should not contain webview commands/scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
test('should not contain build:webview script', !packageJson.scripts['build:webview']);
test('should not contain watch:webview script', !packageJson.scripts['watch:webview']);

const commands = packageJson.contributes?.commands || [];
const showDetailsCommand = commands.find(cmd => cmd.command === 'cp-ninja.showDetails');
test('should not contain cp-ninja.showDetails command', !showDetailsCommand);

// Test: Extension.ts should not contain webview imports/registrations
const extensionContent = fs.readFileSync('src/extension.ts', 'utf8');
test('should not import SkillComposerPanel', !extensionContent.includes('import { SkillComposerPanel }'));
test('should not have SkillComposerPanel from webview import', !extensionContent.includes("from './webview/SkillComposerPanel'"));
test('should not register showDetails command', !extensionContent.includes('SkillComposerPanel.createOrShow'));
test('should not register showTargetPath command', !extensionContent.includes('cp-ninja.showTargetPath') || extensionContent.includes('REMOVED'));

console.log();
console.log('=== TEST RESULTS ===');
console.log('Tests passed:', testsPassed);
console.log('Tests failed:', testsFailed);
console.log('Overall result:', testsFailed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');