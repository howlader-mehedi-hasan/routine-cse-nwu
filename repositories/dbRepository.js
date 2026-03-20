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
    async create(collectionName, item) {
        const { data, error } = await this.supabase
            .from(collectionName)
            .insert(item)
            .select()
            .single();
        
        if (error) {
            console.error(`Error creating in ${collectionName}:`, error);
            return null;
        }
        return data;
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
    async getSettings() {
        const { data, error } = await this.supabase
            .from('settings')
            .select('value')
            .eq('key', 'app_settings')
            .single();
        
        if (error) {
            console.error('Error fetching settings:', error);
            return {};
        }
        return data.value;
    }

    async updateSettings(updates) {
        const currentSettings = await this.getSettings();
        const newSettings = { ...currentSettings, ...updates };

        const { data, error } = await this.supabase
            .from('settings')
            .upsert({ key: 'app_settings', value: newSettings })
            .select('value')
            .single();
        
        if (error) {
            console.error('Error updating settings:', error);
            return currentSettings;
        }
        return data.value;
    }

    // Bulk Operations
    async clearCollection(collectionName) {
        const { error } = await this.supabase
            .from(collectionName)
            .delete()
            .neq('id', 0); // Condition to delete all records
        
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
}

const dbRepositoryInstance = new DBRepository();
export default dbRepositoryInstance;
