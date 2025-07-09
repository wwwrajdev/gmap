// Google Maps Lead Extractor - Content Script
class GoogleMapsExtractor {
    constructor() {
        this.extractedLeads = [];
        this.isExtracting = false;
        this.currentQuery = '';
        this.observer = null;
        this.init();
    }

    init() {
        this.createExtractorUI();
        this.setupMessageListener();
        this.observePageChanges();
    }

    createExtractorUI() {
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
                </div>
                <div class="progress-bar" style="display:none;">
                    <div class="progress-fill"></div>
                </div>
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
            }
        });
    }

    observePageChanges() {
        this.observer = new MutationObserver((mutations) => {
            if (this.isExtracting) {
                this.extractVisibleBusinesses();
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
        
        this.extractVisibleBusinesses();
        this.autoScroll();
    }

    stopExtraction() {
        this.isExtracting = false;
        
        document.getElementById('start-extraction').style.display = 'inline-block';
        document.getElementById('stop-extraction').style.display = 'none';
        document.querySelector('.progress-bar').style.display = 'none';
        document.querySelector('.status').textContent = `Extracted ${this.extractedLeads.length} leads`;
    }

    clearData() {
        this.extractedLeads = [];
        this.updateLeadCount();
        document.querySelector('.status').textContent = 'Ready to extract';
    }

    getCurrentSearchQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('query') || urlParams.get('q') || 'Unknown';
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    extractVisibleBusinesses() {
        const businessElements = document.querySelectorAll('[data-result-index]');
        
        businessElements.forEach(element => {
            try {
                const businessData = this.extractBusinessData(element);
                if (businessData && !this.isDuplicate(businessData)) {
                    this.extractedLeads.push(businessData);
                    this.updateLeadCount();
                }
            } catch (error) {
                console.error('Error extracting business data:', error);
            }
        });
    }

    extractBusinessData(element) {
        try {
            // Extract basic information
            const nameElement = element.querySelector('[data-value="Name"]') || 
                              element.querySelector('h3') || 
                              element.querySelector('.qBF1Pd');
            
            const name = nameElement ? nameElement.textContent.trim() : '';
            if (!name) return null;

            // Extract rating and reviews
            const ratingElement = element.querySelector('[data-value="Rating"]') || 
                                element.querySelector('.MW4etd');
            const rating = ratingElement ? parseFloat(ratingElement.textContent.replace(',', '.')) : 0;

            const reviewsElement = element.querySelector('.UY7F9') || 
                                 element.querySelector('[data-value="Reviews"]');
            const reviews = reviewsElement ? 
                parseInt(reviewsElement.textContent.replace(/[^\d]/g, '')) || 0 : 0;

            // Extract address
            const addressElement = element.querySelector('[data-value="Address"]') || 
                                 element.querySelector('.W4Efsd:last-child');
            const fullAddress = addressElement ? addressElement.textContent.trim() : '';

            // Parse address components
            const addressParts = this.parseAddress(fullAddress);

            // Extract categories/types
            const categoryElement = element.querySelector('.W4Efsd:not(:last-child)') || 
                                  element.querySelector('[data-value="Category"]');
            const categories = categoryElement ? categoryElement.textContent.trim() : '';

            // Extract URL and domain
            const linkElement = element.querySelector('a[href*="/maps/place/"]');
            const url = linkElement ? linkElement.href : '';
            const domain = url ? new URL(url).hostname : '';

            // Extract thumbnail
            const thumbnailElement = element.querySelector('img[src*="googleusercontent.com"]') ||
                                   element.querySelector('img[src*="maps.gstatic.com"]');
            const thumbnail = thumbnailElement ? thumbnailElement.src : '';

            // Extract coordinates from URL if available
            const coordinates = this.extractCoordinates(url);

            // Extract phone number (if visible)
            const phoneElement = element.querySelector('[data-value="Phone"]') ||
                               element.querySelector('[href^="tel:"]');
            const phoneNumbers = phoneElement ? phoneElement.textContent.trim() : '';

            // Extract website (if available)
            const websiteElement = element.querySelector('[data-value="Website"]') ||
                                 element.querySelector('[href^="http"]:not([href*="google.com"])');
            const website = websiteElement ? websiteElement.href || websiteElement.textContent : '';

            return {
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
        } catch (error) {
            console.error('Error in extractBusinessData:', error);
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
            const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
            if (coordMatch) {
                coords.lat = parseFloat(coordMatch[1]);
                coords.lng = parseFloat(coordMatch[2]);
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

        const scrollContainer = document.querySelector('[role="main"]') || 
                              document.querySelector('.m6QErb') ||
                              document.querySelector('[data-value="Search results"]');
        
        if (scrollContainer) {
            scrollContainer.scrollTop += 300;
            setTimeout(() => this.autoScroll(), 2000);
        }
    }
}

// Initialize the extractor when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new GoogleMapsExtractor();
    });
} else {
    new GoogleMapsExtractor();
}