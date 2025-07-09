# Google Maps Lead Extractor

A powerful Chrome extension that extracts business leads from Google Maps with live preview and CSV export functionality.

## Features

🎯 **Real-time Lead Extraction**: Automatically extract business information from Google Maps search results
📊 **Live Preview**: View extracted leads in real-time with a beautiful, modern interface
📥 **CSV Export**: Download leads in CSV format with all requested fields
🔍 **Smart Search**: Search and filter extracted leads
📱 **Responsive Design**: Works perfectly on all screen sizes
🎨 **Modern UI**: Beautiful, Google-inspired design with smooth animations

## Extracted Data Fields

The extension captures all the requested fields:

- `uuid` - Unique identifier for each lead
- `query` - The search query used
- `name` - Business name
- `url` - Google Maps URL
- `domain` - Domain from URL
- `fulladdr` - Full address
- `addr1`, `addr2`, `addr3`, `addr4` - Address components
- `district` - District/area
- `timezone` - Local timezone
- `reviews` - Number of reviews
- `review_url` - URL to reviews
- `rating` - Star rating
- `latitude`, `longitude` - GPS coordinates
- `categories` - Business categories
- `local_name` - Local business name
- `local_fulladdr` - Local address format
- `thumbnail` - Business image
- `phone_numbers` - Contact numbers
- `website` - Business website
- `created_at` - Extraction timestamp

## 🚀 Quick Start

**For a 5-minute setup guide, see [`QUICK_START.md`](QUICK_START.md)**

**Having issues? Check [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)**

## Installation

### Option 1: Load Unpacked Extension (Development)

1. **Download the Extension Files**
   - Clone or download this repository
   - Extract all files to a folder

2. **Generate Icons** (Required)
   - Open `icons/icon.svg` in a web browser
   - Use browser dev tools or online SVG to PNG converter
   - Create PNG files in these sizes:
     - `icon16.png` (16x16)
     - `icon32.png` (32x32) 
     - `icon48.png` (48x48)
     - `icon128.png` (128x128)
   - Save them in the `icons/` directory

3. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

### Option 2: Icon Generation Script

Create this HTML file to easily generate icons from the SVG:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script>
        const sizes = [16, 32, 48, 128];
        const svg = `[SVG content from icons/icon.svg]`;
        
        sizes.forEach(size => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, size, size);
                const link = document.createElement('a');
                link.download = `icon${size}.png`;
                link.href = canvas.toDataURL();
                link.click();
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svg);
        });
    </script>
</body>
</html>
```

## Usage

### 1. Starting Extraction

1. **Navigate to Google Maps**
   - Go to https://www.google.com/maps/
   - Search for businesses (e.g., "restaurants in New York")

2. **Use the Floating Panel**
   - The extension automatically adds a floating panel to the page
   - Click "Start Extraction" to begin capturing leads
   - The extension will automatically scroll and extract visible businesses

3. **Use the Popup Interface**
   - Click the extension icon in the toolbar
   - View live preview of extracted leads
   - Use search functionality to filter results

### 2. Managing Leads

- **View Leads**: See all extracted leads with detailed information
- **Search**: Filter leads by name, address, category, or query
- **Pagination**: Navigate through large datasets easily
- **Real-time Updates**: Leads update automatically as extraction continues

### 3. Exporting Data

- **CSV Export**: Click "Download CSV" for spreadsheet-compatible format
- **JSON Export**: Use "Export JSON" for programmatic use
- **Auto-filename**: Files include timestamp for easy organization

### 4. Data Management

- **Clear Data**: Remove all extracted leads
- **Auto-backup**: Automatic periodic backups (configurable)
- **Storage**: Uses Chrome's local storage for persistence

## Tips for Best Results

1. **Scroll Manually**: While auto-scroll is enabled, manual scrolling can help capture more results
2. **Wait for Load**: Allow pages to fully load before starting extraction
3. **Check Duplicates**: The extension automatically removes duplicates based on name + address
4. **Regular Exports**: Export data regularly to avoid loss
5. **Search Variations**: Use different search terms for comprehensive coverage

## Technical Details

### File Structure
```
google-maps-lead-extractor/
├── manifest.json          # Extension configuration
├── content.js             # Main extraction logic
├── content.css            # Floating panel styles
├── popup.html             # Popup interface
├── popup.js               # Popup functionality
├── popup.css              # Popup styles
├── background.js          # Background service worker
├── icons/                 # Extension icons
│   ├── icon.svg          # Source SVG icon
│   ├── icon16.png        # 16x16 icon (generate)
│   ├── icon32.png        # 32x32 icon (generate)
│   ├── icon48.png        # 48x48 icon (generate)
│   └── icon128.png       # 128x128 icon (generate)
└── README.md             # This file
```

### Browser Compatibility
- Chrome 88+ (Manifest V3 support required)
- Chromium-based browsers (Edge, Brave, etc.)

### Permissions Used
- `activeTab`: Access current Google Maps tab
- `storage`: Save extracted leads locally
- `downloads`: Enable CSV/JSON downloads
- `scripting`: Inject extraction scripts
- `alarms`: Periodic backups
- `notifications`: User notifications

## Privacy & Security

- **Local Storage Only**: All data stays on your device
- **No External Servers**: No data sent to external services
- **Google Maps Only**: Extension only activates on Google Maps
- **No Tracking**: No analytics or tracking code

## Troubleshooting

### Extension Not Working
1. Check if you're on Google Maps (google.com/maps)
2. Refresh the page and try again
3. Check Chrome extensions are enabled
4. Verify all files are present

### No Leads Extracted
1. Ensure businesses are visible on screen
2. Wait for page to fully load
3. Try manual scrolling
4. Check browser console for errors

### Download Issues
1. Check browser download settings
2. Ensure sufficient disk space
3. Try different export format (JSON vs CSV)

### Icons Not Showing
1. Generate PNG icons from the SVG file
2. Place icons in the `icons/` directory
3. Reload the extension

## Development

### Modifying the Extension

1. **Content Script**: Edit `content.js` for extraction logic
2. **UI Changes**: Modify `popup.html` and CSS files
3. **Background Tasks**: Update `background.js`
4. **Reload Extension**: After changes, reload in `chrome://extensions/`

### Data Format Customization

Edit the `extractBusinessData()` function in `content.js` to modify extracted fields or add new ones.

### Styling Customization

Modify `content.css` and `popup.css` to change the appearance.

## License

This project is open source. Feel free to modify and distribute according to your needs.

## Support

For issues, questions, or feature requests:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Ensure all files are properly installed

---

**Note**: This extension is for educational and business purposes. Please respect Google's Terms of Service and rate limiting when using automated extraction tools.