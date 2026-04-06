import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const VoicePlayer = ({ url }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => {
            setProgress((audio.currentTime / audio.duration) * 100);
        };
        const onLoadedMetadata = () => {
            setDuration(audio.duration);
        };
        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-full border border-border/50 max-w-xs min-w-[200px]">
            <button
                onClick={togglePlay}
                className="w-8 h-8 flex flex-shrink-0 items-center justify-center bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
            </button>
            <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-100 ease-linear" 
                        style={{ width: `${progress}%` }} 
                    />
                </div>
                <span className="text-[10px] text-muted-foreground mr-2 font-mono whitespace-nowrap">
                    {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(duration)}
                </span>
            </div>
            <audio ref={audioRef} src={url} className="hidden" />
        </div>
    );
};

export default VoicePlayer;
