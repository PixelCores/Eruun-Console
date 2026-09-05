import React, { useState, useRef } from 'react';
import { 
    RotateCcw, 
    Trash2, 
    Plus, 
    Keyboard
} from 'lucide-react';
import { 
    useShortcutsStore, 
    type Shortcut 
} from '../../../stores/shortcutsStore';
import Switch from '../../../components/base/switch';
import Modal from '../../../components/base/Modal';
import { Button } from '../../../components/ui/Button';

// Format combination to Mac/Win styling
const formatShortcutDisplay = (comboStr: string): string => {
    const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform || '');
    const parts = comboStr.toLowerCase().split('+');
    const order = ['ctrl', 'alt', 'shift', 'meta'];
    const modifiers = parts.filter(p => order.includes(p));
    const mainKeys = parts.filter(p => !order.includes(p));
    modifiers.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const sorted = [...modifiers, ...mainKeys];

    if (isMac) {
        return sorted.map(p => {
            if (p === 'meta' || p === 'cmd' || p === 'command') return '⌘';
            if (p === 'ctrl' || p === 'control') return '⌃';
            if (p === 'shift') return '⇧';
            if (p === 'alt' || p === 'option') return '⌥';
            if (p === 'backspace') return '⌫';
            if (p === 'delete') return 'Del';
            if (p === 'escape' || p === 'esc') return 'Esc';
            return p.charAt(0).toUpperCase() + p.slice(1);
        }).join('');
    }
    return sorted.map(p => {
        if (p === 'meta' || p === 'cmd' || p === 'command') return 'Win';
        if (p === 'ctrl' || p === 'control') return 'Ctrl';
        if (p === 'shift') return 'Shift';
        if (p === 'alt' || p === 'option') return 'Alt';
        if (p === 'backspace') return 'Backspace';
        if (p === 'delete') return 'Delete';
        if (p === 'escape' || p === 'esc') return 'Esc';
        return p.charAt(0).toUpperCase() + p.slice(1);
    }).join('+');
};

export const ShortcutsSection: React.FC = () => {
    const { 
        shortcuts, 
        shortcutsEnabled, 
        updateShortcutKeys, 
        resetAllShortcuts, 
        setShortcutsEnabled 
    } = useShortcutsStore();

    const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
    const [tempKeys, setTempKeys] = useState<string[]>([]);
    const recordingAreaRef = useRef<HTMLDivElement>(null);

    const startEditing = (shortcut: Shortcut) => {
        setEditingShortcut(shortcut);
        setTempKeys([...shortcut.keys]);
        setIsRecording(false);
        setRecordedKeys([]);
    };

    const handleRemoveKeyComboInline = (shortcutId: string, indexToRemove: number) => {
        const shortcut = shortcuts.find(s => s.id === shortcutId);
        if (shortcut) {
            updateShortcutKeys(shortcutId, shortcut.keys.filter((_, idx) => idx !== indexToRemove));
        }
    };

    const handleStartRecording = () => {
        setIsRecording(true);
        setRecordedKeys([]);
        setTimeout(() => recordingAreaRef.current?.focus(), 100);
    };

    const handleRecordingKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const key = e.key;
        if (['control', 'shift', 'alt', 'meta'].includes(key.toLowerCase())) return;

        const parts: string[] = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        if (e.metaKey) parts.push('meta');

        let mainKey = key.toLowerCase();
        if (mainKey === ' ') mainKey = 'space';
        if (mainKey === 'escape') mainKey = 'esc';
        parts.push(mainKey);

        setRecordedKeys([parts.join('+')]);
    };

    const handleSaveRecorded = () => {
        if (recordedKeys.length > 0 && !tempKeys.includes(recordedKeys[0])) {
            setTempKeys([...tempKeys, recordedKeys[0]]);
        }
        setIsRecording(false);
        setRecordedKeys([]);
    };

    const handleSaveShortcutConfig = () => {
        if (editingShortcut) {
            updateShortcutKeys(editingShortcut.id, tempKeys);
            setEditingShortcut(null);
        }
    };

    // Group shortcuts by category
    const globalShortcuts = shortcuts.filter(s => s.category === 'Global');
    const canvasShortcuts = shortcuts.filter(s => s.category === 'Flow Canvas');

    return (
        <div className="relative h-full">
            {/* Header - matches ToolsSection / ModelStoreSection pattern */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <h1 className="text-sm font-medium text-gray-900">Keyboard Shortcuts</h1>
                    <span className="text-xs text-gray-400">{shortcuts.length} AVAILABLE</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 mr-2">
                        <span className="text-xs text-gray-500">启用快捷键</span>
                        <Switch checked={shortcutsEnabled} onChange={setShortcutsEnabled} />
                    </div>
                    <Button onClick={resetAllShortcuts} variant="secondary" size="small">
                        <span className="flex items-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5" />
                            恢复默认
                        </span>
                    </Button>
                </div>
            </div>

            {/* Shortcut Groups */}
            <div className="space-y-8">
                {/* Global Shortcuts */}
                {globalShortcuts.length > 0 && (
                    <div>
                        <div className="mb-3">
                            <h2 className="text-xs font-semibold text-gray-900 mb-0.5">全局快捷键</h2>
                            <p className="text-[11px] text-gray-400">适用于控制台任意页面的通用操作。</p>
                        </div>
                        <ShortcutTable
                            shortcuts={globalShortcuts}
                            shortcutsEnabled={shortcutsEnabled}
                            onEdit={startEditing}
                            onRemoveKey={handleRemoveKeyComboInline}
                            formatDisplay={formatShortcutDisplay}
                        />
                    </div>
                )}

                {/* Flow Canvas Shortcuts */}
                {canvasShortcuts.length > 0 && (
                    <div>
                        <div className="mb-3">
                            <h2 className="text-xs font-semibold text-gray-900 mb-0.5">流程画布快捷键</h2>
                            <p className="text-[11px] text-gray-400">仅在 Workflow 流程设计器画布激活时有效。</p>
                        </div>
                        <ShortcutTable
                            shortcuts={canvasShortcuts}
                            shortcutsEnabled={shortcutsEnabled}
                            onEdit={startEditing}
                            onRemoveKey={handleRemoveKeyComboInline}
                            formatDisplay={formatShortcutDisplay}
                        />
                    </div>
                )}

                {/* Empty state */}
                {shortcuts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <div className="p-3 bg-gray-100 rounded-full text-gray-400 mb-4">
                            <Keyboard className="w-8 h-8" />
                        </div>
                        <h3 className="text-md font-medium text-gray-900 mb-1">No shortcuts configured</h3>
                        <p className="text-sm text-gray-500 max-w-sm text-center">
                            Keyboard shortcuts are not available at this time.
                        </p>
                    </div>
                )}
            </div>

            {/* Edit Modal - using project-standard base Modal */}
            <Modal
                isShow={!!editingShortcut}
                onClose={() => setEditingShortcut(null)}
                title={editingShortcut ? `自定义快捷键 · ${editingShortcut.name}` : ''}
            >
                {editingShortcut && (
                    <div className="space-y-5">
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                            {editingShortcut.description}
                        </p>

                        {/* Current bindings */}
                        <div className="space-y-2">
                            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">当前绑定</div>
                            {tempKeys.length > 0 ? (
                                <div className="space-y-1.5">
                                    {tempKeys.map((keyCombo, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-[#f9fafb] border border-gray-100 rounded-xl">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 font-mono">
                                                {formatShortcutDisplay(keyCombo)}
                                            </span>
                                            <button
                                                onClick={() => setTempKeys(tempKeys.filter((_, i) => i !== idx))}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400 italic py-3 text-center border border-dashed border-gray-200 rounded-xl">
                                    未指定任何按键组合
                                </div>
                            )}
                        </div>

                        {/* Recorder */}
                        {isRecording ? (
                            <div 
                                ref={recordingAreaRef}
                                tabIndex={0}
                                onKeyDown={handleRecordingKeyDown}
                                className="border border-dashed border-blue-400 bg-blue-50/30 rounded-xl p-5 text-center outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            >
                                <div className="text-[11px] text-gray-500 mb-3 font-medium">按下您想要绑定的组合键</div>
                                <div className="h-10 flex items-center justify-center">
                                    {recordedKeys.length > 0 ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded text-sm font-semibold bg-white text-blue-700 border border-blue-200 font-mono shadow-sm">
                                            {formatShortcutDisplay(recordedKeys[0])}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-blue-500 font-medium animate-pulse">等待按键输入...</span>
                                    )}
                                </div>
                                <div className="flex justify-center gap-2 mt-4">
                                    <Button onClick={handleSaveRecorded} size="small" disabled={recordedKeys.length === 0}>
                                        确认添加
                                    </Button>
                                    <Button onClick={() => { setIsRecording(false); setRecordedKeys([]); }} variant="secondary" size="small">
                                        取消
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleStartRecording}
                                className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl text-xs font-medium text-gray-500 hover:text-blue-600 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                录制新的组合键
                            </button>
                        )}

                        {/* Footer */}
                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                            <Button onClick={() => setEditingShortcut(null)} variant="secondary" size="small">
                                取消
                            </Button>
                            <Button onClick={handleSaveShortcutConfig} size="small">
                                保存
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

/* ---- Sub-component: Shortcut Table ---- */

interface ShortcutTableProps {
    shortcuts: Shortcut[];
    shortcutsEnabled: boolean;
    onEdit: (s: Shortcut) => void;
    onRemoveKey: (id: string, idx: number) => void;
    formatDisplay: (combo: string) => string;
}

const ShortcutTable: React.FC<ShortcutTableProps> = ({ shortcuts, shortcutsEnabled, onEdit, onRemoveKey, formatDisplay }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="px-6 py-4">命令</th>
                    <th className="px-6 py-4">按键绑定</th>
                    <th className="px-6 py-4 text-right w-24">操作</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[14px]">
                {shortcuts.map(shortcut => (
                    <tr 
                        key={shortcut.id} 
                        className={`hover:bg-gray-50/50 transition-colors group ${
                            !shortcut.enabled || !shortcutsEnabled ? 'opacity-50' : ''
                        }`}
                    >
                        {/* Command */}
                        <td className="px-6 py-4.5">
                            <div className="font-medium text-gray-900">{shortcut.name}</div>
                            <div className="text-[11px] text-gray-400 mt-0.5">{shortcut.description}</div>
                        </td>

                        {/* Key Bindings */}
                        <td className="px-6 py-4.5">
                            <div className="flex flex-col gap-1.5">
                                {shortcut.keys.length > 0 ? shortcut.keys.map((keyCombo, idx) => (
                                    <div key={idx} className="flex items-center gap-2 group/combo">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 font-mono">
                                            {formatDisplay(keyCombo)}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRemoveKey(shortcut.id, idx); }}
                                            disabled={!shortcutsEnabled}
                                            className="opacity-0 group-hover/combo:opacity-100 p-0.5 text-gray-400 hover:text-red-500 rounded transition-all disabled:opacity-0"
                                            title="删除"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )) : (
                                    <span className="text-xs text-gray-400 italic">未指定</span>
                                )}
                            </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4.5 text-right">
                            <button
                                onClick={() => { if (shortcutsEnabled) onEdit(shortcut); }}
                                disabled={!shortcutsEnabled}
                                className="text-[11px] text-gray-500 hover:text-blue-600 font-medium transition-colors disabled:opacity-50 disabled:hover:text-gray-500"
                            >
                                编辑
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
