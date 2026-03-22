import React from 'react';
import { X, Cloud } from 'lucide-react';
import GenericCloudBackup from './GenericCloudBackup';

const CloudRoutineBackupModal = ({ isOpen, onClose, routineData, onRestore }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-3xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border bg-card rounded-t-xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Cloud className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Cloud Routine Backups</h3>
                            <p className="text-xs text-muted-foreground">Manage your weekly schedule data in the cloud.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto bg-card rounded-b-xl">
                    <GenericCloudBackup 
                        type="routine"
                        title="Routine Data Snapshots"
                        description="Save a complete snapshot of all classes to the cloud and restore them anytime."
                        onBackupDataGenerate={async () => {
                            if (!routineData || routineData.length === 0) {
                                throw new Error("No routine data available to backup.");
                            }
                            return routineData;
                        }}
                        onRestoreDataApply={async (data) => {
                            if (Array.isArray(data)) {
                                await onRestore(data);
                            } else {
                                throw new Error("Invalid format. Expected an array of routine entries.");
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default CloudRoutineBackupModal;
