import { Routes, Route, Navigate, Outlet, BrowserRouter } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import Layout from "./components/Layout/Layout";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from "./components/Layout/Spinner";




const Login = lazy(() => import("./pages/User/Login/Login"));
// const UploadPage = lazy(() => import("./pages/UploadPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));



 const LeaveManagement = lazy(() => import("./pages/LeaveManagement"));
 const Database = lazy(() => import("./pages/Database"));
  const UploadPersonnel = lazy(() => import("./pages/Upload"));
// import all your components...
// (SliderImage, TagText, etc.)

// 🔐 Protected Route
const ProtectedRoute = ({ user, loading }) => {
  if (loading) return <div className="text-center">Loading...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// 🔓 Public Route
const PublicRoute = ({ user, loading }) => {
  if (loading) return <div className="text-center">Loading...</div>;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

// 🔁 Fallback
const RoleAwareFallback = ({ user }) => {
  //return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
   return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default function RouterWrapper() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Call backend to check session
  useEffect(() => {
    fetch("http://localhost:4000/api/admin/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
     <BrowserRouter>
     <>
  <Suspense fallback={<Spinner size="lg" text="Loading ..." />}>
      <Routes>

        {/* 🔐 Public Route */}
        <Route element={<PublicRoute user={user} loading={loading} />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* 🔒 Protected Routes */}
        <Route element={<ProtectedRoute user={user} loading={loading} />}>
          <Route element={<Layout/>}>
             {/* <Route path="/upload" element={<UploadPage/>} /> */}
            <Route path="/dashboard" element={<Dashboard />} />

          
           
           
             <Route path="/leave" element={<LeaveManagement />}/>
             <Route path="/database" element={<Database/>}/>
              <Route path="/upload" element={<UploadPersonnel />}/>


          </Route>
        </Route>

        {/* 🔁 Fallback */}
        <Route path="*" element={<RoleAwareFallback user={user} />} />

      </Routes>
      </Suspense>
      </>
      <ToastContainer position="top-right" autoClose={3000} />
    
    </BrowserRouter>
  );
}