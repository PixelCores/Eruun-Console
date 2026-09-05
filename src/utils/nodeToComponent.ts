import type { FlowNode, Traits, TraitEnv, TraitStorage, TraitProbe, TraitContainer, TraitRbac, TraitRbacRule, TraitIngressSpec } from '../types/flow';

/**
 * Export component structure matching the target JSON format
 */
export interface ExportComponent {
    name: string;
    type: string;
    replicas: number;
    image?: string;
    properties: {
        ports?: { port: number }[] | null;
        env?: Record<string, string> | null;
        conf?: Record<string, string> | null;
        secret?: Record<string, string> | null;
        command?: string[] | null;
        labels?: Record<string, string> | null;
    };
    traits?: ExportTraits;
}

export interface ExportTraitRbacRule {
    apiGroups: string[];
    resources: string[];
    verbs: string[];
}

export interface ExportTraitRbac {
    serviceAccount: string;
    roleName: string;
    bindingName: string;
    rules: ExportTraitRbacRule[];
    roleLabels?: Record<string, string>;
}

export interface ExportTraitResource {
    cpu?: string;
    memory?: string;
    gpu?: string;
    cpuLimit?: string;
    memoryLimit?: string;
}

export interface ExportTraits {
    envs?: ExportTraitEnv[];
    probes?: ExportTraitProbe[];
    storage?: ExportTraitStorage[];
    sidecar?: ExportSidecar[];
    init?: ExportInitContainer[];
    rbac?: ExportTraitRbac[];
    ingress?: ExportTraitIngressSpec[];
    resource?: ExportTraitResource;
}

export interface ExportTraitIngressTLSConfig {
    secretName: string;
    hosts?: string[];
}

export interface ExportTraitIngressRouteBackend {
    serviceName: string;
    servicePort?: number;
    weight?: number;
    headers?: Record<string, string>;
}

export interface ExportTraitIngressRewritePolicy {
    type: string;
    match?: string;
    replacement?: string;
}

export interface ExportTraitIngressRoute {
    path?: string;
    pathType?: string;
    host?: string;
    backend: ExportTraitIngressRouteBackend;
    rewrite?: ExportTraitIngressRewritePolicy;
}

export interface ExportTraitIngressSpec {
    name: string;
    namespace: string;
    hosts?: string[];
    label: Record<string, string>;
    annotations?: Record<string, string>;
    ingressClassName?: string;
    defaultPathType?: string;
    tls?: ExportTraitIngressTLSConfig[];
    routes: ExportTraitIngressRoute[];
}

export interface ExportTraitEnv {
    name: string;
    valueFrom?: {
        secret?: {
            name: string;
            key: string;
        };
        field?: string;
    };
}

export interface ExportTraitStorage {
    type: 'persistent' | 'ephemeral' | 'config';
    name: string;
    mountPath: string;
    subPath?: string;
    size?: string;
    sourceName?: string;
}

export interface ExportTraitProbe {
    type: 'liveness' | 'readiness';
    exec?: {
        command: string[];
    };
    initialDelaySeconds?: number;
    periodSeconds?: number;
    timeoutSeconds?: number;
}

export interface ExportSidecar {
    name: string;
    image: string;
    command?: string[];
    traits?: {
        envs?: ExportTraitEnv[];
        storage?: ExportTraitStorage[];
    };
}

export interface ExportInitContainer {
    name: string;
    properties?: {
        image?: string;
        env?: Record<string, string>;
        command?: string[];
    };
    traits?: {
        envs?: ExportTraitEnv[];
        storage?: ExportTraitStorage[];
    };
}

export interface ExportDSL {
    name: string;
    alias: string;
    version: string;
    project: string;
    description: string;
    component: ExportComponent[];
}

/**
 * Convert TraitEnv from FlowNode format to export format
 */
function convertTraitEnvToExport(env: TraitEnv): ExportTraitEnv {
    const result: ExportTraitEnv = {
        name: env.name,
    };

    if (env.valueFrom) {
        result.valueFrom = {};
        if (env.valueFrom.secret) {
            result.valueFrom.secret = {
                name: env.valueFrom.secret.name,
                key: env.valueFrom.secret.key,
            };
        }
        if (env.valueFrom.field) {
            result.valueFrom.field = env.valueFrom.field.fieldPath;
        }
    }

    return result;
}

/**
 * Convert TraitStorage from FlowNode format to export format
 */
function convertTraitStorageToExport(storage: TraitStorage): ExportTraitStorage {
    const result: ExportTraitStorage = {
        type: storage.type,
        name: storage.name,
        mountPath: storage.mountPath,
    };

    if (storage.subPath) {
        result.subPath = storage.subPath;
    }
    if (storage.size) {
        result.size = storage.size;
    }
    if (storage.sourceName) {
        result.sourceName = storage.sourceName;
    }

    return result;
}

/**
 * Convert TraitProbe from FlowNode format to export format
 */
function convertTraitProbeToExport(probe: TraitProbe): ExportTraitProbe {
    const result: ExportTraitProbe = {
        type: probe.type,
    };

    if (probe.exec) {
        result.exec = { command: probe.exec.command };
    }
    if (probe.initialDelaySeconds !== undefined) {
        result.initialDelaySeconds = probe.initialDelaySeconds;
    }
    if (probe.periodSeconds !== undefined) {
        result.periodSeconds = probe.periodSeconds;
    }
    if (probe.timeoutSeconds !== undefined) {
        result.timeoutSeconds = probe.timeoutSeconds;
    }

    return result;
}

/**
 * Convert Sidecar container from FlowNode format to export format
 */
function convertSidecarToExport(sidecar: TraitContainer): ExportSidecar {
    const result: ExportSidecar = {
        name: sidecar.name,
        image: sidecar.image || '',
    };

    if (sidecar.command && sidecar.command.length > 0) {
        result.command = sidecar.command;
    }

    if (sidecar.traits) {
        result.traits = {};
        if (sidecar.traits.envs && sidecar.traits.envs.length > 0) {
            result.traits.envs = sidecar.traits.envs.map(convertTraitEnvToExport);
        }
        if (sidecar.traits.storage && sidecar.traits.storage.length > 0) {
            result.traits.storage = sidecar.traits.storage.map(convertTraitStorageToExport);
        }
    }

    return result;
}

/**
 * Convert Init container from FlowNode format to export format
 */
function convertInitContainerToExport(init: TraitContainer): ExportInitContainer {
    const result: ExportInitContainer = {
        name: init.name,
    };

    if (init.properties) {
        result.properties = {};
        if (init.properties.image) {
            result.properties.image = init.properties.image;
        }
        if (init.properties.env && Object.keys(init.properties.env).length > 0) {
            result.properties.env = init.properties.env;
        }
        if (init.properties.command && init.properties.command.length > 0) {
            result.properties.command = init.properties.command;
        }
    }

    if (init.traits) {
        result.traits = {};
        if (init.traits.envs && init.traits.envs.length > 0) {
            result.traits.envs = init.traits.envs.map(convertTraitEnvToExport);
        }
        if (init.traits.storage && init.traits.storage.length > 0) {
            result.traits.storage = init.traits.storage.map(convertTraitStorageToExport);
        }
    }

    return result;
}

/**
 * Convert TraitRbacRule from FlowNode format to export format
 */
function convertRbacRuleToExport(rule: TraitRbacRule): ExportTraitRbacRule {
    return {
        apiGroups: rule.apiGroups,
        resources: rule.resources,
        verbs: rule.verbs,
    };
}

/**
 * Convert TraitRbac from FlowNode format to export format
 */
function convertRbacToExport(rbac: TraitRbac): ExportTraitRbac {
    const result: ExportTraitRbac = {
        serviceAccount: rbac.serviceAccount,
        roleName: rbac.roleName,
        bindingName: rbac.bindingName,
        rules: rbac.rules.map(convertRbacRuleToExport),
    };

    if (rbac.roleLabels && Object.keys(rbac.roleLabels).length > 0) {
        result.roleLabels = rbac.roleLabels;
    }

    return result;
}

function convertIngressToExport(ingress: TraitIngressSpec): ExportTraitIngressSpec {
    return {
        name: ingress.name,
        namespace: ingress.namespace,
        hosts: ingress.hosts,
        label: ingress.label || {},
        annotations: ingress.annotations,
        ingressClassName: ingress.ingressClassName,
        defaultPathType: ingress.defaultPathType,
        tls: ingress.tls?.map((t): ExportTraitIngressTLSConfig => ({
            secretName: t.secretName,
            hosts: t.hosts,
        })),
        routes: (ingress.routes || []).map((r): ExportTraitIngressRoute => ({
            path: r.path,
            pathType: r.pathType,
            host: r.host,
            backend: {
                serviceName: r.backend.serviceName,
                servicePort: r.backend.servicePort,
                weight: r.backend.weight,
                headers: r.backend.headers,
            },
            rewrite: r.rewrite
                ? {
                    type: r.rewrite.type,
                    match: r.rewrite.match,
                    replacement: r.rewrite.replacement,
                }
                : undefined,
        })),
    };
}

/**
 * Convert FlowNode traits to export format
 */
function convertTraitsToExport(traits: Traits, nodeData: FlowNode['data']): ExportTraits | undefined {
    const result: ExportTraits = {};
    let hasTraits = false;

    // Convert envs
    if (traits.envs && traits.envs.length > 0) {
        result.envs = traits.envs.map(convertTraitEnvToExport);
        hasTraits = true;
    }

    // Convert probes - check both traits.probes and individual probe fields
    const probes: ExportTraitProbe[] = [];

    if (traits.probes && traits.probes.length > 0) {
        probes.push(...traits.probes.map(convertTraitProbeToExport));
    } else {
        // Build probes from individual fields if traits.probes doesn't exist
        if (nodeData.livenessEnabled) {
            const livenessProbe: ExportTraitProbe = {
                type: 'liveness',
            };
            if (nodeData.livenessExecCommand) {
                // Parse command string back to array
                livenessProbe.exec = {
                    command: parseCommandString(nodeData.livenessExecCommand as string),
                };
            }
            if (nodeData.livenessInitialDelay !== undefined) {
                livenessProbe.initialDelaySeconds = nodeData.livenessInitialDelay as number;
            }
            if (nodeData.livenessPeriod !== undefined) {
                livenessProbe.periodSeconds = nodeData.livenessPeriod as number;
            }
            if (nodeData.livenessTimeout !== undefined) {
                livenessProbe.timeoutSeconds = nodeData.livenessTimeout as number;
            }
            probes.push(livenessProbe);
        }

        if (nodeData.readinessEnabled) {
            const readinessProbe: ExportTraitProbe = {
                type: 'readiness',
            };
            if (nodeData.readinessExecCommand) {
                readinessProbe.exec = {
                    command: parseCommandString(nodeData.readinessExecCommand as string),
                };
            }
            if (nodeData.readinessInitialDelay !== undefined) {
                readinessProbe.initialDelaySeconds = nodeData.readinessInitialDelay as number;
            }
            if (nodeData.readinessPeriod !== undefined) {
                readinessProbe.periodSeconds = nodeData.readinessPeriod as number;
            }
            if (nodeData.readinessTimeout !== undefined) {
                readinessProbe.timeoutSeconds = nodeData.readinessTimeout as number;
            }
            probes.push(readinessProbe);
        }
    }

    if (probes.length > 0) {
        result.probes = probes;
        hasTraits = true;
    }

    // Convert storage
    if (traits.storage && traits.storage.length > 0) {
        result.storage = traits.storage.map(convertTraitStorageToExport);
        hasTraits = true;
    }

    // Convert sidecar
    if (traits.sidecar && traits.sidecar.length > 0) {
        result.sidecar = traits.sidecar.map(convertSidecarToExport);
        hasTraits = true;
    }

    // Convert init
    if (traits.init && traits.init.length > 0) {
        result.init = traits.init.map(convertInitContainerToExport);
        hasTraits = true;
    }

    // Convert rbac
    if (traits.rbac && traits.rbac.length > 0) {
        result.rbac = traits.rbac.map(convertRbacToExport);
        hasTraits = true;
    }

    // Convert ingress
    if (traits.ingress && traits.ingress.length > 0) {
        result.ingress = traits.ingress.map(convertIngressToExport);
        hasTraits = true;
    }

    // Convert resource
    if (traits.resource) {
        const resource: ExportTraitResource = {};
        if (traits.resource.cpu) {
            resource.cpu = traits.resource.cpu;
        }
        if (traits.resource.memory) {
            resource.memory = traits.resource.memory;
        }
        if (traits.resource.gpu) {
            resource.gpu = traits.resource.gpu;
        }
        if (traits.resource.cpuLimit) {
            resource.cpuLimit = traits.resource.cpuLimit;
        }
        if (traits.resource.memoryLimit) {
            resource.memoryLimit = traits.resource.memoryLimit;
        }
        if (Object.keys(resource).length > 0) {
            result.resource = resource;
            hasTraits = true;
        }
    }

    return hasTraits ? result : undefined;
}

/**
 * Parse command string to array
 * Handles cases like: sh -c "mysqladmin ping"
 */
function parseCommandString(cmdString: string): string[] {
    // Simple parsing - split by space but keep quoted strings together
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < cmdString.length; i++) {
        const char = cmdString[i];

        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
            current += char;
        } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            current += char;
            quoteChar = '';
        } else if (char === ' ' && !inQuotes) {
            if (current.trim()) {
                result.push(current.trim());
            }
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        result.push(current.trim());
    }

    return result;
}

/**
 * Convert a single FlowNode to ExportComponent format
 */
export function nodeToComponent(node: FlowNode): ExportComponent {
    const data = node.data;

    // Determine the actual type to export
    // Use originalType if available (preserves config/secret distinction)
    // Otherwise map config-secret back to config or secret based on data
    let exportType = data.originalType || data.componentType || 'webservice';

    if (data.componentType === 'config-secret') {
        // Determine based on what data exists
        const hasConfig = data.configData && data.configData.length > 0;
        const hasSecret = data.secretData && data.secretData.length > 0;

        if (hasSecret && !hasConfig) {
            exportType = 'secret';
        } else {
            exportType = 'config';
        }
    }

    const component: ExportComponent = {
        name: data.name || data.label || 'component',
        type: exportType,
        replicas: data.replicas || 1,
        properties: {},
    };

    // Add image for non-config/secret types
    if (exportType !== 'config' && exportType !== 'secret' && exportType !== 'job') {
        component.image = data.image || '';
    }

    // For job, we still want to include image if present, but the check above was for "Non-config/secret"
    // Actually, Job SHOULD have an image. The original check was excluding config/secret.
    // Let's keep it inclusive for 'job'.
    if (exportType === 'job') {
        component.image = data.image || '';
    }

    // Inject position metadata into labels
    if (node.position) {
        component.properties.labels = {
            ...(component.properties.labels || {}),
            'ui.eruun.io/x': Math.round(node.position.x).toString(),
            'ui.eruun.io/y': Math.round(node.position.y).toString()
        };
    }

    // Build properties based on type
    if (exportType === 'config') {
        // Config type: convert configData to properties.conf
        if (data.configData && data.configData.length > 0) {
            component.properties.conf = {};
            data.configData.forEach(item => {
                component.properties.conf![item.key] = item.value;
            });
        }
    } else if (exportType === 'secret') {
        // Secret type: convert secretData to properties.secret
        if (data.secretData && data.secretData.length > 0) {
            component.properties.secret = {};
            data.secretData.forEach(item => {
                component.properties.secret![item.key] = item.value;
            });
        }
    } else {
        // Store/Webservice types
        // Convert ports
        if (data.ports && data.ports.length > 0) {
            component.properties.ports = data.ports.map(port => ({
                port: parseInt(port) || 0,
            }));
        }

        // Convert environmentVariables to env
        if (data.environmentVariables && data.environmentVariables.length > 0) {
            component.properties.env = {};
            data.environmentVariables.forEach(envVar => {
                if (!envVar.isSecret) {
                    component.properties.env![envVar.key] = envVar.value;
                }
            });
            // Only include env if it has values
            if (Object.keys(component.properties.env).length === 0) {
                delete component.properties.env;
            }
        }

        // Convert cmd to command
        if (data.cmd && Array.isArray(data.cmd) && data.cmd.length > 0) {
            component.properties.command = data.cmd as string[];
        }

        // Convert traits
        if (data.traits) {
            const exportTraits = convertTraitsToExport(data.traits, data);
            if (exportTraits) {
                component.traits = exportTraits;
            }
        } else {
            // Build traits from individual probe fields if no traits object
            const traits: ExportTraits = {};
            const probes: ExportTraitProbe[] = [];

            if (data.livenessEnabled) {
                const livenessProbe: ExportTraitProbe = {
                    type: 'liveness',
                };
                if (data.livenessExecCommand) {
                    livenessProbe.exec = {
                        command: parseCommandString(data.livenessExecCommand as string),
                    };
                }
                if (data.livenessInitialDelay !== undefined) {
                    livenessProbe.initialDelaySeconds = data.livenessInitialDelay as number;
                }
                if (data.livenessPeriod !== undefined) {
                    livenessProbe.periodSeconds = data.livenessPeriod as number;
                }
                if (data.livenessTimeout !== undefined) {
                    livenessProbe.timeoutSeconds = data.livenessTimeout as number;
                }
                probes.push(livenessProbe);
            }

            if (data.readinessEnabled) {
                const readinessProbe: ExportTraitProbe = {
                    type: 'readiness',
                };
                if (data.readinessExecCommand) {
                    readinessProbe.exec = {
                        command: parseCommandString(data.readinessExecCommand as string),
                    };
                }
                if (data.readinessInitialDelay !== undefined) {
                    readinessProbe.initialDelaySeconds = data.readinessInitialDelay as number;
                }
                if (data.readinessPeriod !== undefined) {
                    readinessProbe.periodSeconds = data.readinessPeriod as number;
                }
                if (data.readinessTimeout !== undefined) {
                    readinessProbe.timeoutSeconds = data.readinessTimeout as number;
                }
                probes.push(readinessProbe);
            }

            if (probes.length > 0) {
                traits.probes = probes;
                component.traits = traits;
            }
        }
    }

    return component;
}

/**
 * Convert array of FlowNodes to ExportDSL format
 */
export function nodesToDSL(
    nodes: FlowNode[],
    metadata?: {
        name?: string;
        alias?: string;
        version?: string;
        project?: string;
        description?: string;
    }
): ExportDSL {
    const components = nodes.map(nodeToComponent);

    return {
        name: metadata?.name || 'project-export',
        alias: metadata?.alias || 'project',
        version: metadata?.version || '1.0.0',
        project: metadata?.project || '',
        description: metadata?.description || 'Exported Project',
        component: components,
    };
}

export default nodesToDSL;

