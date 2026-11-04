
// src/components/Header.jsx

import { useRef } from "react";
import { Menu, LogOut } from "lucide-react";
import { toast } from "react-toastify";
import { useAdminLogoutMutation } from "@/redux/api/userApi";

export default function Header({ setMobileOpen }) {
  const profileRef = useRef(null);

  const [logoutUser, { isLoading: isAdminLogoutLoading }] =
    useAdminLogoutMutation();

  const handleLogout = async () => {
    try {
      const response = await logoutUser().unwrap();

      if (response?.success) {
        toast.success(response?.message || "Logout successful");
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout error:", err);
      toast.error(err?.data?.message || "Logout failed");
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="relative flex h-14 items-center justify-between px-4 sm:px-6">

        {/* Left: Mobile menu */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Centre: Training name */}
        <h1 className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-lg font-bold text-black sm:text-xl">
          TRAINING
        </h1>

        {/* Right: Admin profile and logout */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div
            ref={profileRef}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
              A
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isAdminLogoutLoading}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut size={15} />
              {isAdminLogoutLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
