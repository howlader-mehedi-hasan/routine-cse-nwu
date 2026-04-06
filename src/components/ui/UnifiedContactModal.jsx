import React, { useState, useEffect } from 'react';
import { X, User, GraduationCap, Phone, MessageCircle, Mail } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const UnifiedContactModal = ({ 
    isOpen, 
    onClose, 
    facultyList = [], 
    studentList = [], 
    batchName, 
    sectionName,
    defaultTab
}) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('faculty');

    useEffect(() => {
        if (isOpen && user) {
            if (defaultTab) {
                setActiveTab(defaultTab);
            } else {
                // Default tab logic based on user role
                if (user.role === 'Faculty' || user.faculty_id) {
                    setActiveTab('students');
                } else {
                    setActiveTab('faculty');
                }
            }
        }
    }, [isOpen, user, defaultTab]);

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
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1 text-left">
                            <h3 className="text-lg font-bold text-foreground leading-none">Contact Support</h3>
                            <p className="text-xs text-muted-foreground">{batchName} (Sec: {sectionName})</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Horizontal Tabs */}
                    <div className="flex bg-muted rounded-lg p-1 border border-border shadow-sm">
                        <button
                            onClick={() => setActiveTab('faculty')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                                activeTab === 'faculty' 
                                    ? "bg-card text-indigo-600 shadow-sm border border-border/50" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <User className="w-4 h-4" />
                            Faculty
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                                activeTab === 'students' 
                                    ? "bg-card text-emerald-600 shadow-sm border border-border/50" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <GraduationCap className="w-4 h-4" />
                            CR/ACR
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                    {activeTab === 'faculty' ? (
                        facultyList.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground italic">
                                <User className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                No faculty information available.
                            </div>
                        ) : (
                            facultyList.map((f, i) => (
                                <ContactCard key={i} data={f} type="faculty" formatWhatsAppLink={formatWhatsAppLink} />
                            ))
                        )
                    ) : (
                        studentList.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground italic">
                                <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                No CR/ACR information for this batch.
                            </div>
                        ) : (
                            studentList.map((s, i) => (
                                <ContactCard key={i} data={s} type="student" formatWhatsAppLink={formatWhatsAppLink} />
                            ))
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end">
                    <Button variant="outline" onClick={onClose} className="rounded-lg px-6">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

const ContactCard = ({ data, type, formatWhatsAppLink }) => {
    const isFaculty = type === 'faculty';
    const accentColor = isFaculty ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400';
    const bgColor = isFaculty ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';

    return (
        <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/10 relative overflow-hidden group text-left">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h4 className="font-bold text-base text-foreground leading-tight">{data.name}</h4>
                    {isFaculty ? (
                        <p className={`text-xs font-medium ${accentColor}`}>{data.designation || 'Faculty Member'}</p>
                    ) : (
                        <p className={`text-xs font-medium ${accentColor}`}>ID: {data.student_id}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                            isFaculty ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        )}>
                            {isFaculty ? (data.initials || 'TBA') : data.account_type}
                        </span>
                        {!isFaculty && <span className="text-[10px] text-muted-foreground">{data.batch} (Sec: {data.section})</span>}
                    </div>
                </div>
                <div className={cn("p-2 rounded-lg shrink-0", bgColor)}>
                    {isFaculty ? <User className={cn("w-5 h-5", accentColor)} /> : <GraduationCap className={cn("w-5 h-5", accentColor)} />}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                    href={data.phone ? `tel:${data.phone}` : '#'}
                    onClick={(e) => !data.phone && e.preventDefault()}
                    className={cn(
                        "flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all",
                        data.phone 
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:-translate-y-0.5 active:translate-y-0" 
                            : "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
                    )}
                >
                    <Phone className="w-4 h-4" />
                    Call
                </a>
                <a
                    href={data.phone ? formatWhatsAppLink(data.phone) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => !data.phone && e.preventDefault()}
                    className={cn(
                        "flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all",
                        data.phone 
                            ? "bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm hover:-translate-y-0.5 active:translate-y-0" 
                            : "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
                    )}
                >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                </a>
            </div>
            {data.email && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{data.email}</span>
                </div>
            )}
        </div>
    );
};

export default UnifiedContactModal;
