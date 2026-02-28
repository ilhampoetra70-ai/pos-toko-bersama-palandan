import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div className="flex h-screen overflow-hidden dark:bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto dark:bg-background p-6">
                <Outlet />
            </main>
        </div>
    );
}
