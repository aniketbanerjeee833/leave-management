
// import Sidebar from "../SideMenu/SideMenu";
// export default function Layout({ children }) {

//   return (
//     <>
//        {/* <Header/> */}
//     <div className="flex">
//       <div className="flex w-full min-h-screen flex">
//         {/* Sidebar (always visible) */}
//         <div className="flex">
//           <Sidebar/>
//         </div>

//         {/* Main content */}
//         <div className="w-full min-h-screen flex">{children}</div>
//       </div>
//     </div>
//     </>
//   );
// }
// import Sidebar from "../SideMenu/SideMenu";
 import { Outlet } from "react-router-dom";

// export default function Layout() {
//   return (
//     <div className="flex w-full min-h-screen">

//       {/* Sidebar */}
//       <Sidebar />

//       {/* Main content */}
//       {/* <div className="w-full min-h-screen">
        
//       </div> */}
//       <div className="flex-1 min-h-screen w-0 overflow-x-hidden
//                 ml-20 sm:ml-0
//                 transition-all duration-300">
//         <Outlet />
//       </div>

//     </div>
//   );
// }
// src/components/Layout.jsx
// import { useState } from "react";


// import Sidebar from "../SideMenu/SideMenu";
// import Header from "../Header/Header";

// export default function Layout() {
//   // mobileOpen lives here so BOTH Header and Sidebar can read/write it
//   const [mobileOpen, setMobileOpen] = useState(false);

//   return (
//     <div className="flex h-screen overflow-hidden">

//       {/* Sidebar gets mobileOpen so it knows when to slide in/out */}
//       <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

//       {/* Right column: header + page content */}
//       <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

//         {/* Header gets setMobileOpen so the hamburger can open the sidebar */}
//         <Header setMobileOpen={setMobileOpen} />

//         {/* <main className="flex-1 overflow-y-auto bg-gray-50">
//           {children}
//         </main> */}
//             <div className="flex-1 min-h-screen w-0 overflow-x-hidden
//                  ml-20 sm:ml-0
//                 transition-all duration-300">
//         <Outlet />
//       </div>

//       </div>
//     </div>
//   );
// }


import { useState } from "react";
import Sidebar from "../SideMenu/SideMenu";
import Header from "../Header/Header";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Right side */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <Header setMobileOpen={setMobileOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <Outlet />
        </main>

      </div>
    </div>
  );
}