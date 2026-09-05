import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../../components/base/Modal';
import { Button } from '../../../components/ui/Button';
import { fetchModelDetail, type CatalogModelVersion } from '../../../api/models';
import { deployInferenceService } from '../../../api/inference';
import { useAuthStore } from '../../../stores/authStore';
import { useTenantStore } from '../../../stores/tenantStore';
import type { Model } from '../../../types/model';

interface ModelDeployDialogProps {
    model: Model | null;
    onClose: () => void;
}

const ModelDeployDialog: React.FC<ModelDeployDialogProps> = ({ model, onClose }) => {
    const navigate = useNavigate();
    const accessToken = useAuthStore((state) => state.session?.accessToken);
    const currentTenantId = useTenantStore((state) => state.currentTenantId);
    const loadTenants = useTenantStore((state) => state.loadTenants);

    const [versions, setVersions] = useState<CatalogModelVersion[]>([]);
    const [versionId, setVersionId] = useState('');
    const [name, setName] = useState('');
    const [replicas, setReplicas] = useState(1);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [deploying, setDeploying] = useState(false);
    const [error, setError] = useState('');
    const [deployedId, setDeployedId] = useState<string | null>(null);

    useEffect(() => {
        if (!model || !accessToken) return;
        setName(model.title);
        setVersionId('');
        setError('');
        setDeployedId(null);

        const load = async () => {
            setLoadingVersions(true);
            try {
                const detail = await fetchModelDetail(accessToken, model.id);
                setVersions(detail.versions ?? []);
                if (detail.versions?.length) setVersionId(detail.versions[0].id);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load model versions');
            } finally {
                setLoadingVersions(false);
            }
        };
        load();
        // Ensure the tenant context is available for the deploy call.
        loadTenants();
    }, [model, accessToken, loadTenants]);

    const handleDeploy = async () => {
        if (!model || !accessToken || !versionId || !currentTenantId) return;
        setDeploying(true);
        setError('');
        try {
            const result = await deployInferenceService(accessToken, currentTenantId, {
                name: name.trim() || model.title,
                modelId: model.id,
                modelVersionId: versionId,
                replicas,
            });
            if (result.service.status === 'failed') {
                setError(result.service.error || 'Deploy failed on the execution plane.');
            } else {
                setDeployedId(result.service.id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Deploy failed');
        } finally {
            setDeploying(false);
        }
    };

    return (
        <Modal
            isShow={model !== null}
            onClose={onClose}
            title={model ? `Deploy ${model.title}` : 'Deploy'}
        >
            {model && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                        <select
                            value={versionId}
                            onChange={(e) => setVersionId(e.target.value)}
                            disabled={loadingVersions || deploying}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                            {versions.length === 0 && (
                                <option value="">{loadingVersions ? 'Loading…' : 'No versions available'}</option>
                            )}
                            {versions.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.version}{v.parameters ? ` (${v.parameters})` : ''}{v.quantization ? ` · ${v.quantization}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={deploying}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Replicas</label>
                        <input
                            type="number"
                            min={1}
                            max={16}
                            value={replicas}
                            onChange={(e) => setReplicas(Math.max(1, Number(e.target.value) || 1))}
                            disabled={deploying}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-red-600">{error}</p>
                    )}

                    {deployedId ? (
                        <div className="space-y-3">
                            <p className="text-sm text-green-600">Deployment started. Track it under Inference Services.</p>
                            <div className="flex justify-end gap-2">
                                <Button variant="secondary" onClick={onClose}>Close</Button>
                                <Button onClick={() => { onClose(); navigate('/dashboard1?section=inference'); }}>
                                    View services
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={onClose} disabled={deploying}>Cancel</Button>
                            <Button
                                onClick={handleDeploy}
                                disabled={deploying || !versionId || !currentTenantId || loadingVersions}
                            >
                                {deploying ? 'Deploying…' : 'Deploy'}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default ModelDeployDialog;
