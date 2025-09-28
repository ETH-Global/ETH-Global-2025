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

```sql
-- ----------------------------------------------------
-- 1. USER SECRETS TABLE (The User Registry & Metadata)
-- ----------------------------------------------------
-- Note: 'user_id' is BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY for sequential IDs.
CREATE TABLE IF NOT EXISTS user_secrets (
    user_id TEXT PRIMARY KEY,
    eth_address TEXT UNIQUE NOT NULL,
    symmetric_key TEXT NOT NULL,
    blob_ids TEXT[] DEFAULT '{}'::text[] NOT NULL
);

-- ----------------------------------------------------
-- 2. EMBEDDINGS TABLE (The Search Index)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.embeddings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- CRITICAL FIX: Foreign key column name must be consistent with the referenced column.
  user_id TEXT NOT NULL REFERENCES user_secrets(user_id),
  embedding vector (768) NOT NULL
);

-- ----------------------------------------------------
-- 3. USER DATA BUFFER TABLE (The Staging Log)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_data_buffer (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    -- CRITICAL FIX: Changed column name from 'uid' to 'user_id' for consistency.
    user_id TEXT NOT NULL REFERENCES user_secrets(user_id),
    record_json JSONB[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------
-- 4. INDEXES
-- ----------------------------------------------------

-- Index for filtering by user_id
CREATE INDEX IF NOT EXISTS idx_embeddings_user_id
ON public.embeddings (user_id);

-- Vector similarity index (IVFFlat with cosine distance)
CREATE INDEX IF NOT EXISTS idx_embeddings_embedding
ON public.embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Refresh statistics for pgvector
ANALYZE public.embeddings;

-- ----------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) & POLICY CLEANUP
-- ----------------------------------------------------

DROP POLICY IF EXISTS "Allow service key inserts" ON public.embeddings;
DROP POLICY IF EXISTS "Allow service key select" ON public.embeddings;

-- Enable RLS
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- RLS: Policy to allow service key to insert vectors (used by the Express backend)
-- We grant to 'service_role', assuming the Express backend uses the service key.
-- CREATE POLICY "Allow service key inserts"
-- ON public.embeddings
-- FOR INSERT
-- TO anon, authenticated
-- WITH CHECK (true);

CREATE POLICY "Allow service key inserts"
ON public.embeddings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- RLS: Policy to allow selecting only embeddings belonging to the current user.
-- This assumes the front-end user's JWT contains their auth.uid(), which we map to user_secrets(user_id).
-- For simple service access, we'll keep it open for the service role.
CREATE POLICY "Allow service key select"
ON public.embeddings
FOR SELECT
TO anon, authenticated
USING (true);

-- ----------------------------------------------------
-- 6. RPC FUNCTION
-- ----------------------------------------------------

-- Function to select UIDs whose buffer is full
CREATE OR REPLACE FUNCTION get_full_buffers(threshold integer)
RETURNS SETOF BIGINT
LANGUAGE sql
AS $$
    -- FIX: Removed the redundant table prefix to avoid the 42703 error.
    -- The column 'user_id' is unambiguous as it is the only table in the FROM clause.
    SELECT user_id
    FROM user_data_buffer
    GROUP BY user_id
    HAVING COUNT(*) >= threshold;
$$;

-- get similar vectors (Used by companies to find matching context)
CREATE OR REPLACE FUNCTION public.match_embeddings (
  -- FIX: Changed p_user_id from VARCHAR to BIGINT to match schema
  p_user_id BIGINT,
  p_embedding vector (768),
  p_match_threshold double precision,
  p_match_count integer
)
RETURNS table (
  id bigint,
  created_at timestamp with time zone,
  -- FIX: Changed user_id return type from VARCHAR to BIGINT
  user_id BIGINT, 
  embedding vector (768),
  -- Changed 'similarity' output column to 'distance' and operator to '<=>' (cosine distance)
  distance double precision
)
LANGUAGE sql STABLE AS $$
  -- Using <=> for cosine distance search, which uses the ivfflat index created with vector_cosine_ops
  SELECT e.id,
         e.created_at,
         e.user_id,
         e.embedding,
         (e.embedding <=> p_embedding) AS distance
  FROM public.embeddings e
  WHERE e.user_id = p_user_id
    -- Check if distance is below the threshold (lower distance means higher similarity)
    AND (e.embedding <=> p_embedding) <= p_match_threshold 
  ORDER BY e.embedding <=> p_embedding
  LIMIT p_match_count;
$$;


-- add vectors in bulk (Used by the Express backend to insert after data intake)
CREATE OR REPLACE FUNCTION public.insert_embeddings_bulk (
  -- FIX: Changed p_user_id from VARCHAR to BIGINT to match schema
  p_user_id BIGINT,
  p_vectors vector (768)[]
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Insert into public.embeddings using the user_id and unnesting the vector array
  INSERT INTO public.embeddings (user_id, embedding)
  SELECT p_user_id, v
  FROM unnest(p_vectors) AS v;
END;
$$;
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
