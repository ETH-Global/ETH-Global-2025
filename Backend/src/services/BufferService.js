const { createClient } = require('@supabase/supabase-js');
const lighthouse = require('@lighthouse-web3/sdk');
const crypto = require('crypto');
const config = require('../config/config');

const { url: supabaseUrl, key: supabaseKey } = config.getSupabaseConfig();
const supabase = createClient(supabaseUrl, supabaseKey);

const { size: BUFFER_SIZE } = config.getBufferConfig();
const { apiKey: LIGHTHOUSE_API_KEY, privateKey: LIGHTHOUSE_PRIVATE_KEY } = config.getLighthouseConfig();

class BufferService {
    constructor() {
        this.encryptionKey = crypto.createHash('sha256').update(LIGHTHOUSE_PRIVATE_KEY || 'default-key').digest();
    }

    /**
     * Encrypt data using AES-256-GCM
     */
    encryptData(data) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
            cipher.setAAD(Buffer.from('lighthouse-data', 'utf8'));
            
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
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
     * Get users with filled buffers
     */
    async getUsersWithFilledBuffers() {
        try {
            // Get all buffer records and check which ones have filled arrays
            const { data, error } = await supabase
                .from('user_data_buffer')
                .select('user_id, record_json');

            if (error) {
                console.error('Error getting buffer data:', error);
                throw error;
            }

            // Group by user_id and check if any buffer has >= BUFFER_SIZE records
            const userBufferCounts = {};
            (data || []).forEach(record => {
                if (!userBufferCounts[record.user_id]) {
                    userBufferCounts[record.user_id] = 0;
                }
                // Add the count of records in this buffer
                userBufferCounts[record.user_id] += (record.record_json || []).length;
            });

            // Filter users with filled buffers
            const usersWithFilledBuffers = Object.entries(userBufferCounts)
                .filter(([userId, count]) => count >= BUFFER_SIZE)
                .map(([userId, count]) => ({ user_id: parseInt(userId), buffer_count: count }));

            return usersWithFilledBuffers;
        } catch (error) {
            console.error('Error in getUsersWithFilledBuffers:', error);
            throw error;
        }
    }

    /**
     * Get buffer entries for a specific user
     */
    async getBufferEntriesForUser(userId, limit = BUFFER_SIZE) {
        try {
            const { data, error } = await supabase
                .from('user_data_buffer')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error getting buffer entries:', error);
                throw error;
            }

            // Flatten all records from all buffers for this user
            const allRecords = [];
            (data || []).forEach(buffer => {
                const records = buffer.record_json || [];
                records.forEach((record, index) => {
                    allRecords.push({
                        id: `${buffer.id}_${index}`,
                        buffer_id: buffer.id,
                        record_data: record,
                        created_at: buffer.created_at
                    });
                });
            });

            // Return up to the limit
            return allRecords.slice(0, limit);
        } catch (error) {
            console.error('Error in getBufferEntriesForUser:', error);
            throw error;
        }
    }

    /**
     * Format data for Lighthouse storage
     */
    formatDataForLighthouse(bufferEntries, userId) {
        try {
            const formattedData = bufferEntries.map((entry, index) => {
                return {
                    website_uid: entry.record_data.wuid,
                    cleanedJson: entry.record_data.cleaned,
                    context: entry.record_data.context || ""
                };
            });

            return [{
                user_id: userId,
                data: formattedData
            }];
        } catch (error) {
            console.error('Error formatting data for Lighthouse:', error);
            throw error;
        }
    }

    /**
     * Upload data to Lighthouse
     */
    async uploadToLighthouse(formattedData) {
        try {
            if (!LIGHTHOUSE_API_KEY) {
                throw new Error('Lighthouse API key not configured');
            }

            // Encrypt the data before uploading
            const encryptedData = this.encryptData(formattedData);
            
            // Create a temporary file buffer for upload
            const dataBuffer = Buffer.from(JSON.stringify(encryptedData), 'utf8');
            
            // Upload to Lighthouse
            const uploadResponse = await lighthouse.upload(
                [dataBuffer],
                LIGHTHOUSE_API_KEY,
                false, // dealStatus
                undefined, // publicKey
                undefined, // signedMessage
                `batch_${Date.now()}.json` // fileName
            );

            if (!uploadResponse || !uploadResponse.data || !uploadResponse.data.Hash) {
                throw new Error('Invalid response from Lighthouse');
            }

            return {
                success: true,
                hash: uploadResponse.data.Hash,
                fileName: uploadResponse.data.Name,
                size: uploadResponse.data.Size
            };
        } catch (error) {
            console.error('Error uploading to Lighthouse:', error);
            throw error;
        }
    }

    /**
     * Delete processed buffer entries
     */
    async deleteProcessedBuffers(userId, processedCount) {
        try {
            // Get all buffers for the user
            const { data: buffers, error: fetchError } = await supabase
                .from('user_data_buffer')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (fetchError) {
                console.error('Error fetching buffers for deletion:', fetchError);
                throw fetchError;
            }

            let remainingToDelete = processedCount;
            const buffersToDelete = [];
            const buffersToUpdate = [];

            for (const buffer of buffers || []) {
                const recordCount = (buffer.record_json || []).length;
                
                if (remainingToDelete >= recordCount) {
                    // Delete entire buffer
                    buffersToDelete.push(buffer.id);
                    remainingToDelete -= recordCount;
                } else if (remainingToDelete > 0) {
                    // Partial deletion - remove first N records
                    const updatedRecords = buffer.record_json.slice(remainingToDelete);
                    buffersToUpdate.push({
                        id: buffer.id,
                        record_json: updatedRecords
                    });
                    remainingToDelete = 0;
                }
                
                if (remainingToDelete <= 0) break;
            }

            // Delete complete buffers
            if (buffersToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('user_data_buffer')
                    .delete()
                    .in('id', buffersToDelete);

                if (deleteError) {
                    console.error('Error deleting complete buffers:', deleteError);
                    throw deleteError;
                }
            }

            // Update partial buffers
            for (const bufferUpdate of buffersToUpdate) {
                const { error: updateError } = await supabase
                    .from('user_data_buffer')
                    .update({ record_json: bufferUpdate.record_json })
                    .eq('id', bufferUpdate.id);

                if (updateError) {
                    console.error('Error updating partial buffer:', updateError);
                    throw updateError;
                }
            }

            return true;
        } catch (error) {
            console.error('Error in deleteProcessedBuffers:', error);
            throw error;
        }
    }

    /**
     * Log transfer activity
     */
    async logTransferActivity(userId, lighthouseHash, entryCount, status) {
        try {
            const { error } = await supabase
                .from('transfer_logs')
                .insert({
                    user_id: userId,
                    lighthouse_hash: lighthouseHash,
                    entries_transferred: entryCount,
                    status: status,
                    transferred_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error logging transfer activity:', error);
                // Don't throw here as this is just logging
            }
        } catch (error) {
            console.error('Error in logTransferActivity:', error);
            // Don't throw here as this is just logging
        }
    }

    /**
     * Process filled buffers for a single user
     */
    async processUserBuffer(userId) {
        try {
            console.log(`Processing buffer for user: ${userId}`);
            
            // Get buffer entries for the user
            const bufferEntries = await this.getBufferEntriesForUser(userId);
            
            if (bufferEntries.length === 0) {
                console.log(`No buffer entries found for user: ${userId}`);
                return { success: false, message: 'No buffer entries found' };
            }

            // Format data for Lighthouse
            const formattedData = this.formatDataForLighthouse(bufferEntries, userId);

            // Upload to Lighthouse
            const uploadResult = await this.uploadToLighthouse(formattedData);

            // Delete processed buffer entries
            await this.deleteProcessedBuffers(userId, bufferEntries.length);

            // Log the transfer
            await this.logTransferActivity(
                userId,
                uploadResult.hash,
                bufferEntries.length,
                'success'
            );

            console.log(`Successfully processed ${bufferEntries.length} entries for user: ${userId}`);
            console.log(`Lighthouse hash: ${uploadResult.hash}`);

            return {
                success: true,
                userId: userId,
                entriesProcessed: bufferEntries.length,
                lighthouseHash: uploadResult.hash,
                fileName: uploadResult.fileName
            };
        } catch (error) {
            console.error(`Error processing buffer for user ${userId}:`, error);
            
            // Log failed transfer
            await this.logTransferActivity(userId, null, 0, 'failed');
            
            throw error;
        }
    }

    /**
     * Process all filled buffers
     */
    async processAllFilledBuffers() {
        try {
            console.log('Starting buffer processing job...');
            
            // Get users with filled buffers
            const usersWithFilledBuffers = await this.getUsersWithFilledBuffers();
            
            if (usersWithFilledBuffers.length === 0) {
                console.log('No users with filled buffers found');
                return { success: true, message: 'No buffers to process' };
            }

            console.log(`Found ${usersWithFilledBuffers.length} users with filled buffers`);

            const results = [];
            const errors = [];

            // Process each user's buffer
            for (const userInfo of usersWithFilledBuffers) {
                try {
                    const result = await this.processUserBuffer(userInfo.user_id);
                    results.push(result);
                } catch (error) {
                    console.error(`Failed to process buffer for user ${userInfo.user_id}:`, error);
                    errors.push({
                        userId: userInfo.user_id,
                        error: error.message
                    });
                }
            }

            console.log(`Buffer processing completed. Success: ${results.length}, Errors: ${errors.length}`);

            return {
                success: true,
                processedUsers: results.length,
                totalUsers: usersWithFilledBuffers.length,
                results: results,
                errors: errors
            };
        } catch (error) {
            console.error('Error in processAllFilledBuffers:', error);
            throw error;
        }
    }
}

module.exports = BufferService;