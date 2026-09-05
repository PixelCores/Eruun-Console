import React from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../pages/dashboard/components/Sidebar';

export const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const activeSection = (() => {
        const path = location.pathname;
        if (path.startsWith('/apps')) return 'apps';
        if (path.startsWith('/dashboard1') || path === '/') {
            const dashboard1Section = searchParams.get('section');
            return !dashboard1Section || dashboard1Section === 'widgets'
                ? 'widgets'
                : dashboard1Section;
        }

        return 'widgets';
    })();

    const handleSectionChange = (section: string) => {
        if (['widgets', 'schedule', 'apps', 'tools', 'model-store', 'inference', 'training', 'settings', 'shortcuts', 'language'].includes(section)) {
            navigate(`/dashboard1?section=${section}`);
        }
    };

    return (
        <div className="flex h-full w-full bg-white overflow-hidden">
            <Sidebar
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
            />
            <div className="flex-1 overflow-y-auto bg-gray-50">
                <Outlet />
            </div>
        </div>
    );
};
