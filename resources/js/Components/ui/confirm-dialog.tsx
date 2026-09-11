import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/Components/ui/modal';
import { Btn } from '@/Components/ui/btn';
import { AlertTriangle, Trash2, Check } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
    loading?: boolean;
}

export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    message,
    confirmLabel = 'Hapus',
    variant = 'danger',
    onConfirm,
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Modal open={open} onOpenChange={onOpenChange} maxWidth="md">
            <ModalHeader
                title={
                    <span className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            variant === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                        }`}>
                            <AlertTriangle className="w-4 h-4" />
                        </span>
                        {title}
                    </span>
                }
            />
            <ModalBody>
                <p className="text-sm text-muted-foreground">{message}</p>
            </ModalBody>
            <ModalFooter>
                <Btn
                    variant={variant === 'danger' ? 'danger' : 'primary'}
                    loading={loading}
                    icon={variant === 'danger' ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    onClick={() => {
                        onConfirm();
                    }}
                >
                    {confirmLabel}
                </Btn>
            </ModalFooter>
        </Modal>
    );
}
