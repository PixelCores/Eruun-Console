import type { TraitIngressSpec, TraitShare, TraitSecurityPolicy, TraitServiceSpec } from './flow';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface AppResources {
  cpuReq?: string;
  memReq?: string;
  cpuLimit?: string;
  memLimit?: string;
  replicas?: number;
}

export interface App {
  id: string;
  name: string;
  alias: string;
  project: string;
  namespace?: string;
  version?: string;
  description: string;
  createTime: string;
  updateTime: string;
  icon: string;
  workflowId: string;
  templateEnabled?: boolean;
  resources?: AppResources;
}

export interface AppListResponse {
  data: App[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AppFilters {
  search?: string;
  tags?: string[];
  myApps?: boolean;
}

// Component types from API
export interface ComponentPort {
  port: number;
  expose: boolean;
}

export interface ComponentTraitStorage {
  name: string;
  type: 'persistent' | 'ephemeral' | 'config';
  mountPath: string;
  subPath?: string;
  size?: string;
  sourceName?: string;
}

export interface ComponentTraitEnv {
  name: string;
  valueFrom?: {
    secret?: {
      name: string;
      key: string;
    };
    field?: string;
  };
}

export interface ComponentTraitProbe {
  type: 'liveness' | 'readiness';
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  exec?: {
    command: string[];
  };
}

export interface ComponentTraitRbacRule {
  apiGroups: string[];
  resources: string[];
  verbs: string[];
}

export interface ComponentTraitRbac {
  serviceAccount: string;
  namespace?: string;
  roleName: string;
  bindingName: string;
  rules: ComponentTraitRbacRule[];
  roleLabels?: Record<string, string>;
}

export interface ComponentTraitResource {
  cpu?: string;
  memory?: string;
  gpu?: string;
  cpuLimit?: string;
  memoryLimit?: string;
}

export interface ComponentInitContainer {
  name: string;
  traits?: {
    storage?: ComponentTraitStorage[];
    envs?: ComponentTraitEnv[];
  };
  properties?: {
    image?: string;
    ports?: ComponentPort[] | null;
    env?: Record<string, string> | null;
    conf?: Record<string, string> | null;
    secret?: Record<string, string> | null;
    command?: string[] | null;
    labels?: Record<string, string> | null;
  };
}

export interface ComponentSidecar {
  name: string;
  image: string;
  command?: string[];
  traits?: {
    storage?: ComponentTraitStorage[];
    envs?: ComponentTraitEnv[];
  };
}

export interface ComponentTraits {
  init?: ComponentInitContainer[];
  storage?: ComponentTraitStorage[];
  sidecar?: ComponentSidecar[];
  rbac?: ComponentTraitRbac[];
  envs?: ComponentTraitEnv[];
  probes?: ComponentTraitProbe[];
  resource?: ComponentTraitResource;
  resources?: ComponentTraitResource;  // API may return 'resources' (plural)
  ingress?: TraitIngressSpec[];
  share?: TraitShare;
  securityPolicy?: TraitSecurityPolicy[];
  service?: TraitServiceSpec[];
}

export interface ComponentProperties {
  image?: string;
  ports?: ComponentPort[] | null;
  env?: Record<string, string> | null;
  conf?: Record<string, string> | null;
  secret?: Record<string, string> | null;
  command?: string[] | null;
  labels?: Record<string, string> | null;
}

export interface ComponentExternalLink {
  type: string;
  value: string;
}

export interface Component {
  id: number;
  appId: string;
  name: string;
  namespace: string;
  image?: string;
  replicas: number;
  type: 'config' | 'secret' | 'store' | 'webservice' | 'job';
  properties: ComponentProperties;
  traits: ComponentTraits;
  status?: string;
  lastAbnormal?: string;
  externalLinks?: ComponentExternalLink[];
  createTime: string;
  updateTime: string;
}

export interface ComponentsResponse {
  components: Component[];
}

// Workflow types from API
export interface WorkflowStep {
  name: string;
  workflowType: string;
  mode: 'StepByStep' | 'DAG';
  components: string[];
}

export interface Workflow {
  id: string;
  name: string;
  alias: string;
  namespace: string;
  projectId?: string;
  description: string;
  status: string;
  disabled: boolean;
  steps: WorkflowStep[];
  createTime: string;
  updateTime: string;
  workflowType: string;
}

export interface WorkflowsResponse {
  workflows: Workflow[];
}
export interface RestartAppResponse {
  appId: string;
  restartedAt: string;
  restartedResources: string[];
  skippedResources: string[];
  failedResources: string[];
}

// Workflow Callback types
export interface WorkflowCallback {
  success?: string;
  failure?: string;
  methods?: {
    success?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    failure?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  };
  headers?: Record<string, string>;
  timeoutSeconds?: number;
}
