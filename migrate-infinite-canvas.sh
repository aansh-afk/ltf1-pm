#!/bin/bash

# Infinite Canvas Migration Script
# Migrates WhiteboardCanvas.tsx to enhanced version with infinite canvas features

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$SCRIPT_DIR/apps/web/src/components/features/whiteboard"
ENHANCED_FILE="$TARGET_DIR/WhiteboardCanvas_ENHANCED.tsx"
CURRENT_FILE="$TARGET_DIR/WhiteboardCanvas.tsx"
BACKUP_FILE="$TARGET_DIR/WhiteboardCanvas_BACKUP_$(date +%Y%m%d_%H%M%S).tsx"

echo "=========================================="
echo "  Infinite Canvas Migration Script"
echo "=========================================="
echo ""

# Check if enhanced file exists
if [ ! -f "$ENHANCED_FILE" ]; then
    echo "❌ ERROR: Enhanced file not found at:"
    echo "   $ENHANCED_FILE"
    exit 1
fi

# Check if current file exists
if [ ! -f "$CURRENT_FILE" ]; then
    echo "❌ ERROR: Current file not found at:"
    echo "   $CURRENT_FILE"
    exit 1
fi

echo "✅ Files found"
echo ""
echo "Current file: $CURRENT_FILE"
echo "Enhanced file: $ENHANCED_FILE"
echo "Backup will be saved to: $BACKUP_FILE"
echo ""
echo "Features to be added:"
echo "  ✨ Infinite coordinates (negative x,y support)"
echo "  ✨ Viewport culling (1.5x buffer)"
echo "  ✨ Interactive minimap (150x100px, bottom-right)"
echo "  ✨ Fit-to-content button (50px padding)"
echo "  ✨ Real-time viewport bounds tracking"
echo "  ✨ Performance optimizations (60fps)"
echo ""

# Prompt for confirmation
read -p "Proceed with migration? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🔄 Starting migration..."
echo ""

# Step 1: Backup current file
echo "1/3 Creating backup..."
cp "$CURRENT_FILE" "$BACKUP_FILE"
echo "    ✅ Backup saved: $BACKUP_FILE"

# Step 2: Replace with enhanced version
echo "2/3 Replacing with enhanced version..."
cp "$ENHANCED_FILE" "$CURRENT_FILE"
echo "    ✅ File replaced"

# Step 3: Verify
echo "3/3 Verifying..."
if [ -f "$CURRENT_FILE" ]; then
    FILE_SIZE=$(wc -c < "$CURRENT_FILE")
    echo "    ✅ File verified (${FILE_SIZE} bytes)"
else
    echo "    ❌ Verification failed!"
    echo "    Restoring backup..."
    cp "$BACKUP_FILE" "$CURRENT_FILE"
    echo "    ✅ Backup restored"
    exit 1
fi

echo ""
echo "=========================================="
echo "  ✅ Migration Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Test the application: cd apps/web && npm run dev"
echo "  2. Verify infinite canvas features work"
echo "  3. Check performance with many elements"
echo ""
echo "To rollback:"
echo "  cp $BACKUP_FILE $CURRENT_FILE"
echo ""
echo "Features added:"
echo "  ✅ Infinite coordinates"
echo "  ✅ Viewport culling"
echo "  ✅ Interactive minimap"
echo "  ✅ Fit-to-content"
echo "  ✅ Performance optimizations"
echo ""
echo "Documentation: ./INFINITE_CANVAS_IMPLEMENTATION.md"
echo ""
