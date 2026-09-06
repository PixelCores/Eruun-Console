import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useTranslations } from 'next-intl';
import SalesRevenueWidget from './components/SalesRevenueWidget';
import SegmentationWidget from './components/SegmentationWidget';
import ProductPerformanceWidget from './components/ProductPerformanceWidget';
import TaskCompletionWidget from './components/TaskCompletionWidget';
import UserRetentionWidget from './components/UserRetentionWidget';
import LeadsByStatusWidget from './components/LeadsByStatusWidget';
import CommunityInsightsWidget from './components/CommunityInsightsWidget';
import { List as AppsList } from '../apps/list';
import { GameAppStoreList } from '../app-store/game-list';
import { List as CustomersList } from '../customers/list';
import ToolsSection from './components/ToolsSection';
import ModelStoreSection from './components/ModelStoreSection';
import InferenceServicesSection from './components/InferenceServicesSection';
import TrainingJobsSection from './components/TrainingJobsSection';
import { SettingsSection } from './components/SettingsSection';
import { LanguageSection } from './components/LanguageSection';
import { ShortcutsSection } from './components/ShortcutsSection';

interface Dashboard1PageProps {
    roleLabel?: string;
}

const Dashboard1Page: React.FC<Dashboard1PageProps> = ({ roleLabel }) => {
    const t = useTranslations('Navigation');
    const [searchParams] = useSearchParams();
    const sectionFromUrl = searchParams.get('section');
    const activeSection = sectionFromUrl || 'widgets';

    if (activeSection === 'app-store1') {
        return <Navigate to="/application-management" replace />;
    }

    return (
        <div className={activeSection === 'settings' ? 'h-screen' : 'p-8'}>
            {activeSection === 'apps' ? (
                <AppsList />
            ) : activeSection === 'app-store' ? (
                <GameAppStoreList />
            ) : activeSection === 'customers' ? (
                <CustomersList />
            ) : activeSection === 'tools' ? (
                <ToolsSection />
            ) : activeSection === 'model-store' ? (
                <ModelStoreSection />
            ) : activeSection === 'inference' ? (
                <InferenceServicesSection />
            ) : activeSection === 'training' ? (
                <TrainingJobsSection />
            ) : activeSection === 'settings' ? (
                <SettingsSection />
            ) : activeSection === 'shortcuts' ? (
                <ShortcutsSection />
            ) : activeSection === 'language' ? (
                <LanguageSection />
            ) : activeSection === 'widgets' ? (
                <>
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-8">
                        <h1 className="text-sm font-medium text-gray-900">{t('manageWidgets')}</h1>
                        {roleLabel && <span className="text-xs text-gray-500">{t('workspace', { role: roleLabel })}</span>}
                        <span className="text-xs text-gray-400">{t('available', { count: 204 }).toUpperCase()}</span>
                    </div>

                    {/* Sales & Financial Insights */}
                    <div className="mb-12">
                        <h2 className="text-lg font-medium text-gray-900 mb-1">{t('salesInsights')}</h2>
                        <p className="text-sm text-gray-500 mb-6">{t('salesInsightsDescription')}</p>
                        <div className="grid grid-cols-3 gap-6">
                            <SalesRevenueWidget />
                            <SegmentationWidget />
                            <ProductPerformanceWidget />
                        </div>
                    </div>

                    {/* Goals & Tasks Tracking */}
                    <div className="mb-12">
                        <h2 className="text-lg font-medium text-gray-900 mb-1">{t('goals')}</h2>
                        <p className="text-sm text-gray-500 mb-6">{t('goalsDescription')}</p>
                        <div className="grid grid-cols-3 gap-6">
                            <TaskCompletionWidget />
                            <UserRetentionWidget />
                            <LeadsByStatusWidget />
                        </div>
                    </div>

                    {/* Community Insights */}
                    <div>
                        <CommunityInsightsWidget />
                    </div>
                </>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500">{t('underConstruction')}</p>
                </div>
            )}
        </div >
    );
};

export default Dashboard1Page;
