import React, { useState, useEffect } from 'react';
import { Maximize, Minimize, Link as LinkIcon, Check, Info, X, FileText, Download, Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from './ui/use-toast';
import { copyToClipboard } from '../lib/utils';

// 1. Sesuaikan Interface dengan yang ada di Index.tsx
export interface MediaItem {
    id: number;
    name: string;
    file_name: string;
    mime_type: string;
    size: number;
    human_readable_size: string;
    thumbnail_url: string;
    original_url: string;
    created_at: string;
    model_type: string;
    custom_properties: any;
    attached_to?: string;
    uploader?: { name: string } | null;
}

interface MediaViewerProps {
    media: MediaItem;
    onClose: () => void;
    onDelete: () => void;
    canDelete: boolean;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
}

export default function MediaViewer({ media, onClose, onDelete, canDelete, onNext, onPrev, hasNext, hasPrev }: MediaViewerProps) {
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    const handleCopyLink = () => {
        copyToClipboard(new URL(media.original_url, window.location.origin).href);
        toast.success('URL Media disalin ke clipboard');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = media.original_url;
        link.download = media.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-all duration-300 p-0">
            <div className="relative bg-surface shadow-2xl flex flex-col transition-all duration-300 w-screen h-[100dvh] max-w-none max-h-none border-0 rounded-none">
                
                {/* HEADER */}
                <div className="flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-3 border-b border-border-subtle bg-surface-muted/50 z-20">
                    <div className="flex items-center gap-3 overflow-hidden pr-2">
                        <span className="font-semibold text-sm text-foreground truncate max-w-[200px] sm:max-w-md">{media.file_name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {/* Desktop Only Actions */}
                        <div className="hidden sm:flex items-center gap-1">
                            <button title="Salin Tautan" onClick={handleCopyLink} className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface-muted rounded-md transition-colors">
                                {copied ? <Check className="w-4 h-4 text-success" /> : <LinkIcon className="w-4 h-4" />}
                            </button>
                            <button title="Info File" onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-md transition-colors ${showInfo ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'}`}>
                                <Info className="w-4 h-4" />
                            </button>
                            <button title="Unduh" onClick={handleDownload} className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface-muted rounded-md transition-colors">
                                <Download className="w-4 h-4" />
                            </button>
                            {canDelete && (
                                <button title="Hapus" onClick={onDelete} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <div className="w-px h-4 bg-border-subtle mx-1"></div>
                        </div>

                        {/* Always visible (Mobile & Desktop) */}
                        <button title="Tutup" onClick={onClose} className="p-1.5 sm:p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                            <X className="w-5 h-5 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-hidden relative flex bg-surface-muted/30 group">
                    {/* Slider Prev Button */}
                    {hasPrev && (
                        <button 
                            onClick={onPrev} 
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[50] p-2 sm:p-3 rounded-full bg-black/40 text-white hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-lg backdrop-blur-md"
                        >
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    )}

                    {/* Area Preview */}
                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[350px]">
                        {media.mime_type?.startsWith('image/') ? (
                            <img 
                                src={media.original_url} 
                                alt={media.name} 
                                className="max-w-full object-contain rounded-md shadow-sm select-none transition-all duration-300 max-h-[85vh]"
                            />
                        ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                                <FileText className="w-20 h-20 mb-4 opacity-50" />
                                <p className="text-sm font-medium">{media.file_name}</p>
                            </div>
                        )}
                    </div>

                    {/* Slider Next Button */}
                    {hasNext && (
                        <button 
                            onClick={onNext} 
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[50] p-2 sm:p-3 rounded-full bg-black/40 text-white hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-lg backdrop-blur-md"
                        >
                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    )}


                </div>

                {/* MOBILE FOOTER (Only visible on small screens) */}
                    <div className="sm:hidden flex items-center justify-around px-1 py-1.5 border-t border-border-subtle bg-surface-muted/50 z-20">
                    <button title="Salin Tautan" onClick={handleCopyLink} className="p-2 text-muted-foreground hover:text-foreground rounded-full transition-colors flex flex-col items-center gap-1">
                        {copied ? <Check className="w-5 h-5 text-success" /> : <LinkIcon className="w-5 h-5" />}
                    </button>
                    <button title="Unduh" onClick={handleDownload} className="p-2 text-muted-foreground hover:text-foreground rounded-full transition-colors flex flex-col items-center gap-1">
                        <Download className="w-5 h-5" />
                    </button>
                    <button title="Info File" onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-full transition-colors flex flex-col items-center gap-1 ${showInfo ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Info className="w-5 h-5" />
                    </button>
                    {canDelete && (
                        <button title="Hapus" onClick={onDelete} className="p-2 text-muted-foreground hover:text-destructive rounded-full transition-colors flex flex-col items-center gap-1">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Panel Info (Floating Card on Mobile, Sidebar on Desktop) */}
                {showInfo && (
                    <>
                        {/* Invisible Backdrop for click-outside to close */}
                        <div className="absolute inset-0 z-[15]" onClick={() => setShowInfo(false)} />
                        
                        <div className="absolute z-[60] sm:fixed sm:z-[120] bg-surface/95 backdrop-blur-md sm:overflow-y-auto animate-in duration-300 
                            /* Mobile (Floating Dropdown Card) - sits above footer */
                            inset-x-4 bottom-[60px] top-auto rounded-xl shadow-2xl border border-border-subtle fade-in zoom-in-95
                            /* Desktop (Dropdown from top right) */
                            sm:inset-auto sm:top-[60px] sm:right-4 sm:left-auto sm:w-[450px] sm:max-h-[calc(100vh-80px)] sm:pb-6 sm:rounded-xl sm:border sm:border-border-subtle sm:shadow-2xl sm:slide-in-from-top-4 sm:fade-in sm:zoom-in-95"
                        >

                            <div className="p-5 sm:p-6 pt-5 sm:pt-6 space-y-4 sm:space-y-6">
                                <div className="border-b border-border-subtle pb-3 sm:pb-4">
                                    <h3 className="font-bold text-base sm:text-lg text-foreground">Metadata Aset</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 sm:gap-5">
                                    <div className="col-span-2">
                                        <span className="block text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-0.5 sm:mb-1">Nama Tampilan</span>
                                        <span className="font-medium text-sm sm:text-base text-foreground">{media.name}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-0.5 sm:mb-1">Nama File</span>
                                        <span className="break-all text-xs sm:text-sm font-mono text-foreground">{media.file_name}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-0.5 sm:mb-1">Ukuran</span>
                                        <span className="text-sm sm:text-base text-foreground">{media.human_readable_size}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-0.5 sm:mb-1">Tipe Mime</span>
                                        <span className="text-sm sm:text-base text-foreground">{media.mime_type}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-0.5 sm:mb-1">Terlampir Pada</span>
                                        <span className="text-xs sm:text-sm text-foreground">{media.attached_to || 'Aset Sistem (Global)'}</span>
                                    </div>
                                    {media.uploader && (
                                        <div className="col-span-2">
                                            <span className="block text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-0.5 sm:mb-1">Pengunggah</span>
                                            <span className="text-sm sm:text-base text-foreground flex items-center gap-2">
                                                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] sm:text-xs font-bold">
                                                    {media.uploader.name.charAt(0)}
                                                </span>
                                                {media.uploader.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}