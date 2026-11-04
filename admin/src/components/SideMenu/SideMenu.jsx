import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  Users,
  CalendarDays,
  Database,
} from "lucide-react";

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const scrollRef = useRef(null);
  const scrollPos = useRef(0);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    
    {
      label: "Leave Management",
      path: "/leave",
      icon: CalendarDays,
    },
     {
      label: "Database",
      path: "/database",
      icon: Database,
    },
    {
      label: "Upload database",
      path: "/upload",
      icon: Users,
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo and Header */}
      <div className="flex items-center justify-center relative px-4 py-6 border-b border-gray-700">
        <div className="flex flex-col items-center gap-2">
          {/* <img
            src="/assets/images/logo-tagway-new.png"
            className="w-20 object-contain"
            alt="Logo"
          /> */}

          <span className="font-bold text-lg text-white">
            Admin Panel
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute right-4 top-4 p-1 rounded hover:bg-gray-700 text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
      >
        {menuItems.map(({ label, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              isActive(path)
                ? "bg-red-500 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />

            <span className="font-medium">
              {label}
            </span>
          </Link>
        ))}
      </nav>

    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-gray-900 text-white z-50 shadow-2xl transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-gray-900 text-white flex-shrink-0 sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}