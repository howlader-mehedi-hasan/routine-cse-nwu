import React, { useState, useEffect } from 'react';
import { getFaculty } from '../services/api';
import { Search, Phone, MessageCircle, User, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import EditContactModal from './modals/EditContactModal';

const FacultyList = () => {
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPermanent, setShowPermanent] = useState(true);
    const [showGuest, setShowGuest] = useState(true);
    const [showAdjunct, setShowAdjunct] = useState(true);
    const { user } = useAuth();
    const [editingFaculty, setEditingFaculty] = useState(null);
    const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';

    useEffect(() => {
        fetchFaculty();
    }, []);

    const fetchFaculty = async () => {
        try {
            const response = await getFaculty();
            setFaculty(response.data || []);
        } catch (error) {
            console.error("Error fetching faculty:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredFaculty = faculty.filter(f => {
        // Type Filter
        if (f.type === 'Permanent' && !showPermanent) return false;
        if (f.type === 'Guest' && !showGuest) return false;
        if (f.type === 'Adjunct' && !showAdjunct) return false;

        return (
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const formatWhatsAppLink = (phone) => {
        if (!phone) return '#';
        // Remove non-numeric characters for the link
        const cleanNumber = phone.replace(/\D/g, '');
        return `https://wa.me/${cleanNumber}`;
    };

    return (
        <div className="w-full px-6 mx-auto space-y-8 animate-in fade-in duration-500 py-8">
            {/* Sticky Search and Filter Header */}
            <div className="sticky top-[64px] z-20 bg-background/95 backdrop-blur-sm py-4 space-y-4 border-b -mx-6 px-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Faculty Members</h2>
                        <p className="text-muted-foreground mt-1 text-sm">Contact our esteemed faculty members.</p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search faculty..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 w-full text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showPermanent}
                            onChange={(e) => setShowPermanent(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Permanent
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showGuest}
                            onChange={(e) => setShowGuest(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Guest
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showAdjunct}
                            onChange={(e) => setShowAdjunct(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Adjunct
                    </label>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading faculty directory...</div>
            ) : filteredFaculty.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border text-muted-foreground">
                    No faculty members found matching your search.
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <AnimatePresence>
                        {filteredFaculty.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex gap-3">
                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                                                <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => setEditingFaculty(item)}
                                                    className="p-2 h-fit bg-muted hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-muted-foreground hover:text-indigo-600 transition-colors rounded-lg"
                                                    title="Edit Faculty"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                                            {item.initials}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg text-foreground mb-1">{item.name}</h3>
                                    <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-2">{item.designation || 'Faculty Member'}</p>
                                    <p className="text-sm text-muted-foreground mb-1">{item.type}</p>
                                    <p className="text-xs text-muted-foreground truncate" title={item.email}>{item.email}</p>
                                </div>

                                <div className="p-4 bg-muted/30 border-t border-border mt-auto grid grid-cols-2 gap-3">
                                    <a
                                        href={item.phone ? `tel:${item.phone}` : '#'}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${item.phone
                                            ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                            : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                            }`}
                                        onClick={e => !item.phone && e.preventDefault()}
                                        title={item.phone ? "Call Faculty" : "Phone number not available"}
                                    >
                                        <Phone className="w-4 h-4" />
                                        <span>Call</span>
                                    </a>

                                    <a
                                        href={item.phone ? formatWhatsAppLink(item.phone) : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${item.phone
                                            ? "bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm"
                                            : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                            }`}
                                        onClick={e => !item.phone && e.preventDefault()}
                                        title={item.phone ? "WhatsApp Message" : "Phone number not available"}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>WhatsApp</span>
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <EditContactModal 
                isOpen={!!editingFaculty} 
                onClose={() => setEditingFaculty(null)} 
                data={editingFaculty} 
                type="faculty" 
                onUpdate={fetchFaculty} 
            />
        </div>
    );
};

export default FacultyList;
