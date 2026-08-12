import React from 'react';
import {
  Shield,
  Home,
  MapPin,
  Users,
  Ambulance,
  History,
  Settings,
  AlertTriangle,
  HelpCircle,
  LogOut,
  Bell,
  ShieldCheck,
  User as UserIcon,
  Bot,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  onOpenSos: () => void;
  onOpenAssistant: () => void;
  locationSharingActive: boolean;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  onOpenSos,
  onOpenAssistant,
  locationSharingActive,
  unreadCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'journey', label: 'Journey', icon: MapPin },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'resources', label: 'Resources', icon: Ambulance },
    { id: 'history', label: 'History', icon: History },
    { id: 'privacy', label: 'Settings', icon: Settings },
  ];

  if (user?.role === 'ADMIN' || user?.role === 'SAFETY_OPERATOR') {
    navItems.push({ id: 'admin', label: 'Admin', icon: ShieldCheck });
  }

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col h-screen w-[280px] fixed left-0 top-0 bg-white border-r border-[#e1e2e5] z-40 p-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-[#532dcf] flex items-center justify-center text-white shadow-sm">
            <Shield className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#191c1e] tracking-tight">NexGuard</h1>
            <div className="flex items-center gap-1.5 text-xs text-[#484555]">
              <span className={`w-2 h-2 rounded-full ${locationSharingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span>{locationSharingActive ? 'Sharing Active' : 'Safety Active'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm ${
                  isActive
                    ? 'bg-[#e6deff] text-[#1c0062] font-semibold'
                    : 'text-[#484555] hover:bg-[#f2f3f6] hover:text-[#191c1e]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#532dcf]' : 'text-[#797586]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* AI Companion Shortcut */}
        <button
          onClick={onOpenAssistant}
          className="w-full mb-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f0ecff] text-[#532dcf] font-medium text-sm hover:bg-[#e6deff] transition-all border border-[#c9c4d7]/40"
        >
          <Bot className="w-5 h-5 text-[#532dcf]" />
          <span>Safety Companion</span>
        </button>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-[#e1e2e5] space-y-3">
          <button
            onClick={onOpenSos}
            className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <AlertTriangle className="w-5 h-5 fill-current" />
            <span>TRIGGER SOS</span>
          </button>

          {user ? (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-[#e6deff] text-[#532dcf] flex items-center justify-center font-bold text-xs shrink-0">
                  {user.full_name.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#191c1e] truncate">{user.full_name}</p>
                  <p className="text-[11px] text-[#797586] truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 text-[#797586] hover:text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSelectTab('auth')}
              className="w-full py-2.5 px-4 bg-[#532dcf] text-white rounded-xl font-medium text-sm hover:bg-[#481cc4] transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e1e2e5] px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2" onClick={() => onSelectTab('dashboard')}>
          <Shield className="w-7 h-7 text-[#532dcf] fill-current" />
          <span className="font-bold text-lg text-[#532dcf] tracking-tight">NexGuard</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAssistant}
            className="p-2 rounded-full bg-[#f0ecff] text-[#532dcf] hover:bg-[#e6deff]"
            title="Safety Assistant"
          >
            <Bot className="w-5 h-5" />
          </button>
          <button
            onClick={() => onSelectTab('privacy')}
            className="p-2 text-[#484555] hover:bg-[#f2f3f6] rounded-full relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600" />
            )}
          </button>
          {user ? (
            <div
              onClick={() => onSelectTab('privacy')}
              className="w-8 h-8 rounded-full bg-[#532dcf] text-white font-bold text-xs flex items-center justify-center cursor-pointer"
            >
              {user.full_name.charAt(0)}
            </div>
          ) : (
            <button
              onClick={() => onSelectTab('auth')}
              className="text-xs font-semibold text-[#532dcf] px-3 py-1.5 rounded-full bg-[#f0ecff]"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-white border-t border-[#e1e2e5] px-2 py-2 flex justify-around items-center shadow-lg">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                isActive ? 'text-[#532dcf] font-bold' : 'text-[#797586]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onOpenSos}
          className="flex flex-col items-center justify-center p-2 text-red-600 font-bold animate-pulse"
        >
          <AlertTriangle className="w-5 h-5 fill-current text-red-600" />
          <span className="text-[10px] mt-1 uppercase tracking-wider">SOS</span>
        </button>
      </nav>
    </>
  );
};
