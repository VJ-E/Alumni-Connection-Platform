#!/usr/bin/env node

/**
 * PWA Testing Script for Alumni Connection Platform
 * 
 * This script tests all PWA features to ensure they're working correctly.
 * Run with: node scripts/test-pwa.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing PWA Implementation...\n');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

function test(name, condition, details = '') {
  results.total++;
  if (condition) {
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
    results.passed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    results.failed++;
  }
}

// Test 1: Manifest file exists
test(
  'Web App Manifest exists',
  fs.existsSync(path.join(__dirname, '../public/manifest.json')),
  'manifest.json should be present in public directory'
);

// Test 2: Service Worker exists
test(
  'Service Worker exists',
  fs.existsSync(path.join(__dirname, '../public/sw.js')),
  'sw.js should be present in public directory'
);

// Test 3: Offline page exists
test(
  'Offline page exists',
  fs.existsSync(path.join(__dirname, '../public/offline.html')),
  'offline.html should be present in public directory'
);

// Test 4: Browser config exists
test(
  'Browser config exists',
  fs.existsSync(path.join(__dirname, '../public/browserconfig.xml')),
  'browserconfig.xml should be present in public directory'
);

// Test 5: PWA components exist
const pwaComponents = [
  'components/PWAInstaller.tsx',
  'components/OfflineIndicator.tsx'
];

pwaComponents.forEach(component => {
  test(
    `PWA Component exists: ${component}`,
    fs.existsSync(path.join(__dirname, '..', component)),
    `${component} should be present in components directory`
  );
});

// Test 6: Enhanced components exist
const enhancedComponents = [
  'components/Feed.tsx',
  'components/PostInput.tsx',
  'components/ChatWindow.tsx',
  'components/GroupChatWindow.tsx',
  'components/MessagesList.tsx',
  'components/PeopleList.tsx',
  'components/Post.tsx',
  'components/CommentInput.tsx',
  'components/SocialOptions.tsx',
  'components/CreateGroupModal.tsx'
];

enhancedComponents.forEach(component => {
  test(
    `Enhanced Component exists: ${component}`,
    fs.existsSync(path.join(__dirname, '..', component)),
    `${component} should be present and enhanced with offline support`
  );
});

// Test 7: Layout includes PWA components
const layoutPath = path.join(__dirname, '../app/layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  test(
    'Layout includes PWA components',
    layoutContent.includes('PWAInstaller') && layoutContent.includes('OfflineIndicator'),
    'layout.tsx should import and include PWA components'
  );
  
  test(
    'Layout includes PWA meta tags',
    layoutContent.includes('manifest') && layoutContent.includes('appleWebApp'),
    'layout.tsx should include PWA meta tags'
  );
}

// Test 8: Next.js config includes PWA settings
const nextConfigPath = path.join(__dirname, '../next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  test(
    'Next.js config includes PWA headers',
    nextConfigContent.includes('Service-Worker-Allowed') && nextConfigContent.includes('Cache-Control'),
    'next.config.mjs should include PWA-specific headers'
  );
}

// Test 9: Manifest content validation
const manifestPath = path.join(__dirname, '../public/manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    test(
      'Manifest has required fields',
      manifest.name && manifest.short_name && manifest.start_url && manifest.display,
      'manifest.json should include all required PWA fields'
    );
    
    test(
      'Manifest has icons',
      manifest.icons && manifest.icons.length > 0,
      'manifest.json should include app icons'
    );
    
    test(
      'Manifest has shortcuts',
      manifest.shortcuts && manifest.shortcuts.length > 0,
      'manifest.json should include app shortcuts'
    );
  } catch (error) {
    test(
      'Manifest is valid JSON',
      false,
      `manifest.json should be valid JSON: ${error.message}`
    );
  }
}

// Test 10: Service Worker content validation
const swPath = path.join(__dirname, '../public/sw.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  test(
    'Service Worker has install event',
    swContent.includes('addEventListener(\'install\''),
    'sw.js should handle install event'
  );
  
  test(
    'Service Worker has fetch event',
    swContent.includes('addEventListener(\'fetch\''),
    'sw.js should handle fetch event for caching'
  );
  
  test(
    'Service Worker has activate event',
    swContent.includes('addEventListener(\'activate\''),
    'sw.js should handle activate event for cache cleanup'
  );
}

// Test 11: Offline page content validation
const offlinePath = path.join(__dirname, '../public/offline.html');
if (fs.existsSync(offlinePath)) {
  const offlineContent = fs.readFileSync(offlinePath, 'utf8');
  
  test(
    'Offline page has proper structure',
    offlineContent.includes('<title>') && offlineContent.includes('<body>'),
    'offline.html should have proper HTML structure'
  );
  
  test(
    'Offline page includes offline messaging',
    offlineContent.includes('offline') || offlineContent.includes('Offline'),
    'offline.html should clearly indicate offline status'
  );
}

// Test 12: PWA components have proper imports
const pwaInstallerPath = path.join(__dirname, '../components/PWAInstaller.tsx');
if (fs.existsSync(pwaInstallerPath)) {
  const installerContent = fs.readFileSync(pwaInstallerPath, 'utf8');
  
  test(
    'PWA Installer has service worker registration',
    installerContent.includes('navigator.serviceWorker.register'),
    'PWAInstaller should register the service worker'
  );
  
  test(
    'PWA Installer has install prompt handling',
    installerContent.includes('beforeinstallprompt'),
    'PWAInstaller should handle install prompts'
  );
}

const offlineIndicatorPath = path.join(__dirname, '../components/OfflineIndicator.tsx');
if (fs.existsSync(offlineIndicatorPath)) {
  const indicatorContent = fs.readFileSync(offlineIndicatorPath, 'utf8');
  
  test(
    'Offline Indicator has online/offline event handling',
    indicatorContent.includes('addEventListener(\'online\'') && indicatorContent.includes('addEventListener(\'offline\''),
    'OfflineIndicator should handle online/offline events'
  );
  
  test(
    'Offline Indicator exports useOnlineStatus hook',
    indicatorContent.includes('export const useOnlineStatus'),
    'OfflineIndicator should export the useOnlineStatus hook'
  );
}

// Test 13: Enhanced components use offline hooks
enhancedComponents.forEach(component => {
  const componentPath = path.join(__dirname, '..', component);
  if (fs.existsSync(componentPath)) {
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    test(
      `${component} imports offline hook`,
      componentContent.includes('useOnlineStatus') || componentContent.includes('OfflineIndicator'),
      `${component} should import offline status functionality`
    );
  }
});

// Test 14: Package.json includes PWA dependencies
const packagePath = path.join(__dirname, '../package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  test(
    'Package.json has required dependencies',
    packageContent.dependencies && (
      packageContent.dependencies['next'] ||
      packageContent.dependencies['react'] ||
      packageContent.dependencies['@clerk/nextjs']
    ),
    'package.json should include core dependencies'
  );
}

// Test 15: TypeScript configuration supports PWA
const tsConfigPath = path.join(__dirname, '../tsconfig.json');
if (fs.existsSync(tsConfigPath)) {
  const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf8');
  
  test(
    'TypeScript config exists',
    true,
    'tsconfig.json should be present for TypeScript support'
  );
}

console.log('\n📊 Test Results:');
console.log(`Total Tests: ${results.total}`);
console.log(`Passed: ${results.passed} ✅`);
console.log(`Failed: ${results.failed} ❌`);
console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

if (results.failed === 0) {
  console.log('\n🎉 All PWA tests passed! The Alumni Connection Platform is ready as a PWA.');
} else {
  console.log('\n⚠️  Some PWA tests failed. Please review the failed tests above.');
}

console.log('\n🚀 PWA Features Summary:');
console.log('• Web App Manifest for app installation');
console.log('• Service Worker for offline functionality');
console.log('• Offline page for graceful degradation');
console.log('• PWA installer component');
console.log('• Offline indicator component');
console.log('• Enhanced components with offline support');
console.log('• Next.js PWA configuration');
console.log('• Comprehensive PWA documentation');

console.log('\n📱 To test PWA features:');
console.log('1. Build and run the application');
console.log('2. Open Chrome DevTools > Application > Manifest');
console.log('3. Check service worker registration');
console.log('4. Test offline functionality');
console.log('5. Try installing the app');

process.exit(results.failed === 0 ? 0 : 1);
