// Google Maps Lead Extractor - Popup Script
class PopupManager {
    constructor() {
        this.allLeads = [];
        this.filteredLeads = [];
        this.currentPage = 1;
        this.leadsPerPage = 10;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadLeads();
        this.updateUI();
    }

    setupEventListeners() {
        // Button events
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.loadLeads();
        });

        document.getElementById('download-csv').addEventListener('click', () => {
            this.downloadCSV();
        });

        document.getElementById('clear-all-data').addEventListener('click', () => {
            this.clearAllData();
        });

        document.getElementById('export-json').addEventListener('click', () => {
            this.exportJSON();
        });

        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterLeads(e.target.value);
        });

        // Pagination events
        document.getElementById('prev-page').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.displayLeads();
            }
        });

        document.getElementById('next-page').addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredLeads.length / this.leadsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.displayLeads();
            }
        });
    }

    async loadLeads() {
        try {
            // Get leads from active tab's content script
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab && tab.url && (tab.url.includes('google.com/maps') || tab.url.includes('maps.google.com'))) {
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'getLeads' });
                if (response && response.leads) {
                    this.allLeads = response.leads;
                    this.filteredLeads = [...this.allLeads];
                    this.currentPage = 1;
                }
            } else {
                // Load from storage if not on Google Maps
                const stored = await chrome.storage.local.get(['extractedLeads']);
                if (stored.extractedLeads) {
                    this.allLeads = stored.extractedLeads;
                    this.filteredLeads = [...this.allLeads];
                }
            }
        } catch (error) {
            console.error('Error loading leads:', error);
        }
        
        this.updateUI();
    }

    filterLeads(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredLeads = [...this.allLeads];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredLeads = this.allLeads.filter(lead => 
                lead.name.toLowerCase().includes(term) ||
                lead.fulladdr.toLowerCase().includes(term) ||
                lead.categories.toLowerCase().includes(term) ||
                lead.query.toLowerCase().includes(term)
            );
        }
        
        this.currentPage = 1;
        this.displayLeads();
        this.updatePagination();
    }

    updateUI() {
        // Update stats
        document.getElementById('total-leads').textContent = this.allLeads.length;
        
        // Update download button state
        const downloadBtn = document.getElementById('download-csv');
        downloadBtn.disabled = this.allLeads.length === 0;
        
        // Display leads
        this.displayLeads();
        this.updatePagination();
    }

    displayLeads() {
        const container = document.getElementById('leads-container');
        const emptyState = document.getElementById('empty-state');
        
        if (this.filteredLeads.length === 0) {
            emptyState.style.display = 'block';
            container.innerHTML = '';
            container.appendChild(emptyState);
            return;
        }

        emptyState.style.display = 'none';
        
        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.leadsPerPage;
        const endIndex = startIndex + this.leadsPerPage;
        const pageLeads = this.filteredLeads.slice(startIndex, endIndex);
        
        // Create leads HTML
        container.innerHTML = pageLeads.map(lead => this.createLeadCard(lead)).join('');
    }

    createLeadCard(lead) {
        const rating = lead.rating > 0 ? '⭐'.repeat(Math.floor(lead.rating)) : 'No rating';
        const reviews = lead.reviews > 0 ? `${lead.reviews} reviews` : 'No reviews';
        const phone = lead.phone_numbers || 'No phone';
        const website = lead.website ? `<a href="${lead.website}" target="_blank" class="website-link">🌐 Website</a>` : '';
        
        return `
            <div class="lead-card" data-uuid="${lead.uuid}">
                <div class="lead-header">
                    <div class="lead-info">
                        <h4 class="lead-name">${this.escapeHtml(lead.name)}</h4>
                        <span class="lead-category">${this.escapeHtml(lead.categories)}</span>
                    </div>
                    ${lead.thumbnail ? `<img src="${lead.thumbnail}" alt="${lead.name}" class="lead-thumbnail">` : ''}
                </div>
                
                <div class="lead-details">
                    <div class="detail-row">
                        <span class="detail-icon">📍</span>
                        <span class="detail-text">${this.escapeHtml(lead.fulladdr)}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-icon">⭐</span>
                        <span class="detail-text">${rating} (${reviews})</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-icon">📞</span>
                        <span class="detail-text">${this.escapeHtml(phone)}</span>
                    </div>
                    
                    ${website ? `<div class="detail-row">${website}</div>` : ''}
                </div>
                
                <div class="lead-footer">
                    <span class="lead-query">Query: ${this.escapeHtml(lead.query)}</span>
                    <span class="lead-date">${new Date(lead.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        `;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredLeads.length / this.leadsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.style.display = 'none';
        } else {
            pagination.style.display = 'flex';
            document.getElementById('current-page').textContent = this.currentPage;
            document.getElementById('total-pages').textContent = totalPages;
            
            document.getElementById('prev-page').disabled = this.currentPage === 1;
            document.getElementById('next-page').disabled = this.currentPage === totalPages;
        }
    }

    downloadCSV() {
        if (this.allLeads.length === 0) {
            alert('No leads to download!');
            return;
        }

        const csvContent = this.generateCSV(this.allLeads);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `google-maps-leads-${timestamp}.csv`;
        
        this.downloadFile(csvContent, filename, 'text/csv');
    }

    exportJSON() {
        if (this.allLeads.length === 0) {
            alert('No leads to export!');
            return;
        }

        const jsonContent = JSON.stringify(this.allLeads, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `google-maps-leads-${timestamp}.json`;
        
        this.downloadFile(jsonContent, filename, 'application/json');
    }

    generateCSV(leads) {
        // CSV Headers as requested
        const headers = [
            'uuid', 'query', 'name', 'url', 'domain', 'fulladdr', 'addr1', 'addr2', 
            'addr3', 'addr4', 'district', 'timezone', 'reviews', 'review_url', 'rating', 
            'latitude', 'longitude', 'categories', 'local_name', 'local_fulladdr', 
            'thumbnail', 'phone_numbers', 'website', 'created_at'
        ];

        const csvRows = [headers.join(',')];

        leads.forEach(lead => {
            const row = headers.map(header => {
                const value = lead[header] || '';
                // Escape commas and quotes in CSV
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('Download error:', chrome.runtime.lastError);
                alert('Download failed. Please try again.');
            } else {
                console.log('Download started:', downloadId);
            }
            URL.revokeObjectURL(url);
        });
    }

    async clearAllData() {
        if (confirm('Are you sure you want to clear all extracted leads? This action cannot be undone.')) {
            this.allLeads = [];
            this.filteredLeads = [];
            this.currentPage = 1;
            
            // Clear from storage
            await chrome.storage.local.remove(['extractedLeads']);
            
            // Clear from content script if on Google Maps
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.url && (tab.url.includes('google.com/maps') || tab.url.includes('maps.google.com'))) {
                    await chrome.tabs.sendMessage(tab.id, { action: 'clearData' });
                }
            } catch (error) {
                console.error('Error clearing content script data:', error);
            }
            
            this.updateUI();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});

// Auto-refresh every 5 seconds when popup is open
setInterval(async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && (tab.url.includes('google.com/maps') || tab.url.includes('maps.google.com'))) {
            // Only auto-refresh if we're on Google Maps
            if (window.popupManager) {
                window.popupManager.loadLeads();
            }
        }
    } catch (error) {
        // Silently fail - popup might be closed
    }
}, 5000);