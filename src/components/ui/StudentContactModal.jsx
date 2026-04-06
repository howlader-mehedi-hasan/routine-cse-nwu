import React from 'react';
import { X, Phone, MessageCircle, User, GraduationCap } from 'lucide-react';
import { Button } from './Button';

const StudentContactModal = ({ isOpen, onClose, studentList = [] }) => {
    if (!isOpen) return null;

    const formatWhatsAppLink = (phone) => {
        if (!phone) return '#';
        const cleanNumber = phone.replace(/\D/g, '');
        // Bangladesh country code +880
        const withCountryCode = cleanNumber.startsWith('880') ? cleanNumber : `880${cleanNumber.startsWith('0') ? cleanNumber.slice(1) : cleanNumber}`;
        return `https://wa.me/${withCountryCode}`;
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                        <GraduationCap className="w-5 h-5 text-emerald-500" />
                        Contact CR/ACR
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                    {studentList.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No CR/ACR information available for this batch.
                        </div>
                    ) : (
                        studentList.map((s, index) => (
                            <div key={s.id || index} className="space-y-4 p-4 rounded-xl border border-border bg-muted/10">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-lg text-foreground leading-tight">{s.name}</h4>
                                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">ID: {s.student_id}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                                {s.account_type}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{s.batch} (Sec: {s.section})</span>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                        <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <a
                                        href={s.phone ? `tel:${s.phone}` : '#'}
                                        onClick={(e) => !s.phone && e.preventDefault()}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                            s.phone 
                                                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 hover:-translate-y-0.5 active:translate-y-0" 
                                                : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                                        }`}
                                    >
                                        <Phone className="w-4 h-4" />
                                        Call
                                    </a>
                                    <a
                                        href={s.phone ? formatWhatsAppLink(s.phone) : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => !s.phone && e.preventDefault()}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                            s.phone 
                                                ? "bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-green-500/20 hover:-translate-y-0.5 active:translate-y-0" 
                                                : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                                        }`}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        WhatsApp
                                    </a>
                                </div>
                                {s.email && (
                                    <div className="pt-2 flex items-center justify-center">
                                        <p className="text-xs text-muted-foreground truncate italic">{s.email}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end">
                    <Button variant="outline" onClick={onClose} className="rounded-lg">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StudentContactModal;
