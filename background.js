// Google Maps Lead Extractor - Background Service Worker
class BackgroundManager {
    constructor() {
        this.setupEventListeners();
        this.initializeStorage();
    }

    setupEventListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Handle messages from content scripts and popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Handle tab updates to inject content script if needed
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });

        // Periodic data backup
        this.setupPeriodicBackup();
    }

    async handleInstallation(details) {
        if (details.reason === 'install') {
            console.log('Google Maps Lead Extractor installed successfully');
            
            // Initialize storage
            await chrome.storage.local.set({
                extractedLeads: [],
                settings: {
                    autoBackup: true,
                    maxLeads: 10000,
                    extractionDelay: 2000
                },
                stats: {
                    totalExtracted: 0,
                    lastExtractionDate: null,
                    version: chrome.runtime.getManifest().version
                }
            });
            
            // Open welcome page or show notification
            this.showWelcomeNotification();
        } else if (details.reason === 'update') {
            console.log('Google Maps Lead Extractor updated');
            this.handleUpdate(details);
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'saveLeads':
                    await this.saveLeads(request.leads);
                    sendResponse({ success: true });
                    break;

                case 'getLeads':
                    const leads = await this.getStoredLeads();
                    sendResponse({ leads: leads });
                    break;

                case 'clearLeads':
                    await this.clearStoredLeads();
                    sendResponse({ success: true });
                    break;

                case 'getStats':
                    const stats = await this.getStats();
                    sendResponse({ stats: stats });
                    break;

                case 'updateSettings':
                    await this.updateSettings(request.settings);
                    sendResponse({ success: true });
                    break;

                case 'exportData':
                    const exportData = await this.exportAllData();
                    sendResponse({ data: exportData });
                    break;

                case 'importData':
                    await this.importData(request.data);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ error: error.message });
        }
    }

    async handleTabUpdate(tabId, changeInfo, tab) {
        // Inject content script if on Google Maps and page is loaded
        if (changeInfo.status === 'complete' && tab.url) {
            if (tab.url.includes('google.com/maps') || tab.url.includes('maps.google.com')) {
                try {
                    // Check if content script is already injected
                    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
                } catch (error) {
                    // Content script not injected, inject it
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content.js']
                        });
                        
                        await chrome.scripting.insertCSS({
                            target: { tabId: tabId },
                            files: ['content.css']
                        });
                    } catch (injectionError) {
                        console.error('Failed to inject content script:', injectionError);
                    }
                }
            }
        }
    }

    async initializeStorage() {
        try {
            const stored = await chrome.storage.local.get([
                'extractedLeads', 
                'settings', 
                'stats'
            ]);

            // Initialize with defaults if not exists
            if (!stored.extractedLeads) {
                await chrome.storage.local.set({ extractedLeads: [] });
            }

            if (!stored.settings) {
                await chrome.storage.local.set({
                    settings: {
                        autoBackup: true,
                        maxLeads: 10000,
                        extractionDelay: 2000,
                        autoScroll: true,
                        notifications: true
                    }
                });
            }

            if (!stored.stats) {
                await chrome.storage.local.set({
                    stats: {
                        totalExtracted: 0,
                        lastExtractionDate: null,
                        version: chrome.runtime.getManifest().version,
                        installDate: new Date().toISOString()
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing storage:', error);
        }
    }

    async saveLeads(leads) {
        try {
            const stored = await chrome.storage.local.get(['extractedLeads', 'stats', 'settings']);
            const existingLeads = stored.extractedLeads || [];
            const settings = stored.settings || {};
            
            // Merge new leads with existing ones (avoid duplicates)
            const mergedLeads = this.mergeLeads(existingLeads, leads);
            
            // Apply max leads limit
            const maxLeads = settings.maxLeads || 10000;
            const finalLeads = mergedLeads.slice(-maxLeads);
            
            // Update storage
            await chrome.storage.local.set({ 
                extractedLeads: finalLeads,
                stats: {
                    ...stored.stats,
                    totalExtracted: finalLeads.length,
                    lastExtractionDate: new Date().toISOString()
                }
            });

            console.log(`Saved ${finalLeads.length} leads to storage`);
        } catch (error) {
            console.error('Error saving leads:', error);
            throw error;
        }
    }

    mergeLeads(existingLeads, newLeads) {
        const leadsMap = new Map();
        
        // Add existing leads
        existingLeads.forEach(lead => {
            const key = `${lead.name}-${lead.fulladdr}`;
            leadsMap.set(key, lead);
        });
        
        // Add new leads (will overwrite duplicates)
        newLeads.forEach(lead => {
            const key = `${lead.name}-${lead.fulladdr}`;
            leadsMap.set(key, lead);
        });
        
        return Array.from(leadsMap.values());
    }

    async getStoredLeads() {
        try {
            const stored = await chrome.storage.local.get(['extractedLeads']);
            return stored.extractedLeads || [];
        } catch (error) {
            console.error('Error getting stored leads:', error);
            return [];
        }
    }

    async clearStoredLeads() {
        try {
            await chrome.storage.local.set({ extractedLeads: [] });
            console.log('Cleared all stored leads');
        } catch (error) {
            console.error('Error clearing leads:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const stored = await chrome.storage.local.get(['stats', 'extractedLeads']);
            const leads = stored.extractedLeads || [];
            
            return {
                ...stored.stats,
                totalExtracted: leads.length,
                uniqueQueries: new Set(leads.map(lead => lead.query)).size,
                averageRating: this.calculateAverageRating(leads),
                topCategories: this.getTopCategories(leads, 5)
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {};
        }
    }

    calculateAverageRating(leads) {
        const ratingsWithValues = leads.filter(lead => lead.rating > 0);
        if (ratingsWithValues.length === 0) return 0;
        
        const sum = ratingsWithValues.reduce((acc, lead) => acc + lead.rating, 0);
        return (sum / ratingsWithValues.length).toFixed(1);
    }

    getTopCategories(leads, limit = 5) {
        const categoryCount = {};
        
        leads.forEach(lead => {
            if (lead.categories) {
                const categories = lead.categories.split(',').map(cat => cat.trim());
                categories.forEach(category => {
                    categoryCount[category] = (categoryCount[category] || 0) + 1;
                });
            }
        });
        
        return Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([category, count]) => ({ category, count }));
    }

    async updateSettings(newSettings) {
        try {
            const stored = await chrome.storage.local.get(['settings']);
            const updatedSettings = { ...stored.settings, ...newSettings };
            await chrome.storage.local.set({ settings: updatedSettings });
            console.log('Settings updated:', updatedSettings);
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }

    async exportAllData() {
        try {
            const data = await chrome.storage.local.get(null);
            return {
                ...data,
                exportDate: new Date().toISOString(),
                version: chrome.runtime.getManifest().version
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    async importData(importData) {
        try {
            // Validate import data
            if (!importData.extractedLeads || !Array.isArray(importData.extractedLeads)) {
                throw new Error('Invalid import data format');
            }

            // Merge with existing data
            const existing = await chrome.storage.local.get(['extractedLeads']);
            const mergedLeads = this.mergeLeads(existing.extractedLeads || [], importData.extractedLeads);
            
            await chrome.storage.local.set({
                extractedLeads: mergedLeads,
                stats: {
                    ...importData.stats,
                    totalExtracted: mergedLeads.length,
                    lastImportDate: new Date().toISOString()
                }
            });

            console.log(`Imported ${importData.extractedLeads.length} leads`);
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    setupPeriodicBackup() {
        // Create alarm for periodic backup
        chrome.alarms.create('periodicBackup', { periodInMinutes: 60 });
        
        chrome.alarms.onAlarm.addListener(async (alarm) => {
            if (alarm.name === 'periodicBackup') {
                await this.performBackup();
            }
        });
    }

    async performBackup() {
        try {
            const settings = await chrome.storage.local.get(['settings']);
            if (settings.settings?.autoBackup) {
                const data = await this.exportAllData();
                // Here you could implement cloud backup or local file backup
                console.log('Periodic backup completed');
            }
        } catch (error) {
            console.error('Error during periodic backup:', error);
        }
    }

    async handleUpdate(details) {
        try {
            // Handle extension updates
            const stats = await chrome.storage.local.get(['stats']);
            await chrome.storage.local.set({
                stats: {
                    ...stats.stats,
                    version: chrome.runtime.getManifest().version,
                    lastUpdateDate: new Date().toISOString(),
                    previousVersion: details.previousVersion
                }
            });
        } catch (error) {
            console.error('Error handling update:', error);
        }
    }

    showWelcomeNotification() {
        // Show a notification to welcome the user
        if (chrome.notifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Google Maps Lead Extractor',
                message: 'Extension installed successfully! Visit Google Maps to start extracting leads.'
            });
        }
    }
}

// Initialize the background manager
new BackgroundManager();