import { useEffect } from 'react';
import { useTourStore } from '../stores/tourStore';

export const useEducationInit = () => {
    const { hasCompleted, isActive, startTour } = useTourStore();

    useEffect(() => {
        // Auto-start guided tour for first-time users
        if (!hasCompleted && !isActive) {
            // Small delay to ensure the canvas is fully rendered
            const timer = setTimeout(() => {
                startTour();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [hasCompleted, isActive, startTour]);
};
