import React, { useState, useEffect, useRef } from 'react';
import { X, Cloud, HardDrive, Download, Upload, Trash2, RefreshCw, FileText, AlertCircle, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';
import { getCloudBackups, createCloudBackup, restoreCloudBackup, deleteCloudBackup, exportSystemBackup, importSystemBackup } from '../services/api';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

const BackupDashboard = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('cloud'); // 'cloud' | 'local'
    const [cloudFiles, setCloudFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && activeTab === 'cloud') {
            fetchCloudBackups();
        }
    }, [isOpen, activeTab]);

    const fetchCloudBackups = async () => {
        try {
            setLoading(true);
            const res = await getCloudBackups('system');
            setCloudFiles(res.data.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load cloud backups");
        } finally {
            setLoading(false);
        }
    };

    // --- Cloud Actions ---
    const handleCreateCloudBackup = async () => {
        let loadingToast;
        try {
            setActionLoading(true);
            loadingToast = toast.loading("Creating cloud backup...");
            await createCloudBackup();
            toast.success("Cloud backup created successfully!", { id: loadingToast });
            fetchCloudBackups();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create cloud backup", { id: loadingToast });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRestoreCloud = async (filename) => {
        if (!window.confirm(`Are you sure you want to restore from ${filename}? This will permanently overwrite all current system data.`)) {
            return;
        }

        let loadingToast;
        try {
            setActionLoading(true);
            loadingToast = toast.loading("Restoring from cloud...");
            await restoreCloudBackup(filename);
            toast.success("System restored successfully! Please refresh the page.", { id: loadingToast, duration: 5000 });
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error(error);
            toast.error("Failed to restore from cloud", { id: loadingToast });
            setActionLoading(false);
        }
    };

    const handleDeleteCloud = async (filename) => {
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

    // --- Local Actions ---
    const handleLocalExport = async () => {
        const loadingToast = toast.loading('Generating system backup...');
        try {
            setActionLoading(true);
            const response = await exportSystemBackup();
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const contentDisposition = response.headers['content-disposition'];
            let filename = `system_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
                if (filenameMatch && filenameMatch.length === 2) {
                    filename = filenameMatch[1];
                }
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            toast.success('Backup exported successfully!', { id: loadingToast });
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export system data.', { id: loadingToast });
        } finally {
            setActionLoading(false);
        }
    };

    const handleLocalImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const processLocalImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        event.target.value = null; // reset

        if (!window.confirm('WARNING: Restoring from a local file will PERMANENTLY REPLACE all current system data (Faculty, Courses, Rooms, Batches, Routine). Are you absolutely sure?')) {
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const loadingToast = toast.loading('Restoring system data...');
            try {
                setActionLoading(true);
                const jsonContent = JSON.parse(e.target.result);
                await importSystemBackup(jsonContent);
                toast.success('System restored successfully! Please refresh the page.', { id: loadingToast, duration: 5000 });
                setTimeout(() => window.location.reload(), 2000);
            } catch (error) {
                console.error("Import failed:", error);
                toast.error(error.response?.data?.message || 'Failed to restore system data.', { id: loadingToast });
                setActionLoading(false);
            }
        };
        reader.onerror = () => toast.error('Failed to read the file.');
        reader.readAsText(file);
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-4xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-card rounded-t-xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Cloud className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Backup & Restore</h3>
                            <p className="text-xs text-muted-foreground">Manage your system snapshots</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={actionLoading} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Sidebar / Tabs */}
                    <div className="md:w-64 border-b md:border-b-0 md:border-r border-border bg-muted/10 p-4 shrink-0 overflow-y-auto">
                        <nav className="flex md:flex-col gap-2">
                            <button
                                onClick={() => setActiveTab('cloud')}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-sm w-full",
                                    activeTab === 'cloud' 
                                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Cloud className={cn("h-5 w-5", activeTab === 'cloud' && "fill-indigo-100 dark:fill-indigo-900/40")} />
                                Cloud Storage
                            </button>
                            <button
                                onClick={() => setActiveTab('local')}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-sm w-full",
                                    activeTab === 'local' 
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <HardDrive className={cn("h-5 w-5", activeTab === 'local' && "fill-emerald-100 dark:fill-emerald-900/40")} />
                                Local Storage
                            </button>
                        </nav>
                        
                        <div className="mt-8 hidden md:block">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/50">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                        Backups contain the entire system state including faculty, courses, routines, and settings. Restoring a backup is a destructive action that replaces all current data.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 p-6 overflow-y-auto bg-card">
                        
                        {/* Cloud Tab */}
                        {activeTab === 'cloud' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-semibold text-lg">Cloud Backups</h4>
                                        <p className="text-sm text-muted-foreground">Stored securely in your configured cloud bucket.</p>
                                    </div>
                                    <Button 
                                        onClick={handleCreateCloudBackup}
                                        disabled={actionLoading}
                                        className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create New Backup
                                    </Button>
                                </div>

                                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-2">Available Snapshots</span>
                                        <button onClick={fetchCloudBackups} disabled={loading || actionLoading} className="p-1.5 hover:bg-background rounded-md text-muted-foreground transition-colors">
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
                                            <p className="text-sm text-muted-foreground mt-1 max-w-sm">Create your first system backup to ensure your data is safely stored in the cloud.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border">
                                            {cloudFiles.map((file) => (
                                                <div key={file.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors group">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1 p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <h5 className="font-medium text-sm text-foreground break-all">{file.name}</h5>
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                                                                <span>&bull;</span>
                                                                <span>{formatBytes(file.metadata?.size)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8"
                                                            onClick={() => handleRestoreCloud(file.name)}
                                                            disabled={actionLoading}
                                                        >
                                                            <Download className="h-3.5 w-3.5 mr-1.5" />
                                                            Restore
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            onClick={() => handleDeleteCloud(file.name)}
                                                            disabled={actionLoading}
                                                            title="Delete backup"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Local Tab */}
                        {activeTab === 'local' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                                <div>
                                    <h4 className="font-semibold text-lg">Local Workstation Backup</h4>
                                    <p className="text-sm text-muted-foreground">Download backups directly to your PC, or restore from a previously downloaded .json file.</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 flex-1">
                                    {/* Export Card */}
                                    <div className="border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center bg-background/50 hover:bg-muted/20 transition-colors group">
                                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Download className="h-8 w-8" />
                                        </div>
                                        <h5 className="font-medium mb-2">Export to PC</h5>
                                        <p className="text-sm text-muted-foreground mb-6 max-w-[200px]">Download a complete system snapshot to your local machine.</p>
                                        <Button 
                                            onClick={handleLocalExport}
                                            disabled={actionLoading}
                                            className="w-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                                        >
                                            Generate File
                                        </Button>
                                    </div>

                                    {/* Import Card */}
                                    <div className="border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center bg-background/50 hover:bg-muted/20 transition-colors group">
                                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Upload className="h-8 w-8" />
                                        </div>
                                        <h5 className="font-medium mb-2">Restore from PC</h5>
                                        <p className="text-sm text-muted-foreground mb-6 max-w-[200px]">Upload a previously generated .json system snapshot.</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".json"
                                            className="hidden"
                                            onChange={processLocalImport}
                                        />
                                        <Button 
                                            onClick={handleLocalImportClick}
                                            disabled={actionLoading}
                                            variant="outline"
                                            className="w-full border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                        >
                                            Select Backup File
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackupDashboard;
