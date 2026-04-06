import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBugReports, createBugReport, updateBugReportStatus, getBugMessages, addBugMessage } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { Send, Image as ImageIcon, Mic, X, CheckCircle, Bug, Search, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils.js';
import VoicePlayer from './ui/VoicePlayer';
import { AnimatePresence, motion } from 'framer-motion';

const BugReportPage = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [activeReport, setActiveReport] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // New Report Form
    const [showNewReport, setShowNewReport] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    
    // Chat Input
    const [textInput, setTextInput] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [sendingMessage, setSendingMessage] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const pollIntervalRef = useRef(null);

    const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.permissions?.includes('manage_bugs');

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        if (activeReport) {
            fetchMessages(activeReport.id);
            // Polling for new messages
            pollIntervalRef.current = setInterval(() => {
                fetchMessages(activeReport.id, true);
            }, 5000);
        }
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [activeReport]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const fetchReports = async () => {
        try {
            setLoadingReports(true);
            const res = await getBugReports();
            if (res.data.success) {
                setReports(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            toast.error('Failed to load tickets');
        } finally {
            setLoadingReports(false);
        }
    };

    const fetchMessages = async (reportId, silent = false) => {
        try {
            if (!silent) setLoadingMessages(true);
            const res = await getBugMessages(reportId);
            if (res.data.success) {
                setMessages(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            if (!silent) toast.error('Failed to load messages');
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    };

    const handleCreateReport = async (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newDesc.trim()) return toast.error('Title and description are required');
        
        try {
            const toastId = toast.loading('Creating ticket...');
            const res = await createBugReport({ title: newTitle, description: newDesc });
            if (res.data.success) {
                toast.success('Ticket created!', { id: toastId });
                setShowNewReport(false);
                setNewTitle('');
                setNewDesc('');
                fetchReports();
                setActiveReport(res.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error('Failed to create ticket');
        }
    };

    const handleMarkSolved = async () => {
        if (!activeReport) return;
        try {
            const res = await updateBugReportStatus(activeReport.id, 'solved');
            if (res.data.success) {
                toast.success('Ticket marked as solved');
                setActiveReport(prev => ({ ...prev, status: 'solved' }));
                setReports(prev => prev.map(r => r.id === activeReport.id ? { ...r, status: 'solved' } : r));
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
        }
    };

    // --- Media & Chat Handling ---
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('Only images are allowed');
        
        setSelectedImage(file);
        const url = URL.createObjectURL(file);
        setImagePreview(url);
    };

    const clearImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                sendVoiceMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing mic:', error);
            toast.error('Microphone access denied or unavailable');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = null; // Prevent sending
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setRecordingTime(0);
        }
    };

    const sendVoiceMessage = async (audioBlob) => {
        if (!activeReport) return;
        setSendingMessage(true);
        const formData = new FormData();
        formData.append('media', audioBlob, 'voice.webm');
        formData.append('message_type', 'voice');

        try {
            const res = await addBugMessage(activeReport.id, formData);
            if (res.data.success) {
                setMessages(prev => [...prev, res.data.data]);
            }
        } catch (error) {
            console.error('Error sending voice message', error);
            toast.error('Failed to send voice note');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!activeReport || sendingMessage) return;
        if (!textInput.trim() && !selectedImage) return;

        setSendingMessage(true);
        const formData = new FormData();
        
        if (selectedImage) {
            formData.append('media', selectedImage);
            formData.append('message_type', 'image');
            formData.append('message_content', textInput.trim());
        } else {
            formData.append('message_type', 'text');
            formData.append('message_content', textInput.trim());
        }

        try {
            const res = await addBugMessage(activeReport.id, formData);
            if (res.data.success) {
                setMessages(prev => [...prev, res.data.data]);
                setTextInput('');
                clearImage();
            }
        } catch (error) {
            console.error('Error sending message', error);
            toast.error('Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    const filteredReports = reports.filter(r => 
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-background">
            
            {/* Sidebar (List of Tickets) */}
            <div className={cn(
                "w-full md:w-1/3 lg:w-1/4 border-r border-border flex flex-col transition-all duration-300",
                activeReport ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b border-border space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Bug className="text-indigo-500" />
                            Bug Reports
                        </h2>
                        {!isAdmin && (
                            <button 
                                onClick={() => { setShowNewReport(true); setActiveReport(null); }}
                                className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md transition-colors"
                            >
                                New Ticket
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="Search tickets..." 
                            className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loadingReports ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                    ) : filteredReports.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-8">No reports found.</p>
                    ) : (
                        filteredReports.map(report => (
                            <div 
                                key={report.id}
                                onClick={() => { setActiveReport(report); setShowNewReport(false); }}
                                className={cn(
                                    "p-3 rounded-lg cursor-pointer transition-all border",
                                    activeReport?.id === report.id 
                                        ? "bg-primary/10 border-primary/30" 
                                        : "bg-card hover:bg-muted/50 border-transparent hover:border-border"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-sm line-clamp-1">{report.title || "Untitled"}</h4>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
                                        report.status === 'solved' ? "bg-emerald-500/10 text-emerald-600" :
                                        report.status === 'in_progress' ? "bg-orange-500/10 text-orange-600" :
                                        "bg-blue-500/10 text-blue-600"
                                    )}>
                                        {report.status}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{report.description}</p>
                                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                    <span>{isAdmin && report.users?.full_name ? report.users.full_name : formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-muted/10 relative",
                !activeReport && !showNewReport ? "hidden md:flex" : "flex"
            )}>
                {showNewReport ? (
                    // New Report Form
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        <button onClick={() => setShowNewReport(false)} className="md:hidden flex items-center gap-2 text-muted-foreground mb-4">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <div className="max-w-2xl mx-auto bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm">
                            <h2 className="text-2xl font-bold mb-6">Submit a New Bug Report</h2>
                            <form onSubmit={handleCreateReport} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Title / Category</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="E.g. Login page is crashing"
                                        className="w-full p-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Detailed Description</label>
                                    <textarea 
                                        required
                                        rows={6}
                                        placeholder="Describe the issue you are facing, steps to reproduce, etc."
                                        className="w-full p-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowNewReport(false)} className="px-4 py-2 rounded-md hover:bg-muted transition-colors">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium shadow-sm">
                                        Submit Report
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : activeReport ? (
                    // Chat Thread View
                    <>
                        {/* Header */}
                        <div className="h-16 border-b border-border bg-card px-4 flex items-center justify-between shrink-0 shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveReport(null)} className="md:hidden p-1 -ml-1 text-muted-foreground hover:bg-muted rounded-md shrink-0">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        {activeReport.title}
                                        {activeReport.status === 'solved' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                    </h3>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{activeReport.description}</p>
                                </div>
                            </div>
                            {isAdmin && activeReport.status !== 'solved' && (
                                <button 
                                    onClick={handleMarkSolved}
                                    className="flex items-center gap-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Mark Solved
                                </button>
                            )}
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {loadingMessages ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : (
                                <>
                                    {/* Original Report Message Bubble */}
                                    <div className="flex flex-col gap-1 items-start">
                                        <span className="text-[10px] text-muted-foreground ml-1">Original Report</span>
                                        <div className="bg-card border border-border shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] md:max-w-[70%] text-sm">
                                            <p className="font-medium mb-1">{activeReport.title}</p>
                                            <p className="text-muted-foreground whitespace-pre-wrap">{activeReport.description}</p>
                                        </div>
                                    </div>
                                    
                                    {messages.map((msg, idx) => {
                                        const isMine = msg.sender_id === user.id;
                                        const isAdminMsg = isAdmin ? isMine : (msg.users?.role === 'Admin' || msg.users?.role === 'Super Admin');
                                        
                                        return (
                                            <div key={msg.id || idx} className={cn("flex flex-col gap-1", isMine ? "items-end" : "items-start")}>
                                                <span className="text-[10px] text-muted-foreground px-1">
                                                    {isMine ? 'You' : msg.users?.full_name || 'Admin'} • {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                                </span>
                                                <div className={cn(
                                                    "px-4 py-2.5 max-w-[85%] md:max-w-[70%] text-sm shadow-sm",
                                                    isMine 
                                                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
                                                        : isAdminMsg 
                                                            ? "bg-indigo-500/10 border border-indigo-500/20 text-foreground rounded-2xl rounded-tl-sm"
                                                            : "bg-card border border-border text-foreground rounded-2xl rounded-tl-sm"
                                                )}>
                                                    
                                                    {msg.message_type === 'image' && (
                                                        <div className="mb-2">
                                                            <a href={msg.message_content} target="_blank" rel="noopener noreferrer">
                                                                <img src={msg.message_content} alt="Attachment" className="rounded-lg max-h-60 object-cover border border-white/20" />
                                                            </a>
                                                        </div>
                                                    )}
                                                    
                                                    {msg.message_type === 'voice' ? (
                                                        <VoicePlayer url={msg.message_content} />
                                                    ) : (
                                                        <p className="whitespace-pre-wrap">{msg.message_content || (msg.message_type === 'image' ? '' : '...')}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input Area */}
                        {activeReport.status !== 'solved' ? (
                            <div className="p-4 bg-card border-t border-border shrink-0">
                                {imagePreview && (
                                    <div className="mb-3 relative inline-block">
                                        <img src={imagePreview} alt="Preview" className="h-20 rounded-md border border-border" />
                                        <button onClick={clearImage} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                
                                {isRecording ? (
                                    <div className="flex items-center gap-4 bg-destructive/10 text-destructive p-3 rounded-full border border-destructive/20 animate-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-2 flex-1 pl-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse"></div>
                                            <span className="font-mono font-medium">{formatTime(recordingTime)}</span>
                                            <span className="text-sm opacity-80 animate-pulse">Recording...</span>
                                        </div>
                                        <button onClick={cancelRecording} className="p-2 hover:bg-destructive/20 rounded-full transition-colors" title="Cancel">
                                            <X className="w-5 h-5" />
                                        </button>
                                        <button onClick={stopRecording} className="px-4 py-1.5 bg-destructive text-white rounded-full text-sm font-medium hover:bg-destructive/90 transition-colors shadow-sm">
                                            Send
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                        <div className="flex-none pb-1">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                ref={fileInputRef}
                                                onChange={handleImageSelect}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2.5 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                                                title="Attach Image"
                                            >
                                                <ImageIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                        
                                        <div className="flex-1 bg-muted/50 border border-input rounded-2xl flex items-end focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                                            <textarea 
                                                placeholder="Type a message..."
                                                className="w-full bg-transparent max-h-32 min-h-[44px] p-3 text-sm focus:outline-none resize-none"
                                                rows={1}
                                                value={textInput}
                                                onChange={(e) => {
                                                    setTextInput(e.target.value);
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                            />
                                            {!textInput.trim() && !selectedImage && (
                                                <button 
                                                    type="button" 
                                                    onClick={startRecording}
                                                    className="p-3 text-muted-foreground hover:text-primary transition-colors shrink-0"
                                                    title="Hold to Record"
                                                >
                                                    <Mic className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex-none pb-1">
                                            <button 
                                                type="submit" 
                                                disabled={(!textInput.trim() && !selectedImage) || sendingMessage}
                                                className={cn(
                                                    "p-2.5 rounded-full flex items-center justify-center transition-all",
                                                    textInput.trim() || selectedImage
                                                        ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:scale-105" 
                                                        : "bg-muted text-muted-foreground cursor-not-allowed"
                                                )}
                                            >
                                                {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20 text-center text-sm text-emerald-600 font-medium shrink-0">
                                This issue has been marked as solved. No further messages can be sent.
                            </div>
                        )}
                    </>
                ) : (
                    // Empty State
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                            <Bug className="w-8 h-8 opacity-50" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">Bug Report System</h3>
                        <p className="max-w-md">Select a ticket from the sidebar to view details or create a new ticket to get help from the admin team.</p>
                        {!isAdmin && (
                            <button 
                                onClick={() => setShowNewReport(true)}
                                className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow"
                            >
                                Submit New Bug
                            </button>
                        )}
                    </div>
                )}
            </div>
            
        </div>
    );
};

// Helper for formatting recording time
const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default BugReportPage;
