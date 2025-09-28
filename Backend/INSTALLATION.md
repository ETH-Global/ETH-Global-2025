# Installation Guide for Lighthouse Encryption Dependencies

## Overview
This guide will help you install the required dependencies for Lighthouse encryption functionality in the BufferService.

## Required Dependencies

The following new dependencies have been added to support Lighthouse's built-in encryption:

1. `@lighthouse-web3/kavach` - Lighthouse's encryption SDK
2. `ethers` - Ethereum JavaScript library for wallet operations

## Installation Steps

### 1. Install Dependencies

Run the following command in the Backend directory:

```bash
npm install @lighthouse-web3/kavach@^1.0.0 ethers@^6.13.0
```

Or if you prefer yarn:

```bash
yarn add @lighthouse-web3/kavach@^1.0.0 ethers@^6.13.0
```

### 2. Environment Variables

Make sure your `.env` file contains the following variables:

```env
# Lighthouse Configuration
LIGHTHOUSE_API_KEY=your_lighthouse_api_key_here
LIGHTHOUSE_PRIVATE_KEY=your_ethereum_private_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Obtaining Lighthouse API Key

To get your Lighthouse API Key:

1. Visit [https://files.lighthouse.storage/](https://files.lighthouse.storage/)
2. Connect your wallet
3. Generate an API key from the dashboard

Alternatively, use the Lighthouse CLI:

```bash
npm install -g @lighthouse-web3/sdk
lighthouse-web3 api-key
```

### 4. Private Key Setup

⚠️ **Security Warning**: Never commit your private key to version control. Always use environment variables.

The `LIGHTHOUSE_PRIVATE_KEY` should be:
- A valid Ethereum private key (64 characters, hexadecimal)
- The private key corresponding to the wallet you want to use for encryption
- Stored securely in your `.env` file

Example format:
```env
LIGHTHOUSE_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### 5. Database Schema

Ensure your Supabase `user_secrets` table has the correct structure:

```sql
CREATE TABLE user_secrets (
    user_id BIGINT PRIMARY KEY,
    eth_address TEXT NOT NULL,
    symmetric_key TEXT,
    blob_ids TEXT[] DEFAULT '{}' -- Array of CIDs from Lighthouse
);
```
## Steps to run the backend
```
> cd Backend
> npm run dev
```

## Steps to run the frontend
```
> cd Frontend
> npm i
> npm run dev
```

## Features Enabled

After installation, the following features will be available:

1. **Encrypted File Upload**: Files are encrypted using Lighthouse's Kavach encryption before storage
2. **CID Tracking**: All uploaded file CIDs are automatically added to the user's `blob_ids` array
3. **Decentralized Storage**: Files are stored on IPFS/Filecoin with encryption
4. **Authentication**: Proper authentication with Lighthouse nodes using signed messages

## Usage

The BufferService will now:

1. Format user data in the required structure: `{user_id, sites: [{wuid, cleaned, context}]}`
2. Upload encrypted data to Lighthouse using the built-in encryption
3. Receive a CID (Content Identifier) from Lighthouse
4. Add the CID to the user's `blob_ids` array in Supabase
5. Clean up processed buffer entries

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your `LIGHTHOUSE_PRIVATE_KEY` is valid
   - Ensure the private key format includes the '0x' prefix

2. **API Key Issues**
   - Check that your `LIGHTHOUSE_API_KEY` is correct
   - Verify you have sufficient credits in your Lighthouse account

3. **Supabase Errors**
   - Confirm your `user_secrets` table structure matches the expected schema
   - Check that the `blob_ids` column is of type `TEXT[]`

### Verification

To verify everything is working:

1. Check the logs for successful uploads: `"Data uploaded to Lighthouse with CID: ..."`
2. Verify CIDs are being added to `user_secrets.blob_ids`
3. Confirm temporary files are being cleaned up

## Security Notes

- All data is encrypted before leaving your server
- Encryption keys are managed by Lighthouse's distributed key system
- Only users with proper authentication can decrypt their data
- CIDs are publicly accessible but content is encrypted

For more information, visit the [Lighthouse Documentation](https://docs.lighthouse.storage/).
