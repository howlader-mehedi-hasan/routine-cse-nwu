import React from 'react';
import { X, User, GraduationCap } from 'lucide-react';
import { Button } from './Button';

const ContactChoiceModal = ({ isOpen, onClose, onSelectFaculty, onSelectCR, batchName, sectionName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <h3 className="text-lg font-bold text-foreground">Contact Options</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-muted-foreground mb-2">
                        Who would you like to contact for <span className="font-semibold text-foreground">{batchName} (Sec: {sectionName})</span>?
                    </p>
                    
                    <button
                        onClick={onSelectFaculty}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
                    >
                        <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <User className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-foreground">Contact Faculty</div>
                            <div className="text-xs text-muted-foreground">View instructor contact details</div>
                        </div>
                    </button>

                    <button
                        onClick={onSelectCR}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group"
                    >
                        <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-foreground">Contact CR/ACR</div>
                            <div className="text-xs text-muted-foreground">View class representatives</div>
                        </div>
                    </button>
                </div>

                <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ContactChoiceModal;
