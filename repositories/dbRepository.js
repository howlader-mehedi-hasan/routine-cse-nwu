import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

class DBRepository {
    constructor() {
        this.supabase = supabase;
    }

    // Generic Get All
    async getAll(collectionName) {
        const { data, error } = await this.supabase
            .from(collectionName)
            .select('*');
        
        if (error) {
            console.error(`Error fetching all from ${collectionName}:`, {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return [];
        }
        return data;
    }

    // Generic Get By Field (Targeted query)
    async getByField(collectionName, field, value) {
        const { data, error } = await this.supabase
            .from(collectionName)
            .select('*')
            .eq(field, value);
        
        if (error) {
            console.error(`Error fetching from ${collectionName} where ${field} = ${value}:`, {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return [];
        }
        return data;
    }

    async findOne(collectionName, field, value) {
        const { data, error } = await this.supabase
            .from(collectionName)
            .select('*')
            .eq(field, value)
            .maybeSingle();
        
        if (error) {
            console.error(`Error finding one from ${collectionName} where ${field} = ${value}:`, {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return null;
        }
        return data;
    }

    // Generic Get By ID
    async getById(collectionName, id) {
        const { data, error } = await this.supabase
            .from(collectionName)
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            console.error(`Error fetching ${collectionName} by ID ${id}:`, error);
            return null;
        }
        return data;
    }

    // Generic Create
    async create(table, data) {
        const { data: result, error } = await this.supabase
            .from(table)
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error(`Error creating in ${table}:`, {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                inputData: data
            });
            throw error;
        }
        return result;
    }

    // Generic Update
    async update(collectionName, id, updates) {
        const { data, error } = await this.supabase
            .from(collectionName)
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            console.error(`Error updating ${collectionName} with ID ${id}:`, error);
            return null;
        }
        return data;
    }

    // Generic Delete
    async delete(collectionName, id) {
        const { error } = await this.supabase
            .from(collectionName)
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error(`Error deleting from ${collectionName} with ID ${id}:`, error);
            return false;
        }
        return true;
    }

    // Settings (special handling)
    async getSettings(key = 'app_settings') {
        const { data, error } = await this.supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .maybeSingle(); // Changed from single() to maybeSingle() to handle missing keys gracefully
        
        if (error) {
            console.error(`Error fetching settings for key ${key}:`, error);
            return {};
        }
        return data ? data.value : {};
    }

    async updateSettings(updates, key = 'app_settings') {
        // If updates is an object and it's for 'app_settings', we might want to merge.
        // But for PDF settings, we usually replace. 
        // Let's implement a clean overwrite for now, or merge if it's app_settings.
        
        let newValue;
        if (key === 'app_settings') {
            const currentSettings = await this.getSettings(key);
            newValue = { ...currentSettings, ...updates };
        } else {
            newValue = updates; // Direct overwrite for other keys (like pdf_settings)
        }

        const { data, error } = await this.supabase
            .from('settings')
            .upsert({ key: key, value: newValue }, { onConflict: 'key' })
            .select('value');
        
        if (error) {
            console.error(`Error updating settings for key ${key}:`, error);
            // Even if select fails, the upsert might have succeeded. 
            // We return newValue as a fallback.
            return newValue;
        }
        
        return data && data.length > 0 ? data[0].value : newValue;
    }

    // Bulk Operations
    async clearCollection(collectionName) {
        const { error } = await this.supabase
            .from(collectionName)
            .delete()
            .not('id', 'is', null); // Condition to delete all records safely
        
        if (error) {
            console.error(`Error clearing ${collectionName}:`, error);
            return false;
        }
        return true;
    }

    async bulkCreate(collectionName, items) {
        const { data, error } = await this.supabase
            .from(collectionName)
            .insert(items)
            .select();
        
        if (error) {
            console.error(`Error bulk creating in ${collectionName}:`, error);
            return null;
        }
        return data;
    }

    async bulkDelete(collectionName, ids) {
        const { error } = await this.supabase
            .from(collectionName)
            .delete()
            .in('id', ids);
        
        if (error) {
            console.error(`Error bulk deleting from ${collectionName}:`, error);
            return false;
        }
        return true;
    }

    // --- Cloud Storage (Backups) ---
    async uploadToCloud(filename, fileData) {
        const { data, error } = await this.supabase.storage
            .from('backups')
            .upload(filename, fileData, {
                contentType: 'application/json',
                upsert: true
            });
        
        if (error) {
            console.error('Error uploading backup to cloud:', error);
            throw error;
        }
        return data;
    }

    async listCloudBackups(prefix = '') {
        const { data, error } = await this.supabase.storage
            .from('backups')
            .list('', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });
        
        if (error) {
            console.error('Error listing cloud backups:', error);
            throw error;
        }
        // Filter out empty '.emptyFolderPlaceholder' if any exists, and optionally match prefix
        return data.filter(file => file.name !== '.emptyFolderPlaceholder' && file.name.startsWith(prefix));
    }

    async downloadFromCloud(filename) {
        const { data, error } = await this.supabase.storage
            .from('backups')
            .download(filename);
        
        if (error) {
            console.error('Error downloading backup from cloud:', error);
            throw error;
        }
        return data;
    }

    async deleteFromCloud(filename) {
        const { data, error } = await this.supabase.storage
            .from('backups')
            .remove([filename]);
            
        if (error) {
            console.error('Error deleting backup from cloud:', error);
            throw error;
        }
        return true;
    }

    async renameInCloud(oldPath, newPath) {
        const { data, error } = await this.supabase.storage
            .from('backups')
            .move(oldPath, newPath);
        
        if (error) {
            console.error('Error renaming backup in cloud:', error);
            throw error;
        }
        return data;
    }
    // --- General Media Storage ---
    async uploadMedia(bucket, path, fileBuffer, contentType) {
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .upload(path, fileBuffer, {
                contentType: contentType,
                upsert: true
            });
        
        if (error) {
            console.error(`Error uploading media to ${bucket}/${path}:`, error);
            throw error;
        }
        return data;
    }

    getMediaPublicUrl(bucket, path) {
        const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }
}

const dbRepositoryInstance = new DBRepository();
export default dbRepositoryInstance;
