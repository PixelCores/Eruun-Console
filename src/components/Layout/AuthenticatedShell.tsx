import { Outlet } from 'react-router-dom';

export const AuthenticatedShell = () => (
  <div className="h-screen w-full overflow-hidden bg-gray-50">
    <main className="h-full">
      <Outlet />
    </main>
  </div>
);
