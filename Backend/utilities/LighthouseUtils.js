const lighthouse = require('@lighthouse-web3/sdk');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

class LighthouseUtils {
    constructor() {
        this.apiKey = process.env.LIGHTHOUSE_API_KEY;
        this.privateKey = process.env.LIGHTHOUSE_PRIVATE_KEY;
        this.encryptionKey = crypto.createHash('sha256').update(this.privateKey || 'default-key').digest();
    }

    /**
     * Decrypt data using AES-256-GCM
     */
    decryptData(encryptedData) {
        try {
            const { encrypted, iv, authTag } = encryptedData;
            const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
            
            decipher.setAAD(Buffer.from('lighthouse-data', 'utf8'));
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    /**
     * Get file from Lighthouse IPFS using hash
     */
    async getFileFromIPFS(hash) {
        try {
            if (!hash) {
                throw new Error('IPFS hash is required');
            }

            // Use Lighthouse gateway to fetch the file
            const gatewayUrl = `https://gateway.lighthouse.storage/ipfs/${hash}`;
            
            const response = await axios.get(gatewayUrl, {
                timeout: 30000, // 30 seconds timeout
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.status !== 200) {
                throw new Error(`Failed to fetch file from IPFS: ${response.statusText}`);
            }

            return response.data;
        } catch (error) {
            console.error('Error fetching file from IPFS:', error);
            throw new Error(`Failed to retrieve file from IPFS: ${error.message}`);
        }
    }

    /**
     * Get and decrypt data from Lighthouse storage
     */
    async getDecryptedData(hash) {
        try {
            // Fetch encrypted data from IPFS
            const encryptedData = await this.getFileFromIPFS(hash);
            
            // Decrypt the data
            const decryptedData = this.decryptData(encryptedData);
            
            return decryptedData;
        } catch (error) {
            console.error('Error getting decrypted data:', error);
            throw error;
        }
    }

    /**
     * Get user data by hash and optional user_id filter
     */
    async getUserData(hash, userId = null) {
        try {
            const decryptedData = await this.getDecryptedData(hash);
            
            if (!Array.isArray(decryptedData)) {
                throw new Error('Invalid data format: expected array');
            }

            // If userId is specified, filter the data
            if (userId) {
                const userData = decryptedData.find(item => 
                    item.user_id && item.user_id.toString() === userId.toString()
                );
                
                if (!userData) {
                    throw new Error(`No data found for user ${userId}`);
                }
                
                return userData;
            }

            return decryptedData;
        } catch (error) {
            console.error('Error getting user data:', error);
            throw error;
        }
    }

    /**
     * Search data by website_uid
     */
    async searchByWebsiteUid(hash, websiteUid) {
        try {
            const decryptedData = await this.getDecryptedData(hash);
            
            if (!Array.isArray(decryptedData)) {
                throw new Error('Invalid data format: expected array');
            }

            const results = [];
            
            decryptedData.forEach(userItem => {
                if (userItem.data && Array.isArray(userItem.data)) {
                    const matchingEntries = userItem.data.filter(dataItem => 
                        dataItem.website_uid && dataItem.website_uid.includes(websiteUid)
                    );
                    
                    if (matchingEntries.length > 0) {
                        results.push({
                            user_id: userItem.user_id,
                            data: matchingEntries
                        });
                    }
                }
            });

            return results;
        } catch (error) {
            console.error('Error searching by website UID:', error);
            throw error;
        }
    }

    /**
     * Get file information from Lighthouse
     */
    async getFileInfo(hash) {
        try {
            if (!this.apiKey) {
                throw new Error('Lighthouse API key not configured');
            }

            // This would use the Lighthouse SDK to get file information
            // const fileInfo = await lighthouse.getFileInfo(hash, this.apiKey);
            
            // For now, return basic info from IPFS
            const gatewayUrl = `https://gateway.lighthouse.storage/ipfs/${hash}`;
            
            const response = await axios.head(gatewayUrl, {
                timeout: 10000
            });

            return {
                hash: hash,
                size: response.headers['content-length'] || 'unknown',
                contentType: response.headers['content-type'] || 'unknown',
                lastModified: response.headers['last-modified'] || 'unknown',
                gatewayUrl: gatewayUrl
            };
        } catch (error) {
            console.error('Error getting file info:', error);
            throw new Error(`Failed to get file information: ${error.message}`);
        }
    }

    /**
     * Validate if a hash is accessible
     */
    async validateHash(hash) {
        try {
            const fileInfo = await this.getFileInfo(hash);
            return {
                valid: true,
                accessible: true,
                info: fileInfo
            };
        } catch (error) {
            return {
                valid: false,
                accessible: false,
                error: error.message
            };
        }
    }

    /**
     * Get all data for a specific user from multiple hashes
     */
    async getUserDataFromMultipleHashes(hashes, userId) {
        try {
            if (!Array.isArray(hashes)) {
                throw new Error('Hashes must be an array');
            }

            const results = [];
            const errors = [];

            for (const hash of hashes) {
                try {
                    const userData = await this.getUserData(hash, userId);
                    results.push({
                        hash: hash,
                        data: userData
                    });
                } catch (error) {
                    errors.push({
                        hash: hash,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                results: results,
                errors: errors,
                totalHashes: hashes.length,
                successfulRetrieval: results.length,
                failedRetrieval: errors.length
            };
        } catch (error) {
            console.error('Error getting user data from multiple hashes:', error);
            throw error;
        }
    }

    /**
     * Extract all unique website UIDs from decrypted data
     */
    async getWebsiteUids(hash) {
        try {
            const decryptedData = await this.getDecryptedData(hash);
            
            if (!Array.isArray(decryptedData)) {
                throw new Error('Invalid data format: expected array');
            }

            const websiteUids = new Set();
            
            decryptedData.forEach(userItem => {
                if (userItem.data && Array.isArray(userItem.data)) {
                    userItem.data.forEach(dataItem => {
                        if (dataItem.website_uid) {
                            websiteUids.add(dataItem.website_uid);
                        }
                    });
                }
            });

            return Array.from(websiteUids);
        } catch (error) {
            console.error('Error getting website UIDs:', error);
            throw error;
        }
    }
}

module.exports = LighthouseUtils;