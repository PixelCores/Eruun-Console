import type { Connection, Edge, EdgeChange, Node, NodeChange } from '@xyflow/react';

export type EnvironmentVariable = {
    key: string;
    value: string;
    type?: 'String' | 'Number' | 'Secret';
    isSecret?: boolean;
    description?: string;
};

export type PropertyItem = {
    id: string;
    value: string;
    placeholder?: string;
};

export type EnvConfigItem = {
    id: string;
    key: string;
    value: string;
};

export interface TraitEnv {
    name: string;
    valueFrom?: {
        secret?: {
            name: string;
            key: string;
        };
        field?: {
            fieldPath: string;
        };
    };
}

export interface TraitProbe {
    type: 'liveness' | 'readiness';
    exec?: {
        command: string[];
    };
    initialDelaySeconds?: number;
    periodSeconds?: number;
    timeoutSeconds?: number;
}

export interface TraitStorage {
    type: 'persistent' | 'ephemeral' | 'config';
    name: string;
    mountPath: string;
    subPath?: string;
    size?: string;
    sourceName?: string; // For config type
}

export interface TraitContainer {
    name: string;
    image?: string;
    command?: string[];
    properties?: {
        image?: string;
        command?: string[];
        env?: Record<string, string>;
    };
    traits?: Traits;
    securityPolicy?: TraitSecurityPolicy;
}

export interface TraitResource {
    cpu?: string;
    memory?: string;
    gpu?: string;
    cpuLimit?: string;
    memoryLimit?: string;
}

export interface TraitRbacRule {
    apiGroups: string[];
    resources: string[];
    verbs: string[];
}

export interface TraitRbac {
    serviceAccount: string;
    roleName: string;
    bindingName: string;
    rules: TraitRbacRule[];
    roleLabels?: Record<string, string>;
}

export interface TraitIngressTLSConfig {
    secretName: string;
    hosts?: string[];
}

export interface TraitIngressRouteBackend {
    serviceName: string;
    servicePort?: number;
    weight?: number;
    headers?: Record<string, string>;
}

export interface TraitIngressRewritePolicy {
    type: string;
    match?: string;
    replacement?: string;
}

export interface TraitIngressRoute {
    path?: string;
    pathType?: string;
    host?: string;
    backend: TraitIngressRouteBackend;
    rewrite?: TraitIngressRewritePolicy;
}

export interface TraitIngressSpec {
    name: string;
    namespace: string;
    hosts?: string[];
    label: Record<string, string>;
    annotations?: Record<string, string>;
    ingressClassName?: string;
    defaultPathType?: string;
    tls?: TraitIngressTLSConfig[];
    routes: TraitIngressRoute[];
}

// Security Policy types based on Kubernetes SecurityContext
export interface TraitCapabilities {
    add?: string[];
    drop?: string[];
}

export interface TraitSELinuxOptions {
    level?: string;
    role?: string;
    type?: string;
    user?: string;
}

export interface TraitSeccompProfile {
    type: 'Unconfined' | 'RuntimeDefault' | 'Localhost';
    localhostProfile?: string;
}

export interface TraitAppArmorProfile {
    type: 'Unconfined' | 'RuntimeDefault' | 'Localhost';
    localhostProfile?: string;
}

export interface TraitSecurityPolicy {
    name: string;
    capabilities?: TraitCapabilities;
    privileged?: boolean;
    seLinuxOptions?: TraitSELinuxOptions;
    runAsUser?: number;
    runAsGroup?: number;
    runAsNonRoot?: boolean;
    readOnlyRootFilesystem?: boolean;
    allowPrivilegeEscalation?: boolean;
    procMount?: 'Default' | 'Unmasked';
    seccompProfile?: TraitSeccompProfile;
    appArmorProfile?: TraitAppArmorProfile;
}

export type ShareStrategy = 'default' | 'ignore' | 'force';

export interface TraitShare {
    strategy: ShareStrategy;
}

export interface TraitServicePort {
    port: number;
    targetPort?: number;
    protocol?: string;
    name?: string;
}

export type TraitServiceType = 'internal' | 'node' | 'public' | 'external';

export interface TraitServiceSpec {
    name?: string;
    type?: TraitServiceType;
    headless?: boolean;
    selector?: Record<string, string>;
    externalName?: string;
    labels?: Record<string, string>;
    ports: TraitServicePort[];
}

export interface Traits {
    envs?: TraitEnv[];
    probes?: TraitProbe[];
    storage?: TraitStorage[];
    sidecar?: TraitContainer[];
    init?: TraitContainer[];
    resource?: TraitResource;
    rbac?: TraitRbac[];
    ingress?: TraitIngressSpec[];
    securityPolicy?: TraitSecurityPolicy[];
    service?: TraitServiceSpec[];
    share?: TraitShare;
}

// Config data item (key-value pair for config files like master.cnf, slave.cnf)
export interface ConfigDataItem {
    id: string;
    key: string;      // filename, e.g., "master.cnf"
    value: string;    // file content
}

// Secret data item (key-value pair for secrets)
export interface SecretDataItem {
    id: string;
    key: string;      // secret key, e.g., "MYSQL_ROOT_PASSWORD"
    value: string;    // secret value (base64 encoded)
}

export interface FlowNodeData extends Record<string, unknown> {
    name?: string;
    label: string;
    description?: string;
    icon?: string;
    componentType?: 'webservice' | 'store' | 'config' | 'secret' | 'config-secret' | 'job';
    originalType?: 'config' | 'secret' | 'store' | 'webservice' | 'job';  // Original API type
    image?: string;
    namespace?: string;
    replicas?: number;
    content?: string;
    environmentVariables?: EnvironmentVariable[];
    properties?: PropertyItem[];
    envConfig?: EnvConfigItem[];
    configData?: ConfigDataItem[];   // For config type: properties.conf
    secretData?: SecretDataItem[];   // For secret type: properties.secret
    enabled?: boolean;
    ports?: string[];
    traits?: Traits;
    status?: string;
    hasCustomPosition?: boolean;
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge;

// Component deployment status types
export type ComponentDeployStatus =
    | 'waiting'    // waiting
    | 'queued'     // queued
    | 'running'    // running
    | 'completed'  // completed
    | 'failed'     // failed
    | 'cancelled'  // cancelled
    | 'timeout'    // timeout
    | 'reject'     // reject
    | 'prepare'    // prepare
    | 'pending'    // pending
    | 'cleaning';  // cleaning

export interface ComponentStatus {
    name: string;
    type: string;
    status: ComponentDeployStatus;
    startTime?: number;
    endTime?: number;
}

export const ControlMode = {
    Pointer: 'pointer',
    Hand: 'hand',
} as const;

export type ControlMode = typeof ControlMode[keyof typeof ControlMode];

export type FlowState = {
    nodes: FlowNode[];
    edges: FlowEdge[];
    selectedNodeId: string | null;
    controlMode: ControlMode;
    panelMenu: { top: number; left: number; edgeId?: string } | null;
    clipboard: FlowNode | null;
    setNodes: (nodes: FlowNode[]) => void;
    setEdges: (edges: FlowEdge[]) => void;
    clearNodes: () => void;
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    addNode: (node: FlowNode) => void;
    insertNodeOnEdge: (edgeId: string, node: FlowNode) => void;
    setSelectedNode: (id: string | null) => void;
    updateNodeData: (id: string, data: Partial<FlowNodeData>) => void;
    setControlMode: (mode: ControlMode) => void;
    setPanelMenu: (menu: { top: number; left: number; edgeId?: string } | null) => void;
    deleteSelectedElements: () => void;
    copyNode: () => void;
    pasteNode: () => void;
    showEnvPanel: boolean;
    setShowEnvPanel: (show: boolean) => void;
    environmentVariables: EnvironmentVariable[];
    setEnvironmentVariables: (vars: EnvironmentVariable[]) => void;
    envSecrets: Record<string, string>;
    setEnvSecrets: (secrets: Record<string, string>) => void;
    // Preview mode state
    isPreviewMode: boolean;
    setPreviewMode: (mode: boolean) => void;
    taskId: string | null;
    setTaskId: (id: string | null) => void;
    componentStatuses: Record<string, ComponentStatus>;
    setComponentStatuses: (statuses: Record<string, ComponentStatus>) => void;
    clearPreviewState: () => void;
    // Log panel state
    showLogPanel: boolean;
    setShowLogPanel: (show: boolean) => void;
    logComponentName: string | null;
    setLogComponentName: (name: string | null) => void;
    logs: string[];
    appendLog: (line: string) => void;
    clearLogs: () => void;
    resetLogPanelState: () => void;
};
