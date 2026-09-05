import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useFlowStore } from '../../stores/flowStore';
import type {
    TraitIngressSpec,
    TraitIngressRoute,
    TraitIngressTLSConfig,
    TraitIngressRewritePolicy,
} from '../../types/flow';

interface TraitsIngressPanelProps {
    onClose: () => void;
    onAdd: (ingress: TraitIngressSpec) => void;
    initialData?: TraitIngressSpec;
    onUpdate?: (ingress: TraitIngressSpec) => void;
}

type KeyValueItem = { key: string; value: string };

type TLSForm = {
    secretName: string;
    hosts: string[];
};

type RouteForm = {
    path: string;
    pathType: string;
    host: string;
    serviceName: string;
    servicePort: string;
    weight: string;
    headers: KeyValueItem[];
    rewriteEnabled: boolean;
    rewriteType: string;
    rewriteMatch: string;
    rewriteReplacement: string;
};

const INPUT_STYLES =
    'w-full px-3 py-2 text-sm border border-components-panel-border rounded-lg bg-white input-gradient-focus focus:ring-0 outline-none transition-colors';

const gradientBorderStyle = `
    .input-gradient-focus:focus {
        border-image: linear-gradient(to right, #67e8f9, #3b82f6) 1;
        border-width: 1px;
        outline: none;
    }
    .input-gradient-focus:focus-visible {
        border-image: linear-gradient(to right, #67e8f9, #3b82f6) 1;
        border-width: 1px;
        outline: none;
        box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
    }
`;

const recordToItems = (record?: Record<string, string>): KeyValueItem[] => {
    if (!record) return [];
    return Object.entries(record).map(([key, value]) => ({ key, value }));
};

const itemsToRecord = (items: KeyValueItem[]): Record<string, string> | undefined => {
    const record: Record<string, string> = {};
    for (const item of items) {
        const key = item.key.trim();
        if (!key) continue;
        record[key] = item.value;
    }
    return Object.keys(record).length ? record : undefined;
};

const normalizeStringList = (values: string[]): string[] => values.map((v) => v.trim()).filter(Boolean);

const parseOptionalInt = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const num = Number(trimmed);
    if (!Number.isFinite(num)) return undefined;
    return Math.trunc(num);
};

const createEmptyRoute = (): RouteForm => ({
    path: '/',
    pathType: '',
    host: '',
    serviceName: '',
    servicePort: '',
    weight: '',
    headers: [],
    rewriteEnabled: false,
    rewriteType: 'replace',
    rewriteMatch: '',
    rewriteReplacement: '',
});

const createEmptyTLS = (): TLSForm => ({
    secretName: '',
    hosts: [],
});

const TraitsIngressPanel: React.FC<TraitsIngressPanelProps> = ({ onClose, onAdd, initialData, onUpdate }) => {
    const { nodes, selectedNodeId } = useFlowStore();
    const selectedNode = nodes.find((n) => n.id === selectedNodeId);
    const defaultNamespace = selectedNode?.data.namespace || 'default';

    const isEditMode = !!initialData;

    const [name, setName] = useState('');
    const [namespace, setNamespace] = useState(defaultNamespace);
    const [hosts, setHosts] = useState<string[]>([]);
    const [labels, setLabels] = useState<KeyValueItem[]>([]);
    const [annotations, setAnnotations] = useState<KeyValueItem[]>([]);
    const [ingressClassName, setIngressClassName] = useState('');
    const [defaultPathType, setDefaultPathType] = useState('');
    const [tls, setTls] = useState<TLSForm[]>([]);
    const [routes, setRoutes] = useState<RouteForm[]>([createEmptyRoute()]);

    const [showLabels, setShowLabels] = useState(false);
    const [showAnnotations, setShowAnnotations] = useState(false);
    const [showTls, setShowTls] = useState(true);
    const [showRoutes, setShowRoutes] = useState(true);

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (initialData) {
            setName(initialData.name || '');
            setNamespace(initialData.namespace || defaultNamespace);
            setHosts(initialData.hosts || []);
            setLabels(recordToItems(initialData.label || {}));
            setAnnotations(recordToItems(initialData.annotations));
            setIngressClassName(initialData.ingressClassName || '');
            setDefaultPathType(initialData.defaultPathType || '');
            setTls(
                (initialData.tls || []).map((t) => ({
                    secretName: t.secretName || '',
                    hosts: t.hosts || [],
                }))
            );
            setRoutes(
                (initialData.routes || []).length
                    ? initialData.routes.map((r) => ({
                        path: r.path || '',
                        pathType: r.pathType || '',
                        host: r.host || '',
                        serviceName: r.backend?.serviceName || '',
                        servicePort: r.backend?.servicePort != null ? String(r.backend.servicePort) : '',
                        weight: r.backend?.weight != null ? String(r.backend.weight) : '',
                        headers: recordToItems(r.backend?.headers),
                        rewriteEnabled: !!r.rewrite,
                        rewriteType: r.rewrite?.type || 'replace',
                        rewriteMatch: r.rewrite?.match || '',
                        rewriteReplacement: r.rewrite?.replacement || '',
                    }))
                    : [createEmptyRoute()]
            );
        } else {
            setName('');
            setNamespace(defaultNamespace);
            setHosts([]);
            setLabels([]);
            setAnnotations([]);
            setIngressClassName('');
            setDefaultPathType('');
            setTls([]);
            setRoutes([createEmptyRoute()]);
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [initialData, defaultNamespace]);

    const hasAnyRouteService = useMemo(() => routes.some((r) => r.serviceName.trim()), [routes]);
    const isValid = Boolean(name.trim()) && hasAnyRouteService;

    const addKeyValue = (setter: React.Dispatch<React.SetStateAction<KeyValueItem[]>>) => {
        setter((prev) => [...prev, { key: '', value: '' }]);
    };
    const updateKeyValue = (
        setter: React.Dispatch<React.SetStateAction<KeyValueItem[]>>,
        index: number,
        field: 'key' | 'value',
        value: string
    ) => {
        setter((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };
    const removeKeyValue = (setter: React.Dispatch<React.SetStateAction<KeyValueItem[]>>, index: number) => {
        setter((prev) => prev.filter((_, i) => i !== index));
    };

    const addString = (setter: React.Dispatch<React.SetStateAction<string[]>>) => setter((prev) => [...prev, '']);
    const updateString = (
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        index: number,
        value: string
    ) => {
        setter((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };
    const removeString = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) =>
        setter((prev) => prev.filter((_, i) => i !== index));

    const addTLS = () => setTls((prev) => [...prev, createEmptyTLS()]);
    const removeTLS = (index: number) => setTls((prev) => prev.filter((_, i) => i !== index));
    const updateTLS = (index: number, field: keyof TLSForm, value: string | string[]) => {
        setTls((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value } as TLSForm;
            return next;
        });
    };

    const addRoute = () => setRoutes((prev) => [...prev, createEmptyRoute()]);
    const removeRoute = (index: number) => setRoutes((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    const updateRoute = (index: number, field: keyof RouteForm, value: string | boolean | KeyValueItem[]) => {
        setRoutes((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value } as RouteForm;
            return next;
        });
    };

    const handleSubmit = () => {
        if (!isValid) return;

        const labelRecord = itemsToRecord(labels) || {};
        const annotationsRecord = itemsToRecord(annotations);
        const hostsList = normalizeStringList(hosts);

        const tlsConfigs: TraitIngressTLSConfig[] | undefined = tls.length
            ? tls
                .map((t): TraitIngressTLSConfig | null => {
                    const secretName = t.secretName.trim();
                    if (!secretName) return null;
                    const tlsHosts = normalizeStringList(t.hosts);
                    return {
                        secretName,
                        hosts: tlsHosts.length ? tlsHosts : undefined,
                    };
                })
                .filter((t): t is TraitIngressTLSConfig => t !== null)
            : undefined;

        const routesConfigs: TraitIngressRoute[] = routes
            .map((r): TraitIngressRoute | null => {
                const serviceName = r.serviceName.trim();
                if (!serviceName) return null;

                const headersRecord = itemsToRecord(r.headers);
                const servicePort = parseOptionalInt(r.servicePort);
                const weight = parseOptionalInt(r.weight);
                const rewrite: TraitIngressRewritePolicy | undefined = r.rewriteEnabled
                    ? {
                        type: r.rewriteType.trim() || 'replace',
                        match: r.rewriteMatch.trim() || undefined,
                        replacement: r.rewriteReplacement.trim() || undefined,
                    }
                    : undefined;

                return {
                    path: r.path.trim() || undefined,
                    pathType: r.pathType.trim() || undefined,
                    host: r.host.trim() || undefined,
                    backend: {
                        serviceName,
                        servicePort,
                        weight,
                        headers: headersRecord,
                    },
                    rewrite,
                };
            })
            .filter((r): r is TraitIngressRoute => r !== null);

        const ingressData: TraitIngressSpec = {
            name: name.trim(),
            namespace: namespace.trim() || defaultNamespace,
            hosts: hostsList.length ? hostsList : undefined,
            label: labelRecord,
            annotations: annotationsRecord,
            ingressClassName: ingressClassName.trim() || undefined,
            defaultPathType: defaultPathType.trim() || undefined,
            tls: tlsConfigs && tlsConfigs.length ? tlsConfigs : undefined,
            routes: routesConfigs,
        };

        if (isEditMode && onUpdate) {
            onUpdate(ingressData);
        } else {
            onAdd(ingressData);
        }
    };

    const renderCollapse = (
        title: string,
        count: number,
        isExpanded: boolean,
        setExpanded: (expanded: boolean) => void,
        children: React.ReactNode
    ) => (
        <div className="border border-components-panel-border rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <span className="text-xs font-medium text-text-secondary">{title}</span>
                <div className="flex items-center gap-2">
                    {count > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                            {count}
                        </span>
                    )}
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            </button>
            {isExpanded && <div className="p-3 space-y-2 bg-white">{children}</div>}
        </div>
    );

    return (
        <>
            <style>{gradientBorderStyle}</style>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-5 py-4 border-b border-components-panel-border">
                    <span className="text-[15px] font-semibold text-text-primary">
                        {isEditMode ? 'Edit Traits Ingress' : 'Add Traits Ingress'}
                    </span>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
                        <X size={16} />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder="e.g. ingress-main"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">
                            Namespace <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder={defaultNamespace}
                            value={namespace}
                            onChange={(e) => setNamespace(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">Ingress Class Name</label>
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder="e.g. nginx"
                            value={ingressClassName}
                            onChange={(e) => setIngressClassName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-[13px] font-medium text-text-primary mb-2 block">Default Path Type</label>
                        <input
                            type="text"
                            className={INPUT_STYLES}
                            placeholder="e.g. Prefix"
                            value={defaultPathType}
                            onChange={(e) => setDefaultPathType(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-text-primary">Hosts</span>
                            <button
                                type="button"
                                onClick={() => addString(setHosts)}
                                className="flex items-center gap-1 text-xs text-state-accent-solid hover:text-state-accent-active"
                            >
                                <Plus size={12} />
                                Add Host
                            </button>
                        </div>
                        {hosts.length === 0 ? (
                            <div className="text-xs text-text-tertiary">No hosts</div>
                        ) : (
                            <div className="space-y-2">
                                {hosts.map((h, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            className={INPUT_STYLES}
                                            placeholder="e.g. example.com"
                                            value={h}
                                            onChange={(e) => updateString(setHosts, idx, e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeString(setHosts, idx)}
                                            className="p-1 text-text-tertiary hover:text-state-destructive-solid rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {renderCollapse(
                        'Labels',
                        labels.filter((l) => l.key.trim()).length,
                        showLabels,
                        setShowLabels,
                        <div className="space-y-2">
                            {labels.length === 0 ? (
                                <div className="text-xs text-text-tertiary">No labels</div>
                            ) : (
                                labels.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                            placeholder="Key"
                                            value={item.key}
                                            onChange={(e) => updateKeyValue(setLabels, idx, 'key', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                            placeholder="Value"
                                            value={item.value}
                                            onChange={(e) => updateKeyValue(setLabels, idx, 'value', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeKeyValue(setLabels, idx)}
                                            className="p-1 text-text-tertiary hover:text-state-destructive-solid rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                            <button
                                type="button"
                                onClick={() => addKeyValue(setLabels)}
                                className="flex items-center gap-1 text-xs text-state-accent-solid hover:text-state-accent-active"
                            >
                                <Plus size={12} />
                                Add Label
                            </button>
                        </div>
                    )}

                    {renderCollapse(
                        'Annotations',
                        annotations.filter((l) => l.key.trim()).length,
                        showAnnotations,
                        setShowAnnotations,
                        <div className="space-y-2">
                            {annotations.length === 0 ? (
                                <div className="text-xs text-text-tertiary">No annotations</div>
                            ) : (
                                annotations.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                            placeholder="Key"
                                            value={item.key}
                                            onChange={(e) => updateKeyValue(setAnnotations, idx, 'key', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                            placeholder="Value"
                                            value={item.value}
                                            onChange={(e) => updateKeyValue(setAnnotations, idx, 'value', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeKeyValue(setAnnotations, idx)}
                                            className="p-1 text-text-tertiary hover:text-state-destructive-solid rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                            <button
                                type="button"
                                onClick={() => addKeyValue(setAnnotations)}
                                className="flex items-center gap-1 text-xs text-state-accent-solid hover:text-state-accent-active"
                            >
                                <Plus size={12} />
                                Add Annotation
                            </button>
                        </div>
                    )}

                    {renderCollapse(
                        'TLS',
                        tls.filter((t) => t.secretName.trim()).length,
                        showTls,
                        setShowTls,
                        <div className="space-y-3">
                            {tls.length === 0 ? (
                                <div className="text-xs text-text-tertiary">No TLS config</div>
                            ) : (
                                tls.map((t, idx) => (
                                    <div key={idx} className="rounded-lg border border-components-panel-border bg-white p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-text-secondary">TLS #{idx + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeTLS(idx)}
                                                className="p-1 text-text-tertiary hover:text-state-destructive-solid rounded"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-tertiary mb-1 block">Secret Name *</label>
                                            <input
                                                type="text"
                                                className={INPUT_STYLES}
                                                placeholder="e.g. tls-secret"
                                                value={t.secretName}
                                                onChange={(e) => updateTLS(idx, 'secretName', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-text-tertiary">Hosts</span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateTLS(idx, 'hosts', [...t.hosts, ''])}
                                                    className="flex items-center gap-1 text-xs text-state-accent-solid hover:text-state-accent-active"
                                                >
                                                    <Plus size={12} />
                                                    Add
                                                </button>
                                            </div>
                                            {t.hosts.length === 0 ? (
                                                <div className="text-xs text-text-tertiary">No TLS hosts</div>
                                            ) : (
                                                t.hosts.map((h, hIdx) => (
                                                    <div key={hIdx} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            className={INPUT_STYLES}
                                                            placeholder="e.g. example.com"
                                                            value={h}
                                                            onChange={(e) =>
                                                                updateTLS(
                                                                    idx,
                                                                    'hosts',
                                                                    t.hosts.map((v, j) => (j === hIdx ? e.target.value : v))
                                                                )
                                                            }
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateTLS(
                                                                    idx,
                                                                    'hosts',
                                                                    t.hosts.filter((_, j) => j !== hIdx)
                                                                )
                                                            }
                                                            className="p-1 text-text-tertiary hover:text-state-destructive-solid rounded"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            <button
                                type="button"
                                onClick={addTLS}
                                className="flex items-center gap-1 text-xs text-state-accent-solid hover:text-state-accent-active"
                            >
                                <Plus size={12} />
                                Add TLS
                            </button>
                        </div>
                    )}

                    {renderCollapse(
                        'Routes',
                        routes.filter((r) => r.serviceName.trim()).length,
                        showRoutes,
                        setShowRoutes,
                        <div className="space-y-3">
                            {routes.map((r, idx) => (
                                <div key={idx} className="rounded-lg border border-components-panel-border bg-white p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-text-secondary">Route #{idx + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeRoute(idx)}
                                            disabled={routes.length <= 1}
                                            className="p-1 text-text-tertiary hover:text-state-destructive-solid rounded disabled:opacity-50"
                                            title={routes.length <= 1 ? 'At least one route is required' : 'Remove route'}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        <div>
                                            <label className="text-xs text-text-tertiary mb-1 block">Host</label>
                                            <input
                                                type="text"
                                                className={INPUT_STYLES}
                                                placeholder="e.g. example.com"
                                                value={r.host}
                                                onChange={(e) => updateRoute(idx, 'host', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-text-tertiary mb-1 block">Path</label>
                                                <input
                                                    type="text"
                                                    className={INPUT_STYLES}
                                                    placeholder="/"
                                                    value={r.path}
                                                    onChange={(e) => updateRoute(idx, 'path', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-text-tertiary mb-1 block">Path Type</label>
                                                <input
                                                    type="text"
                                                    className={INPUT_STYLES}
                                                    placeholder="e.g. Prefix"
                                                    value={r.pathType}
                                                    onChange={(e) => updateRoute(idx, 'pathType', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-text-tertiary mb-1 block">
                                                    Service Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={INPUT_STYLES}
                                                    placeholder="e.g. nginx"
                                                    value={r.serviceName}
                                                    onChange={(e) => updateRoute(idx, 'serviceName', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-text-tertiary mb-1 block">Service Port</label>
                                                <input
                                                    type="number"
                                                    className={INPUT_STYLES}
                                                    placeholder="80"
                                                    value={r.servicePort}
                                                    onChange={(e) => updateRoute(idx, 'servicePort', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-tertiary mb-1 block">Weight</label>
                                            <input
                                                type="number"
                                                className={INPUT_STYLES}
                                                placeholder="1"
                                                value={r.weight}
                                                onChange={(e) => updateRoute(idx, 'weight', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-text-tertiary">Headers</span>
                                            <button
                                                type="button"
                                                onClick={() => updateRoute(idx, 'headers', [...r.headers, { key: '', value: '' }])}
                                                className="flex items-center gap-1 text-xs text-state-accent-solid hover:text-state-accent-active"
                                            >
                                                <Plus size={12} />
                                                Add Header
                                            </button>
                                        </div>
                                        {r.headers.length === 0 ? (
                                            <div className="text-xs text-text-tertiary">No headers</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {r.headers.map((item, hIdx) => (
                                                    <div key={hIdx} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={item.key}
                                                            onChange={(e) =>
                                                                updateRoute(
                                                                    idx,
                                                                    'headers',
                                                                    r.headers.map((v, j) =>
                                                                        j === hIdx ? { ...v, key: e.target.value } : v
                                                                    )
                                                                )
                                                            }
                                                            placeholder="Key"
                                                            className="flex-1 px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={item.value}
                                                            onChange={(e) =>
                                                                updateRoute(
                                                                    idx,
                                                                    'headers',
                                                                    r.headers.map((v, j) =>
                                                                        j === hIdx ? { ...v, value: e.target.value } : v
                                                                    )
                                                                )
                                                            }
                                                            placeholder="Value"
                                                            className="flex-1 px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateRoute(
                                                                    idx,
                                                                    'headers',
                                                                    r.headers.filter((_, j) => j !== hIdx)
                                                                )
                                                            }
                                                            className="p-1 text-text-tertiary hover:text-state-destructive-solid rounded"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-lg border border-components-panel-border bg-components-input-bg-normal p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-text-secondary">Rewrite</span>
                                            <label className="flex items-center gap-2 text-xs text-text-tertiary">
                                                <input
                                                    type="checkbox"
                                                    checked={r.rewriteEnabled}
                                                    onChange={(e) => updateRoute(idx, 'rewriteEnabled', e.target.checked)}
                                                />
                                                Enable
                                            </label>
                                        </div>
                                        {r.rewriteEnabled && (
                                            <div className="grid grid-cols-1 gap-2">
                                                <div>
                                                    <label className="text-xs text-text-tertiary mb-1 block">
                                                        Type <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={INPUT_STYLES}
                                                        placeholder="replace | regexReplace | prefix"
                                                        value={r.rewriteType}
                                                        onChange={(e) => updateRoute(idx, 'rewriteType', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-text-tertiary mb-1 block">Match</label>
                                                    <input
                                                        type="text"
                                                        className={INPUT_STYLES}
                                                        placeholder="/old"
                                                        value={r.rewriteMatch}
                                                        onChange={(e) => updateRoute(idx, 'rewriteMatch', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-text-tertiary mb-1 block">Replacement</label>
                                                    <input
                                                        type="text"
                                                        className={INPUT_STYLES}
                                                        placeholder="/new"
                                                        value={r.rewriteReplacement}
                                                        onChange={(e) => updateRoute(idx, 'rewriteReplacement', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {!isValid && (
                                <div className="text-xs text-amber-600">
                                    Name and at least one Route with Service Name are required.
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={addRoute}
                                className="flex items-center gap-1 text-xs text-state-accent-solid hover:text-state-accent-active"
                            >
                                <Plus size={12} />
                                Add Route
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-components-panel-border bg-white">
                    <Button
                        variant="primary"
                        size="medium"
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={!isValid}
                    >
                        {isEditMode ? 'Update Ingress' : 'Add Ingress'}
                    </Button>
                </div>
            </div>
        </>
    );
};

export default TraitsIngressPanel;
