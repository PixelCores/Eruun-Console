import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    AlertCircle, 
    Languages,
    CheckCircle2,
    XCircle,
    X
} from 'lucide-react';
import { 
    listLanguages, 
    createLanguage, 
    updateLanguage, 
    deleteLanguage 
} from '../../../api/languages';
import type { ProgrammingLanguage } from '../../../api/languages';
import Modal from '../../../components/base/Modal';
import Input from '../../../components/base/Input';
import Switch from '../../../components/base/switch';
import { Button } from '../../../components/ui/Button';

export const LanguageSection: React.FC = () => {
    const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState<ProgrammingLanguage | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [version, setVersion] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [cpuReq, setCpuReq] = useState('');
    const [memReq, setMemReq] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
    };

    const fetchLanguages = async () => {
        setLoading(true);
        setToast(null);
        try {
            const data = await listLanguages();
            setLanguages(data);
        } catch (err: any) {
            showToast('error', err.message || 'Failed to load programming languages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLanguages();
    }, []);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const openAddModal = () => {
        setSelectedLang(null);
        setName('');
        setVersion('');
        setEnabled(true);
        setCpuReq('');
        setMemReq('');
        setFormError(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (lang: ProgrammingLanguage) => {
        setSelectedLang(lang);
        setName(lang.name);
        setVersion(lang.version);
        setEnabled(lang.enabled);
        setCpuReq(lang.cpuReq || '');
        setMemReq(lang.memReq || '');
        setFormError(null);
        setIsFormModalOpen(true);
    };

    const openDeleteModal = (lang: ProgrammingLanguage) => {
        setSelectedLang(lang);
        setIsDeleteModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!name.trim()) {
            setFormError('Language Name is required');
            return;
        }
        if (!version.trim()) {
            setFormError('Version is required');
            return;
        }

        setSubmitting(true);
        try {
            if (selectedLang) {
                // Update mode
                await updateLanguage(selectedLang.id, {
                    name,
                    version,
                    enabled,
                    cpuReq: cpuReq.trim() || undefined,
                    memReq: memReq.trim() || undefined
                });
                showToast('success', `Language "${name}" updated successfully.`);
            } else {
                // Create mode
                await createLanguage({
                    name: name.trim(),
                    version: version.trim(),
                    enabled,
                    cpuReq: cpuReq.trim() || undefined,
                    memReq: memReq.trim() || undefined
                });
                showToast('success', `Language "${name}" created successfully.`);
            }
            setIsFormModalOpen(false);
            fetchLanguages();
        } catch (err: any) {
            setFormError(err.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        if (!selectedLang) return;
        setSubmitting(true);
        try {
            await deleteLanguage(selectedLang.id);
            showToast('success', `Language "${selectedLang.name}" deleted successfully.`);
            setIsDeleteModalOpen(false);
            fetchLanguages();
        } catch (err: any) {
            showToast('error', err.message || 'Failed to delete language');
            setIsDeleteModalOpen(false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (lang: ProgrammingLanguage, newStatus: boolean) => {
        try {
            await updateLanguage(lang.id, {
                enabled: newStatus
            });
            // Update local state directly for responsive feedback
            setLanguages(prev => prev.map(item => item.id === lang.id ? { ...item, enabled: newStatus } : item));
            showToast('success', `Language "${lang.name}" status updated.`);
        } catch (err: any) {
            showToast('error', err.message || 'Failed to toggle status');
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-100/80 px-2 py-0.5 rounded-full border border-gray-200/50">
                        {languages.length} Available
                    </span>
                </div>
                <Button
                    onClick={openAddModal}
                    size="small"
                >
                    <span className="flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Add Language
                    </span>
                </Button>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed top-20 right-6 z-[100] max-w-sm rounded-lg shadow-lg border p-4 animate-in slide-in-from-right transition-all duration-350 ${toast.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        {toast.type === 'success' ? (
                            <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                            <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                {toast.message}
                            </p>
                        </div>
                        <button
                            onClick={() => setToast(null)}
                            className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors cursor-pointer border-none bg-transparent"
                        >
                            <X size={14} className={toast.type === 'success' ? 'text-green-500' : 'text-red-500'} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto">
                {loading && languages.length === 0 ? (
                    /* Loading Skeletons */
                    <div className="space-y-4">
                        <div className="h-10 bg-gray-100 rounded animate-pulse" />
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />
                            ))}
                        </div>
                    </div>
                ) : languages.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <div className="p-3 bg-gray-100 rounded-full text-gray-400 mb-4">
                            <Languages className="w-8 h-8" />
                        </div>
                        <h3 className="text-md font-medium text-gray-900 mb-1">No languages configured</h3>
                        <p className="text-sm text-gray-500 max-w-sm text-center mb-6">
                            Start by adding a programming language profile to provision resource defaults.
                        </p>
                        <Button
                            onClick={openAddModal}
                            variant="primary"
                        >
                            <span className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Language
                            </span>
                        </Button>
                    </div>
                ) : (
                    /* Table List */
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Version</th>
                                    <th className="px-6 py-4">CPU Limit (Req)</th>
                                    <th className="px-6 py-4">Memory Limit (Req)</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[14px]">
                                {languages.map(lang => (
                                    <tr key={lang.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4.5 font-medium text-gray-900 font-mono text-xs">
                                            {lang.id}
                                        </td>
                                        <td className="px-6 py-4.5 text-gray-700">
                                            {lang.name}
                                        </td>
                                        <td className="px-6 py-4.5">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 font-mono">
                                                v{lang.version}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4.5 text-gray-500 font-mono">
                                            {lang.cpuReq || '—'}
                                        </td>
                                        <td className="px-6 py-4.5 text-gray-500 font-mono">
                                            {lang.memReq || '—'}
                                        </td>
                                        <td className="px-6 py-4.5 text-center">
                                            <Switch
                                                checked={lang.enabled}
                                                onChange={(checked) => handleToggleStatus(lang, checked)}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="px-6 py-4.5 text-right space-x-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(lang)}
                                                className="inline-flex p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(lang)}
                                                className="inline-flex p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Form Modal (Add / Edit) */}
            <Modal
                isShow={isFormModalOpen}
                onClose={() => !submitting && setIsFormModalOpen(false)}
                title={selectedLang ? 'Edit Programming Language' : 'Add Programming Language'}
            >
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    {formError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    {selectedLang && (
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                ID
                            </label>
                            <Input
                                value={selectedLang.id}
                                disabled
                                className="font-mono bg-gray-50/50 cursor-not-allowed text-xs"
                            />
                            <p className="text-[11px] text-gray-400">
                                Unique identifier of the language profile.
                            </p>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Display Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            placeholder="e.g. Go, Python 3, Node.js Runtime"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Version <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            placeholder="e.g. 1.22, 3.11, 20"
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            required
                            className="font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                CPU Request (cpuReq)
                            </label>
                            <Input
                                placeholder="e.g. 100m, 1, 0.5"
                                value={cpuReq}
                                onChange={(e) => setCpuReq(e.target.value)}
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Memory Request (memReq)
                            </label>
                            <Input
                                placeholder="e.g. 256Mi, 1Gi"
                                value={memReq}
                                onChange={(e) => setMemReq(e.target.value)}
                                className="font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-t border-b border-gray-100">
                        <div>
                            <span className="text-sm font-medium text-gray-800">Enabled Status</span>
                            <p className="text-xs text-gray-400">Whether this language runtime is selectable.</p>
                        </div>
                        <Switch
                            checked={enabled}
                            onChange={setEnabled}
                            size="md"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsFormModalOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={submitting}
                        >
                            Save
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isShow={isDeleteModalOpen}
                onClose={() => !submitting && setIsDeleteModalOpen(false)}
                title="Delete Programming Language"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Confirm Deletion</p>
                            <p className="mt-1 text-xs">
                                Are you sure you want to permanently delete the configuration for{' '}
                                <strong className="font-mono text-rose-900">{selectedLang?.name} ({selectedLang?.code})</strong>? 
                                This operation cannot be undone.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            loading={submitting}
                            onClick={handleDeleteSubmit}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
