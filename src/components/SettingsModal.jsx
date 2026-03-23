import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, RotateCcw, Download, Upload, Cloud } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../services/api';
import { cn } from '../lib/utils';
import GenericCloudBackup from './GenericCloudBackup';

const SettingsModal = ({ isOpen, onClose, onSettingsUpdated }) => {
    const [settings, setSettings] = useState({
        general: { theory_slots: [], lab_slots: [], slot_mapping: {} },
        daily_overrides: {},
        app_settings: { auto_restore_on_startup: false, backup_schedule: { enabled: false, time: '02:00' } }
    });
    const [activeTab, setActiveTab] = useState('general'); // 'general', 'cloud', 'Monday', etc.
    const [loading, setLoading] = useState(true);

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await getSettings('app_settings');
            setSettings(res.data.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load settings");
            setLoading(false);
        }
    };

    const getCurrentConfig = () => {
        if (activeTab === 'general') return settings.general;
        return settings.daily_overrides[activeTab] || settings.general;
    };

    const updateCurrentConfig = (updates) => {
        if (activeTab === 'general') {
            setSettings({
                ...settings,
                general: { ...settings.general, ...updates }
            });
        } else {
            setSettings({
                ...settings,
                daily_overrides: {
                    ...settings.daily_overrides,
                    [activeTab]: { ...(settings.daily_overrides[activeTab] || settings.general), ...updates }
                }
            });
        }
    };

    const handleTheorySlotChange = (index, value) => {
        const config = getCurrentConfig();
        const newSlots = [...config.theory_slots];
        newSlots[index] = value;
        updateCurrentConfig({ theory_slots: newSlots });
    };

    const handleLabSlotChange = (index, value) => {
        const config = getCurrentConfig();
        const newSlots = [...config.lab_slots];
        newSlots[index] = value;
        updateCurrentConfig({ lab_slots: newSlots });
    };

    const addTheorySlot = () => {
        const config = getCurrentConfig();
        updateCurrentConfig({ theory_slots: [...config.theory_slots, "00:00-00:00"] });
    };

    const addLabSlot = () => {
        const config = getCurrentConfig();
        updateCurrentConfig({ lab_slots: [...config.lab_slots, "00:00-00:00"] });
    };

    const removeTheorySlot = (index) => {
        const config = getCurrentConfig();
        const newSlots = config.theory_slots.filter((_, i) => i !== index);
        updateCurrentConfig({ theory_slots: newSlots });
    };

    const removeLabSlot = (index) => {
        const config = getCurrentConfig();
        const newSlots = config.lab_slots.filter((_, i) => i !== index);
        updateCurrentConfig({ lab_slots: newSlots });
    };

    const handleMappingChange = (theorySlot, labSlot) => {
        const config = getCurrentConfig();
        const newMapping = { ...config.slot_mapping };
        if (labSlot === "") {
            delete newMapping[theorySlot];
        } else {
            newMapping[theorySlot] = labSlot;
        }
        updateCurrentConfig({ slot_mapping: newMapping });
    };

    const handleSave = async () => {
        const loadingToast = toast.loading("Saving settings...");
        try {
            await updateSettings(settings, 'app_settings');
            toast.success("Settings saved successfully!", { id: loadingToast });
            onSettingsUpdated(settings);
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save settings", { id: loadingToast });
        }
    };

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset to default settings?")) {
            const defaults = {
                general: {
                    theory_slots: ["08:00-09:15", "09:15-10:30", "10:45-12:00", "12:00-01:15", "02:00-03:15", "03:15-04:30", "04:30-05:45", "05:45-07:00"],
                    lab_slots: ["08:00-10:30", "10:45-01:15", "02:00-04:30", "04:30-07:00"],
                    slot_mapping: {
                        "08:00-09:15": "08:00-10:30", "10:45-12:00": "10:45-01:15", "02:00-03:15": "02:00-04:30", "04:30-05:45": "04:30-07:00",
                        "09:15-10:30": "08:00-10:30", "12:00-01:15": "10:45-01:15", "03:15-04:30": "02:00-04:30", "05:45-07:00": "04:30-07:00"
                    }
                },
                daily_overrides: { Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null, Saturday: null, Sunday: null }
            };
            setSettings(defaults);
        }
    };

    const handleClearOverride = () => {
        if (activeTab === 'general') return;
        if (window.confirm(`Clear custom settings for ${activeTab} and use General defaults?`)) {
            setSettings({
                ...settings,
                daily_overrides: {
                    ...settings.daily_overrides,
                    [activeTab]: null
                }
            });
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `routine_settings_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success("Settings exported successfully!");
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                // Basic validation
                if (json.general && typeof json.general === 'object') {
                    setSettings(json);
                    toast.success("Settings loaded from backup! Click 'Save' to apply changes permanentely.", {
                        duration: 5000,
                        icon: '📥'
                    });
                } else {
                    toast.error("Invalid settings file format. Please use a previously exported backup.");
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to read the backup file. Ensure it's a valid JSON.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset for consecutive uploads
    };

    if (!isOpen) return null;

    const currentConfig = getCurrentConfig();
    const isOverridden = activeTab !== 'general' && settings.daily_overrides[activeTab] !== null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto py-8 lg:py-12">
            <div className="bg-card w-full max-w-3xl rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 mb-8">
                <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10 rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <RotateCcw className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Schedule Settings</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto bg-muted/30 p-1 border-b border-border no-scrollbar scroll-smooth">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all",
                            activeTab === 'general' ? "bg-card text-indigo-600 shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        General (Defaults)
                    </button>
                    <button
                        onClick={() => setActiveTab('cloud')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5",
                            activeTab === 'cloud' ? "bg-card text-indigo-600 shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Cloud className="w-4 h-4" /> Cloud Storage
                    </button>
                    {days.map(day => (
                        <button
                            key={day}
                            onClick={() => setActiveTab(day)}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5",
                                activeTab === day ? "bg-card text-indigo-600 shadow-sm border border-border" : "text-muted-foreground hover:text-foreground",
                                settings.daily_overrides[day] && "font-bold"
                            )}
                        >
                            {day}
                            {settings.daily_overrides[day] && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                        </button>
                    ))}
                </div>

                <div className="p-6 space-y-8">
                    {activeTab === 'cloud' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h4 className="font-semibold text-lg text-foreground">Cloud Sync & Automation</h4>
                                <p className="text-sm text-muted-foreground">Configure automated backups and startup behavior.</p>
                            </div>

                            <div className="space-y-4 bg-muted/20 p-5 rounded-xl border border-border/50">
                                {/* Auto-Restore Toggle */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h5 className="font-medium text-foreground">Cloud Wake-Up (Auto-Restore)</h5>
                                        <p className="text-xs text-muted-foreground mt-0.5">Automatically restore the latest cloud backup when the server starts up.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={settings.app_settings?.auto_restore_on_startup || false}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                app_settings: {
                                                    ...(settings.app_settings || {}),
                                                    auto_restore_on_startup: e.target.checked
                                                }
                                            })}
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                <div className="w-full h-px bg-border"></div>

                                {/* Scheduled Backups */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h5 className="font-medium text-foreground">Scheduled Daily Backup</h5>
                                        <p className="text-xs text-muted-foreground mt-0.5 mb-3">Automatically create a cloud snapshot every day at the designated time.</p>
                                        
                                        {settings.app_settings?.backup_schedule?.enabled && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-sm text-muted-foreground">Execution Time:</span>
                                                <Input 
                                                    type="time" 
                                                    value={settings.app_settings?.backup_schedule?.time || '02:00'}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        app_settings: {
                                                            ...(settings.app_settings || {}),
                                                            backup_schedule: {
                                                                ...((settings.app_settings || {}).backup_schedule || {}),
                                                                time: e.target.value
                                                            }
                                                        }
                                                    })}
                                                    className="w-32 h-8 text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={settings.app_settings?.backup_schedule?.enabled || false}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                app_settings: {
                                                    ...(settings.app_settings || {}),
                                                    backup_schedule: {
                                                        time: '02:00',
                                                        ...((settings.app_settings || {}).backup_schedule || {}),
                                                        enabled: e.target.checked
                                                    }
                                                }
                                            })}
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="w-full h-px bg-border my-8" />
                            
                            <GenericCloudBackup 
                                type="schedule_settings"
                                title="Schedule Settings Cloud Snapshots"
                                description="Save your exact schedule array and mappings configurations to the cloud and restore them anytime."
                                onBackupDataGenerate={async () => settings}
                                onRestoreDataApply={async (data) => {
                                    if (data && data.general && typeof data.general === 'object') {
                                        setSettings(data);
                                    } else {
                                        throw new Error("Invalid settings file format in cloud backup.");
                                    }
                                }}
                            />
                        </div>
                    )}

                    {activeTab !== 'cloud' && activeTab !== 'general' && !isOverridden && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg flex items-center justify-between gap-4">
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                This day is currently using <strong>General Defaults</strong>. Edit any field to create a custom configuration for {activeTab}.
                            </p>
                        </div>
                    )}

                    {activeTab !== 'general' && isOverridden && (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/50 rounded-lg flex items-center justify-between gap-4">
                            <p className="text-sm text-indigo-700 dark:text-indigo-400">
                                Custom configuration active for <strong>{activeTab}</strong>. Changes here won't affect other days.
                            </p>
                            <Button variant="ghost" size="sm" onClick={handleClearOverride} className="h-8 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40">
                                Use Defaults
                            </Button>
                        </div>
                    )}

                    {/* Schedule Config */}
                    {activeTab !== 'cloud' && (
                        <>
                    {/* Theory Slots */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-xs">1</span>
                                Theory Periods
                            </h4>
                            <Button variant="outline" size="sm" onClick={addTheorySlot} className="h-8 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900/50">
                                <Plus className="h-4 w-4 mr-1" /> Add Theory
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {currentConfig.theory_slots.map((slot, index) => (
                                <div key={`theory-${index}`} className="flex items-center gap-2 bg-muted/20 p-1 rounded-md border border-border/50">
                                    <Input
                                        value={slot}
                                        onChange={(e) => handleTheorySlotChange(index, e.target.value)}
                                        className="font-mono text-sm border-0 focus-visible:ring-0 shadow-none bg-transparent"
                                        placeholder="08:00-09:15"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeTheorySlot(index)}
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Lab Slots */}
                    <section className="space-y-4 border-t border-border pt-6">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-xs">2</span>
                                Lab Periods
                            </h4>
                            <Button variant="outline" size="sm" onClick={addLabSlot} className="h-8 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50">
                                <Plus className="h-4 w-4 mr-1" /> Add Lab
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {currentConfig.lab_slots.map((slot, index) => (
                                <div key={`lab-${index}`} className="flex items-center gap-2 bg-muted/20 p-1 rounded-md border border-border/50">
                                    <Input
                                        value={slot}
                                        onChange={(e) => handleLabSlotChange(index, e.target.value)}
                                        className="font-mono text-sm border-0 focus-visible:ring-0 shadow-none bg-transparent"
                                        placeholder="08:00-10:30"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLabSlot(index)}
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Slot Mapping */}
                    <section className="space-y-4 border-t border-border pt-6">
                        <h4 className="font-semibold text-lg flex items-center gap-2 text-orange-600 dark:text-orange-400">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/40 text-xs">3</span>
                            Theory to Lab Mapping
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Select which Lab period covers each Theory period for automatic duration handling.
                        </p>
                        <div className="space-y-2">
                            {currentConfig.theory_slots.map((theorySlot, index) => (
                                <div key={`map-${index}-${theorySlot}`} className="grid grid-cols-[100px_1fr_minmax(140px,200px)] items-center gap-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                                    <span className="text-sm font-medium font-mono text-foreground truncate" title={theorySlot}>{theorySlot}</span>
                                    <div className="flex justify-center">
                                        <div className="h-px bg-border flex-1 mx-2 relative">
                                            <div className="absolute right-0 -top-1 border-r border-t border-border w-2 h-2 rotate-45"></div>
                                        </div>
                                    </div>
                                    <select
                                        className="bg-background border border-input rounded-md px-3 py-1.5 text-xs font-mono w-full focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={currentConfig.slot_mapping[theorySlot] || ""}
                                        onChange={(e) => handleMappingChange(theorySlot, e.target.value)}
                                    >
                                        <option value="">No Mapping</option>
                                        {currentConfig?.lab_slots?.map(ls => (
                                            <option key={ls} value={ls}>{ls}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </section>
                    </>
                    )}
                </div>

                <div className="flex flex-col gap-4 p-6 border-t border-border bg-muted/20 rounded-b-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 h-8">
                                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset Default
                            </Button>
                            <div className="w-px h-4 bg-border mx-1" />
                            <Button variant="ghost" size="sm" onClick={handleExport} className="text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 h-8">
                                <Download className="h-3.5 w-3.5 mr-1.5" /> Backup
                            </Button>
                            <div className="relative">
                                <Button variant="ghost" size="sm" onClick={() => document.getElementById('restore-input').click()} className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-2 h-8">
                                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Restore
                                </Button>
                                <input
                                    id="restore-input"
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={handleImport}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">Cancel</Button>
                            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 flex-1 sm:flex-none shadow-lg shadow-indigo-500/20">
                                <Save className="h-4 w-4 mr-2" /> Save All Settings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
