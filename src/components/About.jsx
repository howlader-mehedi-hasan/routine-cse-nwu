import React, { useState } from 'react';
import { Book, Info, HelpCircle, Globe2, CheckCircle2, Layout, FileText, Users, Settings, Database, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const About = () => {
    const [lang, setLang] = useState('en');
    const navigate = useNavigate();

    const content = {
        en: {
            title: "About NWU Smart Routine",
            subtitle: "Modern Academic Management for Department of CSE",
            description: "NWU Smart Routine Management System is a professional, full-stack platform designed to streamline academic scheduling at North Western University. It replaces traditional, manual scheduling methods with a sleek, digital interface that ensures clarity for students and efficiency for administrators.",
            highlights: [
                { icon: <Layout className="w-5 h-5" />, text: "Multiple Interactive Views" },
                { icon: <FileText className="w-5 h-5" />, text: "Customizable PDF Exports" },
                { icon: <Users className="w-5 h-5" />, text: "Integrated Faculty Directory" },
                { icon: <Database className="w-5 h-5" />, text: "Secure Cloud Backups" }
            ],
            manualTitle: "User Manual",
            manualDescription: "Follow these simple steps to make the most out of the system:",
            steps: [
                {
                    title: "Viewing Routines",
                    desc: "Navigate to 'Home' for the 'Daily View' or 'Week View' for the full weekly schedule. Use the sidebar to quickly jump between sections."
                },
                {
                    title: "Faculty Contact",
                    desc: "Visit the 'Faculty' page to search for instructors. Use the integrated 'Call' or 'WhatsApp' buttons to connect directly."
                },
                {
                    title: "PDF Export",
                    desc: "In 'Week View', click the central 'PDF' button. You can customize headers, signatures, and backgrounds in the settings modal."
                },
                {
                    title: "Administrative Actions",
                    desc: "If you have admin access, use the 'Admin Panel' to manage Faculty, Courses, Rooms, and Batches. All changes are logged for transparency."
                },
                {
                    title: "Data Backup",
                    desc: "In the 'Week View' or 'Settings', use 'Export' for local JSON backups or 'Cloud' to save directly to the secure departmental storage."
                }
            ],
            cta: "Go to Routine"
        },
        bn: {
            title: "এনডাব্লিউইউ স্মার্ট রুটিন সম্পর্কে",
            subtitle: "সিএসই বিভাগের জন্য আধুনিক একাডেমিক ম্যানেজমেন্ট",
            description: "এনডাব্লিউইউ স্মার্ট রুটিন ম্যানেজমেন্ট সিস্টেম হলো নর্থ ওয়েস্টার্ন ইউনিভার্সিটির একাডেমিক সিডিউল ম্যানেজ করার একটি পূর্ণাঙ্গ প্ল্যাটফর্ম। এটি প্রচলিত ম্যানুয়াল পদ্ধতির পরিবর্তে একটি আধুনিক ডিজিটাল ইন্টারফেস প্রদান করে যা শিক্ষার্থীদের জন্য স্বচ্ছতা এবং অ্যাডমিনদের জন্য দক্ষতা নিশ্চিত করে।",
            highlights: [
                { icon: <Layout className="w-5 h-5" />, text: "মাল্টিপল ইন্টারেক্টিভ ভিউ" },
                { icon: <FileText className="w-5 h-5" />, text: "কাস্টমাইজবল পিডিএফ এক্সপোর্ট" },
                { icon: <Users className="w-5 h-5" />, text: "ফ্যাকাল্টি ডিরেক্টরি" },
                { icon: <Database className="w-5 h-5" />, text: "নিরাপদ ক্লাউড ব্যাকআপ" }
            ],
            manualTitle: "ব্যবহার নির্দেশিকা (ইউজার ম্যানুয়াল)",
            manualDescription: "সিস্টেমটি সঠিকভাবে ব্যবহার করতে নিচের ধাপগুলো অনুসরণ করুন:",
            steps: [
                {
                    title: "রুটিন দেখা",
                    desc: "হোম পেজে 'ডেইলি ভিউ' অথবা পুরো সাপ্তাহিক সিডিউল দেখতে 'Week View' এ যান। সাইডবার ব্যবহার করে দ্রুত বিভিন্ন সেকশনে ন্যাভিগেট করুন।"
                },
                {
                    title: "ফ্যাকাল্টি যোগাযোগ",
                    desc: "পছন্দের শিক্ষককে খুঁজে পেতে 'Faculty' পেজে যান। সরাসরি যোগাযোগ করতে 'Call' বা 'WhatsApp' বাটন ব্যবহার করুন।"
                },
                {
                    title: "পিডিএফ এক্সপোর্ট",
                    desc: "'Week View'-তে থাকা 'PDF' বাটনে ক্লিক করুন। সেটিংস মোডাল থেকে আপনি হেডার, সিগনেচার এবং ব্যাকগ্রাউন্ড কাস্টমাইজ করতে পারেন।"
                },
                {
                    title: "অ্যাডমিন অ্যাকশন",
                    desc: "অ্যাডমিন অ্যাক্সেস থাকলে 'Admin Panel' ব্যবহার করে ফ্যাকাল্টি, কোর্স, রুম এবং ব্যাচ ম্যানেজ করুন। স্বচ্ছতার জন্য সব পরিবর্তন লগ করা হয়।"
                },
                {
                    title: "ডেটা ব্যাকআপ",
                    desc: "'Week View' বা 'Settings' থেকে লোকাল ব্যাকআপের জন্য 'Export' অথবা সরাসরি ক্লাউড স্টোরেজে সেভ করতে 'Cloud' অপশন ব্যবহার করুন।"
                }
            ],
            cta: "রুটিন দেখুন"
        }
    };

    const current = content[lang];

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Language Toggle */}
            <div className="flex justify-end sticky top-20 z-10">
                <div className="bg-card/80 backdrop-blur-md border border-border p-1 rounded-full shadow-lg flex pointer-events-auto">
                    <button
                        onClick={() => setLang('en')}
                        className={cn(
                            "px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 flex items-center gap-2",
                            lang === 'en' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"
                        )}
                    >
                        <Globe2 className="w-3.5 h-3.5" />
                        English
                    </button>
                    <button
                        onClick={() => setLang('bn')}
                        className={cn(
                            "px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 flex items-center gap-2",
                            lang === 'bn' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"
                        )}
                    >
                        <Globe2 className="w-3.5 h-3.5" />
                        বাংলা
                    </button>
                </div>
            </div>

            {/* Project Description Section */}
            <section className="space-y-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-xs">
                        <Info className="w-4 h-4" />
                        <span>Project Overview</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground lg:text-6xl">
                        {current.title}
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed">
                        {current.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div className="space-y-6">
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                            {current.description}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {current.highlights.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50 group hover:bg-muted/60 transition-colors">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <span className="text-sm font-semibold">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="relative group overflow-hidden rounded-2xl border border-border shadow-2xl bg-muted/20 p-2">
                         <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-card to-transparent z-1"></div>
                         <div className="p-6 space-y-4 relative z-2">
                             <div className="h-4 w-1/2 bg-primary/20 rounded-full"></div>
                             <div className="space-y-2">
                                 <div className="h-3 w-full bg-muted rounded-full"></div>
                                 <div className="h-3 w-3/4 bg-muted rounded-full"></div>
                             </div>
                             <div className="grid grid-cols-4 gap-2 pt-4">
                                 {[1,2,3,4].map(i => <div key={i} className="h-10 bg-muted/50 rounded-lg border border-border/50"></div>)}
                             </div>
                         </div>
                    </div>
                </div>
            </section>

            {/* User Manual Section */}
            <section className="space-y-10 pt-8 border-t border-border">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-500 font-bold tracking-wider uppercase text-xs">
                        <Book className="w-4 h-4" />
                        <span>How it works</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                        {current.manualTitle}
                    </h2>
                    <p className="text-muted-foreground font-medium">
                        {current.manualDescription}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {current.steps.map((step, idx) => (
                        <div key={idx} className="relative p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all group overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 -mr-4 -mt-4 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                            
                            <div className="relative space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg border border-primary/20">
                                        {idx + 1}
                                    </div>
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500/0 group-hover:text-emerald-500 transition-all transform scale-50 group-hover:scale-100" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer CTA */}
            <div className="pt-12 flex justify-center">
                <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20" onClick={() => navigate('/')}>
                    {current.cta}
                    <ArrowRight className="ml-2 w-5 h-5 flex-shrink-0" />
                </Button>
            </div>
        </div>
    );
};

export default About;
