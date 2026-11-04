import { lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";


const Login = lazy(() => import("./pages/User/Login/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SliderImage = lazy(() => import("./pages/Home/SliderImage"));
const TagText = lazy(() => import("./pages/Home/TagText"));
const CreateQRCode = lazy(() => import("./pages/QrCode/CreateQRCode"));
const Layout = lazy(() => import("./components/Layout/Layout"));
const HowItWorks = lazy(() => import("./pages/Home/HowItWorks"));
const HowItWorks2 = lazy(() => import("./pages/Home/HowItWorks2"));
const CustomerSays = lazy(() => import("./pages/Home/CustomerSays"));
const PrintQRCode = lazy(() => import("./pages/QrCode/PrintQRCode"));
const OneYearDeliveredQRCode = lazy(() => import("./pages/QrCode/OneYearDeliveredQRCode"));
const SixMonthsDeliveredQRCode = lazy(() => import("./pages/QrCode/SixMonthsDeliveredQRCode"));
const ThreeMonthsDeliveredQRCode = lazy(() => import("./pages/QrCode/ThreeMonthsDeliveredQRCode"));
const ContactUs = lazy(() => import("./pages/ContactUs/ContactUs"));
const ShippingDetails = lazy(() => import("./pages/ShipAndPurchase/ShippingDetails"));
const PurchaseDetails = lazy(() => import("./pages/ShipAndPurchase/PurchaseDetails"));
const RegisteredMember = lazy(() => import("./pages/RegisteredMember/RegisteredMember"));
 const ProductDetails = lazy(() => import("./pages/Product/ProductDetails"));
 const DiscountCode = lazy(() => import("./pages/Product/DiscountCode"));
 const ShippingPrice = lazy(() => import("./pages/Product/ShippingPrice"));
// function ProtectedRoute() {
//   const location = useLocation();
//   const { data, isLoading, isError } = useGetUserQuery(undefined, {
//   });

//   if (isLoading) return <div className='flex justify-center align-center w-full'>Loading...</div>;

//   const isAuthenticated = data?.authenticated || data?.user;

//   if (isError || !isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   return <Outlet />;
// }

// 🔓 Public Route — prevent logged-in users from accessing /login
// function PublicRoute() {
//   //const location = useLocation();
//   // const { data, isLoading } = useGetUserQuery(undefined, {
//   //   skip: location.pathname !== "/login", // ✅ Only run this check on login page
//   // });

//   //if (isLoading) return <div>Loading...</div>;

//   const isAuthenticated = data?.authenticated;

//   return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
// }
const ProtectedRoute = () => {
  if (loading) return <div>Loading...</div>;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};
function RoleAwareFallback() {
  // if (userRole === "admin") {
  //   return <Navigate to="/home" replace />;
  // }

  // if (userRole === "staff") {
  //   return <Navigate to="/staff/orders/all-tables" replace />;
  // }

  // if (userRole === "kitchen-staff") {
  //   return <Navigate to="/kitchen-staff/orders/all-orders" replace />;
  // }

  return <Navigate to="/login" replace />;
}

function RouterWrapper() {
  //const location = useLocation();

  return (
    <>
     
      <Suspense
  fallback={
     <Spinner size="lg" text="Loading Dashboard..." />
  }
>

    {/* <Suspense fallback={<Spinner size="lg" text="Loading Dashboard..." />}> */}
        <Routes>
           
          {/* Public Route: Login */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
   
          </Route>
{/* Admin Routes */}
        /         {/* 🔒 Protected / App routes (WITH layout) */}
         <Route element={<Layout />}>
           <Route path="/dashboard" element={<Dashboard />} />
           <Route path="/home/slider" element={<SliderImage />} />
           <Route path="/home/tag-text" element={<TagText />} />
           <Route path="/home/how-it-works" element={<HowItWorks />} />
           <Route path="/home/how-it-works2" element={<HowItWorks2 />} />
           <Route path="/home/customer-says" element={<CustomerSays />} />

           <Route path="/qr-code/create" element={<CreateQRCode />} />
           <Route path="/qr-code/print" element={<PrintQRCode />} />
           <Route path="/qr-code/one-year-delivered" element={<OneYearDeliveredQRCode />} />
           <Route path="/qr-code/six-months-delivered" element={<SixMonthsDeliveredQRCode />} />
           <Route path="/qr-code/three-months-delivered" element={<ThreeMonthsDeliveredQRCode />} />

           <Route path="/contact-us/contact" element={<ContactUs />} />
           <Route path="/ship-and-purchase/ship" element={<ShippingDetails />} />
           <Route path="/ship-and-purchase/purchase" element={<PurchaseDetails />} />

           <Route path="/registered-member" element={<RegisteredMember />} />
           <Route path="/product/details" element={<ProductDetails />} />
           <Route path="/product/discount-code" element={<DiscountCode />} />
          <Route path="/product/shipping-price" element={<ShippingPrice />} />
         </Route>


        

      


         

          {/* Fallback */}
          <Route path="*" element={<RoleAwareFallback userRole={userRole} />} />

          {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
        </Routes>
      </Suspense>
      

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
export default function App() {
  // const { data: userMe, isLoading } = useGetUserQuery();

  // ⛔ Prevent router from rendering repeatedly
  // if (isLoading) return <div>
  //    <Spinner size="lg" text="Loading ..." />
  // </div>;

  // // ❌ Not logged in → redirect userRole=null
  // const role = userMe?.user?.role || null;

  return (
    <BrowserRouter>
      <RouterWrapper />
    </BrowserRouter>
  );
}


 // function App() {
//   const ProtectedRoute = () => {
//   const isAuthenticated = !!localStorage.getItem("admin_session"); // or cookie check

//   return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
// };
// const PublicRoute = ({ children }) => {
//   const isAuthenticated = !!localStorage.getItem("admin_session");

//   return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
// };


  
// return (
//     <BrowserRouter>
//       <Routes>

//         {/* 🔐 Public route (NO layout) */}
//         <Route path="/login" element={<Login />} />

//         {/* 🔒 Protected / App routes (WITH layout) */}
//         <Route element={<Layout />}>
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/home/slider" element={<SliderImage />} />
//           <Route path="/home/tag-text" element={<TagText />} />
//           <Route path="/home/how-it-works" element={<HowItWorks />} />
//           <Route path="/home/how-it-works2" element={<HowItWorks2 />} />
//           <Route path="/home/customer-says" element={<CustomerSays />} />

//           <Route path="/qr-code/create" element={<CreateQRCode />} />
//           <Route path="/qr-code/print" element={<PrintQRCode />} />
//           <Route path="/qr-code/one-year-delivered" element={<OneYearDeliveredQRCode />} />
//           <Route path="/qr-code/six-months-delivered" element={<SixMonthsDeliveredQRCode />} />
//           <Route path="/qr-code/three-months-delivered" element={<ThreeMonthsDeliveredQRCode />} />

//           <Route path="/contact-us/contact" element={<ContactUs />} />
//           <Route path="/ship-and-purchase/ship" element={<ShippingDetails />} />
//           <Route path="/ship-and-purchase/purchase" element={<PurchaseDetails />} />

//           <Route path="/registered-member" element={<RegisteredMember />} />
//           <Route path="/product/details" element={<ProductDetails />} />
//           <Route path="/product/discount-code" element={<DiscountCode />} />
//           <Route path="/product/shipping-price" element={<ShippingPrice />} />
//         </Route>

//       </Routes>
//     </BrowserRouter>
//   );

// }
 
// export default App;