import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

const DashboardLayout = ({ children, fullWidth = false }) => {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
            <Navbar />
            <main className={fullWidth ? "flex-grow w-full p-4 sm:p-6 lg:p-8" : "flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8"}>
                {children}
            </main>
            <Footer />
            <Toaster position="top-right" />
        </div>
    );
};

export default DashboardLayout;
