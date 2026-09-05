import { useState, useEffect, useRef } from 'react';

export function useResizeWidth<T extends HTMLElement>() {
    const [width, setWidth] = useState<number>(0);
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // 初始设置一次
        setWidth(element.getBoundingClientRect().width);

        const observer = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0) return;
            const { width } = entries[0].contentRect;
            setWidth(width);
        });

        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, []);

    return [ref, width] as const;
}
