import React from 'react';
import type { TraitProbe } from '../../types/flow';

interface TraitsProbesManagerProps {
    probes: TraitProbe[];
    onChange: (probes: TraitProbe[]) => void;
}

const TraitsProbesManager: React.FC<TraitsProbesManagerProps> = ({ probes, onChange }) => {
    const getProbe = (type: 'liveness' | 'readiness') => probes.find(p => p.type === type);

    const handleProbeChange = (type: 'liveness' | 'readiness', field: keyof TraitProbe | 'command', value: unknown) => {
        const currentProbe = getProbe(type);
        let newProbes = [...probes];

        if (field === 'command') {
            // Handle command specifically as it's nested in exec
            const newProbe: TraitProbe = currentProbe
                ? { ...currentProbe, exec: { command: value as string[] } }
                : { type, exec: { command: value as string[] } };

            if (currentProbe) {
                newProbes = newProbes.map(p => p.type === type ? newProbe : p);
            } else {
                newProbes.push(newProbe);
            }
        } else {
            // Handle top-level fields
            const newProbe: TraitProbe = currentProbe
                ? { ...currentProbe, [field]: value as TraitProbe[keyof TraitProbe] }
                : { type, [field]: value as TraitProbe[keyof TraitProbe] };

            if (currentProbe) {
                newProbes = newProbes.map(p => p.type === type ? newProbe : p);
            } else {
                newProbes.push(newProbe);
            }
        }
        onChange(newProbes);
    };

    const toggleProbe = (type: 'liveness' | 'readiness', enabled: boolean) => {
        if (enabled) {
            if (!getProbe(type)) {
                onChange([...probes, { type, exec: { command: [] } }]);
            }
        } else {
            onChange(probes.filter(p => p.type !== type));
        }
    };

    const renderProbeForm = (type: 'liveness' | 'readiness') => {
        const probe = getProbe(type);
        const enabled = !!probe;

        return (
            <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{type} Probe</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={enabled}
                            onChange={(e) => toggleProbe(type, e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {enabled && probe && (
                    <div className="p-3 border border-components-panel-border rounded-lg bg-components-badge-bg-dimm space-y-3">
                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Command</label>
                            <textarea
                                value={probe.exec?.command?.join('\n') || ''}
                                onChange={(e) => handleProbeChange(type, 'command', e.target.value.split('\n'))}
                                placeholder="sh\n-c\necho hello"
                                rows={3}
                                className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none resize-vertical"
                            />
                            <p className="text-[10px] text-text-tertiary mt-1">One argument per line</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-text-tertiary mb-1 block">Initial Delay (s)</label>
                                <input
                                    type="number"
                                    value={probe.initialDelaySeconds || ''}
                                    onChange={(e) => handleProbeChange(type, 'initialDelaySeconds', parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-tertiary mb-1 block">Period (s)</label>
                                <input
                                    type="number"
                                    value={probe.periodSeconds || ''}
                                    onChange={(e) => handleProbeChange(type, 'periodSeconds', parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-tertiary mb-1 block">Timeout (s)</label>
                                <input
                                    type="number"
                                    value={probe.timeoutSeconds || ''}
                                    onChange={(e) => handleProbeChange(type, 'timeoutSeconds', parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 text-sm border border-components-panel-border rounded bg-white input-gradient-focus focus:ring-0 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {renderProbeForm('liveness')}
            {renderProbeForm('readiness')}
        </div>
    );
};

export default TraitsProbesManager;
