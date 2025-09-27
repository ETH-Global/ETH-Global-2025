const dotenv = require("dotenv");
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const config = require('../config/config');

dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
const { size: BUFFER_SIZE } = config.getBufferConfig();

async function CleansObj(req, res) {
    try {
        let response = await axios.post(process.env.CLEANING_API_URL, req.body, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        let data = response.data;

        // storing embeddings
        const { data: data2, error: err2 } = await supabase.from('embeddings').insert({
            user_id: req.uuid,
            embedding: data.embedding
        });

        if (err2) {
            console.log(err2);
            return res.status(500).json({ error: 'Supabase Database insertion failed' });
        }

        console.log(data2)

        // storing data into buffer - find existing buffer or create new one
        let data3;
        let err;

        // First, try to find an existing buffer with space
        const { data: existingBuffer, error: findError } = await supabase
            .from('user_data_buffer')
            .select('id, record_json')
            .eq('user_id', req.uuid)
            .order('created_at', { ascending: false })
            .limit(1);

        if (findError) {
            console.log('Error finding existing buffer:', findError);
            return res.status(500).json({ error: 'Failed to check existing buffer' });
        }

        const newRecord = {
            wuid: data.id,
            cleaned: data.cleaned,
            context: data.context
        };

        if (existingBuffer && existingBuffer.length > 0) {
            const buffer = existingBuffer[0];
            const currentRecords = buffer.record_json || [];

            // Check if current buffer has space (record_json length <= BUFFER_SIZE)
            if (currentRecords.length < BUFFER_SIZE) {
                // Append to existing buffer
                const updatedRecords = [...currentRecords, newRecord];

                const { data: updateData, error: updateError } = await supabase
                    .from('user_data_buffer')
                    .update({ record_json: updatedRecords })
                    .eq('id', buffer.id)
                    .select();

                data3 = updateData;
                err = updateError;
            } else {
                // Current buffer is full, create new buffer
                const { data: insertData, error: insertError } = await supabase
                    .from('user_data_buffer')
                    .insert({
                        user_id: req.uuid,
                        record_json: [newRecord]
                    })
                    .select();

                data3 = insertData;
                err = insertError;
            }
        } else {
            // No existing buffer, create new one
            const { data: insertData, error: insertError } = await supabase
                .from('user_data_buffer')
                .insert({
                    user_id: req.uuid,
                    record_json: [newRecord]
                })
                .select();

            data3 = insertData;
            err = insertError;
        }

        if (err) {
            console.log('Buffer operation error:', err);
            return res.status(500).json({ error: 'Supabase Buffer operation failed' });
        }

        res.status(200).json({
            message: 'Data processed and buffered successfully',
            embedding_id: data2?.[0]?.id,
            buffer_id: data3?.[0]?.id
        });
    } catch (error) {
        console.error('Error in CleansObj:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { CleansObj }
