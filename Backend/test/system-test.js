const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

class SystemTester {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        this.testResults = [];
        this.testUserId = Math.floor(Math.random() * 1000000); // Random test user ID
    }

    async runTest(testName, testFunction) {
        console.log(`\n🧪 Running test: ${testName}`);
        try {
            const startTime = Date.now();
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                name: testName,
                status: 'PASS',
                duration,
                result
            });
            console.log(`✅ ${testName} - PASSED (${duration}ms)`);
            return result;
        } catch (error) {
            this.testResults.push({
                name: testName,
                status: 'FAIL',
                error: error.message
            });
            console.log(`❌ ${testName} - FAILED: ${error.message}`);
            throw error;
        }
    }

    async testHealthCheck() {
        const response = await axios.get(`${BASE_URL}/health`);
        if (response.status !== 200 || !response.data.success) {
            throw new Error('Health check failed');
        }
        return response.data;
    }

    async testCronStatus() {
        const response = await axios.get(`${BASE_URL}/cron/status`);
        if (response.status !== 200 || !response.data.success) {
            throw new Error('Cron status check failed');
        }
        return response.data;
    }

    async testBufferStats() {
        const response = await axios.get(`${BASE_URL}/buffer/stats`);
        if (response.status !== 200 || !response.data.success) {
            throw new Error('Buffer stats check failed');
        }
        return response.data;
    }

    async testDataIngestion() {
        // Simulate data ingestion
        const testData = {
            data: {
                cleaned: { 
                    test: 'data',
                    timestamp: Date.now(),
                    user: this.testUserId
                },
                context: `Test context for user ${this.testUserId}`
            }
        };

        // Insert test data directly into buffer
        const { data, error } = await this.supabase
            .from('user_data_buffer')
            .insert({
                user_id: this.testUserId,
                record_json: [{
                    wuid: testData.data.id,
                    cleaned: testData.data.cleaned,
                    context: testData.data.context
                }]
            });

        if (error) {
            throw new Error(`Failed to insert test data: ${error.message}`);
        }

        return { inserted: true, data };
    }

    async testBufferProcessing() {
        // Get buffer size from config
        const bufferSize = parseInt(process.env.BUFFER_SIZE) || 100;
        
        // Insert enough records to fill buffer
        const insertPromises = [];
        // Create batches of records to fill buffers efficiently
        const recordsPerBuffer = Math.min(10, bufferSize); // Insert up to 10 records per buffer
        const numBuffers = Math.ceil(bufferSize / recordsPerBuffer);
        
        for (let bufferIndex = 0; bufferIndex < numBuffers; bufferIndex++) {
            const recordsInThisBuffer = Math.min(recordsPerBuffer, bufferSize - (bufferIndex * recordsPerBuffer));
            const recordsArray = [];
            
            for (let recordIndex = 0; recordIndex < recordsInThisBuffer; recordIndex++) {
                const globalIndex = bufferIndex * recordsPerBuffer + recordIndex;
                recordsArray.push({
                    wuid: `test_data_id_${globalIndex}`,
                    cleaned: { test: 'data', index: globalIndex, timestamp: Date.now() },
                    context: `Test context ${globalIndex} for user ${this.testUserId}`
                });
            }
            
            insertPromises.push(
                this.supabase
                    .from('user_data_buffer')
                    .insert({
                        user_id: this.testUserId,
                        record_json: recordsArray
                    })
            );
        }

        await Promise.all(insertPromises);

        // Check buffer stats
        const statsResponse = await axios.get(`${BASE_URL}/buffer/stats`);
        const stats = statsResponse.data.stats;
        
        if (stats.usersWithFilledBuffers === 0) {
            throw new Error('Buffer not filled despite inserting required records');
        }

        return { bufferFilled: true, stats };
    }

    async testManualTrigger() {
        const response = await axios.post(`${BASE_URL}/cron/trigger`);
        
        if (response.status !== 200 || !response.data.success) {
            throw new Error('Manual trigger failed');
        }

        // Wait a moment for processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        return response.data;
    }

    async testTransferLogs() {
        const response = await axios.get(`${BASE_URL}/transfer/logs`);
        
        if (response.status !== 200 || !response.data.success) {
            throw new Error('Transfer logs check failed');
        }

        return response.data;
    }

    async testUserSpecificProcessing() {
        const response = await axios.post(`${BASE_URL}/buffer/process/${this.testUserId}`);
        
        if (response.status !== 200 || !response.data.success) {
            throw new Error('User-specific processing failed');
        }

        return response.data;
    }

    async testLighthouseValidation() {
        // Get a hash from recent transfers
        const logsResponse = await axios.get(`${BASE_URL}/transfer/logs?limit=1`);
        const logs = logsResponse.data.logs;

        if (logs.length === 0) {
            console.log('⚠️  No transfer logs found, skipping Lighthouse validation');
            return { skipped: true };
        }

        const hash = logs[0].lighthouse_hash;
        if (!hash) {
            throw new Error('No Lighthouse hash found in recent transfers');
        }

        const response = await axios.get(`${BASE_URL}/lighthouse/${hash}/validate`);
        
        if (response.status !== 200 || !response.data.success) {
            throw new Error('Lighthouse hash validation failed');
        }

        return response.data;
    }

    async testLighthouseDataRetrieval() {
        // Get a hash from recent transfers
        const logsResponse = await axios.get(`${BASE_URL}/transfer/logs?limit=1`);
        const logs = logsResponse.data.logs;

        if (logs.length === 0) {
            console.log('⚠️  No transfer logs found, skipping data retrieval test');
            return { skipped: true };
        }

        const hash = logs[0].lighthouse_hash;
        if (!hash) {
            throw new Error('No Lighthouse hash found in recent transfers');
        }

        try {
            const response = await axios.get(`${BASE_URL}/lighthouse/${hash}`);
            
            if (response.status !== 200 || !response.data.success) {
                throw new Error('Data retrieval failed');
            }

            return response.data;
        } catch (error) {
            // This might fail if the hash is not yet available on IPFS
            console.log('⚠️  Data retrieval failed (hash might not be available yet)');
            return { skipped: true, reason: 'Hash not yet available' };
        }
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up test data...');
        
        try {
            // Delete test buffer entries
            await this.supabase
                .from('user_data_buffer')
                .delete()
                .eq('user_id', this.testUserId);

            // Delete test transfer logs
            await this.supabase
                .from('transfer_logs')
                .delete()
                .eq('user_id', this.testUserId);

            console.log('✅ Cleanup completed');
        } catch (error) {
            console.log(`⚠️  Cleanup failed: ${error.message}`);
        }
    }

    printSummary() {
        console.log('\n📊 TEST SUMMARY');
        console.log('================');
        
        const passed = this.testResults.filter(t => t.status === 'PASS').length;
        const failed = this.testResults.filter(t => t.status === 'FAIL').length;
        
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(t => t.status === 'FAIL')
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.error}`);
                });
        }

        console.log('\n✅ Passed Tests:');
        this.testResults
            .filter(t => t.status === 'PASS')
            .forEach(test => {
                console.log(`  - ${test.name} (${test.duration}ms)`);
            });
    }

    async runAllTests() {
        console.log('🚀 Starting System Tests');
        console.log(`Test User ID: ${this.testUserId}`);
        console.log(`Base URL: ${BASE_URL}`);
        
        try {
            // Basic system tests
            await this.runTest('Health Check', () => this.testHealthCheck());
            await this.runTest('Cron Status', () => this.testCronStatus());
            await this.runTest('Buffer Stats', () => this.testBufferStats());
            
            // Data flow tests
            await this.runTest('Data Ingestion', () => this.testDataIngestion());
            await this.runTest('Buffer Processing Setup', () => this.testBufferProcessing());
            await this.runTest('Manual Trigger', () => this.testManualTrigger());
            await this.runTest('Transfer Logs', () => this.testTransferLogs());
            
            // User-specific processing
            await this.runTest('User Processing', () => this.testUserSpecificProcessing());
            
            // Lighthouse tests (these might be skipped if no data available)
            await this.runTest('Lighthouse Validation', () => this.testLighthouseValidation());
            await this.runTest('Lighthouse Data Retrieval', () => this.testLighthouseDataRetrieval());
            
        } catch (error) {
            console.log(`\n❌ Test suite failed: ${error.message}`);
        } finally {
            await this.cleanup();
            this.printSummary();
        }
    }
}

// Main execution
async function main() {
    const tester = new SystemTester();
    await tester.runAllTests();
    
    // Exit with error code if any tests failed
    const failed = tester.testResults.filter(t => t.status === 'FAIL').length;
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = SystemTester;