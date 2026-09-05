import { Fragment, type ReactNode } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface IModal {
    className?: string;
    isShow: boolean;
    onClose: () => void;
    role?: 'dialog' | 'alertdialog';
    dismissible?: boolean;
    closeLabel?: string;
    title?: ReactNode;
    headerContent?: ReactNode;
    headerActions?: ReactNode;
    children: ReactNode;
    overflowVisible?: boolean;
}

export default function Modal({
    className,
    isShow,
    onClose,
    role = 'dialog',
    dismissible = true,
    closeLabel = 'Close',
    title,
    headerContent,
    headerActions,
    children,
}: IModal) {
    return (
        <Transition appear show={isShow} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-[60]"
                role={role}
                onClose={dismissible ? onClose : () => undefined}
            >
                {/* Backdrop */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm transition-opacity" />
                </TransitionChild>

                {/* Content Container */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel
                                className={cn(
                                    "relative w-full max-w-[480px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all",
                                    className
                                )}
                            >
                                {(title || headerContent || headerActions) && (
                                    <div className="mb-4 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            {title && (
                                                <DialogTitle
                                                    as="h3"
                                                    className={cn(
                                                        "text-lg font-medium leading-6 text-gray-900",
                                                        headerContent && "sr-only",
                                                    )}
                                                >
                                                    {title}
                                                </DialogTitle>
                                            )}
                                            {headerContent}
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            {headerActions}
                                            {dismissible && (
                                                <button
                                                    type="button"
                                                    onClick={onClose}
                                                    aria-label={closeLabel}
                                                    className="rounded-full p-1 transition-colors hover:bg-gray-100"
                                                >
                                                    <X className="h-5 w-5 text-gray-500" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {children}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
