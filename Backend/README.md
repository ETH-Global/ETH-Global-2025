# Buffer Processing & Lighthouse Integration System

This system provides automated buffer management with Lighthouse warm storage integration for efficient data processing and storage.

## Overview

The system consists of:
- **Buffer Management**: Collects user data in Supabase buffers
- **Cron Jobs**: Automatically processes filled buffers
- **Lighthouse Integration**: Encrypts and stores data in IPFS via Lighthouse
- **Data Retrieval**: Decrypt and retrieve stored data from Lighthouse

## Architecture

```
User Data → Supabase Buffer → Cron Job → Lighthouse IPFS
                ↓                ↓            ↓
         Buffer Monitoring → Processing → Encrypted Storage
```

## Environment Variables

Add these to your `.env` file:

```env
PORT=5000
CLEANING_API_URL=your_cleaning_api_url
SUPABASE_KEY=your_supabase_key
SUPABASE_URL=your_supabase_url

# Buffer Configuration
BUFFER_SIZE=100
CRON_SCHEDULE="*/5 * * * *"

# Lighthouse Configuration
LIGHTHOUSE_API_KEY=your_lighthouse_api_key
LIGHTHOUSE_PRIVATE_KEY=your_lighthouse_private_key

# Optional
TZ=UTC
NODE_ENV=production
```

## Database Schema

### user_data_buffer Table
```sql
CREATE TABLE user_data_buffer (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    record_json JSONB NOT NULL, -- Array of JSON objects with structure: [{"wuid": "...", "cleaned": {...}, "context": "..."}]
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### transfer_logs Table
```sql
CREATE TABLE transfer_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    lighthouse_hash TEXT,
    entries_transferred INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    transferred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Data Format

### Buffer Entry Format
```json
{
  "user_id": 123,
  "record_json": [
    {
      "wuid": "data_id_from_cleaning_api_1",
      "cleaned": {
        "title": "Website Title",
        "content": "Website content...",
        "metadata": {...}
      },
      "context": "Context information for this website"
    },
    {
      "wuid": "data_id_from_cleaning_api_2",
      "cleaned": {
        "title": "Another Website",
        "content": "More website content...",
        "metadata": {...}
      },
      "context": "Context information for another website"
    }
  ]
}
```

**Note**: Each buffer record contains an array of JSON objects. When storing website info, the system will:
1. Look for an existing buffer for the user where `record_json.length <= BUFFER_SIZE`
2. Append `{"wuid": data.id, "cleaned": data.cleaned, "context": data.context}` to the existing `record_json` array
3. If no suitable buffer exists or current buffer is full, create a new buffer record

### Lighthouse Storage Format
```json
[
  {
    "user_id": 123,
    "data": [
        {
            "website_uid": "data_id_from_cleaning_api_1",
            "cleanedJson": {...},
            "context": "..."
        }
    ]
  }
]
```

## API Endpoints

### Health & Status
- `GET /health` - System health check
- `GET /cron/status` - Cron job status

### Cron Management
- `POST /cron/start` - Start cron job
- `POST /cron/stop` - Stop cron job
- `PUT /cron/schedule` - Update cron schedule
- `POST /cron/trigger` - Manually trigger processing

### Buffer Management
- `GET /buffer/stats` - Get buffer statistics
- `POST /buffer/process/:user_id` - Process specific user buffer

### Transfer Logs
- `GET /transfer/logs` - Get transfer history
- `GET /transfer/logs?user_id=123` - Get user-specific logs

### Lighthouse Data Retrieval
- `GET /lighthouse/:hash` - Get all data from hash
- `GET /lighthouse/:hash?user_id=123` - Get user-specific data
- `GET /lighthouse/:hash?website_uid=wuid_123` - Search by website UID
- `GET /lighthouse/:hash/info` - Get file information
- `GET /lighthouse/:hash/validate` - Validate hash accessibility
- `GET /lighthouse/:hash/website-uids` - List all website UIDs in file

## Usage Examples

### 1. Start the System
```bash
npm start
# Cron job automatically starts with the application
```

### 2. Check Buffer Status
```bash
curl http://localhost:5000/buffer/stats
```

### 3. Manually Trigger Processing
```bash
curl -X POST http://localhost:5000/cron/trigger
```

### 4. Retrieve Data from Lighthouse
```bash
# Get all data
curl http://localhost:5000/lighthouse/QmHash123...

# Get specific user data
curl http://localhost:5000/lighthouse/QmHash123...?user_id=123

# Search by website UID
curl http://localhost:5000/lighthouse/QmHash123...?website_uid=wuid_123
```

### 5. Update Cron Schedule
```bash
curl -X PUT http://localhost:5000/cron/schedule \
  -H "Content-Type: application/json" \
  -d '{"schedule": "0 */2 * * *"}'  # Every 2 hours
```

## Cron Schedule Examples

- `"*/5 * * * *"` - Every 5 minutes
- `"0 * * * *"` - Every hour
- `"0 */6 * * *"` - Every 6 hours
- `"0 0 * * *"` - Daily at midnight
- `"0 0 * * 0"` - Weekly on Sunday

## Security Features

### Data Encryption
- All data is encrypted using AES-256-GCM before Lighthouse storage
- Encryption key derived from `LIGHTHOUSE_PRIVATE_KEY`
- Additional authenticated data (AAD) for integrity verification

### Access Control
- API endpoints can be protected with authentication middleware
- Environment variables for sensitive configuration
- Secure key management practices

## Monitoring & Logging

### Transfer Logs
The system maintains detailed logs of all transfers:
- Success/failure status
- Number of entries processed
- Lighthouse hash references
- Timestamps and error messages

### Health Checks
- System status monitoring
- Cron job health verification
- Buffer size monitoring
- Environment validation

## Error Handling

### Common Issues

1. **Buffer Size Not Met**
   - Users need at least `BUFFER_SIZE` entries before processing
   - Check current buffer counts with `/buffer/stats`

2. **Lighthouse API Errors**
   - Verify `LIGHTHOUSE_API_KEY` is valid
   - Check network connectivity
   - Monitor API rate limits

3. **Encryption/Decryption Errors**
   - Ensure `LIGHTHOUSE_PRIVATE_KEY` is consistent
   - Verify data format integrity

4. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Monitor connection limits

### Recovery Procedures

1. **Failed Transfers**
   - Check transfer logs for error details
   - Retry with `/cron/trigger`
   - Process specific users with `/buffer/process/:user_id`

2. **Data Corruption**
   - Validate hashes with `/lighthouse/:hash/validate`
   - Re-encrypt and upload if necessary

## Performance Considerations

### Buffer Sizing
- Larger buffers = fewer Lighthouse uploads but more memory usage
- Recommended: 50-200 entries per buffer
- Monitor with `/buffer/stats`

### Cron Frequency
- More frequent = lower latency but higher resource usage
- Recommended: 5-15 minutes for active systems
- Adjust based on data volume

### Batch Processing
- System processes all eligible users in each cron cycle
- Uses sequential processing to avoid overwhelming Lighthouse API
- Monitor performance with transfer logs

## Development & Testing

### Local Setup
```bash
# Install dependencies
npm install

# Set up environment
cp Sample.env .env
# Edit .env with your configuration

# Run database migrations
psql -d your_database -f migrations/create_transfer_logs_table.sql

# Start development server
npm start
```

### Testing Endpoints
```bash
# Test data upload
curl -X POST http://localhost:5000/poll \
  -H "Content-Type: application/json" \
  -d '{"data": "test_data"}'

# Check if buffer is filling
curl http://localhost:5000/buffer/stats

# Manually trigger when ready
curl -X POST http://localhost:5000/cron/trigger
```

## Troubleshooting

### Debug Mode
Set `NODE_ENV=development` for verbose logging.

### Common Commands
```bash
# Check cron status
curl http://localhost:5000/cron/status

# View recent transfers
curl http://localhost:5000/transfer/logs

# Health check
curl http://localhost:5000/health

# Buffer statistics
curl http://localhost:5000/buffer/stats
```

### Log Analysis
Monitor application logs for:
- Buffer processing cycles
- Lighthouse upload confirmations
- Encryption/decryption operations
- Database transaction results

## Contributing

1. Follow existing code patterns
2. Add appropriate error handling
3. Update documentation for new features
4. Test with various buffer sizes and data formats

## License

[Your License Here]