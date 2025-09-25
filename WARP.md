# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Alfred Browser Tabs is an Alfred Workflow that enables blazing fast search and navigation of open browser tabs across multiple browsers (Chrome, Arc, Brave, Edge, Vivaldi, Safari, Orion, Comet). The workflow uses JavaScript for Automation (JXA) to interact with browser applications via macOS System Events.

## Architecture

### Core Components

The workflow consists of three main types of JavaScript files:

1. **Tab Listing Scripts** (`list-tabs*.js`):
   - `list-tabs.js` - For Chromium-based browsers (Chrome, Brave, Edge, Vivaldi, Comet)
   - `list-tabs-webkit.js` - For WebKit-based browsers (Safari, Orion)  
   - `list-tabs-arc.js` - Special handling for Arc browser's space-based tab organization

2. **Tab Focusing Scripts** (`focus-tab*.js`):
   - `focus-tab.js` - For Chromium browsers (Chrome, Brave, Edge, Vivaldi, Comet) with complex window/system window mapping
   - `focus-tab-webkit.js` - For WebKit browsers with simpler URL-based tab matching
   - `focus-tab-arc.js` - For Arc's window/space/tab hierarchy

3. **Alfred Configuration** (`info.plist`):
   - Workflow metadata, connections, and script filter configurations
   - Defines keyword commands for each browser
   - Handles clipboard copying with CTRL modifier

### Browser-Specific Differences

- **Chromium browsers** (Chrome, Brave, Edge, Vivaldi, Comet): Use `tabs.title()` and track by window/tab indices
- **WebKit browsers**: Use `tabs.name()` and match by URL prefix for focusing
- **Arc browser**: Has a unique 3-level hierarchy (window → space → tab) requiring special handling

### Data Flow

1. Alfred invokes script filter with browser name parameter
2. Tab listing script queries browser via JXA and returns JSON with tab data
3. User selection triggers focus script with encoded position data
4. Focus script parses position data and activates the target tab
5. Optional CTRL modifier copies URL to clipboard instead

## Development Commands

### Testing Tab Listing
```bash
# Test Chrome tab listing
osascript -l JavaScript src/list-tabs.js "Google Chrome"

# Test Safari tab listing  
osascript -l JavaScript src/list-tabs-webkit.js "Safari"

# Test Arc tab listing
osascript -l JavaScript src/list-tabs-arc.js "Arc"

# Test Comet tab listing
osascript -l JavaScript src/list-tabs.js "Comet"
```

### Testing Tab Focusing
```bash
# Focus Chrome tab (requires window,tab,url format)
osascript -l JavaScript src/focus-tab.js "0,1,https://example.com"

# Focus Safari tab (requires window,url format)
osascript -l JavaScript src/focus-tab-webkit.js "0,https://example.com"

# Focus Arc tab (requires window,space,tab,url format)
osascript -l JavaScript src/focus-tab-arc.js "0,0,1,https://example.com"

# Focus Comet tab (requires window,tab,url format)
browser=Comet osascript -l JavaScript src/focus-tab.js "0,1,https://example.com"
```

### Alfred Workflow Development
```bash
# Import workflow into Alfred
open Browser-Tabs.alfredworkflow

# Build new workflow file from src/
# (No build process - manual export from Alfred required)
```

## Browser Support Matrix

| Browser | Script Files | Tab Data Format | Focus Method |
|---------|-------------|-----------------|--------------|
| Chrome | list-tabs.js, focus-tab.js | window,tab,url | activeTabIndex |
| Brave | list-tabs.js, focus-tab.js | window,tab,url | activeTabIndex |
| Edge | list-tabs.js, focus-tab.js | window,tab,url | activeTabIndex |
| Vivaldi | list-tabs.js, focus-tab.js | window,tab,url | activeTabIndex |
| Safari | list-tabs-webkit.js, focus-tab-webkit.js | window,url | currentTab |
| Orion | list-tabs-webkit.js, focus-tab-webkit.js | window,url | currentTab |
| Arc | list-tabs-arc.js, focus-tab-arc.js | window,space,tab,url | spaces[].tabs[].select() |
| Comet | list-tabs.js, focus-tab.js | window,tab,url | activeTabIndex |

## Key Implementation Details

### JXA Pattern
All scripts use JavaScript for Automation with the shebang `#!/usr/bin/env osascript -l JavaScript` and follow the pattern:
- Import ObjC.import("stdlib") for environment variable access
- Check if browser is running before querying
- Return Alfred-formatted JSON with items array

### Error Handling
Scripts handle browser not running by returning a launch prompt rather than throwing errors.

### Deduplication Strategy
Tab listing uses URL as key in `tabsMap` object to automatically deduplicate tabs with same URL across windows.

### Alfred Integration
- Uses `arg` field for passing encoded position data between list and focus scripts
- Uses `match` field for fuzzy search including both title and decoded URL
- Supports `quicklookurl` for previewing tabs
- CTRL modifier (262144) triggers URL copying instead of focusing

## Adding New Browser Support

To add support for a new browser:

1. Test browser API compatibility:
   - Chromium browsers: Use `list-tabs.js` and `focus-tab.js`
   - WebKit browsers: Use `list-tabs-webkit.js` and `focus-tab-webkit.js`
   - Unique browsers (like Arc): Create new specialized scripts

2. Update documentation and workflow configuration
3. See `ADDING_COMET_SUPPORT.md` for a complete example of adding Comet browser

## Deployment

The workflow is distributed as a `.alfredworkflow` file containing all source files and configuration. Users import this file directly into Alfred (requires Powerpack).

New releases are typically published on GitHub with the workflow file attached for download.
