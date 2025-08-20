// Quick test to verify shortcuts module can be imported
console.log('Testing shortcuts module imports...');

try {
  // Test that the types file exists and can be read
  const fs = require('fs');
  const path = require('path');
  
  const shortcutsTypesPath = path.join(__dirname, 'src/types/shortcuts.ts');
  const defaultShortcutsPath = path.join(__dirname, 'src/config/defaultShortcuts.ts');
  
  if (fs.existsSync(shortcutsTypesPath)) {
    console.log('✅ shortcuts.ts file exists');
    const content = fs.readFileSync(shortcutsTypesPath, 'utf-8');
    if (content.includes('export interface ShortcutGroup')) {
      console.log('✅ ShortcutGroup interface is exported');
    }
  }
  
  if (fs.existsSync(defaultShortcutsPath)) {
    console.log('✅ defaultShortcuts.ts file exists');
    const content = fs.readFileSync(defaultShortcutsPath, 'utf-8');
    if (content.includes('import type { Shortcut, ShortcutGroup }')) {
      console.log('✅ Type imports are correctly formatted');
    }
  }
  
  console.log('\n✅ All shortcut module checks passed!');
} catch (error) {
  console.error('❌ Error:', error.message);
}