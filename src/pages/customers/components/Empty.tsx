import React from 'react';
import { Users, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EmptyProps {
    isLoading?: boolean;
    onCreateCustomer?: () => void;
}

export const Empty: React.FC<EmptyProps> = ({ isLoading, onCreateCustomer }) => {
    const t = useTranslations('Customers');
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('empty')}</h3>
            <p className="text-gray-500 mb-6">{t('emptyDescription')}</p>
            {onCreateCustomer && (
                <button
                    onClick={onCreateCustomer}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {t('add')}
                </button>
            )}
        </div>
    );
};
