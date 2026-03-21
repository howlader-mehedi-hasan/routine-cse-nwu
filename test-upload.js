import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
    console.log("Testing upload to 'backups' bucket...");
    const { data, error } = await supabase.storage.from('backups').upload('test.json', JSON.stringify({ test: 1 }), { upsert: true });
    if (error) {
        console.error("Upload failed:");
        console.error(error);
    } else {
        console.log("Upload succeeded:", data);
    }
}
test();
