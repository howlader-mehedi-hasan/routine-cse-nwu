import React from 'react';
import {
    Facebook,
    Globe,
    BookOpen,
    ExternalLink,
    Github,
    Code2
} from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const quickLinks = [
        { name: 'NWU Official', url: 'https://nwu.ac.bd/', icon: <Globe className="w-4 h-4" /> },
        { name: 'Academic Portal', url: 'https://academic.nwu.ac.bd/', icon: <BookOpen className="w-4 h-4" /> },
        { name: 'Study Resource', url: 'https://study-hmh.vercel.app/', icon: <ExternalLink className="w-4 h-4" /> },
    ];

    const socialLinks = [
        { name: 'CSE Department', url: 'https://www.facebook.com/nwucsedepartment' },
        { name: 'NWU Facebook', url: 'https://www.facebook.com/nwu.ac.bd' },
        { name: 'Comptron NWU', url: 'https://www.facebook.com/comptron.nwu' },
        { name: 'Radio NWU', url: 'https://www.facebook.com/RadioNWU' },
    ];

    return (
        <footer className="mt-auto border-t bg-card/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                    {/* Brand & Rights Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Code2 className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">NWU Routine</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Efficiently managing class schedules for the Department of Computer Science and Engineering at North Western University.
                        </p>
                        <div className="pt-4 border-t border-border/50">
                            <p className="text-xs text-muted-foreground">
                                &copy; {currentYear} All rights reserved by
                                <span className="block font-medium text-foreground mt-1">
                                    The department of Computer Science and Engineering,
                                    North Western University, Khulna, Bangladesh
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Quick Academic Links */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                            Academic Resources
                        </h3>
                        <ul className="space-y-4">
                            {quickLinks.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                                    >
                                        <span className="p-1.5 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                                            {link.icon}
                                        </span>
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social & Department Links */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                            Connect With Us
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {socialLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                                >
                                    <Facebook className="w-4 h-4" />
                                    {link.name}
                                </a>
                            ))}
                        </div>

                        <div className="pt-8">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
                                Developed By
                            </h3>
                            <a
                                href="https://howlader-mehedi-hasan.github.io/portfoleo/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-300"
                            >
                                <Github className="w-4 h-4" />
                                Howlader Mehedi Hasan
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
