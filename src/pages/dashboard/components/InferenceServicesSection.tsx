import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Server, Trash2 } from 'lucide-react';
import { deleteInferenceService, listInferenceServices, type InferenceService, type InferenceStatus } from '../../../api/inference';
import { useAuthStore } from '../../../stores/authStore';
import { useTenantStore } from '../../../stores/tenantStore';
import ConfirmDialog from '../../../components/base/ConfirmDialog';

const STATUS_STYLE: Record<InferenceStatus, string> = {
    pending: 'bg-gray-100 text-gray-600',
    deploying: 'bg-blue-50 text-blue-700',
    running: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    stopped: 'bg-gray-100 text-gray-500',
};

const InferenceServicesSection: React.FC = () => {
    const accessToken = useAuthStore((state) => state.session?.accessToken);
    const currentTenantId = useTenantStore((state) => state.currentTenantId);
    const loadTenants = useTenantStore((state) => state.loadTenants);

    const [services, setServices] = useState<InferenceService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<InferenceService | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(async () => {
        if (!accessToken || !currentTenantId) return;
        try {
            const result = await listInferenceServices(accessToken, currentTenantId);
            setServices(result.services ?? []);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load inference services');
        } finally {
            setLoading(false);
        }
    }, [accessToken, currentTenantId]);

    useEffect(() => { loadTenants(); }, [loadTenants]);
    useEffect(() => { load(); }, [load]);

    const handleDelete = async () => {
        if (!deleteTarget || !accessToken || !currentTenantId) return;
        setDeleting(true);
        try {
            await deleteInferenceService(accessToken, currentTenantId, deleteTarget.id);
            setDeleteTarget(null);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
            setDeleteTarget(null);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="relative h-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <h1 className="text-sm font-medium text-gray-900">Inference Services</h1>
                    <span className="text-xs text-gray-400">{services.length} DEPLOYED</span>
                </div>
                <button
                    type="button"
                    onClick={() => { setLoading(true); load(); }}
                    className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
            ) : error ? (
                <p role="alert" className="text-sm text-red-600">{error}</p>
            ) : services.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Server className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No inference services yet. Deploy one from the Model Store.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs text-gray-500">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Endpoint</th>
                                <th className="px-4 py-3 font-medium">Replicas</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Created</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((svc) => (
                                <tr key={svc.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{svc.name}</div>
                                        {svc.error && <div className="text-xs text-red-500 mt-0.5 max-w-md truncate" title={svc.error}>{svc.error}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500 font-mono max-w-[260px] truncate" title={svc.endpoint || svc.image}>
                                        {svc.endpoint || <span className="text-gray-300">{svc.image}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{svc.replicas}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[svc.status] ?? STATUS_STYLE.pending}`}>
                                            {svc.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-400">
                                        {new Date(svc.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => setDeleteTarget(svc)}
                                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                            aria-label={`Delete ${svc.name}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteTarget !== null}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                tone="destructive"
                title={`Delete ${deleteTarget?.name ?? 'service'}?`}
                description="This removes the service record and deletes the cluster workload via Eruun-Cli."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                loading={deleting}
            />
        </div>
    );
};

export default InferenceServicesSection;
