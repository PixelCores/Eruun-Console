export interface TourStep {
    /** 步骤唯一标识 */
    id: string;
    /** 步骤标题 */
    title: string;
    /** 步骤说明 */
    description: string;
    /** 目标元素的 data-tour 属性值 */
    targetSelector: string;
    /** 卡片相对于目标的偏好位置 */
    placement: 'top' | 'bottom' | 'left' | 'right';
    /** 快捷键提示（可选），引用 shortcutsStore 中的 key 格式 */
    shortcutKeys?: string[];
    /** 高亮区域的额外 padding (px) */
    spotlightPadding?: number;
}

export const TOUR_STEPS: TourStep[] = [
    {
        id: 'add-node',
        title: '添加节点',
        description: '点击 "+" 按钮打开节点选择器，添加你的第一个组件到画布中。你可以选择 Web Service、Store、Job 等不同类型的组件。',
        targetSelector: 'add-node',
        placement: 'right',
        spotlightPadding: 6,
    },
    {
        id: 'select-node',
        title: '选择节点',
        description: '点击画布中的节点来选中它。选中后右侧会出现属性编辑面板，你可以在面板中查看和修改节点的配置。',
        targetSelector: 'canvas-node',
        placement: 'bottom',
        spotlightPadding: 8,
    },
    {
        id: 'edit-node',
        title: '编辑节点属性',
        description: '在右侧面板中修改节点的名称、镜像地址、副本数、环境变量等配置信息。双击节点名称可以快速重命名。',
        targetSelector: 'property-panel',
        placement: 'left',
        spotlightPadding: 4,
    },
    {
        id: 'connect-nodes',
        title: '连接节点',
        description: '从节点右侧的蓝色圆点（Source Handle）拖拽到另一个节点左侧的蓝色圆点（Target Handle），即可建立组件之间的依赖关系。',
        targetSelector: 'canvas-node',
        placement: 'bottom',
        spotlightPadding: 8,
    },
    {
        id: 'context-menu',
        title: '右键菜单',
        description: '在画布空白处点击右键，可以快速添加节点、导入 YAML 文件、导出组件配置等。',
        targetSelector: 'canvas-area',
        placement: 'bottom',
        spotlightPadding: 0,
    },
    {
        id: 'delete-node',
        title: '删除节点',
        description: '选中画布中的节点或连接线后，按下快捷键即可删除选中的元素。',
        targetSelector: 'canvas-area',
        placement: 'bottom',
        shortcutKeys: ['delete', 'backspace'],
        spotlightPadding: 0,
    },
    {
        id: 'copy-paste',
        title: '复制 & 粘贴节点',
        description: '选中节点后使用复制快捷键，然后使用粘贴快捷键即可在画布中创建节点的副本，新节点会自动生成唯一名称。',
        targetSelector: 'canvas-area',
        placement: 'bottom',
        shortcutKeys: ['meta+c', 'meta+v'],
        spotlightPadding: 0,
    },
    {
        id: 'save-workflow',
        title: '保存工作流',
        description: '完成编辑后，点击保存按钮或使用快捷键保存当前的工作流设计方案。',
        targetSelector: 'save-button',
        placement: 'bottom',
        shortcutKeys: ['meta+s'],
        spotlightPadding: 6,
    },
];
