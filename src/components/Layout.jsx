import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import TabNav from './TabNav';

export default function Layout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden font-syne">
      <TopBar />
      <TabNav />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}