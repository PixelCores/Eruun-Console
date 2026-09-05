import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';
import {
    Cpu,
    Sliders,
    CheckCircle2,
    XCircle,
    X,
    Shield,
    Activity,
    Cloud,
    Key,
    AlertCircle,
    Loader2
} from 'lucide-react';
import Switch from '../../../components/base/switch';
import Input from '../../../components/base/Input';
import DynamicKeyValueList, { type KeyValueItem } from '../../../components/base/DynamicKeyValueList';
import DynamicInputList, { type InputItem } from '../../../components/base/DynamicInputList';
import FieldCollapse from '../../../components/base/FieldCollapse';
import { Button } from '../../../components/ui/Button';

interface AliyunConfigDecoupled {
    credentials: {
        accessKeyId: string;
        accessKeySecret: string;
    };
    network: {
        regionId: string;
        zoneId: string;
        vpcId: string;
        vswId: string;
    };
    storage: {
        endpoint: string;
    };
}

interface TencentConfigDecoupled {
    credentials: {
        secretId: string;
        secretKey: string;
    };
    network: {
        region: string;
        zone: string;
        vpcId: string;
        subnetId: string;
    };
    storage: {
        endpoint: string;
    };
}

interface HuaweiConfigDecoupled {
    credentials: {
        accessKeyId: string;
        secretAccessKey: string;
    };
    network: {
        region: string;
        zone: string;
        vpcId: string;
        subnetId: string;
    };
    storage: {
        endpoint: string;
    };
}

interface AwsConfigDecoupled {
    credentials: {
        accessKeyId: string;
        secretKey: string;
    };
    network: {
        region: string;
        zone: string;
        vpcId: string;
        subnetId: string;
    };
    storage: {
        endpoint: string;
    };
}

interface AzureConfigDecoupled {
    credentials: {
        storageAccountName: string;
        storageAccountKey: string;
    };
    network: {
        region: string;
        resourceGroup: string;
        virtualNetwork: string;
        subnetName: string;
    };
    storage: {
        endpoint: string;
    };
}

interface GcpConfigDecoupled {
    credentials: {
        clientEmail: string;
        privateKey: string;
    };
    network: {
        region: string;
        vpcNetwork: string;
        subnetwork: string;
    };
    storage: {
        endpoint: string;
    };
}

interface CloudConfigsDecoupled {
    aliyun: AliyunConfigDecoupled;
    tencent: TencentConfigDecoupled;
    huawei: HuaweiConfigDecoupled;
    aws: AwsConfigDecoupled;
    azure: AzureConfigDecoupled;
    gcp: GcpConfigDecoupled;
}

const BUILTIN_CLOUDS: CloudConfigsDecoupled = {
    aliyun: {
        credentials: {
            accessKeyId: 'LTAI5t9TestAKID123',
            accessKeySecret: 'mock-aliyun-secret-key-123456',
        },
        network: {
            regionId: 'cn-hangzhou',
            zoneId: 'cn-hangzhou-i',
            vpcId: 'vpc-aliyunmock123',
            vswId: 'vsw-aliyunmock123',
        },
        storage: {
            endpoint: 'nas.cn-hangzhou.aliyuncs.com',
        }
    },
    tencent: {
        credentials: {
            secretId: 'AKIDTestSecretID123',
            secretKey: 'mock-tencent-secret-key-123456',
        },
        network: {
            region: 'ap-guangzhou',
            zone: 'ap-guangzhou-1',
            vpcId: 'vpc-tencentmock456',
            subnetId: 'subnet-tencentmock456',
        },
        storage: {
            endpoint: 'cos.ap-guangzhou.myqcloud.com',
        }
    },
    huawei: {
        credentials: {
            accessKeyId: 'AKTestAccessKeyID123',
            secretAccessKey: 'mock-huawei-secret-key-123456',
        },
        network: {
            region: 'cn-north-4',
            zone: 'cn-north-4a',
            vpcId: 'vpc-huaweimock789',
            subnetId: 'subnet-huaweimock789',
        },
        storage: {
            endpoint: 'sfs.cn-north-4.myhuaweicloud.com',
        }
    },
    aws: {
        credentials: {
            accessKeyId: 'AKIAAWSACCESSKEYID12',
            secretKey: 'mock-aws-secret-key-123456',
        },
        network: {
            region: 'us-east-1',
            zone: 'us-east-1a',
            vpcId: 'vpc-awsmock123',
            subnetId: 'subnet-awsmock123',
        },
        storage: {
            endpoint: 'efs.us-east-1.amazonaws.com',
        }
    },
    azure: {
        credentials: {
            storageAccountName: 'mockazureaccount',
            storageAccountKey: 'mock-azure-key-123456',
        },
        network: {
            region: 'eastus',
            resourceGroup: 'rg-azuremock',
            virtualNetwork: 'vnet-azuremock',
            subnetName: 'subnet-azuremock',
        },
        storage: {
            endpoint: 'mockazureaccount.file.core.windows.net',
        }
    },
    gcp: {
        credentials: {
            clientEmail: 'mock-gcp-service-account@project.iam.gserviceaccount.com',
            privateKey: 'mock-gcp-private-key-123456',
        },
        network: {
            region: 'us-central1-a',
            vpcNetwork: 'vpc-gcpmock123',
            subnetwork: 'subnet-gcpmock123',
        },
        storage: {
            endpoint: '10.10.10.10',
        }
    }
};

const CLOUD_PROVIDERS = [
    { id: 'aliyun', name: 'Alibaba Cloud', label: '阿里云', desc: 'Alibaba Cloud NAS Storage' },
    { id: 'tencent', name: 'Tencent Cloud', label: '腾讯云', desc: 'Tencent Cloud COS/NAS Storage' },
    { id: 'huawei', name: 'Huawei Cloud', label: '华为云', desc: 'Huawei Cloud SFS Storage' },
    { id: 'aws', name: 'Amazon Web Services', label: 'AWS', desc: 'Amazon EFS/S3 Storage' },
    { id: 'azure', name: 'Microsoft Azure', label: 'Azure', desc: 'Azure Files Storage' },
    { id: 'gcp', name: 'Google Cloud Platform', label: 'GCP', desc: 'GCP Filestore Storage' },
] as const;

type TabId = 'scheduling' | 'access' | 'security' | 'monitoring' | 'cloud' | 'oauth';

export const SettingsSection: React.FC = () => {
    const {
        serverSettings,
        isLoading,
        fetchServerSettings,
        saveServerSetting
    } = useSettingsStore();

    const [activeTab, setActiveTab] = useState<TabId>('scheduling');
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Scheduling States
    const [nodeSelectorItems, setNodeSelectorItems] = useState<KeyValueItem[]>([]);
    const [affinity, setAffinity] = useState('{}');
    const [tolerations, setTolerations] = useState('[]');

    // Access Control States
    const [apiAuthEnabled, setApiAuthEnabled] = useState(false);
    const [jwtAlgorithms, setJwtAlgorithms] = useState<string[]>(['HS256']);
    const [hs256Secret, setHs256Secret] = useState('');
    const [rs256PublicKeys, setRs256PublicKeys] = useState('[]');
    const [authDefaultEffect, setAuthDefaultEffect] = useState('deny');
    const [authRoutes, setAuthRoutes] = useState('[]');
    const [rbacPolicies, setRbacPolicies] = useState('[]');

    // Security Policy States
    const [allowPrivateByDefault, setAllowPrivateByDefault] = useState(false);
    const [hostPatterns, setHostPatterns] = useState<InputItem[]>([]);
    const [cidrs, setCidrs] = useState<InputItem[]>([]);

    // Monitoring States
    const [monitorEnabled, setMonitorEnabled] = useState(false);
    const [windowSeconds, setWindowSeconds] = useState(1800);
    const [threshold, setThreshold] = useState(3);

    // Cloud States
    const [selectedCloud, setSelectedCloud] = useState<'aliyun' | 'tencent' | 'huawei' | 'aws' | 'azure' | 'gcp'>('aliyun');
    const [cloudConfigs, setCloudConfigs] = useState<CloudConfigsDecoupled>({
        aliyun: { ...BUILTIN_CLOUDS.aliyun },
        tencent: { ...BUILTIN_CLOUDS.tencent },
        huawei: { ...BUILTIN_CLOUDS.huawei },
        aws: { ...BUILTIN_CLOUDS.aws },
        azure: { ...BUILTIN_CLOUDS.azure },
        gcp: { ...BUILTIN_CLOUDS.gcp },
    });

    const updateCloudConfigField = <T extends keyof CloudConfigsDecoupled>(
        provider: T,
        section: 'credentials' | 'network' | 'storage',
        field: string,
        value: any
    ) => {
        setCloudConfigs(prev => ({
            ...prev,
            [provider]: {
                ...prev[provider],
                [section]: {
                    ...prev[provider][section],
                    [field]: value
                }
            }
        }));
    };

    // OAuth States
    const [oauthEnabled, setOauthEnabled] = useState(false);
    const [oauthClientId, setOauthClientId] = useState('');
    const [oauthClientSecret, setOauthClientSecret] = useState('');
    const [oauthRedirectURI, setOauthRedirectURI] = useState('');
    const [oauthScopes, setOauthScopes] = useState('');
    const [jwtIssueIssuer, setJwtIssueIssuer] = useState('');
    const [jwtIssueAudience, setJwtIssueAudience] = useState('');
    const [jwtIssueTtlSeconds, setJwtIssueTtlSeconds] = useState(3600);
    const [defaultRoles, setDefaultRoles] = useState('reader');
    const [stateTTLSeconds, setStateTTLSeconds] = useState(300);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        fetchServerSettings();
    }, [fetchServerSettings]);

    useEffect(() => {
        // 1. Scheduling (nodeSelector)
        const nsVal = serverSettings.nodeSelector || {};
        const nsMap = nsVal.nodeSelector || {};
        setNodeSelectorItems(
            Object.entries(nsMap).map(([key, value]) => ({
                id: `ns-${key}-${Date.now()}`,
                key,
                value: String(value),
            }))
        );
        setAffinity(JSON.stringify(nsVal.affinity || {}, null, 2));
        setTolerations(JSON.stringify(nsVal.tolerations || [], null, 2));

        // 2. Access Control (apiAuth & rbacPolicies)
        const apiVal = serverSettings.apiAuth || {};
        setApiAuthEnabled(!!apiVal.enabled);
        const jwtVal = apiVal.jwt || {};
        setJwtAlgorithms(jwtVal.algorithms || ['HS256']);
        setHs256Secret((jwtVal.hs256 && jwtVal.hs256.secret) ? '******' : '');
        setRs256PublicKeys(JSON.stringify(jwtVal.rs256?.publicKeys || [], null, 2));
        setAuthDefaultEffect(apiVal.authorization?.defaultEffect || 'deny');
        setAuthRoutes(JSON.stringify(apiVal.authorization?.routes || [], null, 2));

        const rbacVal = serverSettings.rbacPolicies || [];
        setRbacPolicies(JSON.stringify(rbacVal, null, 2));

        // 3. Security Policy (urlSecurityPolicy)
        const secVal = serverSettings.urlSecurityPolicy || {};
        setAllowPrivateByDefault(!!secVal.allowPrivateByDefault);
        setHostPatterns(
            (secVal.allowedHostPatterns || []).map((h: string, i: number) => ({
                id: `host-${i}-${Date.now()}`,
                value: h,
            }))
        );
        setCidrs(
            (secVal.allowedCIDRs || []).map((c: string, i: number) => ({
                id: `cidr-${i}-${Date.now()}`,
                value: c,
            }))
        );

        // 4. Runtime Monitoring (podRestartMonitor)
        const monVal = serverSettings.podRestartMonitor || {};
        setMonitorEnabled(!!monVal.enabled);
        setWindowSeconds(monVal.windowSeconds || 1800);
        setThreshold(monVal.threshold || 3);

        // 5. Cloud Provider Configs
        const aliyunVal = serverSettings.aliyunCloud || {};
        const tencentVal = serverSettings.tencentCloud || {};
        const huaweiVal = serverSettings.huaweiCloud || {};
        const awsVal = serverSettings.awsCloud || {};
        const azureVal = serverSettings.azureCloud || {};
        const gcpVal = serverSettings.gcpCloud || {};

        setCloudConfigs({
            aliyun: {
                credentials: {
                    accessKeyId: aliyunVal.accessKeyId !== undefined ? aliyunVal.accessKeyId : BUILTIN_CLOUDS.aliyun.credentials.accessKeyId,
                    accessKeySecret: aliyunVal.accessKeySecret ? '******' : BUILTIN_CLOUDS.aliyun.credentials.accessKeySecret,
                },
                network: {
                    regionId: aliyunVal.regionId !== undefined ? aliyunVal.regionId : BUILTIN_CLOUDS.aliyun.network.regionId,
                    zoneId: aliyunVal.zoneId !== undefined ? aliyunVal.zoneId : BUILTIN_CLOUDS.aliyun.network.zoneId,
                    vpcId: aliyunVal.vpcId !== undefined ? aliyunVal.vpcId : BUILTIN_CLOUDS.aliyun.network.vpcId,
                    vswId: aliyunVal.vswId !== undefined ? aliyunVal.vswId : BUILTIN_CLOUDS.aliyun.network.vswId,
                },
                storage: {
                    endpoint: aliyunVal.endpoint !== undefined ? aliyunVal.endpoint : BUILTIN_CLOUDS.aliyun.storage.endpoint,
                }
            },
            tencent: {
                credentials: {
                    secretId: tencentVal.secretId !== undefined ? tencentVal.secretId : BUILTIN_CLOUDS.tencent.credentials.secretId,
                    secretKey: tencentVal.secretKey ? '******' : BUILTIN_CLOUDS.tencent.credentials.secretKey,
                },
                network: {
                    region: tencentVal.region !== undefined ? tencentVal.region : BUILTIN_CLOUDS.tencent.network.region,
                    zone: tencentVal.zone !== undefined ? tencentVal.zone : BUILTIN_CLOUDS.tencent.network.zone,
                    vpcId: tencentVal.vpcId !== undefined ? tencentVal.vpcId : BUILTIN_CLOUDS.tencent.network.vpcId,
                    subnetId: tencentVal.subnetId !== undefined ? tencentVal.subnetId : BUILTIN_CLOUDS.tencent.network.subnetId,
                },
                storage: {
                    endpoint: tencentVal.endpoint !== undefined ? tencentVal.endpoint : BUILTIN_CLOUDS.tencent.storage.endpoint,
                }
            },
            huawei: {
                credentials: {
                    accessKeyId: huaweiVal.accessKeyId !== undefined ? huaweiVal.accessKeyId : BUILTIN_CLOUDS.huawei.credentials.accessKeyId,
                    secretAccessKey: huaweiVal.secretAccessKey ? '******' : BUILTIN_CLOUDS.huawei.credentials.secretAccessKey,
                },
                network: {
                    region: huaweiVal.region !== undefined ? huaweiVal.region : BUILTIN_CLOUDS.huawei.network.region,
                    zone: huaweiVal.zone !== undefined ? huaweiVal.zone : BUILTIN_CLOUDS.huawei.network.zone,
                    vpcId: huaweiVal.vpcId !== undefined ? huaweiVal.vpcId : BUILTIN_CLOUDS.huawei.network.vpcId,
                    subnetId: huaweiVal.subnetId !== undefined ? huaweiVal.subnetId : BUILTIN_CLOUDS.huawei.network.subnetId,
                },
                storage: {
                    endpoint: huaweiVal.endpoint !== undefined ? huaweiVal.endpoint : BUILTIN_CLOUDS.huawei.storage.endpoint,
                }
            },
            aws: {
                credentials: {
                    accessKeyId: awsVal.accessKeyId !== undefined ? awsVal.accessKeyId : BUILTIN_CLOUDS.aws.credentials.accessKeyId,
                    secretKey: awsVal.secretKey ? '******' : BUILTIN_CLOUDS.aws.credentials.secretKey,
                },
                network: {
                    region: awsVal.region !== undefined ? awsVal.region : BUILTIN_CLOUDS.aws.network.region,
                    zone: awsVal.zone !== undefined ? awsVal.zone : BUILTIN_CLOUDS.aws.network.zone,
                    vpcId: awsVal.vpcId !== undefined ? awsVal.vpcId : BUILTIN_CLOUDS.aws.network.vpcId,
                    subnetId: awsVal.subnetId !== undefined ? awsVal.subnetId : BUILTIN_CLOUDS.aws.network.subnetId,
                },
                storage: {
                    endpoint: awsVal.endpoint !== undefined ? awsVal.endpoint : BUILTIN_CLOUDS.aws.storage.endpoint,
                }
            },
            azure: {
                credentials: {
                    storageAccountName: azureVal.storageAccountName !== undefined ? azureVal.storageAccountName : BUILTIN_CLOUDS.azure.credentials.storageAccountName,
                    storageAccountKey: azureVal.storageAccountKey ? '******' : BUILTIN_CLOUDS.azure.credentials.storageAccountKey,
                },
                network: {
                    region: azureVal.region !== undefined ? azureVal.region : BUILTIN_CLOUDS.azure.network.region,
                    resourceGroup: azureVal.resourceGroup !== undefined ? azureVal.resourceGroup : BUILTIN_CLOUDS.azure.network.resourceGroup,
                    virtualNetwork: azureVal.virtualNetwork !== undefined ? azureVal.virtualNetwork : BUILTIN_CLOUDS.azure.network.virtualNetwork,
                    subnetName: azureVal.subnetName !== undefined ? azureVal.subnetName : BUILTIN_CLOUDS.azure.network.subnetName,
                },
                storage: {
                    endpoint: azureVal.endpoint !== undefined ? azureVal.endpoint : BUILTIN_CLOUDS.azure.storage.endpoint,
                }
            },
            gcp: {
                credentials: {
                    clientEmail: gcpVal.clientEmail !== undefined ? gcpVal.clientEmail : BUILTIN_CLOUDS.gcp.credentials.clientEmail,
                    privateKey: gcpVal.privateKey ? '******' : BUILTIN_CLOUDS.gcp.credentials.privateKey,
                },
                network: {
                    region: gcpVal.region !== undefined ? gcpVal.region : BUILTIN_CLOUDS.gcp.network.region,
                    vpcNetwork: gcpVal.vpcNetwork !== undefined ? gcpVal.vpcNetwork : BUILTIN_CLOUDS.gcp.network.vpcNetwork,
                    subnetwork: gcpVal.subnetwork !== undefined ? gcpVal.subnetwork : BUILTIN_CLOUDS.gcp.network.subnetwork,
                },
                storage: {
                    endpoint: gcpVal.endpoint !== undefined ? gcpVal.endpoint : BUILTIN_CLOUDS.gcp.storage.endpoint,
                }
            }
        });

        // 6. OAuth (oauthAuth)
        const oaVal = serverSettings.oauthAuth || {};
        setOauthEnabled(!!oaVal.enabled);
        const oaGoogle = oaVal.providers?.google || {};
        setOauthClientId(oaGoogle.clientId || '');
        setOauthClientSecret(oaGoogle.clientSecret ? '******' : '');
        setOauthRedirectURI(oaGoogle.redirectURI || '');
        setOauthScopes((oaGoogle.scopes || ['openid', 'email', 'profile']).join(', '));
        setJwtIssueIssuer(oaVal.jwtIssue?.issuer || 'eruun');
        setJwtIssueAudience(oaVal.jwtIssue?.audience || 'eruun-api');
        setJwtIssueTtlSeconds(oaVal.jwtIssue?.ttlSeconds || 3600);
        setDefaultRoles((oaVal.roleMapping?.defaultRoles || ['reader']).join(', '));
        setStateTTLSeconds(oaVal.security?.stateTTLSeconds || 300);
    }, [serverSettings]);

    const handleSaveScheduling = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let affinityObj = {};
            if (affinity.trim()) {
                try {
                    affinityObj = JSON.parse(affinity);
                } catch {
                    showToast('error', 'Affinity must be a valid JSON object');
                    return;
                }
            }

            let tolerationsArr = [];
            if (tolerations.trim()) {
                try {
                    tolerationsArr = JSON.parse(tolerations);
                    if (!Array.isArray(tolerationsArr)) {
                        showToast('error', 'Tolerations must be a valid JSON array');
                        return;
                    }
                } catch {
                    showToast('error', 'Tolerations must be a valid JSON array');
                    return;
                }
            }

            const nsMap: Record<string, string> = {};
            nodeSelectorItems.forEach(item => {
                if (item.key.trim()) {
                    nsMap[item.key.trim()] = item.value;
                }
            });

            await saveServerSetting('nodeSelector', {
                nodeSelector: nsMap,
                affinity: affinityObj,
                tolerations: tolerationsArr
            });
            showToast('success', 'Cluster scheduling configuration saved successfully!');
        } catch (err: any) {
            showToast('error', `Failed to save scheduling configuration: ${err.message || err}`);
        }
    };

    const handleSaveAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const isHS256 = jwtAlgorithms.includes('HS256');
            if (apiAuthEnabled && isHS256) {
                if (hs256Secret === '******') {
                    showToast('error', 'You must re-enter the real JWT Secret when saving!');
                    return;
                }
                if (!hs256Secret.trim()) {
                    showToast('error', 'JWT Secret key cannot be empty!');
                    return;
                }
            }

            let publicKeysArr = [];
            if (rs256PublicKeys.trim()) {
                try {
                    publicKeysArr = JSON.parse(rs256PublicKeys);
                    if (!Array.isArray(publicKeysArr)) {
                        showToast('error', 'PublicKeys must be a valid JSON array');
                        return;
                    }
                } catch {
                    showToast('error', 'PublicKeys must be a valid JSON array');
                    return;
                }
            }

            let routesArr = [];
            if (authRoutes.trim()) {
                try {
                    routesArr = JSON.parse(authRoutes);
                    if (!Array.isArray(routesArr)) {
                        showToast('error', 'Authorization Routes must be a valid JSON array');
                        return;
                    }
                } catch {
                    showToast('error', 'Authorization Routes must be a valid JSON array');
                    return;
                }
            }

            let rbacArr = [];
            if (rbacPolicies.trim()) {
                try {
                    rbacArr = JSON.parse(rbacPolicies);
                    if (!Array.isArray(rbacArr)) {
                        showToast('error', 'RBAC Policies must be a valid JSON array');
                        return;
                    }
                } catch {
                    showToast('error', 'RBAC Policies must be a valid JSON array');
                    return;
                }
            }

            // Save apiAuth
            await saveServerSetting('apiAuth', {
                enabled: apiAuthEnabled,
                jwt: {
                    algorithms: jwtAlgorithms,
                    hs256: isHS256 ? { secret: hs256Secret } : undefined,
                    rs256: jwtAlgorithms.includes('RS256') ? { publicKeys: publicKeysArr } : undefined
                },
                authorization: {
                    defaultEffect: authDefaultEffect,
                    routes: routesArr
                }
            });

            // Save rbacPolicies
            await saveServerSetting('rbacPolicies', rbacArr);

            showToast('success', 'Access control authentication policies saved successfully!');
        } catch (err: any) {
            showToast('error', `Failed to save configuration: ${err.message || err}`);
        }
    };

    const handleSaveSecurity = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const patterns = hostPatterns.map(p => p.value.trim()).filter(Boolean);
            const cidrList = cidrs.map(c => c.value.trim()).filter(Boolean);

            await saveServerSetting('urlSecurityPolicy', {
                allowPrivateByDefault,
                allowedHostPatterns: patterns,
                allowedCIDRs: cidrList
            });
            showToast('success', 'Security policy saved successfully!');
        } catch (err: any) {
            showToast('error', `Failed to save outbound security configuration: ${err.message || err}`);
        }
    };

    const handleSaveMonitoring = async (e: React.FormEvent) => {
        e.preventDefault();
        if (windowSeconds <= 0 || threshold <= 0) {
            showToast('error', 'Monitoring window seconds and restart threshold must be greater than 0');
            return;
        }
        try {
            await saveServerSetting('podRestartMonitor', {
                enabled: monitorEnabled,
                windowSeconds: Number(windowSeconds),
                threshold: Number(threshold)
            });
            showToast('success', 'Runtime container restart monitoring configuration saved!');
        } catch (err: any) {
            showToast('error', `Failed to save runtime monitoring configuration: ${err.message || err}`);
        }
    };

    const handleSaveCloud = async (e: React.FormEvent) => {
        e.preventDefault();
        const providerName = CLOUD_PROVIDERS.find(p => p.id === selectedCloud)?.name || selectedCloud;

        // Check secret validation & construct flat config
        let secretValue = '';
        let idValue = '';
        let flatConfig: any = {};

        if (selectedCloud === 'aliyun') {
            const aliyun = cloudConfigs.aliyun;
            secretValue = aliyun.credentials.accessKeySecret;
            idValue = aliyun.credentials.accessKeyId;
            flatConfig = {
                accessKeyId: aliyun.credentials.accessKeyId,
                accessKeySecret: aliyun.credentials.accessKeySecret,
                endpoint: aliyun.storage.endpoint,
                regionId: aliyun.network.regionId,
                zoneId: aliyun.network.zoneId,
                vpcId: aliyun.network.vpcId,
                vswId: aliyun.network.vswId,
            };
        } else if (selectedCloud === 'tencent') {
            const tencent = cloudConfigs.tencent;
            secretValue = tencent.credentials.secretKey;
            idValue = tencent.credentials.secretId;
            flatConfig = {
                secretId: tencent.credentials.secretId,
                secretKey: tencent.credentials.secretKey,
                endpoint: tencent.storage.endpoint,
                region: tencent.network.region,
                zone: tencent.network.zone,
                vpcId: tencent.network.vpcId,
                subnetId: tencent.network.subnetId,
            };
        } else if (selectedCloud === 'huawei') {
            const huawei = cloudConfigs.huawei;
            secretValue = huawei.credentials.secretAccessKey;
            idValue = huawei.credentials.accessKeyId;
            flatConfig = {
                accessKeyId: huawei.credentials.accessKeyId,
                secretAccessKey: huawei.credentials.secretAccessKey,
                endpoint: huawei.storage.endpoint,
                region: huawei.network.region,
                zone: huawei.network.zone,
                vpcId: huawei.network.vpcId,
                subnetId: huawei.network.subnetId,
            };
        } else if (selectedCloud === 'aws') {
            const aws = cloudConfigs.aws;
            secretValue = aws.credentials.secretKey;
            idValue = aws.credentials.accessKeyId;
            flatConfig = {
                accessKeyId: aws.credentials.accessKeyId,
                secretKey: aws.credentials.secretKey,
                endpoint: aws.storage.endpoint,
                region: aws.network.region,
                zone: aws.network.zone,
                vpcId: aws.network.vpcId,
                subnetId: aws.network.subnetId,
            };
        } else if (selectedCloud === 'azure') {
            const azure = cloudConfigs.azure;
            secretValue = azure.credentials.storageAccountKey;
            idValue = azure.credentials.storageAccountName;
            flatConfig = {
                storageAccountName: azure.credentials.storageAccountName,
                storageAccountKey: azure.credentials.storageAccountKey,
                endpoint: azure.storage.endpoint,
                region: azure.network.region,
                resourceGroup: azure.network.resourceGroup,
                virtualNetwork: azure.network.virtualNetwork,
                subnetName: azure.network.subnetName,
            };
        } else if (selectedCloud === 'gcp') {
            const gcp = cloudConfigs.gcp;
            secretValue = gcp.credentials.privateKey;
            idValue = gcp.credentials.clientEmail;
            flatConfig = {
                clientEmail: gcp.credentials.clientEmail,
                privateKey: gcp.credentials.privateKey,
                endpoint: gcp.storage.endpoint,
                region: gcp.network.region,
                vpcNetwork: gcp.network.vpcNetwork,
                subnetwork: gcp.network.subnetwork,
            };
        }

        if (secretValue === '******') {
            showToast('error', `You must re-enter the real secret key for ${providerName} when saving!`);
            return;
        }

        if (!idValue.trim() || !secretValue.trim()) {
            showToast('error', 'Key ID/Email and Secret/Key cannot be empty');
            return;
        }

        try {
            const keyMap = {
                aliyun: 'aliyunCloud',
                tencent: 'tencentCloud',
                huawei: 'huaweiCloud',
                aws: 'awsCloud',
                azure: 'azureCloud',
                gcp: 'gcpCloud',
            };
            const settingKey = keyMap[selectedCloud];
            await saveServerSetting(settingKey, flatConfig);
            showToast('success', `${providerName} connection verification passed and saved successfully!`);
        } catch (err: any) {
            showToast('error', `Failed to save, ${providerName} read-only validation failed: ${err.message || err}`);
        }
    };

    const handleSaveOAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (oauthEnabled) {
            if (oauthClientSecret === '******') {
                showToast('error', 'You must re-enter Google ClientSecret when enabling third-party OAuth login!');
                return;
            }
            if (!oauthClientId.trim() || !oauthClientSecret.trim() || !oauthRedirectURI.trim()) {
                showToast('error', 'OAuth Client ID, Client Secret, and Redirect URI cannot be empty!');
                return;
            }
        }
        try {
            const scopeList = oauthScopes.split(',').map(s => s.trim()).filter(Boolean);
            const roleList = defaultRoles.split(',').map(r => r.trim()).filter(Boolean);

            await saveServerSetting('oauthAuth', {
                enabled: oauthEnabled,
                providers: {
                    google: {
                        clientId: oauthClientId,
                        clientSecret: oauthClientSecret,
                        redirectURI: oauthRedirectURI,
                        scopes: scopeList
                    }
                },
                jwtIssue: {
                    issuer: jwtIssueIssuer,
                    audience: jwtIssueAudience,
                    ttlSeconds: Number(jwtIssueTtlSeconds)
                },
                roleMapping: {
                    defaultRoles: roleList
                },
                security: {
                    stateTTLSeconds: Number(stateTTLSeconds)
                }
            });
            showToast('success', 'OAuth authentication configuration recorded successfully!');
        } catch (err: any) {
            showToast('error', `Failed to save OAuth configuration: ${err.message || err}`);
        }
    };

    const handleAlgCheckbox = (alg: string, checked: boolean) => {
        if (checked) {
            setJwtAlgorithms(prev => prev.includes(alg) ? prev : [...prev, alg]);
        } else {
            setJwtAlgorithms(prev => prev.filter(x => x !== alg));
        }
    };

    const tabs = [
        { id: 'scheduling', label: 'Cluster Scheduling', description: 'Configure node affinity labels and scheduling selectors', icon: Cpu },
        { id: 'access', label: 'Access Control', description: 'Configure JWT authentication mechanism and RBAC policy rules', icon: Sliders },
        { id: 'security', label: 'Security Policy', description: 'Configure private network URL outbound interception and firewall policies', icon: Shield },
        { id: 'monitoring', label: 'Runtime Monitoring', description: 'Configure time window and threshold for Pod restart anomalies', icon: Activity },
        { id: 'cloud', label: 'Cloud Provider', description: 'Integrate multi-cloud AK/SK and storage connection checks', icon: Cloud },
        { id: 'oauth', label: 'Third-Party OAuth', description: 'Configure Google authorization and local role mapping relationship', icon: Key },
    ] as const;

    if (isLoading && Object.keys(serverSettings).length === 0) {
        return (
            <div className="flex-1 bg-white flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    <span className="text-xs text-text-secondary font-medium">Fetching system settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full flex flex-col">
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
            <div className="flex-1 bg-white flex overflow-hidden h-full">
                {/* Tabs Sidebar */}
                <div className="w-64 border-r border-gray-100 bg-[#F9FAFB] p-4 flex flex-col gap-1 overflow-y-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer border-none bg-transparent ${isActive
                                    ? 'bg-white shadow-sm border border-gray-200/50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100/70'
                                    }`}
                            >
                                <Icon size={18} className={`flex-shrink-0 mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold">{tab.label}</div>
                                    <div className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{tab.description}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Form Content Scroll Container */}
                <div className="flex-1 p-8 overflow-y-auto h-full flex flex-col justify-between">
                    <div className="max-w-2xl w-full">


                        {/* 2. Scheduling Settings Form */}
                        {activeTab === 'scheduling' && (
                            <form onSubmit={handleSaveScheduling} className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Cluster Scheduling (nodeSelector)</h3>
                                    <p className="text-[11px] text-gray-400 mb-4">Configure system-level nodeSelector, affinity, and tolerations for global container scheduling and distribution.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-[#f9fafb] p-3 rounded-xl border border-gray-100">
                                        <DynamicKeyValueList
                                            title="Global Node Selectors (nodeSelector)"
                                            keyPlaceholder="Label Key"
                                            valuePlaceholder="Label Value"
                                            btnText="Add Node Selector Label"
                                            initialItems={nodeSelectorItems}
                                            onItemsChange={setNodeSelectorItems}
                                            showEmptyState={false}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                            Affinity (Node and Pod Affinity - JSON)
                                        </label>
                                        <textarea
                                            value={affinity}
                                            onChange={(e) => setAffinity(e.target.value)}
                                            rows={6}
                                            placeholder="{}"
                                            className="w-full font-mono bg-[#f9fafb] border border-components-panel-border rounded-lg p-3 text-[12px] leading-relaxed transition-all input-gradient-focus bg-components-badge-bg-dimm focus-visible:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                            Tolerations (Pod Tolerations - JSON Array)
                                        </label>
                                        <textarea
                                            value={tolerations}
                                            onChange={(e) => setTolerations(e.target.value)}
                                            rows={6}
                                            placeholder="[]"
                                            className="w-full font-mono bg-[#f9fafb] border border-components-panel-border rounded-lg p-3 text-[12px] leading-relaxed transition-all input-gradient-focus bg-components-badge-bg-dimm focus-visible:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                                    <Button type="submit" loading={isLoading}>
                                        Save Scheduling Configuration
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* 3. Access Control Settings Form */}
                        {activeTab === 'access' && (
                            <form onSubmit={handleSaveAccess} className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Access Control (apiAuth & RBAC)</h3>
                                    <p className="text-[11px] text-gray-400 mb-4">Enable API JWT validation/authentication and configure bypass rules for specific routes, and manage RBAC policies.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <div className="text-xs font-medium text-gray-800">Enable API JWT Authentication</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">When enabled, API requests must include a valid Bearer Token.</div>
                                        </div>
                                        <Switch
                                            checked={apiAuthEnabled}
                                            onChange={setApiAuthEnabled}
                                        />
                                    </div>

                                    {apiAuthEnabled && (
                                        <div className="space-y-4 border-l-2 border-blue-500 pl-4 py-1 animate-fade-in">
                                            <FieldCollapse title="JWT Signature Algorithms" defaultOpen={true}>
                                                <div className="space-y-3">
                                                    <div className="flex gap-6 text-xs">
                                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={jwtAlgorithms.includes('HS256')}
                                                                onChange={(e) => handleAlgCheckbox('HS256', e.target.checked)}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span>HS256 (Symmetric)</span>
                                                        </label>
                                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={jwtAlgorithms.includes('RS256')}
                                                                onChange={(e) => handleAlgCheckbox('RS256', e.target.checked)}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span>RS256 (Asymmetric)</span>
                                                        </label>
                                                    </div>

                                                    {jwtAlgorithms.includes('HS256') && (
                                                        <div className="mt-3">
                                                            <label className="block text-[11px] font-medium text-gray-600 mb-1 flex items-center gap-1">
                                                                HS256 Shared Secret
                                                                <span className="text-[10px] text-orange-500 font-normal flex items-center gap-0.5">
                                                                    <AlertCircle size={10} /> Contains sensitive data, please enter the actual secret when modifying
                                                                </span>
                                                            </label>
                                                            <Input
                                                                type="password"
                                                                value={hs256Secret}
                                                                onChange={(e) => setHs256Secret(e.target.value)}
                                                                placeholder="Enter actual secret key"
                                                            />
                                                        </div>
                                                    )}

                                                    {jwtAlgorithms.includes('RS256') && (
                                                        <div className="mt-3">
                                                            <label className="block text-[11px] font-medium text-gray-600 mb-1">
                                                                RS256 Public Keys (KID & PEM format - JSON Array)
                                                            </label>
                                                            <textarea
                                                                value={rs256PublicKeys}
                                                                onChange={(e) => setRs256PublicKeys(e.target.value)}
                                                                rows={4}
                                                                className="w-full font-mono bg-[#f9fafb] border border-components-panel-border rounded-lg p-2.5 text-[11px] leading-relaxed transition-all input-gradient-focus bg-components-badge-bg-dimm focus-visible:outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </FieldCollapse>

                                            <FieldCollapse title="Access Control List (Authorization)" defaultOpen={true}>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-[11px] font-medium text-gray-600 mb-1.5">
                                                            Default Effect
                                                        </label>
                                                        <select
                                                            value={authDefaultEffect}
                                                            onChange={(e) => setAuthDefaultEffect(e.target.value)}
                                                            className="flex h-9 w-full rounded-md border border-components-panel-border bg-[#F9FAFB] px-3 py-1 text-[15px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-state-accent-solid text-xs text-gray-800"
                                                        >
                                                            <option value="deny">Deny (Block by default)</option>
                                                            <option value="allow">Allow (Pass by default)</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                                                            Authorized Bypass Routes (Routes - JSON Array)
                                                        </label>
                                                        <textarea
                                                            value={authRoutes}
                                                            onChange={(e) => setAuthRoutes(e.target.value)}
                                                            rows={5}
                                                            className="w-full font-mono bg-[#f9fafb] border border-components-panel-border rounded-lg p-2.5 text-[11px] leading-relaxed transition-all input-gradient-focus bg-components-badge-bg-dimm focus-visible:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </FieldCollapse>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                            System RBAC Policies (rbacPolicies - JSON Array)
                                        </label>
                                        <textarea
                                            value={rbacPolicies}
                                            onChange={(e) => setRbacPolicies(e.target.value)}
                                            rows={6}
                                            className="w-full font-mono bg-[#f9fafb] border border-components-panel-border rounded-lg p-3 text-[12px] leading-relaxed transition-all input-gradient-focus bg-components-badge-bg-dimm focus-visible:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                                    <Button type="submit" loading={isLoading}>
                                        Save Authentication Policy
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* 4. Security Policy Settings Form */}
                        {activeTab === 'security' && (
                            <form onSubmit={handleSaveSecurity} className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Outbound URL Security Policy (urlSecurityPolicy)</h3>
                                    <p className="text-[11px] text-gray-400 mb-4">Restrict outbound URL private access requests to isolate and secure sensitive internal services.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <div className="text-xs font-medium text-gray-800">Allow Private Requests by Default</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">When enabled, the system automatically allows all outbound HTTP requests to private CIDRs.</div>
                                        </div>
                                        <Switch
                                            checked={allowPrivateByDefault}
                                            onChange={setAllowPrivateByDefault}
                                        />
                                    </div>

                                    <div className="bg-[#f9fafb] p-3 rounded-xl border border-gray-100">
                                        <DynamicInputList
                                            title="Allowed Host Patterns"
                                            placeholder="Enter allowed host pattern, e.g. *.svc.cluster.local"
                                            btnText="Add Host Pattern"
                                            initialItems={hostPatterns}
                                            onItemsChange={setHostPatterns}
                                            showEmptyState={false}
                                        />
                                    </div>

                                    <div className="bg-[#f9fafb] p-3 rounded-xl border border-gray-100">
                                        <DynamicInputList
                                            title="Allowed CIDR Blocks"
                                            placeholder="Enter allowed CIDR block, e.g. 10.0.0.0/8"
                                            btnText="Add CIDR Block"
                                            initialItems={cidrs}
                                            onItemsChange={setCidrs}
                                            showEmptyState={false}
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                                    <Button type="submit" loading={isLoading}>
                                        Save Outbound Security Policy
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* 5. Runtime Monitoring Settings Form */}
                        {activeTab === 'monitoring' && (
                            <form onSubmit={handleSaveMonitoring} className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Container Runtime Restart Monitoring</h3>
                                    <p className="text-[11px] text-gray-400 mb-4">Monitor restart counts of faulty Pods in the cluster. If restarts exceed the threshold within the window, an alert will be triggered.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <div className="text-xs font-medium text-gray-800">Enable Restart Monitoring Alert</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">When enabled, the monitoring process runs and triggers alerts when the threshold is reached.</div>
                                        </div>
                                        <Switch
                                            checked={monitorEnabled}
                                            onChange={setMonitorEnabled}
                                        />
                                    </div>

                                    {monitorEnabled && (
                                        <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Time Window (seconds)</label>
                                                <Input
                                                    type="number"
                                                    value={windowSeconds}
                                                    onChange={(e) => setWindowSeconds(Number(e.target.value))}
                                                    placeholder="1800"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Restart Threshold (count)</label>
                                                <Input
                                                    type="number"
                                                    value={threshold}
                                                    onChange={(e) => setThreshold(Number(e.target.value))}
                                                    placeholder="3"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                                    <Button type="submit" loading={isLoading}>
                                        Save Monitoring Configuration
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* 6. Cloud Provider Settings Form */}
                        {activeTab === 'cloud' && (
                            <form onSubmit={handleSaveCloud} className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Cloud Storage Provider Settings</h3>
                                    <p className="text-[11px] text-gray-400 mb-4">
                                        Select and configure a cloud provider. Built-in mock credentials are provided by default for ease of testing.
                                    </p>
                                </div>

                                {/* Cloud Provider Card Selector */}
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {CLOUD_PROVIDERS.map((provider) => {
                                        const isSelected = selectedCloud === provider.id;
                                        return (
                                            <button
                                                key={provider.id}
                                                type="button"
                                                onClick={() => setSelectedCloud(provider.id)}
                                                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500/30'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white'
                                                }`}
                                            >
                                                <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                                                    <span>{provider.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-normal">({provider.label})</span>
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-1">{provider.desc}</div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    {/* 6.1 Alibaba Cloud Form */}
                                    {/* 6.1 Alibaba Cloud Form */}
                                    {selectedCloud === 'aliyun' && (
                                        <div className="space-y-6 animate-fade-in">
                                            {/* Access Credentials */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Key size={13.5} className="text-blue-500" />
                                                    访问凭证 (Access Credentials)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">AccessKey ID</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.aliyun.credentials.accessKeyId}
                                                        onChange={(e) => updateCloudConfigField('aliyun', 'credentials', 'accessKeyId', e.target.value)}
                                                        placeholder="LTAIxxxxxxxx"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                                        AccessKey Secret
                                                        <span className="text-[10px] text-orange-500 font-normal flex items-center gap-0.5">
                                                            <AlertCircle size={10} /> 包含敏感数据，修改时请重新输入真实 Secret
                                                        </span>
                                                    </label>
                                                    <Input
                                                        type="password"
                                                        value={cloudConfigs.aliyun.credentials.accessKeySecret}
                                                        onChange={(e) => updateCloudConfigField('aliyun', 'credentials', 'accessKeySecret', e.target.value)}
                                                        placeholder="Enter actual secret key"
                                                    />
                                                </div>
                                            </div>

                                            {/* Network Settings */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Sliders size={13.5} className="text-purple-500" />
                                                    网络配置 (Network Configurations)
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Region ID</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.aliyun.network.regionId}
                                                            onChange={(e) => updateCloudConfigField('aliyun', 'network', 'regionId', e.target.value)}
                                                            placeholder="cn-hangzhou"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Zone ID</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.aliyun.network.zoneId}
                                                            onChange={(e) => updateCloudConfigField('aliyun', 'network', 'zoneId', e.target.value)}
                                                            placeholder="cn-hangzhou-i"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">VPC ID</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.aliyun.network.vpcId}
                                                            onChange={(e) => updateCloudConfigField('aliyun', 'network', 'vpcId', e.target.value)}
                                                            placeholder="vpc-xxxxxx"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">VSwitch ID</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.aliyun.network.vswId}
                                                            onChange={(e) => updateCloudConfigField('aliyun', 'network', 'vswId', e.target.value)}
                                                            placeholder="vsw-xxxxxx"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Storage Settings */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Cloud size={13.5} className="text-green-500" />
                                                    存储配置 (Storage Settings)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">NAS Endpoint</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.aliyun.storage.endpoint}
                                                        onChange={(e) => updateCloudConfigField('aliyun', 'storage', 'endpoint', e.target.value)}
                                                        placeholder="nas.cn-hangzhou.aliyuncs.com"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 6.2 Tencent Cloud Form */}
                                    {selectedCloud === 'tencent' && (
                                        <div className="space-y-6 animate-fade-in">
                                            {/* Access Credentials */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Key size={13.5} className="text-blue-500" />
                                                    访问凭证 (Access Credentials)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Secret ID</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.tencent.credentials.secretId}
                                                        onChange={(e) => updateCloudConfigField('tencent', 'credentials', 'secretId', e.target.value)}
                                                        placeholder="AKIDxxxxxxxx"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                                        Secret Key
                                                        <span className="text-[10px] text-orange-500 font-normal flex items-center gap-0.5">
                                                            <AlertCircle size={10} /> 包含敏感数据，修改时请重新输入真实 Secret
                                                        </span>
                                                    </label>
                                                    <Input
                                                        type="password"
                                                        value={cloudConfigs.tencent.credentials.secretKey}
                                                        onChange={(e) => updateCloudConfigField('tencent', 'credentials', 'secretKey', e.target.value)}
                                                        placeholder="Enter actual secret key"
                                                    />
                                                </div>
                                            </div>

                                            {/* Network Settings */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Sliders size={13.5} className="text-purple-500" />
                                                    网络配置 (Network Configurations)
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Region</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.tencent.network.region}
                                                            onChange={(e) => updateCloudConfigField('tencent', 'network', 'region', e.target.value)}
                                                            placeholder="ap-guangzhou"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Zone</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.tencent.network.zone}
                                                            onChange={(e) => updateCloudConfigField('tencent', 'network', 'zone', e.target.value)}
                                                            placeholder="ap-guangzhou-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">VPC ID</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.tencent.network.vpcId}
                                                            onChange={(e) => updateCloudConfigField('tencent', 'network', 'vpcId', e.target.value)}
                                                            placeholder="vpc-xxxxxx"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Subnet ID</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.tencent.network.subnetId}
                                                            onChange={(e) => updateCloudConfigField('tencent', 'network', 'subnetId', e.target.value)}
                                                            placeholder="subnet-xxxxxx"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Storage Settings */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Cloud size={13.5} className="text-green-500" />
                                                    存储配置 (Storage Settings)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">COS/NAS Endpoint</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.tencent.storage.endpoint}
                                                        onChange={(e) => updateCloudConfigField('tencent', 'storage', 'endpoint', e.target.value)}
                                                        placeholder="cos.ap-guangzhou.myqcloud.com"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 6.3 Huawei Cloud Form */}
                                    {selectedCloud === 'huawei' && (
                                        <div className="space-y-6 animate-fade-in">
                                            {/* Access Credentials */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Key size={13.5} className="text-blue-500" />
                                                    访问凭证 (Access Credentials)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">AccessKey ID</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.huawei.credentials.accessKeyId}
                                                        onChange={(e) => updateCloudConfigField('huawei', 'credentials', 'accessKeyId', e.target.value)}
                                                        placeholder="AKxxxxxxxx"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                                        Secret Access Key
                                                        <span className="text-[10px] text-orange-500 font-normal flex items-center gap-0.5">
                                                            <AlertCircle size={10} /> 包含敏感数据，修改时请重新输入真实 Secret
                                                        </span>
                                                    </label>
                                                    <Input
                                                        type="password"
                                                        value={cloudConfigs.huawei.credentials.secretAccessKey}
                                                        onChange={(e) => updateCloudConfigField('huawei', 'credentials', 'secretAccessKey', e.target.value)}
                                                        placeholder="Enter actual secret key"
                                                    />
                                                </div>
                                            </div>

                                            {/* Network Settings */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Sliders size={13.5} className="text-purple-500" />
                                                    网络配置 (Network Configurations)
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Region</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.huawei.network.region}
                                                            onChange={(e) => updateCloudConfigField('huawei', 'network', 'region', e.target.value)}
                                                            placeholder="cn-north-4"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Zone</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.huawei.network.zone}
                                                            onChange={(e) => updateCloudConfigField('huawei', 'network', 'zone', e.target.value)}
                                                            placeholder="cn-north-4a"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">VPC ID</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.huawei.network.vpcId}
                                                            onChange={(e) => updateCloudConfigField('huawei', 'network', 'vpcId', e.target.value)}
                                                            placeholder="vpc-xxxxxx"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Subnet ID</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.huawei.network.subnetId}
                                                            onChange={(e) => updateCloudConfigField('huawei', 'network', 'subnetId', e.target.value)}
                                                            placeholder="subnet-xxxxxx"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Storage Settings */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Cloud size={13.5} className="text-green-500" />
                                                    存储配置 (Storage Settings)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">SFS Endpoint</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.huawei.storage.endpoint}
                                                        onChange={(e) => updateCloudConfigField('huawei', 'storage', 'endpoint', e.target.value)}
                                                        placeholder="sfs.cn-north-4.myhuaweicloud.com"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 6.4 AWS Form */}
                                    {selectedCloud === 'aws' && (
                                        <div className="space-y-6 animate-fade-in">
                                            {/* Access Credentials */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Key size={13.5} className="text-blue-500" />
                                                    访问凭证 (Access Credentials)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Access Key ID</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.aws.credentials.accessKeyId}
                                                        onChange={(e) => updateCloudConfigField('aws', 'credentials', 'accessKeyId', e.target.value)}
                                                        placeholder="AKIAxxxxxxxxx"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                                        Secret Access Key
                                                        <span className="text-[10px] text-orange-500 font-normal flex items-center gap-0.5">
                                                            <AlertCircle size={10} /> 包含敏感数据，修改时请重新输入真实 Secret
                                                        </span>
                                                    </label>
                                                    <Input
                                                        type="password"
                                                        value={cloudConfigs.aws.credentials.secretKey}
                                                        onChange={(e) => updateCloudConfigField('aws', 'credentials', 'secretKey', e.target.value)}
                                                        placeholder="Enter actual secret key"
                                                    />
                                                </div>
                                            </div>

                                            {/* Network Settings */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Sliders size={13.5} className="text-purple-500" />
                                                    网络配置 (Network Configurations)
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Region</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.aws.network.region}
                                                            onChange={(e) => updateCloudConfigField('aws', 'network', 'region', e.target.value)}
                                                            placeholder="us-east-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Availability Zone</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.aws.network.zone}
                                                            onChange={(e) => updateCloudConfigField('aws', 'network', 'zone', e.target.value)}
                                                            placeholder="us-east-1a"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">VPC ID</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.aws.network.vpcId}
                                                            onChange={(e) => updateCloudConfigField('aws', 'network', 'vpcId', e.target.value)}
                                                            placeholder="vpc-xxxxxx"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Subnet ID</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.aws.network.subnetId}
                                                            onChange={(e) => updateCloudConfigField('aws', 'network', 'subnetId', e.target.value)}
                                                            placeholder="subnet-xxxxxx"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Storage Settings */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Cloud size={13.5} className="text-green-500" />
                                                    存储配置 (Storage Settings)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">EFS/S3 Endpoint</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.aws.storage.endpoint}
                                                        onChange={(e) => updateCloudConfigField('aws', 'storage', 'endpoint', e.target.value)}
                                                        placeholder="efs.us-east-1.amazonaws.com"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 6.5 Microsoft Azure Form */}
                                    {selectedCloud === 'azure' && (
                                        <div className="space-y-6 animate-fade-in">
                                            {/* Access Credentials */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Key size={13.5} className="text-blue-500" />
                                                    访问凭证 (Access Credentials)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Storage Account Name</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.azure.credentials.storageAccountName}
                                                        onChange={(e) => updateCloudConfigField('azure', 'credentials', 'storageAccountName', e.target.value)}
                                                        placeholder="e.g. mystorageaccount"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                                        Storage Account Key
                                                        <span className="text-[10px] text-orange-500 font-normal flex items-center gap-0.5">
                                                            <AlertCircle size={10} /> 包含敏感数据，修改时请重新输入真实 Key
                                                        </span>
                                                    </label>
                                                    <Input
                                                        type="password"
                                                        value={cloudConfigs.azure.credentials.storageAccountKey}
                                                        onChange={(e) => updateCloudConfigField('azure', 'credentials', 'storageAccountKey', e.target.value)}
                                                        placeholder="Enter storage account key"
                                                    />
                                                </div>
                                            </div>

                                            {/* Network Settings */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Sliders size={13.5} className="text-purple-500" />
                                                    网络配置 (Network Configurations)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Region / Location</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.azure.network.region}
                                                        onChange={(e) => updateCloudConfigField('azure', 'network', 'region', e.target.value)}
                                                        placeholder="eastus"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Resource Group</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.azure.network.resourceGroup}
                                                            onChange={(e) => updateCloudConfigField('azure', 'network', 'resourceGroup', e.target.value)}
                                                            placeholder="rg-xxxxxx"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Virtual Network</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.azure.network.virtualNetwork}
                                                            onChange={(e) => updateCloudConfigField('azure', 'network', 'virtualNetwork', e.target.value)}
                                                            placeholder="vnet-xxxxxx"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Subnet Name</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.azure.network.subnetName}
                                                            onChange={(e) => updateCloudConfigField('azure', 'network', 'subnetName', e.target.value)}
                                                            placeholder="subnet-xxxxxx"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Storage Settings */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Cloud size={13.5} className="text-green-500" />
                                                    存储配置 (Storage Settings)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">File Share Endpoint</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.azure.storage.endpoint}
                                                        onChange={(e) => updateCloudConfigField('azure', 'storage', 'endpoint', e.target.value)}
                                                        placeholder="e.g. mystorageaccount.file.core.windows.net"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 6.6 Google Cloud Platform Form */}
                                    {selectedCloud === 'gcp' && (
                                        <div className="space-y-6 animate-fade-in">
                                            {/* Access Credentials */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Key size={13.5} className="text-blue-500" />
                                                    访问凭证 (Access Credentials)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Service Account Client Email</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.gcp.credentials.clientEmail}
                                                        onChange={(e) => updateCloudConfigField('gcp', 'credentials', 'clientEmail', e.target.value)}
                                                        placeholder="sa-name@project-id.iam.gserviceaccount.com"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                                        Private Key
                                                        <span className="text-[10px] text-orange-500 font-normal flex items-center gap-0.5">
                                                            <AlertCircle size={10} /> 包含敏感数据，修改时请重新输入真实 Private Key
                                                        </span>
                                                    </label>
                                                    <textarea
                                                        value={cloudConfigs.gcp.credentials.privateKey}
                                                        onChange={(e) => updateCloudConfigField('gcp', 'credentials', 'privateKey', e.target.value)}
                                                        rows={4}
                                                        placeholder="-----BEGIN PRIVATE KEY-----\n..."
                                                        className="w-full font-mono bg-[#f9fafb] border border-gray-200 rounded-lg p-3 text-[12px] leading-relaxed transition-all focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                                                    />
                                                </div>
                                            </div>

                                            {/* Network Settings */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Sliders size={13.5} className="text-purple-500" />
                                                    网络配置 (Network Configurations)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Region / Zone</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.gcp.network.region}
                                                        onChange={(e) => updateCloudConfigField('gcp', 'network', 'region', e.target.value)}
                                                        placeholder="us-central1-a"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">VPC Network</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.gcp.network.vpcNetwork}
                                                            onChange={(e) => updateCloudConfigField('gcp', 'network', 'vpcNetwork', e.target.value)}
                                                            placeholder="default"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Subnetwork</label>
                                                        <Input
                                                            type="text"
                                                            value={cloudConfigs.gcp.network.subnetwork}
                                                            onChange={(e) => updateCloudConfigField('gcp', 'network', 'subnetwork', e.target.value)}
                                                            placeholder="default"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Storage Settings */}
                                            <div className="bg-gray-50/45 border border-gray-100 rounded-xl p-4.5 space-y-4">
                                                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <Cloud size={13.5} className="text-green-500" />
                                                    存储配置 (Storage Settings)
                                                </h4>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Filestore IP / Endpoint</label>
                                                    <Input
                                                        type="text"
                                                        value={cloudConfigs.gcp.storage.endpoint}
                                                        onChange={(e) => updateCloudConfigField('gcp', 'storage', 'endpoint', e.target.value)}
                                                        placeholder="e.g. 10.10.10.10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                                    <Button type="submit" loading={isLoading}>
                                        Test Connectivity and Save
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* 7. OAuth Settings Form */}
                        {activeTab === 'oauth' && (
                            <form onSubmit={handleSaveOAuth} className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-900 mb-1">Third-Party OAuth Authentication (oauthAuth)</h3>
                                    <p className="text-[11px] text-gray-400 mb-4">
                                        Configure Google OAuth integration to fetch external identities, set session JWT TTL, and define role mapping rules.
                                        <span className="text-red-500 font-semibold block mt-1">Note: The backend routes for OAuth are not registered yet; this panel only supports configuration storage.</span>
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <div className="text-xs font-medium text-gray-800">Enable Google OAuth Login</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">When enabled, users can log in using their Google accounts.</div>
                                        </div>
                                        <Switch
                                            checked={oauthEnabled}
                                            onChange={setOauthEnabled}
                                        />
                                    </div>

                                    {oauthEnabled && (
                                        <div className="space-y-4 border-l-2 border-indigo-500 pl-4 py-1 animate-fade-in">
                                            <FieldCollapse title="Google Credentials" defaultOpen={true}>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Client ID</label>
                                                        <Input
                                                            type="text"
                                                            value={oauthClientId}
                                                            onChange={(e) => setOauthClientId(e.target.value)}
                                                            placeholder="xxxx.apps.googleusercontent.com"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-medium text-gray-600 mb-1 flex items-center gap-1">
                                                            Client Secret
                                                            <span className="text-[10px] text-orange-500 font-normal flex items-center gap-0.5">
                                                                <AlertCircle size={10} /> Contains sensitive data, please enter the actual secret when modifying
                                                            </span>
                                                        </label>
                                                        <Input
                                                            type="password"
                                                            value={oauthClientSecret}
                                                            onChange={(e) => setOauthClientSecret(e.target.value)}
                                                            placeholder="Enter actual secret key"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Google Redirect URI</label>
                                                        <Input
                                                            type="text"
                                                            value={oauthRedirectURI}
                                                            onChange={(e) => setOauthRedirectURI(e.target.value)}
                                                            placeholder="https://console.example.com/api/v1/auth/oauth2/google/callback"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Scopes (comma-separated)</label>
                                                        <Input
                                                            type="text"
                                                            value={oauthScopes}
                                                            onChange={(e) => setOauthScopes(e.target.value)}
                                                            placeholder="openid, email, profile"
                                                        />
                                                    </div>
                                                </div>
                                            </FieldCollapse>

                                            <FieldCollapse title="Generated Session JWT Policy" defaultOpen={true}>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="col-span-2">
                                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">JWT Issuer (Issuer)</label>
                                                        <Input
                                                            type="text"
                                                            value={jwtIssueIssuer}
                                                            onChange={(e) => setJwtIssueIssuer(e.target.value)}
                                                            placeholder="eruun"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">JWT Audience (Audience)</label>
                                                        <Input
                                                            type="text"
                                                            value={jwtIssueAudience}
                                                            onChange={(e) => setJwtIssueAudience(e.target.value)}
                                                            placeholder="eruun-api"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">JWT TTL (seconds)</label>
                                                        <Input
                                                            type="number"
                                                            value={jwtIssueTtlSeconds}
                                                            onChange={(e) => setJwtIssueTtlSeconds(Number(e.target.value))}
                                                            placeholder="3600"
                                                        />
                                                    </div>
                                                </div>
                                            </FieldCollapse>

                                            <FieldCollapse title="Role Mapping Relationships" defaultOpen={true}>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Default Roles after Google Sign-in (comma-separated)</label>
                                                        <Input
                                                            type="text"
                                                            value={defaultRoles}
                                                            onChange={(e) => setDefaultRoles(e.target.value)}
                                                            placeholder="reader"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">OAuth State TTL (seconds)</label>
                                                        <Input
                                                            type="number"
                                                            value={stateTTLSeconds}
                                                            onChange={(e) => setStateTTLSeconds(Number(e.target.value))}
                                                            placeholder="300"
                                                        />
                                                    </div>
                                                </div>
                                            </FieldCollapse>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                                    <Button type="submit" loading={isLoading}>
                                        Save OAuth Configuration
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
