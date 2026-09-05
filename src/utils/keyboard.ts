export const isEventTargetInputArea = (target: HTMLElement) => {
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
    }

    if (target.isContentEditable) {
        return true;
    }

    return false;
};
