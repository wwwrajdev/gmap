// Google Maps Lead Extractor - Content Script (Updated 2024)
class GoogleMapsExtractor {
    constructor() {
        this.extractedLeads = [];
        this.isExtracting = false;
        this.currentQuery = '';
        this.observer = null;
        this.debugMode = true; // Enable debugging
        this.init();
    }

    init() {
        console.log('🎯 Lead Extractor initializing...');
        // Wait for page to load completely
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.setupExtractor(), 2000);
            });
        } else {
            setTimeout(() => this.setupExtractor(), 2000);
        }
    }

    setupExtractor() {
        this.createExtractorUI();
        this.setupMessageListener();
        this.observePageChanges();
        this.debugPageStructure();
        console.log('✅ Lead Extractor ready!');
    }

    debugPageStructure() {
        if (!this.debugMode) return;
        
        console.log('🔍 Debugging Google Maps structure...');
        
        // Check for different possible selectors
        const possibleSelectors = [
            '[data-result-index]',
            '[jstcache]',
            '.Nv2PK',
            '.lI9IFe',
            '.bfdHYd',
            '.THOPZb',
            '[role="article"]',
            '.qjESne',
            '.section-result',
            '.hfpxzc'
        ];

        possibleSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
            }
        });

        // Check current URL pattern
        console.log('📍 Current URL:', window.location.href);
        console.log('📍 URL Search:', window.location.search);
    }

    createExtractorUI() {
        // Remove existing panel if present
        const existingPanel = document.getElementById('gmaps-extractor-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        // Create floating UI panel
        const panel = document.createElement('div');
        panel.id = 'gmaps-extractor-panel';
        panel.innerHTML = `
            <div class="extractor-header">
                <h3>🎯 Lead Extractor</h3>
                <button id="close-panel">×</button>
            </div>
            <div class="extractor-body">
                <div class="status">Ready to extract</div>
                <div class="stats">
                    <span>Leads: <span id="lead-count">0</span></span>
                </div>
                <div class="controls">
                    <button id="start-extraction" class="primary">Start Extraction</button>
                    <button id="stop-extraction" class="secondary" style="display:none;">Stop</button>
                    <button id="clear-data" class="secondary">Clear</button>
                    <button id="debug-scan" class="secondary">Debug Scan</button>
                </div>
                <div class="progress-bar" style="display:none;">
                    <div class="progress-fill"></div>
                </div>
                <div class="debug-info" id="debug-info" style="display:none;"></div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Add event listeners
        document.getElementById('close-panel').addEventListener('click', () => {
            panel.style.display = 'none';
        });
        
        document.getElementById('start-extraction').addEventListener('click', () => {
            this.startExtraction();
        });
        
        document.getElementById('stop-extraction').addEventListener('click', () => {
            this.stopExtraction();
        });
        
        document.getElementById('clear-data').addEventListener('click', () => {
            this.clearData();
        });

        document.getElementById('debug-scan').addEventListener('click', () => {
            this.performDebugScan();
        });
    }

    performDebugScan() {
        const debugInfo = document.getElementById('debug-info');
        debugInfo.style.display = 'block';
        
        let foundElements = 0;
        let debugText = '🔍 Debug Scan Results:<br><br>';
        
        // Try different selectors for business listings
        const selectors = [
            { name: 'Standard Results', selector: '[data-result-index]' },
            { name: 'Business Cards', selector: '.hfpxzc' },
            { name: 'Place Results', selector: '.Nv2PK' },
            { name: 'Search Results', selector: '.section-result' },
            { name: 'List Items', selector: '.lI9IFe' },
            { name: 'Article Elements', selector: '[role="article"]' },
            { name: 'Result Containers', selector: '.bfdHYd' },
            { name: 'Place Items', selector: '.qjESne' }
        ];

        selectors.forEach(({name, selector}) => {
            const elements = document.querySelectorAll(selector);
            debugText += `${name}: ${elements.length} found<br>`;
            foundElements += elements.length;
            
            if (elements.length > 0) {
                // Try to extract a sample business name
                const firstElement = elements[0];
                const nameSelectors = [
                    '.qBF1Pd', 'h3', '.fontHeadlineSmall', '.section-result-title', 
                    '.section-result-text-content h3', '[data-value="Name"]'
                ];
                
                for (let nameSelector of nameSelectors) {
                    const nameEl = firstElement.querySelector(nameSelector);
                    if (nameEl && nameEl.textContent.trim()) {
                        debugText += `  → Sample: "${nameEl.textContent.trim()}"<br>`;
                        break;
                    }
                }
            }
        });

        debugText += `<br>Total elements found: ${foundElements}`;
        debugInfo.innerHTML = debugText;
        
        console.log('Debug scan completed, found elements:', foundElements);
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getLeads') {
                sendResponse({ leads: this.extractedLeads });
            } else if (request.action === 'startExtraction') {
                this.startExtraction();
                sendResponse({ success: true });
            } else if (request.action === 'stopExtraction') {
                this.stopExtraction();
                sendResponse({ success: true });
            } else if (request.action === 'clearData') {
                this.clearData();
                sendResponse({ success: true });
            }
        });
    }

    observePageChanges() {
        this.observer = new MutationObserver((mutations) => {
            if (this.isExtracting) {
                setTimeout(() => this.extractVisibleBusinesses(), 500);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    startExtraction() {
        this.isExtracting = true;
        this.currentQuery = this.getCurrentSearchQuery();
        
        document.getElementById('start-extraction').style.display = 'none';
        document.getElementById('stop-extraction').style.display = 'inline-block';
        document.querySelector('.progress-bar').style.display = 'block';
        document.querySelector('.status').textContent = 'Extracting...';
        
        console.log('🚀 Starting extraction for query:', this.currentQuery);
        
        // Initial extraction
        this.extractVisibleBusinesses();
        
        // Start auto-scroll
        this.autoScroll();
    }

    stopExtraction() {
        this.isExtracting = false;
        
        document.getElementById('start-extraction').style.display = 'inline-block';
        document.getElementById('stop-extraction').style.display = 'none';
        document.querySelector('.progress-bar').style.display = 'none';
        document.querySelector('.status').textContent = `Extracted ${this.extractedLeads.length} leads`;
        
        console.log('⏹️ Extraction stopped. Total leads:', this.extractedLeads.length);
    }

    clearData() {
        this.extractedLeads = [];
        this.updateLeadCount();
        document.querySelector('.status').textContent = 'Ready to extract';
        console.log('🗑️ Data cleared');
    }

    getCurrentSearchQuery() {
        // Try multiple ways to get the search query
        const urlParams = new URLSearchParams(window.location.search);
        let query = urlParams.get('query') || urlParams.get('q');
        
        if (!query) {
            // Try to extract from search input
            const searchInput = document.querySelector('#searchboxinput') || 
                              document.querySelector('input[aria-label*="Search"]') ||
                              document.querySelector('input[placeholder*="Search"]');
            if (searchInput) {
                query = searchInput.value;
            }
        }
        
        return query || 'Unknown Search';
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    extractVisibleBusinesses() {
        // Try multiple selectors for business elements (Google Maps changes frequently)
        const selectors = [
            '.hfpxzc',                    // Current standard selector
            '[data-result-index]',        // Legacy selector
            '.Nv2PK',                     // Alternative selector
            '.section-result',            // Another alternative
            '.lI9IFe',                    // List item selector
            '[role="article"]',           // Semantic selector
            '.qjESne'                     // Place item selector
        ];

        let businessElements = [];
        
        for (let selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                businessElements = Array.from(elements);
                console.log(`📍 Found ${businessElements.length} businesses using selector: ${selector}`);
                break;
            }
        }

        if (businessElements.length === 0) {
            console.log('⚠️ No business elements found with any selector');
            return;
        }
        
        let newLeadsCount = 0;
        
        businessElements.forEach((element, index) => {
            try {
                const businessData = this.extractBusinessData(element, index);
                if (businessData && !this.isDuplicate(businessData)) {
                    this.extractedLeads.push(businessData);
                    this.updateLeadCount();
                    newLeadsCount++;
                    
                    if (this.debugMode) {
                        console.log(`✅ Extracted: ${businessData.name}`);
                    }
                }
            } catch (error) {
                console.error('❌ Error extracting business data:', error);
            }
        });
        
        if (newLeadsCount > 0) {
            console.log(`🎉 Extracted ${newLeadsCount} new leads`);
        }
    }

    extractBusinessData(element, index) {
        try {
            // Extract business name using multiple possible selectors
            const nameSelectors = [
                '.qBF1Pd',                    // Standard name selector
                '.fontHeadlineSmall',         // Alternative name selector
                'h3',                         // Generic heading
                '.section-result-title',      // Result title
                '[data-value="Name"]',        // Data attribute
                '.section-result-text-content h3'
            ];
            
            let name = '';
            let nameElement = null;
            
            for (let selector of nameSelectors) {
                nameElement = element.querySelector(selector);
                if (nameElement && nameElement.textContent.trim()) {
                    name = nameElement.textContent.trim();
                    break;
                }
            }
            
            if (!name) {
                if (this.debugMode) {
                    console.log('⚠️ No name found for element:', element);
                }
                return null;
            }

            // Extract rating
            const ratingSelectors = [
                '.MW4etd',                    // Standard rating
                '[data-value="Rating"]',      // Data attribute
                '.fontBodyMedium .Ob2kfd',    // Alternative rating
                '.section-result-rating'
            ];
            
            let rating = 0;
            for (let selector of ratingSelectors) {
                const ratingElement = element.querySelector(selector);
                if (ratingElement) {
                    const ratingText = ratingElement.textContent.replace(',', '.');
                    const ratingMatch = ratingText.match(/\d+\.?\d*/);
                    if (ratingMatch) {
                        rating = parseFloat(ratingMatch[0]);
                        break;
                    }
                }
            }

            // Extract review count
            const reviewSelectors = [
                '.UY7F9',                     // Standard reviews
                '[data-value="Reviews"]',     // Data attribute
                '.fontBodyMedium:has-text("(")', // Alternative reviews
                '.section-result-num-reviews'
            ];
            
            let reviews = 0;
            for (let selector of reviewSelectors) {
                const reviewElement = element.querySelector(selector);
                if (reviewElement) {
                    const reviewText = reviewElement.textContent;
                    const reviewMatch = reviewText.match(/\d+/);
                    if (reviewMatch) {
                        reviews = parseInt(reviewMatch[0]);
                        break;
                    }
                }
            }

            // Extract address
            const addressSelectors = [
                '.W4Efsd:last-child',         // Standard address
                '[data-value="Address"]',     // Data attribute
                '.fontBodyMedium[title]',     // Alternative address
                '.section-result-location'
            ];
            
            let fullAddress = '';
            for (let selector of addressSelectors) {
                const addressElement = element.querySelector(selector);
                if (addressElement && addressElement.textContent.trim()) {
                    fullAddress = addressElement.textContent.trim();
                    break;
                }
            }

            // Extract categories
            const categorySelectors = [
                '.W4Efsd:not(:last-child)',   // Standard category
                '[data-value="Category"]',    // Data attribute
                '.fontBodyMedium:first-child', // Alternative category
                '.section-result-details'
            ];
            
            let categories = '';
            for (let selector of categorySelectors) {
                const categoryElement = element.querySelector(selector);
                if (categoryElement && categoryElement.textContent.trim()) {
                    categories = categoryElement.textContent.trim();
                    break;
                }
            }

            // Extract URL
            const linkElement = element.querySelector('a[href*="/maps/place/"]') || 
                              element.querySelector('a[href*="google.com/maps"]') ||
                              element.querySelector('a[data-value="directions"]');
            const url = linkElement ? linkElement.href : window.location.href;
            const domain = url ? new URL(url).hostname : '';

            // Extract thumbnail
            const thumbnailElement = element.querySelector('img[src*="googleusercontent.com"]') ||
                                   element.querySelector('img[src*="maps.gstatic.com"]') ||
                                   element.querySelector('img[src*="streetviewpixels"]');
            const thumbnail = thumbnailElement ? thumbnailElement.src : '';

            // Extract coordinates from URL
            const coordinates = this.extractCoordinates(url);

            // Extract phone (rarely visible in list view)
            const phoneElement = element.querySelector('[data-value="Phone"]') ||
                               element.querySelector('[href^="tel:"]');
            const phoneNumbers = phoneElement ? phoneElement.textContent.trim() : '';

            // Extract website (rarely visible in list view)
            const websiteElement = element.querySelector('[data-value="Website"]') ||
                                 element.querySelector('a[href^="http"]:not([href*="google.com"])');
            const website = websiteElement ? websiteElement.href || websiteElement.textContent : '';

            // Parse address components
            const addressParts = this.parseAddress(fullAddress);

            const businessData = {
                uuid: this.generateUUID(),
                query: this.currentQuery,
                name: name,
                url: url,
                domain: domain,
                fulladdr: fullAddress,
                addr1: addressParts.addr1,
                addr2: addressParts.addr2,
                addr3: addressParts.addr3,
                addr4: addressParts.addr4,
                district: addressParts.district,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                reviews: reviews,
                review_url: url,
                rating: rating,
                latitude: coordinates.lat,
                longitude: coordinates.lng,
                categories: categories,
                local_name: name,
                local_fulladdr: fullAddress,
                thumbnail: thumbnail,
                phone_numbers: phoneNumbers,
                website: website,
                created_at: new Date().toISOString()
            };

            return businessData;

        } catch (error) {
            console.error('❌ Error in extractBusinessData:', error);
            return null;
        }
    }

    parseAddress(fullAddress) {
        const parts = fullAddress.split(',').map(part => part.trim());
        return {
            addr1: parts[0] || '',
            addr2: parts[1] || '',
            addr3: parts[2] || '',
            addr4: parts[3] || '',
            district: parts.length > 2 ? parts[parts.length - 2] : ''
        };
    }

    extractCoordinates(url) {
        const coords = { lat: 0, lng: 0 };
        if (url) {
            // Try different coordinate patterns
            const coordPatterns = [
                /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,          // Standard @lat,lng
                /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,      // Alternative format
                /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/      // Center parameter
            ];

            for (let pattern of coordPatterns) {
                const coordMatch = url.match(pattern);
                if (coordMatch) {
                    coords.lat = parseFloat(coordMatch[1]);
                    coords.lng = parseFloat(coordMatch[2]);
                    break;
                }
            }
        }
        return coords;
    }

    isDuplicate(newBusiness) {
        return this.extractedLeads.some(lead => 
            lead.name === newBusiness.name && 
            lead.fulladdr === newBusiness.fulladdr
        );
    }

    updateLeadCount() {
        const countElement = document.getElementById('lead-count');
        if (countElement) {
            countElement.textContent = this.extractedLeads.length;
        }
    }

    autoScroll() {
        if (!this.isExtracting) return;

        // Try multiple scroll container selectors
        const scrollSelectors = [
            '[role="main"]',
            '.m6QErb',
            '.section-scrollbox',
            '.section-result-container',
            '[data-value="Search results"]',
            '.siAUzd',
            '.section-layout'
        ];

        let scrollContainer = null;
        for (let selector of scrollSelectors) {
            scrollContainer = document.querySelector(selector);
            if (scrollContainer) {
                console.log(`📜 Found scroll container: ${selector}`);
                break;
            }
        }
        
        if (scrollContainer) {
            scrollContainer.scrollTop += 400;
            console.log('📜 Auto-scrolling...');
        } else {
            // Fallback to window scroll
            window.scrollBy(0, 400);
            console.log('📜 Window scrolling...');
        }

        // Continue scrolling
        setTimeout(() => this.autoScroll(), 3000);
    }
}

// Initialize the extractor when the page loads
console.log('🎯 Google Maps Lead Extractor loaded');

// Wait for page to be ready
function initializeExtractor() {
    if (window.location.href.includes('google.com/maps') || window.location.href.includes('maps.google.com')) {
        console.log('✅ On Google Maps, initializing extractor...');
        window.googleMapsExtractor = new GoogleMapsExtractor();
    } else {
        console.log('❌ Not on Google Maps');
    }
}

// Multiple initialization attempts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtractor);
} else {
    initializeExtractor();
}

// Also try after a short delay
setTimeout(initializeExtractor, 3000);