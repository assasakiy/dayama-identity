import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from './dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Btn } from './btn';
import { Input } from './input';
import { PRESET_ICONS, PresetIconName } from '../../lib/icon-registry';
import { Search, Upload, X, Check, LayoutGrid, Image as ImageIcon, Loader2 } from 'lucide-react';

interface IconPickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export function DynamicIcon({ icon, className = "w-5 h-5" }: { icon: string; className?: string }) {
    if (!icon) return <ImageIcon className={`${className} opacity-50`} />;

    if (icon.startsWith('url:')) {
        return <img src={icon.substring(4)} alt="icon" className={`${className} object-contain`} />;
    }

    let lucideName = icon;
    if (icon.startsWith('lucide:')) {
        lucideName = icon.substring(7);
    }

    const IconComponent = PRESET_ICONS[lucideName as PresetIconName];
    if (IconComponent) {
        return <IconComponent className={className} />;
    }

    return <span title={`Icon ${lucideName} not found`}><ImageIcon className={`${className} opacity-50 text-destructive`} /></span>;
}

export function IconPicker({ value, onChange, label = "Ikon" }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('library');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Upload state
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Selected state inside modal before saving
    const [tempValue, setTempValue] = useState<string>(value || '');

    // Reset state when opening
    useEffect(() => {
        if (open) {
            setTempValue(value || '');
            setSearchQuery('');
            setActiveTab('library');
            setUploadFile(null);
            setUploadPreview(null);
            setUploading(false);
        }
    }, [open, value]);

    const presetNames = Object.keys(PRESET_ICONS) as PresetIconName[];
    
    const filteredIcons = useMemo(() => {
        if (!searchQuery) return presetNames;
        const q = searchQuery.toLowerCase();
        return presetNames.filter(name => name.toLowerCase().includes(q));
    }, [searchQuery, presetNames]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadFile(file);
            setUploadPreview(URL.createObjectURL(file));
        }
    };

    const doUpload = async () => {
        if (!uploadFile) return;
        setUploading(true);
        
        const formData = new FormData();
        formData.append('icon', uploadFile);

        try {
            // Kita butuh axios, atau fetch. Kita pakai fetch dengan CSRF token Inertia.
            const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch('/dashboard/icons/upload', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');
            
            const data = await res.json();
            const newIconVal = `url:${data.url}`;
            onChange(newIconVal);
            setOpen(false);
        } catch (err) {
            console.error(err);
            alert("Gagal mengupload ikon. Pastikan format valid (svg, png, jpg).");
        } finally {
            setUploading(false);
        }
    };

    const handleConfirm = () => {
        if (activeTab === 'library') {
            onChange(tempValue);
            setOpen(false);
        } else if (activeTab === 'upload') {
            doUpload();
        }
    };

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium">{label}</label>}
            
            <div className="flex gap-2 items-center">
                <div 
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-3 w-full border border-border-subtle rounded-md px-3 py-2 cursor-pointer hover:border-primary/50 transition-colors bg-background"
                >
                    <div className="w-8 h-8 rounded bg-surface-muted flex items-center justify-center shrink-0">
                        <DynamicIcon icon={value} className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="flex-1 truncate text-sm">
                        {value ? value : <span className="text-muted-foreground">Pilih Ikon...</span>}
                    </div>
                                    <Btn type="button" size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
                                        Jelajahi
                                    </Btn>
                </div>
                
                {value && (
                    <Btn type="button" size="sm" variant="ghost" className="shrink-0 text-destructive hover:bg-destructive/10" onClick={() => onChange('')} icon={<X className="w-4 h-4" />} />
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border-subtle mb-0 shrink-0">
                        <DialogTitle className="text-base">Pilih Ikon</DialogTitle>
                        <DialogClose className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors">
                            <X className="w-4 h-4" />
                        </DialogClose>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="px-6 pt-4 shrink-0 flex items-center justify-between gap-4">
                            <TabsList className="grid w-full max-w-[300px] grid-cols-2">
                                <TabsTrigger value="library" className="gap-2 text-xs">
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    Pustaka
                                </TabsTrigger>
                                <TabsTrigger value="upload" className="gap-2 text-xs">
                                    <Upload className="w-3.5 h-3.5" />
                                    Unggah
                                </TabsTrigger>
                            </TabsList>

                            {activeTab === 'library' && (
                                <div className="relative w-full max-w-[200px]">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input 
                                        type="text"
                                        placeholder="Cari ikon..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-8 text-xs bg-surface-muted border-transparent focus-visible:bg-background focus-visible:border-primary"
                                    />
                                </div>
                            )}
                        </div>

                        {/* LIBRARY TAB */}
                        <TabsContent value="library" className="flex-1 overflow-y-auto p-6 m-0 outline-none">
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                {filteredIcons.map(name => {
                                    const IconComponent = PRESET_ICONS[name];
                                    const iconKey = `lucide:${name}`;
                                    const isSelected = tempValue === iconKey || tempValue === name;
                                    return (
                                        <div 
                                            key={name}
                                            onClick={() => setTempValue(iconKey)}
                                            className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all border ${
                                                isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border-subtle bg-surface-muted/30 hover:border-primary/50 text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <IconComponent className="w-6 h-6 mb-1" />
                                            <span className="text-[10px] truncate w-full text-center px-1" title={name}>{name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            {filteredIcons.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    Ikon tidak ditemukan.
                                </div>
                            )}
                        </TabsContent>

                        {/* UPLOAD TAB */}
                        <TabsContent value="upload" className="flex-1 overflow-y-auto p-6 m-0 outline-none flex items-center justify-center">
                            <div className="w-full max-w-md">
                                {!uploadFile ? (
                                    <div 
                                        className="border-2 border-dashed border-border-subtle rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-muted transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".svg,.png,.jpg,.jpeg,.webp" />
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                                            <Upload className="w-5 h-5 text-primary" />
                                        </div>
                                        <h3 className="text-sm font-semibold mb-1">Klik untuk Upload Ikon</h3>
                                        <p className="text-xs text-muted-foreground text-center">
                                            Format didukung: SVG, PNG, JPG (Maks. 2MB). Sangat disarankan SVG.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {uploadPreview && (
                                            <div className="w-full aspect-square max-h-[200px] rounded-lg overflow-hidden border border-border-subtle bg-surface-muted flex items-center justify-center p-4">
                                                <img src={uploadPreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                                            </div>
                                        )}
                                        <div className="p-3 bg-surface-muted rounded-lg border border-border-subtle flex items-center justify-between">
                                            <div className="truncate pr-4 text-xs">
                                                <p className="font-medium truncate">{uploadFile.name}</p>
                                                <p className="text-muted-foreground">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <Btn variant="outline" size="sm" onClick={() => { setUploadFile(null); setUploadPreview(null); }}>
                                                Ganti
                                            </Btn>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="px-6 py-4 bg-surface-muted/30 border-t border-border-subtle shrink-0 flex items-center justify-end gap-3">
                        <DialogClose asChild>
                            <Btn variant="outline" type="button">Batal</Btn>
                        </DialogClose>
                        <Btn 
                            onClick={handleConfirm} 
                            disabled={uploading || (activeTab === 'upload' && !uploadFile)} 
                            icon={uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        >
                            {uploading ? 'Mengupload...' : 'Pilih Ikon'}
                        </Btn>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
