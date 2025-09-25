# Adding Comet Browser Support to Alfred Workflow

Comet browser has been tested and confirmed to work with the existing Chromium browser scripts (`list-tabs.js` and `focus-tab.js`). Here's how to add it to your Alfred workflow:

## Method 1: Manual Alfred Configuration (Recommended)

1. Open Alfred Preferences
2. Go to Workflows tab
3. Find and select "Browser Tabs" workflow
4. Duplicate an existing Chromium browser configuration (like Chrome):
   - Right-click on the "Chrome - Tabs" script filter → Duplicate
   - Right-click on the Chrome hotkey trigger → Duplicate  
   - Right-click on the Chrome argument utility → Duplicate

5. Configure the new Comet script filter:
   - Double-click the duplicated script filter
   - Change Title to: "Comet - Tabs"
   - Change Keyword to: "comet tabs"
   - Change Script to: `./list-tabs.js "Comet"`

6. Configure the new Comet argument utility:
   - Double-click the duplicated argument utility
   - Change Variables → browser value to: "Comet"

7. Connect the components:
   - Connect hotkey → script filter
   - Connect script filter → argument utility (normal path)
   - Connect script filter → clipboard script (CTRL modifier path)
   - Connect argument utility → focus script

## Method 2: Import Updated Workflow

If available, import an updated .alfredworkflow file that includes Comet support.

## Testing Comet Support

Once configured, test the integration:

```bash
# Test tab listing
osascript -l JavaScript src/list-tabs.js "Comet"

# Test tab focusing (replace with actual window,tab,url from your tabs)
browser=Comet osascript -l JavaScript src/focus-tab.js "0,1,https://example.com"
```

## Usage

After setup, you can use:
- `comet tabs` - Search and navigate to Comet browser tabs
- `comet tabs search term` - Filter tabs by search term
- Hold CTRL when selecting to copy URL to clipboard

## Technical Details

Comet browser follows the Chromium API pattern:
- Uses `tabs.title()` method for tab titles
- Uses `tabs.url()` method for tab URLs  
- Uses `activeTabIndex` property for focusing tabs
- Supports the same window/system window mapping as other Chromium browsers

This makes it fully compatible with the existing `list-tabs.js` and `focus-tab.js` scripts without any modifications needed.