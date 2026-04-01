import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const SearchableSelect = ({ 
    options = [], 
    value = "", 
    onValueChange, 
    placeholder = "Select option...", 
    searchPlaceholder = "Search...",
    className = "" 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        (opt.searchTerms && opt.searchTerms.toLowerCase().includes(search.toLowerCase()))
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onValueChange(val);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            <div
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer transition-all hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    !selectedOption && "text-muted-foreground",
                    isOpen && "ring-2 ring-ring ring-offset-2"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")} />
            </div>

            {isOpen && (
                <div className="absolute border z-50 mt-1 w-full rounded-md border-border bg-card text-card-foreground shadow-lg outline-none animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center border-b border-border px-3 py-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                        {search && (
                            <X className="h-4 w-4 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setSearch('')} />
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={cn(
                                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors",
                                        String(value) === String(opt.value) 
                                            ? "bg-primary/10 text-primary font-medium" 
                                            : "text-foreground hover:bg-muted"
                                    )}
                                    onClick={() => handleSelect(opt.value)}
                                >
                                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                        {String(value) === String(opt.value) && <Check className="h-4 w-4" />}
                                    </span>
                                    <div className="flex flex-col truncate">
                                        <span>{opt.label}</span>
                                        {opt.subLabel && <span className="text-[10px] opacity-70">{opt.subLabel}</span>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-6 text-center text-sm text-muted-foreground">No results found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export { SearchableSelect };
