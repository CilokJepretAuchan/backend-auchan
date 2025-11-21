import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const bucket = process.env.SUPABASE_BUCKET || 'attachments';
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFile(fileBuffer: any, filename: string, mimeType: any) {
    const path = `${Date.now()}_${filename}`;
    const { data, error } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
        contentType: mimeType,
        upsert: false,
    });
    if (error) throw error;
    const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return { path, url };
}

export { uploadFile };