import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, GraduationCap, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EditContactModal = ({ isOpen, onClose, onSave, data, type }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (data) {
            setFormData({ ...data });
        }
    }, [data]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const isStudent = type === 'student';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden"
                >
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                {isStudent ? <GraduationCap size={20} /> : <Briefcase size={20} />}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Edit {isStudent ? 'Student' : 'Faculty'}</h2>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Updating Directory Information</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="space-y-4">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 ml-1">
                                    <User size={12} /> Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 ml-1">
                                    <Mail size={12} /> Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.email || ''}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 ml-1">
                                    <Phone size={12} /> Phone / WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.phone || ''}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            {/* Type specific fields */}
                            {!isStudent ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Initials</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.initials || ''}
                                            onChange={e => setFormData({ ...formData, initials: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Type</label>
                                        <select
                                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.type || 'Permanent'}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="Permanent">Permanent</option>
                                            <option value="Guest">Guest</option>
                                            <option value="Adjunct">Adjunct</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Batch</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.batch || ''}
                                            onChange={e => setFormData({ ...formData, batch: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Section</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.section || ''}
                                            onChange={e => setFormData({ ...formData, section: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 border border-border rounded-xl font-bold bg-background hover:bg-muted transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EditContactModal;
