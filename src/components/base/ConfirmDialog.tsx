import { DialogDescription } from '@headlessui/react';
import { CircleAlert, TriangleAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import Modal from './Modal';

export interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    tone?: 'warning' | 'destructive';
    loading?: boolean;
    error?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmLabel,
    cancelLabel,
    tone = 'warning',
    loading = false,
    error,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const isDestructive = tone === 'destructive';
    const Icon = isDestructive ? CircleAlert : TriangleAlert;

    return (
        <Modal
            isShow={isOpen}
            onClose={onCancel}
            role="alertdialog"
            dismissible={!loading}
            title={title}
            className="max-w-[440px]"
        >
            <div className="flex gap-3">
                <div
                    className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        isDestructive
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600',
                    )}
                    aria-hidden="true"
                >
                    <Icon className="h-5 w-5" />
                </div>
                <DialogDescription
                    as="p"
                    className="min-w-0 pt-1.5 text-sm leading-6 text-gray-600"
                >
                    {description}
                </DialogDescription>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    autoFocus
                    disabled={loading}
                    onClick={onCancel}
                >
                    {cancelLabel}
                </Button>
                <Button
                    type="button"
                    variant={isDestructive ? 'destructive' : 'warning'}
                    loading={loading}
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
