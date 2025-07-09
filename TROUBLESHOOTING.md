# 🔧 Lead Scraper Troubleshooting Guide

## Quick Fixes for Common Issues

### 🚨 Extension Not Loading or Panel Not Appearing

**Symptoms:**
- No floating panel appears on Google Maps
- Extension icon shows but no popup
- Console shows errors about missing files

**Solutions:**

1. **Generate Icons First** (Most Common Issue)
   ```bash
   # Open generate-icons.html in your browser
   # Click "Generate Icons" 
   # Move the downloaded PNG files to the icons/ directory
   ```

2. **Check Extension Installation**
   - Go to `chrome://extensions/`
   - Ensure "Developer mode" is enabled
   - Look for error messages in red text
   - Click "Reload" button if you see any errors

3. **Verify File Structure**
   ```
   extension-folder/
   ├── manifest.json
   ├── content.js
   ├── content.css
   ├── popup.html
   ├── popup.js
   ├── popup.css
   ├── background.js
   └── icons/
       ├── icon16.png
       ├── icon32.png
       ├── icon48.png
       └── icon128.png
   ```

### 🔍 No Leads Being Extracted

**Symptoms:**
- Extension loads but shows "0 leads"
- Extraction starts but no data appears
- Debug scan shows "No elements found"

**Step-by-Step Debugging:**

1. **Open Browser Console**
   - Press F12 or Ctrl+Shift+I
   - Go to "Console" tab
   - Look for messages starting with 🎯, ✅, ⚠️, or ❌

2. **Use Debug Features**
   - Click the "Debug Scan" button in the floating panel
   - This will show which selectors are finding elements
   - Check the debug info panel for results

3. **Check You're on Google Maps**
   - URL should contain `google.com/maps` or `maps.google.com`
   - You should see business search results in the sidebar

4. **Perform a Business Search**
   - Search for something like "restaurants near me"
   - Wait for results to load completely
   - Try clicking "Start Extraction"

### 🌐 Google Maps Layout Issues

Google Maps frequently updates their interface. If extraction isn't working:

1. **Check Console Messages**
   ```javascript
   // Look for these messages:
   "✅ Found X businesses using selector: .hfpxzc"
   "⚠️ No business elements found with any selector"
   ```

2. **Manual Selector Testing**
   - Open browser console on Google Maps
   - Try these commands:
   ```javascript
   // Test different selectors
   document.querySelectorAll('.hfpxzc').length
   document.querySelectorAll('[data-result-index]').length
   document.querySelectorAll('.Nv2PK').length
   ```

3. **Report New Selectors**
   If none work, inspect a business element:
   - Right-click on a business result
   - Choose "Inspect Element"
   - Note the class names and structure

### 📥 CSV Download Not Working

**Solutions:**

1. **Check Download Permissions**
   - Extension needs "downloads" permission
   - Check browser's download settings
   - Ensure pop-ups aren't blocked

2. **Try Different Export**
   - Use "Export JSON" instead
   - Clear browser cache
   - Restart browser

3. **Manual Download**
   ```javascript
   // In console, get data manually:
   chrome.storage.local.get(['extractedLeads'], (result) => {
       console.log(result.extractedLeads);
   });
   ```

### 🐛 Advanced Debugging

#### Enable Enhanced Debugging
Edit `content.js` and change:
```javascript
this.debugMode = true; // Set to true for detailed logs
```

#### Common Console Messages

| Message | Meaning | Action |
|---------|---------|---------|
| `🎯 Lead Extractor initializing...` | Extension starting | Normal |
| `✅ On Google Maps, initializing extractor...` | Correct page detected | Normal |
| `❌ Not on Google Maps` | Wrong page | Go to Google Maps |
| `⚠️ No business elements found` | Selectors not working | Try debug scan |
| `✅ Found X businesses using selector` | Working correctly | Normal |
| `🎉 Extracted X new leads` | Successfully extracting | Normal |

#### Manual Testing Commands

Open browser console and test:

```javascript
// Check if extension is loaded
window.googleMapsExtractor

// Test business element detection
document.querySelectorAll('.hfpxzc, [data-result-index], .Nv2PK').length

// Check current leads
window.googleMapsExtractor?.extractedLeads.length

// Force extraction test
window.googleMapsExtractor?.extractVisibleBusinesses()
```

## 🔄 Reset Extension

If nothing works, try a complete reset:

1. **Remove Extension**
   - Go to `chrome://extensions/`
   - Click "Remove" on the Lead Extractor

2. **Clear Browser Data**
   - Settings → Privacy and security → Clear browsing data
   - Choose "Cached images and files"

3. **Reinstall Extension**
   - Generate icons using `generate-icons.html`
   - Load unpacked extension again

## 🆘 Still Having Issues?

### Check Browser Compatibility
- Chrome 88+ required
- Manifest V3 support needed
- Try in incognito mode

### Collect Debug Information
Before reporting issues, gather:

1. **Browser Version**: chrome://version/
2. **Console Logs**: Copy all console messages
3. **Extension Errors**: From chrome://extensions/
4. **Google Maps URL**: Current page URL
5. **Debug Scan Results**: From Debug Scan button

### Common Error Fixes

```javascript
// Error: "Cannot read property of undefined"
// Solution: Reload extension and page

// Error: "Permission denied"
// Solution: Check manifest.json permissions

// Error: "Script injection failed"
// Solution: Reload extension, try incognito mode
```

## ⚡ Performance Tips

1. **Optimal Usage**
   - Search for 20-50 results at a time
   - Let page load completely before extraction
   - Use manual scrolling for better results

2. **Avoid Rate Limiting**
   - Don't extract too fast
   - Take breaks between sessions
   - Respect Google's terms of service

3. **Memory Management**
   - Export data regularly
   - Clear old leads periodically
   - Close other tabs while extracting

## 🔧 Quick Fixes Checklist

- [ ] Icons generated and placed in icons/ folder
- [ ] Extension reloaded after changes
- [ ] On correct Google Maps URL
- [ ] Business search results visible
- [ ] Console shows no red errors
- [ ] Debug scan finds elements
- [ ] Browser allows downloads

---

**Remember**: Google Maps updates frequently. If extraction stops working after a Maps update, the selectors may need updating. Check the console debug messages to identify which selectors are working.