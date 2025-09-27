const cron = require('node-cron');
const BufferService = require('./BufferService');
require('dotenv').config();

class CronService {
    constructor() {
        this.bufferService = new BufferService();
        this.cronSchedule = process.env.CRON_SCHEDULE || '*/5 * * * *'; // Default: every 5 minutes
        this.isRunning = false;
        this.job = null;
    }

    /**
     * Start the cron job
     */
    start() {
        try {
            if (this.job) {
                console.log('Cron job is already running');
                return;
            }

            console.log(`Starting cron job with schedule: ${this.cronSchedule}`);
            
            this.job = cron.schedule(this.cronSchedule, async () => {
                if (this.isRunning) {
                    console.log('Previous buffer processing job is still running, skipping this cycle');
                    return;
                }

                this.isRunning = true;
                try {
                    console.log('=== Buffer Processing Cron Job Started ===');
                    const startTime = Date.now();
                    
                    const result = await this.bufferService.processAllFilledBuffers();
                    
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    
                    console.log('=== Buffer Processing Cron Job Completed ===');
                    console.log(`Duration: ${duration}ms`);
                    console.log(`Processed Users: ${result.processedUsers}`);
                    console.log(`Total Users: ${result.totalUsers}`);
                    
                    if (result.errors && result.errors.length > 0) {
                        console.log(`Errors: ${result.errors.length}`);
                        result.errors.forEach(error => {
                            console.log(`- User ${error.userId}: ${error.error}`);
                        });
                    }
                } catch (error) {
                    console.error('Error in cron job execution:', error);
                } finally {
                    this.isRunning = false;
                }
            }, {
                scheduled: false,
                timezone: process.env.TZ || 'UTC'
            });

            this.job.start();
            console.log('Cron job started successfully');
        } catch (error) {
            console.error('Error starting cron job:', error);
            throw error;
        }
    }

    /**
     * Stop the cron job
     */
    stop() {
        try {
            if (!this.job) {
                console.log('No cron job is running');
                return;
            }

            this.job.stop();
            this.job = null;
            console.log('Cron job stopped successfully');
        } catch (error) {
            console.error('Error stopping cron job:', error);
            throw error;
        }
    }

    /**
     * Get cron job status
     */
    getStatus() {
        return {
            isScheduled: this.job !== null,
            isRunning: this.isRunning,
            schedule: this.cronSchedule,
            timezone: process.env.TZ || 'UTC'
        };
    }

    /**
     * Manually trigger buffer processing (for testing or manual execution)
     */
    async triggerManualProcessing() {
        try {
            if (this.isRunning) {
                throw new Error('Buffer processing is already running');
            }

            console.log('=== Manual Buffer Processing Triggered ===');
            this.isRunning = true;
            
            const startTime = Date.now();
            const result = await this.bufferService.processAllFilledBuffers();
            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log('=== Manual Buffer Processing Completed ===');
            console.log(`Duration: ${duration}ms`);

            return {
                success: true,
                duration,
                ...result
            };
        } catch (error) {
            console.error('Error in manual buffer processing:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Update cron schedule
     */
    updateSchedule(newSchedule) {
        try {
            // Validate the cron expression
            if (!cron.validate(newSchedule)) {
                throw new Error('Invalid cron expression');
            }

            // Stop current job if running
            this.stop();

            // Update schedule
            this.cronSchedule = newSchedule;

            // Start with new schedule
            this.start();

            console.log(`Cron schedule updated to: ${newSchedule}`);
            return true;
        } catch (error) {
            console.error('Error updating cron schedule:', error);
            throw error;
        }
    }
}

module.exports = CronService;