import React from 'react';
import { Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EmptyProps {
    isLoading: boolean;
    message?: string;
}

export const Empty: React.FC<EmptyProps> = ({ isLoading, message }) => {
    const t = useTranslations('Apps');
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {Array.from({ length: 36 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-gray-100 rounded-xl border border-gray-200 p-4 animate-pulse"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-200" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                            </div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-5/6 mb-3" />
                        <div className="flex gap-2">
                            <div className="h-6 bg-gray-200 rounded w-16" />
                            <div className="h-6 bg-gray-200 rounded w-20" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="relative min-h-[400px]">
            {/* Skeleton background */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 opacity-20">
                {Array.from({ length: 36 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-gray-100 rounded-xl border border-gray-200 p-4"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-200" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                            </div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-5/6 mb-3" />
                        <div className="flex gap-2">
                            <div className="h-6 bg-gray-200 rounded w-16" />
                            <div className="h-6 bg-gray-200 rounded w-20" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Centered message */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {message ?? t('noAppsFound')}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {t('adjustFilters')}
                    </p>
                </div>
            </div>
        </div>
    );
};
