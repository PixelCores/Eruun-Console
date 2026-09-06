import React from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../pages/dashboard/components/Sidebar';

export const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const activeSection = (() => {
        const path = location.pathname;
        if (path.startsWith('/applications')) return 'applications';
        if (path.startsWith('/apps')) return 'apps';
        if (path.startsWith('/application-management')) return 'application-management';
        if (path.startsWith('/customers')) return 'customers';
        if (path.startsWith('/messages')) return 'messages';
        if (path.startsWith('/dashboard1')) {
            const dashboard1Section = searchParams.get('section');
            return !dashboard1Section || dashboard1Section === 'widgets'
                ? 'dashboard1'
                : dashboard1Section;
        }
        if (path === '/dashboard' || path === '/') return 'dashboard';

        return 'dashboard';
    })();

    const handleSectionChange = (section: string) => {
        if (['widgets', 'schedule', 'app-store', 'apps', 'tools', 'model-store', 'inference', 'training', 'customers', 'companies', 'settings', 'customer-success', 'shortcuts', 'language'].includes(section)) {
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
