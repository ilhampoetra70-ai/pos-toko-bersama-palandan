import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div className="flex h-screen min-h-[700px] overflow-hidden dark:bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto dark:bg-background p-4 lg:p-6 xl:p-8">
                <Outlet />
            </main>
        </div>
    );
}
