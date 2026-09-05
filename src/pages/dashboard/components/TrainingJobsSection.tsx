import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, PackagePlus, Plus, RefreshCw, Square, Trash2 } from 'lucide-react';
import Modal from '../../../components/base/Modal';
import ConfirmDialog from '../../../components/base/ConfirmDialog';
import { Button } from '../../../components/ui/Button';
import { cancelTrainingJob, createTrainingJob, deleteTrainingJob, listTrainingJobs, publishTrainingJob, type TrainingJob, type TrainingStatus } from '../../../api/training';
import { fetchModels, fetchModelDetail, type CatalogModelVersion } from '../../../api/models';
import { useAuthStore } from '../../../stores/authStore';
import { useTenantStore } from '../../../stores/tenantStore';
import type { Model } from '../../../types/model';

const STATUS_STYLE: Record<TrainingStatus, string> = {
    pending: 'bg-gray-100 text-gray-600',
    running: 'bg-blue-50 text-blue-700',
    succeeded: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    cancelled: 'bg-amber-50 text-amber-700',
};

const TrainingJobsSection: React.FC = () => {
    const navigate = useNavigate();
    const accessToken = useAuthStore((state) => state.session?.accessToken);
    const currentTenantId = useTenantStore((state) => state.currentTenantId);
    const loadTenants = useTenantStore((state) => state.loadTenants);

    const [jobs, setJobs] = useState<TrainingJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<TrainingJob | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TrainingJob | null>(null);
    const [publishTarget, setPublishTarget] = useState<TrainingJob | null>(null);
    const [publishName, setPublishName] = useState('');
    const [publishVersion, setPublishVersion] = useState('1.0.0');
    const [publishError, setPublishError] = useState('');
    const [acting, setActing] = useState(false);

    // Create form state
    const [models, setModels] = useState<Model[]>([]);
    const [formName, setFormName] = useState('');
    const [formModelId, setFormModelId] = useState('');
    const [versions, setVersions] = useState<CatalogModelVersion[]>([]);
    const [formVersionId, setFormVersionId] = useState('');
    const [formDataset, setFormDataset] = useState('');
    const [formCommand, setFormCommand] = useState('');
    const [formError, setFormError] = useState('');
    const [creating, setCreating] = useState(false);

    const load = useCallback(async () => {
        if (!accessToken || !currentTenantId) return;
        try {
            const result = await listTrainingJobs(accessToken, currentTenantId);
            setJobs(result.jobs ?? []);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load training jobs');
        } finally {
            setLoading(false);
        }
    }, [accessToken, currentTenantId]);

    useEffect(() => { loadTenants(); }, [loadTenants]);
    useEffect(() => { load(); }, [load]);

    // Load the model catalog for the create form.
    useEffect(() => {
        if (!isCreateOpen || !accessToken) return;
        fetchModels(accessToken).then((res) => {
            setModels(res.data);
            if (res.data.length && !formModelId) setFormModelId(res.data[0].id);
        }).catch(() => setFormError('Failed to load model catalog'));
    }, [isCreateOpen, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load versions when the selected model changes.
    useEffect(() => {
        if (!formModelId || !accessToken) return;
        fetchModelDetail(accessToken, formModelId).then((detail) => {
            setVersions(detail.versions ?? []);
            setFormVersionId(detail.versions?.[0]?.id ?? '');
        }).catch(() => setVersions([]));
    }, [formModelId, accessToken]);

    const handleCreate = async () => {
        if (!accessToken || !currentTenantId || !formModelId || !formVersionId) return;
        setCreating(true);
        setFormError('');
        try {
            const result = await createTrainingJob(accessToken, currentTenantId, {
                name: formName.trim() || 'training-job',
                baseModelId: formModelId,
                modelVersionId: formVersionId,
                datasetUri: formDataset.trim(),
                command: formCommand.trim(),
            });
            if (result.job.status === 'failed') {
                setFormError(result.job.error || 'Failed to start the training job.');
                return;
            }
            setIsCreateOpen(false);
            setFormName(''); setFormDataset(''); setFormCommand('');
            await load();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to create the training job');
        } finally {
            setCreating(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelTarget || !accessToken || !currentTenantId) return;
        setActing(true);
        try {
            await cancelTrainingJob(accessToken, currentTenantId, cancelTarget.id);
            setCancelTarget(null);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Cancel failed');
            setCancelTarget(null);
        } finally {
            setActing(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget || !accessToken || !currentTenantId) return;
        setActing(true);
        try {
            await deleteTrainingJob(accessToken, currentTenantId, deleteTarget.id);
            setDeleteTarget(null);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
            setDeleteTarget(null);
        } finally {
            setActing(false);
        }
    };

    const handlePublish = async () => {
        if (!publishTarget || !accessToken || !currentTenantId || !publishName.trim() || !publishVersion.trim()) return;
        setActing(true);
        setPublishError('');
        try {
            await publishTrainingJob(accessToken, currentTenantId, publishTarget.id, {
                name: publishName.trim(),
                version: publishVersion.trim(),
            });
            const name = publishName.trim();
            setPublishTarget(null);
            setPublishName('');
            await load();
            navigate('/dashboard1?section=model-store', { state: { published: name } });
        } catch (err) {
            setPublishError(err instanceof Error ? err.message : 'Publish failed');
        } finally {
            setActing(false);
        }
    };

    const canCancel = (job: TrainingJob) => job.status === 'pending' || job.status === 'running';
    const canPublish = (job: TrainingJob) => job.status === 'succeeded' && !job.publishedModelId;

    return (
        <div className="relative h-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <h1 className="text-sm font-medium text-gray-900">Training Jobs</h1>
                    <span className="text-xs text-gray-400">{jobs.length} TOTAL</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => { setLoading(true); load(); }}
                        className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </button>
                    <Button size="small" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="w-3.5 h-3.5" />
                        New Training Job
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
            ) : error ? (
                <p role="alert" className="text-sm text-red-600">{error}</p>
            ) : jobs.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No training jobs yet. Create one to fine-tune a catalog model.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs text-gray-500">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Dataset</th>
                                <th className="px-4 py-3 font-medium">Command</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Created</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job) => (
                                <tr key={job.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{job.name}</div>
                                        {job.error && <div className="text-xs text-red-500 mt-0.5 max-w-md truncate" title={job.error}>{job.error}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500 font-mono max-w-[200px] truncate" title={job.datasetUri}>{job.datasetUri || '—'}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500 font-mono max-w-[220px] truncate" title={job.command}>{job.command || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[job.status] ?? STATUS_STYLE.pending}`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(job.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        {canPublish(job) && (
                                            <button
                                                type="button"
                                                onClick={() => { setPublishTarget(job); setPublishName(job.name); setPublishError(''); }}
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600 mr-1"
                                                aria-label={`Publish ${job.name} to the model store`}
                                                title="Publish to the model store"
                                            >
                                                <PackagePlus className="w-4 h-4" />
                                            </button>
                                        )}
                                        {job.publishedModelId && (
                                            <span className="text-xs text-green-600 mr-2">published</span>
                                        )}
                                        {canCancel(job) && (
                                            <button
                                                type="button"
                                                onClick={() => setCancelTarget(job)}
                                                className="rounded-md p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 mr-1"
                                                aria-label={`Cancel ${job.name}`}
                                            >
                                                <Square className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setDeleteTarget(job)}
                                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                            aria-label={`Delete ${job.name}`}
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

            {/* Create modal */}
            <Modal isShow={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Training Job">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="my-fine-tune"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base model</label>
                        <select
                            value={formModelId}
                            onChange={(e) => setFormModelId(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                            {models.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.provider})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                        <select
                            value={formVersionId}
                            onChange={(e) => setFormVersionId(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                            {versions.length === 0 && <option value="">No versions</option>}
                            {versions.map((v) => (
                                <option key={v.id} value={v.id}>{v.version}{v.parameters ? ` (${v.parameters})` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dataset URI</label>
                        <input
                            type="text"
                            value={formDataset}
                            onChange={(e) => setFormDataset(e.target.value)}
                            placeholder="s3://datasets/my-data"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Command</label>
                        <input
                            type="text"
                            value={formCommand}
                            onChange={(e) => setFormCommand(e.target.value)}
                            placeholder="python train.py --epochs 3"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
                        />
                    </div>

                    {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}

                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={creating}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating || !formVersionId}>
                            {creating ? 'Creating…' : 'Create'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={cancelTarget !== null}
                onCancel={() => setCancelTarget(null)}
                onConfirm={handleCancel}
                title={`Cancel ${cancelTarget?.name ?? 'job'}?`}
                description="The running workflow task on the cluster will be cancelled."
                confirmLabel="Cancel job"
                cancelLabel="Keep running"
                loading={acting}
            />

            {/* Publish modal */}
            <Modal isShow={publishTarget !== null} onClose={() => setPublishTarget(null)} title="Publish to Model Store">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        The trained artifact at <code className="text-xs">{publishTarget?.outputUri}</code> becomes
                        a tenant-private model, deployable from the Model Store.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model name</label>
                        <input
                            type="text"
                            value={publishName}
                            onChange={(e) => setPublishName(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                        <input
                            type="text"
                            value={publishVersion}
                            onChange={(e) => setPublishVersion(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                    </div>
                    {publishError && <p role="alert" className="text-sm text-red-600">{publishError}</p>}
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setPublishTarget(null)} disabled={acting}>Cancel</Button>
                        <Button onClick={handlePublish} disabled={acting || !publishName.trim() || !publishVersion.trim()}>
                            {acting ? 'Publishing…' : 'Publish'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={deleteTarget !== null}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                tone="destructive"
                title={`Delete ${deleteTarget?.name ?? 'job'}?`}
                description="This removes the job record and deletes the cluster workload via Eruun-Cli."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                loading={acting}
            />
        </div>
    );
};

export default TrainingJobsSection;
