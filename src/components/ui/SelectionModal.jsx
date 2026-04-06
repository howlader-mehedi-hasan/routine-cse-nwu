import React from 'react';
import { X, User } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

const SelectionModal = ({ isOpen, onClose, classes = [], onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <h3 className="text-lg font-bold text-foreground">Select Class</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                        Multiple classes found in this slot. Please select one:
                    </p>
                    <div className="space-y-2">
                        {classes.map((cls) => (
                            <button
                                key={cls.id}
                                onClick={() => onSelect(cls)}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-muted/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group text-left"
                            >
                                <div>
                                    <div className="font-bold text-sm text-foreground">{cls.course}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {cls.faculty} {cls.room && cls.room !== 'TBA' ? `| R-${cls.room}` : ''}
                                    </div>
                                </div>
                                <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <User className="w-4 h-4" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end">
                    <Button variant="outline" onClick={onClose} className="rounded-lg">
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SelectionModal;
