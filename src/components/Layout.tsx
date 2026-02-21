import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div className="flex h-screen overflow-hidden dark:bg-gray-900">
            <Sidebar />
            <main className="flex-1 overflow-auto dark:bg-gray-900 p-6">
                <Outlet />
            </main>
        </div>
    );
}
