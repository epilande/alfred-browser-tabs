#!/bin/bash

echo "🧪 Testing Comet Browser Integration for Alfred Browser Tabs"
echo "========================================================="

# Check if Comet is running
if ! osascript -e 'Application("Comet").running()' 2>/dev/null; then
    echo "❌ Comet browser is not running. Please start Comet and open some tabs."
    exit 1
fi

echo "✅ Comet browser is running"

# Test tab listing
echo ""
echo "📋 Testing tab listing..."
TAB_JSON=$(osascript -l JavaScript src/list-tabs.js "Comet" 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$TAB_JSON" ]; then
    echo "✅ Tab listing successful"
    
    # Count tabs if jq is available
    if command -v jq &> /dev/null; then
        TAB_COUNT=$(echo "$TAB_JSON" | jq '.items | length' 2>/dev/null)
        echo "📊 Found $TAB_COUNT tabs"
        
        # Show first tab as example
        echo "📄 Sample tab:"
        echo "$TAB_JSON" | jq '.items[0] | {title, url}' 2>/dev/null
    else
        echo "📊 Tab data retrieved (jq not available for detailed parsing)"
    fi
else
    echo "❌ Tab listing failed"
    exit 1
fi

# Test focus functionality (with first tab if available)
echo ""
echo "🎯 Testing focus functionality..."

if command -v jq &> /dev/null; then
    FIRST_TAB_ARG=$(echo "$TAB_JSON" | jq -r '.items[0].arg' 2>/dev/null)
    if [ "$FIRST_TAB_ARG" != "null" ] && [ ! -z "$FIRST_TAB_ARG" ]; then
        echo "🔍 Testing focus with: $FIRST_TAB_ARG"
        if browser=Comet osascript -l JavaScript src/focus-tab.js "$FIRST_TAB_ARG" 2>/dev/null; then
            echo "✅ Focus test successful"
        else
            echo "❌ Focus test failed"
            exit 1
        fi
    else
        echo "⚠️  No valid tab argument found for focus testing"
    fi
else
    echo "⚠️  jq not available, skipping focus test"
fi

echo ""
echo "🎉 All tests passed! Comet browser is fully supported."
echo ""
echo "To add Comet to your Alfred workflow:"
echo "1. See ADDING_COMET_SUPPORT.md for detailed instructions"
echo "2. Use keyword: 'comet tabs' to search Comet browser tabs"
echo "3. Hold CTRL while selecting to copy URL to clipboard"