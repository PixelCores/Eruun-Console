import { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import type { WorkflowCallback } from '../../types/app';

interface CallbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    callback: WorkflowCallback | null;
    onSave: (callback: WorkflowCallback | null) => void;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;

interface HeaderItem {
    id: string;
    key: string;
    value: string;
}

export default function CallbackModal({
    isOpen,
    onClose,
    callback,
    onSave,
}: CallbackModalProps) {
    const [successUrl, setSuccessUrl] = useState('');
    const [failureUrl, setFailureUrl] = useState('');
    const [successMethod, setSuccessMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
    const [failureMethod, setFailureMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
    const [headers, setHeaders] = useState<HeaderItem[]>([]);
    const [timeoutSeconds, setTimeoutSeconds] = useState<number>(5);

    // Initialize form when panel opens
    useEffect(() => {
        if (isOpen && callback) {
            setSuccessUrl(callback.success || '');
            setFailureUrl(callback.failure || '');
            setSuccessMethod(callback.methods?.success || 'POST');
            setFailureMethod(callback.methods?.failure || 'POST');
            setTimeoutSeconds(callback.timeoutSeconds || 5);

            // Convert headers object to array
            if (callback.headers) {
                const headerItems = Object.entries(callback.headers).map(([key, value]) => ({
                    id: crypto.randomUUID(),
                    key,
                    value,
                }));
                setHeaders(headerItems);
            } else {
                setHeaders([]);
            }
        } else if (isOpen) {
            // Reset form for new callback
            setSuccessUrl('');
            setFailureUrl('');
            setSuccessMethod('POST');
            setFailureMethod('POST');
            setHeaders([]);
            setTimeoutSeconds(5);
        }
    }, [isOpen, callback]);

    const handleAddHeader = () => {
        setHeaders([...headers, { id: crypto.randomUUID(), key: '', value: '' }]);
    };

    const handleRemoveHeader = (id: string) => {
        setHeaders(headers.filter(h => h.id !== id));
    };

    const handleHeaderChange = (id: string, field: 'key' | 'value', value: string) => {
        setHeaders(headers.map(h => h.id === id ? { ...h, [field]: value } : h));
    };

    const handleSave = () => {
        // If all URLs are empty, clear callback
        if (!successUrl && !failureUrl) {
            onSave(null);
            onClose();
            return;
        }

        // Convert headers array to object
        const headersObj: Record<string, string> = {};
        headers.forEach(h => {
            if (h.key.trim()) {
                headersObj[h.key.trim()] = h.value;
            }
        });

        const callbackConfig: WorkflowCallback = {
            ...(successUrl && { success: successUrl }),
            ...(failureUrl && { failure: failureUrl }),
            methods: {
                success: successMethod,
                failure: failureMethod,
            },
            ...(Object.keys(headersObj).length > 0 && { headers: headersObj }),
            timeoutSeconds,
        };

        onSave(callbackConfig);
        onClose();
    };

    const handleClear = () => {
        setSuccessUrl('');
        setFailureUrl('');
        setSuccessMethod('POST');
        setFailureMethod('POST');
        setHeaders([]);
        setTimeoutSeconds(5);
    };

    if (!isOpen) return null;

    return (
        <div
            className="absolute top-full mt-2 right-0 z-50 w-[480px] rounded-2xl bg-white shadow-xl"
            style={{
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
        >
            {/* Header */}
            <div className="px-5 pt-5 pb-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900">
                        Workflow Callback
                    </h2>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-5 pt-3 space-y-4 max-h-[500px] overflow-y-auto">
                {/* Success Callback */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">
                        Success Callback URL
                    </label>
                    <div className="flex gap-2">
                        <select
                            value={successMethod}
                            onChange={(e) => setSuccessMethod(e.target.value as typeof successMethod)}
                            className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            {HTTP_METHODS.map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                        <input
                            type="url"
                            value={successUrl}
                            onChange={(e) => setSuccessUrl(e.target.value)}
                            placeholder="http://example.com/callback/success"
                            className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Failure Callback */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">
                        Failure Callback URL
                    </label>
                    <div className="flex gap-2">
                        <select
                            value={failureMethod}
                            onChange={(e) => setFailureMethod(e.target.value as typeof failureMethod)}
                            className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            {HTTP_METHODS.map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                        <input
                            type="url"
                            value={failureUrl}
                            onChange={(e) => setFailureUrl(e.target.value)}
                            placeholder="http://example.com/callback/failure"
                            className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Timeout */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">
                        Timeout (seconds)
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={60}
                        value={timeoutSeconds}
                        onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 5)}
                        className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Headers */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-gray-700">
                            Headers
                        </label>
                        <button
                            onClick={handleAddHeader}
                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer border-none bg-transparent"
                        >
                            <Plus size={12} />
                            Add
                        </button>
                    </div>
                    {headers.length > 0 ? (
                        <div className="space-y-1.5">
                            {headers.map((header) => (
                                <div key={header.id} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={header.key}
                                        onChange={(e) => handleHeaderChange(header.id, 'key', e.target.value)}
                                        placeholder="Header name"
                                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={header.value}
                                        onChange={(e) => handleHeaderChange(header.id, 'value', e.target.value)}
                                        placeholder="Header value"
                                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <button
                                        onClick={() => handleRemoveHeader(header.id)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer border-none bg-transparent"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[10px] text-gray-400 italic">No headers configured</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-3 border-t border-gray-200">
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                    >
                        <Trash2 size={12} />
                        Clear
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer border-none"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
