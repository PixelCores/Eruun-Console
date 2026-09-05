import React from 'react';
import { Sparkles, Upload, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface NewAppCardProps {
    onCreateBlank: () => void;
    onCreateFromTemplate: () => void;
    onImportDSL: () => void;
}

export const NewAppCard: React.FC<NewAppCardProps> = ({
    onCreateBlank,
    onCreateFromTemplate,
    onImportDSL,
}) => {
    const t = useTranslations('Apps');
    return (
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border-2 border-dashed border-primary-300 p-4 w-[310px] h-[160px] flex flex-col">
            <div className="flex-1 flex flex-col justify-between">
                <button
                    onClick={onCreateBlank}
                    className="flex items-center gap-2 p-1 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-400 transition-all text-left group"
                >
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <Plus className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-gray-900 leading-tight">{t('createApp')}</div>
                        <div className="text-[10px] text-gray-500 leading-tight">{t('fromScratch')}</div>
                    </div>
                </button>

                <button
                    onClick={onCreateFromTemplate}
                    className="flex items-center gap-2 p-1 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-400 transition-all text-left group"
                >
                    <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-gray-900 leading-tight">{t('fromTemplate')}</div>
                        <div className="text-[10px] text-gray-500 leading-tight">{t('templateDescription')}</div>
                    </div>
                </button>

                <button
                    onClick={onImportDSL}
                    className="flex items-center gap-2 p-1 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-400 transition-all text-left group"
                >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Upload className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-gray-900 leading-tight">{t('importDsl')}</div>
                        <div className="text-[10px] text-gray-500 leading-tight">{t('uploadDsl')}</div>
                    </div>
                </button>
            </div>
        </div>
    );
};
