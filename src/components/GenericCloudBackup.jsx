import React, { useState, useEffect } from 'react';
import { Cloud, FileText, Download, Trash2, RefreshCw, Plus, Edit2, Check, X } from 'lucide-react';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';
import { getCloudBackups, saveCloudBackup, getCloudBackupData, deleteCloudBackup, renameCloudBackup } from '../services/api';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const GenericCloudBackup = ({ 
    type, 
    title = "Cloud Backups", 
    description = "Stored securely in the cloud.", 
    onBackupDataGenerate, 
    onRestoreDataApply,
    isExternalLoading = false
}) => {
    const [cloudFiles, setCloudFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [editingFile, setEditingFile] = useState(null);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        fetchCloudBackups();
    }, [type]);

    const fetchCloudBackups = async () => {
        try {
            setLoading(true);
            const res = await getCloudBackups(type);
            setCloudFiles(res.data.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load cloud backups");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        let loadingToast;
        try {
            setActionLoading(true);
            const dataToSave = await onBackupDataGenerate();
            if (!dataToSave) throw new Error("No data generated for backup");

            loadingToast = toast.loading("Creating cloud backup...");
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${type}_backup_${timestamp}.json`;
            
            await saveCloudBackup(filename, dataToSave);
            toast.success("Cloud backup created successfully!", { id: loadingToast });
            fetchCloudBackups();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to create cloud backup", { id: loadingToast });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRestore = async (filename) => {
        if (!window.confirm(`Are you sure you want to load settings/data from ${filename}?`)) {
            return;
        }

        let loadingToast;
        try {
            setActionLoading(true);
            loadingToast = toast.loading("Restoring from cloud...");
            
            const res = await getCloudBackupData(filename);
            await onRestoreDataApply(res.data.data);
            
            toast.success("Restore applied successfully!", { id: loadingToast });
        } catch (error) {
            console.error(error);
            toast.error("Failed to restore from cloud", { id: loadingToast });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (filename) => {
        if (!window.confirm(`Are you sure you want to delete ${filename}? This action cannot be undone.`)) {
            return;
        }

        let loadingToast;
        try {
            setActionLoading(true);
            loadingToast = toast.loading("Deleting backup...");
            await deleteCloudBackup(filename);
            toast.success("Backup deleted successfully!", { id: loadingToast });
            fetchCloudBackups();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete backup", { id: loadingToast });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRenameStart = (file) => {
        setEditingFile(file.name);
        setNewName(file.name.replace('.json', ''));
    };

    const handleRenameCancel = () => {
        setEditingFile(null);
        setNewName('');
    };

    const handleRenameSubmit = async (oldFilename) => {
        if (!newName || newName.trim() === '') {
            toast.error("Name cannot be empty");
            return;
        }

        const fullNewName = newName.endsWith('.json') ? newName : `${newName.trim()}.json`;
        
        if (fullNewName === oldFilename) {
            setEditingFile(null);
            return;
        }

        let loadingToast;
        try {
            setActionLoading(true);
            loadingToast = toast.loading("Renaming backup...");
            await renameCloudBackup(oldFilename, fullNewName);
            toast.success("Backup renamed successfully!", { id: loadingToast });
            setEditingFile(null);
            fetchCloudBackups();
        } catch (error) {
            console.error(error);
            toast.error("Failed to rename backup", { id: loadingToast });
        } finally {
            setActionLoading(false);
        }
    };

    const isBusy = loading || actionLoading || isExternalLoading;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h4 className="font-semibold text-lg">{title}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Button 
                    onClick={handleCreateBackup}
                    disabled={isBusy}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Backup
                </Button>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-2">Available Snapshots</span>
                    <button onClick={fetchCloudBackups} disabled={isBusy} className="p-1.5 hover:bg-background rounded-md text-muted-foreground transition-colors">
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </button>
                </div>
                
                {loading && cloudFiles.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground animate-pulse flex flex-col items-center">
                        <Cloud className="h-8 w-8 mb-2 opacity-50" />
                        Loading cloud files...
                    </div>
                ) : cloudFiles.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <FileText className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h5 className="font-medium text-foreground">No cloud backups found</h5>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">Create your first backup to safely store these settings/data in the cloud.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border h-64 overflow-y-auto">
                        {cloudFiles.map((file) => (
                            <div key={file.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors group">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="mt-1 p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md shrink-0">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {editingFile === file.name ? (
                                            <div className="flex items-center gap-2 max-w-md">
                                                <input 
                                                    type="text"
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    className="flex-1 h-8 bg-background border border-indigo-500 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRenameSubmit(file.name);
                                                        if (e.key === 'Escape') handleRenameCancel();
                                                    }}
                                                />
                                                <button 
                                                    onClick={() => handleRenameSubmit(file.name)}
                                                    className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                    title="Save"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={handleRenameCancel}
                                                    className="p-1.5 bg-muted text-muted-foreground rounded hover:bg-muted-foreground/20 transition-colors"
                                                    title="Cancel"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <h5 className="font-medium text-sm text-foreground truncate">{file.name}</h5>
                                                    <button 
                                                        onClick={() => handleRenameStart(file)}
                                                        className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-indigo-600 transition-all"
                                                        title="Rename"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                                                    <span>&bull;</span>
                                                    <span>{formatBytes(file.metadata?.size)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {editingFile !== file.name && (
                                    <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-auto shrink-0">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-8"
                                            onClick={() => handleRestore(file.name)}
                                            disabled={isBusy}
                                        >
                                            <Download className="h-3.5 w-3.5 mr-1.5" />
                                            Restore
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => handleDelete(file.name)}
                                            disabled={isBusy}
                                            title="Delete backup"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenericCloudBackup;
