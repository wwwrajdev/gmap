# 🚀 Quick Start Guide - Google Maps Lead Extractor

## ⚡ 5-Minute Setup

### Step 1: Generate Icons (Required)
1. **Open the icon generator**: Double-click `generate-icons.html` 
2. **Click "Generate Icons"** - Your browser will download 4 PNG files
3. **Move the files** to the `icons/` folder in your extension directory
   ```
   icons/
   ├── icon16.png
   ├── icon32.png
   ├── icon48.png
   └── icon128.png
   ```

### Step 2: Install Extension
1. **Open Chrome Extensions**: Go to `chrome://extensions/`
2. **Enable Developer Mode**: Toggle the switch in the top-right corner
3. **Load Extension**: Click "Load unpacked" and select your extension folder
4. **Verify Installation**: Look for "Google Maps Lead Extractor" in your extensions list

### Step 3: Start Extracting Leads
1. **Go to Google Maps**: Visit https://www.google.com/maps/
2. **Search for Businesses**: Try "restaurants in New York" or "lawyers near me"
3. **Look for the Panel**: A blue floating panel should appear on the right
4. **Start Extraction**: Click the "Start Extraction" button
5. **Watch Magic Happen**: Leads will appear in real-time as you scroll

## 🎯 Usage Tips

### Best Practices
- **Wait for Results**: Let Google Maps fully load search results before starting
- **Use Specific Searches**: "coffee shops downtown" works better than just "food"
- **Export Regularly**: Download your CSV files frequently to avoid data loss
- **Manual Scrolling**: Scroll manually for better coverage alongside auto-scroll

### Getting Maximum Results
1. **Start with a specific search query**
2. **Let the page load completely**
3. **Click "Start Extraction"**
4. **Scroll through results manually or let auto-scroll work**
5. **Stop extraction when you have enough leads**
6. **Download CSV with all your data**

## 🔧 Quick Troubleshooting

### Extension Not Showing?
- Check `chrome://extensions/` for error messages
- Make sure icons are in the `icons/` folder
- Try reloading the extension

### No Leads Being Extracted?
1. **Click "Debug Scan"** in the floating panel
2. **Check browser console** (F12) for error messages
3. **Make sure you're on Google Maps** with search results visible
4. **Try a different search** like "pizza near me"

### Need Help?
- Check `TROUBLESHOOTING.md` for detailed solutions
- Open browser console (F12) to see debug messages
- Look for messages starting with 🎯, ✅, ⚠️, or ❌

## 📊 Data Fields Extracted

Every lead includes:
- **Basic Info**: Name, Address, Phone, Website
- **Location Data**: GPS coordinates, District
- **Business Data**: Categories, Rating, Review count
- **URLs**: Google Maps link, Review link
- **Images**: Thumbnail if available
- **Metadata**: UUID, Query used, Extraction timestamp

## 📥 Export Options

### CSV Export (Recommended)
- **Click**: "Download CSV" button
- **Use**: Excel, Google Sheets, CRM systems
- **Format**: Standard CSV with proper headers

### JSON Export
- **Click**: "Export JSON" in popup
- **Use**: Programming, databases, APIs
- **Format**: Structured JSON data

## 🎊 You're Ready!

Your Lead Extractor is now ready to capture business data from Google Maps. Happy lead hunting! 🎯

---

**Need more help?** Check the full `README.md` or `TROUBLESHOOTING.md` files.