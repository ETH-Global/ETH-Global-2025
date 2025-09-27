const CronService = require('../services/CronService');
const BufferService = require('../services/BufferService');
const LighthouseUtils = require('../../utilities/LighthouseUtils');

class CronController {
    constructor() {
        this.cronService = new CronService();
        this.bufferService = new BufferService();
        this.lighthouseUtils = new LighthouseUtils();
    }

    /**
     * Get cron job status
     */
    async getStatus(req, res) {
        try {
            const status = this.cronService.getStatus();
            res.status(200).json({
                success: true,
                status
            });
        } catch (error) {
            console.error('Error getting cron status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get cron status'
            });
        }
    }

    /**
     * Start cron job
     */
    async startCron(req, res) {
        try {
            this.cronService.start();
            res.status(200).json({
                success: true,
                message: 'Cron job started successfully'
            });
        } catch (error) {
            console.error('Error starting cron job:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to start cron job'
            });
        }
    }

    /**
     * Stop cron job
     */
    async stopCron(req, res) {
        try {
            this.cronService.stop();
            res.status(200).json({
                success: true,
                message: 'Cron job stopped successfully'
            });
        } catch (error) {
            console.error('Error stopping cron job:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to stop cron job'
            });
        }
    }

    /**
     * Update cron schedule
     */
    async updateSchedule(req, res) {
        try {
            const { schedule } = req.body;
            
            if (!schedule) {
                return res.status(400).json({
                    success: false,
                    error: 'Schedule is required'
                });
            }

            this.cronService.updateSchedule(schedule);
            res.status(200).json({
                success: true,
                message: 'Cron schedule updated successfully',
                newSchedule: schedule
            });
        } catch (error) {
            console.error('Error updating cron schedule:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update cron schedule'
            });
        }
    }

    /**
     * Manually trigger buffer processing
     */
    async triggerManualProcessing(req, res) {
        try {
            const result = await this.cronService.triggerManualProcessing();
            res.status(200).json({
                success: true,
                message: 'Manual buffer processing completed',
                result
            });
        } catch (error) {
            console.error('Error in manual buffer processing:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to process buffers manually'
            });
        }
    }

    /**
     * Get buffer statistics
     */
    async getBufferStats(req, res) {
        try {
            const { data: allBuffers, error: totalError } = await this.bufferService.supabase
                .from('user_data_buffer')
                .select('user_id, record_json');

            if (totalError) {
                throw totalError;
            }

            const bufferSize = parseInt(process.env.BUFFER_SIZE) || 100;
            
            // Calculate statistics from array-based buffers
            const userStats = {};
            let totalRecords = 0;
            
            (allBuffers || []).forEach(buffer => {
                const recordCount = (buffer.record_json || []).length;
                totalRecords += recordCount;
                
                if (!userStats[buffer.user_id]) {
                    userStats[buffer.user_id] = {
                        user_id: buffer.user_id,
                        entry_count: 0
                    };
                }
                userStats[buffer.user_id].entry_count += recordCount;
            });

            const userStatsArray = Object.values(userStats);
            const usersWithFilledBuffers = userStatsArray.filter(user => user.entry_count >= bufferSize);

            res.status(200).json({
                success: true,
                stats: {
                    totalBufferEntries: totalRecords,
                    totalBuffers: allBuffers?.length || 0,
                    totalUsers: userStatsArray.length,
                    usersWithFilledBuffers: usersWithFilledBuffers.length,
                    bufferSize: bufferSize,
                    userBreakdown: userStatsArray
                }
            });
        } catch (error) {
            console.error('Error getting buffer stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get buffer statistics'
            });
        }
    }

    /**
     * Get transfer logs
     */
    async getTransferLogs(req, res) {
        try {
            const { limit = 50, offset = 0, user_id } = req.query;
            
            let query = this.bufferService.supabase
                .from('transfer_logs')
                .select('*')
                .order('transferred_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (user_id) {
                query = query.eq('user_id', user_id);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            res.status(200).json({
                success: true,
                logs: data || [],
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: data?.length === parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Error getting transfer logs:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get transfer logs'
            });
        }
    }

    /**
     * Process specific user's buffer
     */
    async processUserBuffer(req, res) {
        try {
            const { user_id } = req.params;
            
            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID is required'
                });
            }

            const result = await this.bufferService.processUserBuffer(parseInt(user_id));
            
            res.status(200).json({
                success: true,
                message: 'User buffer processed successfully',
                result
            });
        } catch (error) {
            console.error('Error processing user buffer:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to process user buffer'
            });
        }
    }

    /**
     * Get Lighthouse data by hash (decrypt and return)
     */
    async getLighthouseData(req, res) {
        try {
            const { hash } = req.params;
            const { user_id, website_uid } = req.query;
            
            if (!hash) {
                return res.status(400).json({
                    success: false,
                    error: 'Lighthouse hash is required'
                });
            }

            let data;
            
            if (website_uid) {
                // Search by website UID
                data = await this.lighthouseUtils.searchByWebsiteUid(hash, website_uid);
            } else if (user_id) {
                // Get data for specific user
                data = await this.lighthouseUtils.getUserData(hash, user_id);
            } else {
                // Get all data
                data = await this.lighthouseUtils.getDecryptedData(hash);
            }

            res.status(200).json({
                success: true,
                hash: hash,
                data: data
            });
        } catch (error) {
            console.error('Error retrieving Lighthouse data:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to retrieve data from Lighthouse'
            });
        }
    }

    /**
     * Get file information from Lighthouse
     */
    async getLighthouseFileInfo(req, res) {
        try {
            const { hash } = req.params;
            
            if (!hash) {
                return res.status(400).json({
                    success: false,
                    error: 'Lighthouse hash is required'
                });
            }

            const fileInfo = await this.lighthouseUtils.getFileInfo(hash);
            
            res.status(200).json({
                success: true,
                fileInfo: fileInfo
            });
        } catch (error) {
            console.error('Error getting file info:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get file information'
            });
        }
    }

    /**
     * Validate Lighthouse hash
     */
    async validateLighthouseHash(req, res) {
        try {
            const { hash } = req.params;
            
            if (!hash) {
                return res.status(400).json({
                    success: false,
                    error: 'Lighthouse hash is required'
                });
            }

            const validation = await this.lighthouseUtils.validateHash(hash);
            
            res.status(200).json({
                success: true,
                validation: validation
            });
        } catch (error) {
            console.error('Error validating hash:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to validate hash'
            });
        }
    }

    /**
     * Get website UIDs from a hash
     */
    async getWebsiteUids(req, res) {
        try {
            const { hash } = req.params;
            
            if (!hash) {
                return res.status(400).json({
                    success: false,
                    error: 'Lighthouse hash is required'
                });
            }

            const websiteUids = await this.lighthouseUtils.getWebsiteUids(hash);
            
            res.status(200).json({
                success: true,
                websiteUids: websiteUids,
                count: websiteUids.length
            });
        } catch (error) {
            console.error('Error getting website UIDs:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get website UIDs'
            });
        }
    }

    /**
     * Health check endpoint
     */
    async healthCheck(req, res) {
        try {
            const cronStatus = this.cronService.getStatus();
            const bufferSize = parseInt(process.env.BUFFER_SIZE) || 100;
            
            res.status(200).json({
                success: true,
                health: {
                    cronService: cronStatus.isScheduled ? 'running' : 'stopped',
                    bufferSize: bufferSize,
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV || 'development'
                }
            });
        } catch (error) {
            console.error('Error in health check:', error);
            res.status(500).json({
                success: false,
                error: 'Health check failed'
            });
        }
    }
}

module.exports = new CronController();