export const EdgeStatus = {
    SUCCESS: 'success',
    FAILURE: 'failure',
    ERROR: 'error',
    RUNNING: 'running',
    NORMAL: 'normal',
} as const;

export type EdgeStatus = typeof EdgeStatus[keyof typeof EdgeStatus];


export const getEdgeColor = (status: EdgeStatus | string | undefined): string => {
    switch (status) {
        case EdgeStatus.SUCCESS:
            return 'var(--color-workflow-link-line-success-handle)';
        case EdgeStatus.FAILURE:
            return 'var(--color-workflow-link-line-failure-handle)';
        case EdgeStatus.ERROR:
            return 'var(--color-workflow-link-line-error-handle)';
        case EdgeStatus.RUNNING:
            return 'var(--color-workflow-link-line-handle)';
        case EdgeStatus.NORMAL:
        default:
            return 'var(--color-workflow-link-line-normal)';
    }
};
