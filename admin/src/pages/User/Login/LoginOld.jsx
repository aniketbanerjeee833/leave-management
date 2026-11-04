

import "./Login.css"
import { useEffect, useState } from "react";



import { useForm } from "react-hook-form";

//import {loginSchema} from "../../../schema/userFormSchema"
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { Lock, User } from "lucide-react";
import { toast } from "react-toastify";
import { useAdminLoginMutation } from "@/redux/api/userApi";


export default function Login() {
//const dispatch = useDispatch();
//const navigate = useNavigate();
  // const [username, setUsername] = useState('');
  // const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  //const[loggedInLoading, setLoggedInLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedUntil, setBlockedUntil] = useState(null); // timestamp until which login is blocked
 //const {  loggedIn } = useSelector((state) => state.user);
const [countdownLeft, setCountdownLeft] = useState(0);
const[duplicateLoginError,setDuplicateLoginError]=useState("");


 const [loginUser, { isLoading: isAdminLoginLoading }] = useAdminLoginMutation();


const[blockedUntilReadable, setBlockedUntilReadable] = useState(null);
//const [error, setError] = useState("");

  const {
    
      register,
      handleSubmit,

      watch,
      
      //formState: { errors },
    } = useForm()

const formValues = watch();
// const onSubmit = (data) => {
//   console.log("Form submitted with:", data);

//   if (data.username === "Admin1" && data.password === "Admin@123") {
//     //window.location.href = "/dashboard";
//     navigate("/dashboard"); 
//   } else {
//     toast.error("Invalid username or password");
//   }


 


// }
const onSubmit = async (data) => {
 
  setError("");
  const { username, password } = data;
  console.log("Logging in with:", { username, password });

  try {
    const response = await loginUser({ username, password }).unwrap();
    console.log("Login Response:", response);
    
if (response.success) {
  toast.success("Login successful");

  // dispatch(setUser(response?.user));
  // dispatch(setUserId(response?.user?.User_Id)); 

  //const role = response?.user?.role;

  

    // default route for admin or others
    window.location.href = "/dashboard";
 
}

  } catch (err) {
    console.error("Login error:", err);

    // 🔒 1️⃣ Rate limit (too many attempts)
    if (err.status === 429 && err.data?.blockedUntil) {
      const blockedTime = err.data.blockedUntil;
      setBlockedUntil(blockedTime);
      setBlockedUntilReadable(err.data.blockedUntilReadable);

      const localTime = new Date(blockedTime).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      });

      toast.error(
        `Too many login attempts. Please try again at ${localTime} (in about ${Math.ceil(
          (blockedTime - Date.now()) / 60000
        )} minutes).`
      );
    }

    // 🚫 2️⃣ Already logged in on another device
    else if (err.status === 403) {
      toast.error(
        "You are already logged in on another device. Please log out from that device first.",
        { duration: 6000 }
      );

      // 🧠 Optional: show a clear visual warning near the form
      setDuplicateLoginError(
        "You’re already logged in on another device. Please log out there or wait until your session expires."
      );

      // Optionally, open a dialog to explain or refresh session
      // setShowLogoutDialog(true);
    }

    // ⚠️ 3️⃣ General error handler
    else {
      toast.error(err?.data?.message || "Something went wrong. Please try again.");
      setError(err.data?.message || "Something went wrong");
    }
  }
};






// const timeLeft =
//   blockedUntil && blockedUntil > Date.now()
//     ? Math.ceil((blockedUntil - Date.now()) / 1000)
//     : 0;

// 🕐 Countdown timer state (re-renders every second)
useEffect(() => {
  const saved = localStorage.getItem("blockedUntil");
  if (saved && Number(saved) > Date.now()) {
    setBlockedUntil(Number(saved));
  }
}, []);

// 🧠 Save blockedUntil whenever it changes
useEffect(() => {
  if (blockedUntil) {
    localStorage.setItem("blockedUntil", blockedUntil);
  } else {
    localStorage.removeItem("blockedUntil");
  }
}, [blockedUntil]);

// 🕐 Countdown updater (ticks every second)
useEffect(() => {
  if (!blockedUntil) return;

  const timer = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000));
    setCountdownLeft(remaining);

    if (remaining <= 0) {
      clearInterval(timer);
      setBlockedUntil(null);
    }
  }, 1000);

  return () => clearInterval(timer);
}, [blockedUntil]);

// 🕓 Convert to readable local time (India)
const localTime =
  blockedUntil && blockedUntil > Date.now()
    ? new Date(blockedUntil).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : null;

    console.log(formValues);
  return (
  <div  className="min-h-screen bg-slate-100 flex items-center justify-center ">
    <div 
    className="grid grid-cols-1 w-full min-h-screen
    bg-white  border border-gray-200 sm:grid-cols-12 shadow-sm">

      {/* ── Left panel ── */}
       {/* <div className="bg-slate-900 col-span-7 flex flex-col items-center justify-center px-9 py-12 gap-5"> */}
     {/* <div className="hidden sm:flex sm:col-span-7 bg-slate-900 flex-col items-center justify-center
      px-9 py-12 gap-5">
       
         <h2 className="text-2xl font-bold text-white">TRAINING</h2>
          <img src="/assets/images/photo.png" alt="Logo" className="w-32 h-32 object-contain" />
     
        
      </div> */}
      {/* Left panel - Full Police Training Photo */}
<div className="hidden sm:block sm:col-span-6 relative min-h-screen overflow-hidden">
  <img
    src={`assets/images/photo.png`}
    alt="Indian Police Training"
    className="absolute inset-0 w-full h-full object-cover object-center"
  />
</div>

      {/* ── Right panel ── */}
      <div className="flex flex-col col-span-6 items-center justify-center w-full px-9 py-10">
        {/* <div className="w-full p-10"> */}
        <div className="w-full max-w-sm mx-auto p-4 sm:p-6">
          <div className="flex  flex-col items-center justify-center">
          <h1 className="text-xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1 mb-7">Sign in to your account</p>
            </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* <form  className="flex flex-col gap-4"> */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Username</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter username"
                  {...register("username")}
                  className="pl-8 h-10 rounded-xl bg-gray-50 border-gray-200 text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  {...register("password")}
                  className="pl-8 h-10 rounded-xl bg-gray-50 border-gray-200 text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="showPass"
                checked={showPassword}
                onCheckedChange={() => setShowPassword(!showPassword)}
              />
              <label htmlFor="showPass" className="text-sm text-gray-500 cursor-pointer">
                Show password
              </label>
            </div>
            {/* <NavLink to="/dashboard" className="text-sm text-indigo-600 hover:underline self-end"> */}
            {/* <Button
              type="submit"
                disabled={isAdminLoginLoading || duplicateLoginError || countdownLeft > 0}
              //disabled={isLoading}
              className="w-full h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium mt-1"
            >
              {isAdminLoginLoading ? "Signing in..." : "Sign in"}
              {/* {isLoading ? "Signing in..." : "Sign in"} 
            </Button> */}
            <div 
                     className="flex flex-col w-full">
                       <Button
                       className="w-full h-10 rounded-xl 
                       bg-green-600 hover:bg-green-700 text-white text-sm font-medium mt-1"
                        type="submit"
                           disabled={isAdminLoginLoading || duplicateLoginError || countdownLeft > 0}
                          >

                              {countdownLeft > 0 ? (
    <div className="mt-2 mb-2">
      🔒 Please wait{" "}
      <strong>
        {String(Math.floor(countdownLeft / 60)).padStart(2, "0")}m{" "}
        {String(countdownLeft % 60).padStart(2, "0")}s
      </strong>
      <br />
      <small
        style={{
          fontSize: "13px",
          display: "block",
          marginTop: "3px",
          color: "#333",
        }}
      >
        You can try again at{" "}
        <strong style={{ color: "#000" }}>{localTime}</strong>
      </small>
    </div>
  ) : isAdminLoginLoading ? (
    "Logging in..."
  ) : (
    "Login"
  )}
                          
                          </Button> 
                        {duplicateLoginError && (
  <div
  className="flex"
    style={{
      color: "#b91c1c",
      backgroundColor: "#fee2e2",
      border: "1px solid #fca5a5",
      borderRadius: "6px",
      padding: "8px 12px",
      marginTop: "10px",
      fontSize: "14px",
    }}
  >
    ⚠️ {duplicateLoginError}
  </div>
)}
                    </div>
            {/* </NavLink> */}
          </form>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Designed & developed by{" "}
            <a href="https://techpromind.com/" className="text-indigo-500 hover:underline">Techpromind</a>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Support: +91 99036 34360 · Mon–Fri, 11am–6pm
          </p>
        </div>
      </div>

    </div>
  </div>
);
}

//         <>
//         <div className="body">
//       <div className="container">
//     <div className="image-side">
//         <img src="/assets/images/bg-login.jpg"  style={{width:"100%", height:"100%"}} alt="Login Illustration" />
//     </div>
//     <div className="login-side">

    
//     <form onSubmit={handleSubmit(onSubmit)} className="login-form">
 
//   <div className="flex flex-col mb-3 gap-3 justify-center items-center">
//   <img src="/assets/images/resturant_biling_logo.png" className="w-50" alt="" />
//     <h3>Login</h3>

// </div>

//   <div className="mb-3">
//     <input
//       type="text"
//       placeholder="👤 Username"
//       {...register("username")}
    
//       style={{
//         width: "92%",
//         padding: "7px",
//         fontSize: "16px",
//         borderRadius: "6px",
//         border: "1px solid #ccc",
//       }}
//     />
//     {errors.username && (
//       <p className="error-message ">{errors.username.message}</p>
//     )}
//   </div>

//   {/* Password */}
//   <div className="mb-3">
//     <input
//       type={showPassword ? "text" : "password"}
//       placeholder="🔒 Password"
//       {...register("password")}
   
    
//       style={{
//         width: "92%",
//         padding: "7px",
//         fontSize: "16px",
//         borderRadius: "6px",
//         border: "1px solid #ccc",
//       }}
//     />
//         {errors.password && (
//       <p className="error-message ">{errors.password.message}</p>
//     )}
// </div>
  
//     <div
//   style={{
//     display: "flex",
//     alignItems: "center", // ✅ keeps checkbox & label perfectly centered vertically
//     gap: "8px", // ✅ consistent spacing between checkbox & text
//     marginTop: "8px",
//     flexWrap: "wrap", // ✅ ensures responsiveness on smaller screens
//   }}
// >
//   <input
//     type="checkbox"
//     id="showPassword"
//     checked={showPassword}
//     onChange={() => setShowPassword(!showPassword)}
//     style={{
//       width: "16px",
//       height: "16px",
//       cursor: "pointer",
//       flexShrink: 0, // ✅ prevents checkbox from shrinking on small screens
     
//     }}
//   />
//   <label
//     htmlFor="showPassword"
//     style={{
//       position: "relative",
//     bottom: "6px", // ✅ nudges label down to align with checkbox
//       fontSize: "14px",
//       color: "#333",
//       cursor: "pointer",
//      // ✅ aligns label perfectly with checkbox
//       userSelect: "none", // ✅ avoids accidental text selection
//       lineHeight: "1.5", // ✅ perfect alignment visually
//     }}
//   >
//     Show Password
//   </label>
// </div>


// <button
//   type="submit"
//   disabled={isLoading || duplicateLoginError || countdownLeft > 0}
 
//   style={{
//     backgroundColor: countdownLeft > 0 || isLoading || duplicateLoginError ? "#ccc" : "#ff0000",
//     color: countdownLeft > 0 || isLoading || duplicateLoginError ? "#444" : "#fff",
//     cursor: countdownLeft > 0 || isLoading || duplicateLoginError ? "not-allowed" : "pointer",
//     transition: "all 0.3s ease",
//   }}
// >
//   {countdownLeft > 0 ? (
//     <>
//       🔒 Please wait{" "}
//       <strong>
//         {String(Math.floor(countdownLeft / 60)).padStart(2, "0")}m{" "}
//         {String(countdownLeft % 60).padStart(2, "0")}s
//       </strong>
//       <br />
//       <small
//         style={{
//           fontSize: "13px",
//           display: "block",
//           marginTop: "3px",
//           color: "#333",
//         }}
//       >
//         You can try again at{" "}
//         <strong style={{ color: "#000" }}>{localTime}</strong>
//       </small>
//     </>
//   ) : isLoading ? (
//     "Logging in..."
//   ) : (
//     "Login"
//   )}
// </button>
// {duplicateLoginError && (
//   <div
//     style={{
//       color: "#b91c1c",
//       backgroundColor: "#fee2e2",
//       border: "1px solid #fca5a5",
//       borderRadius: "6px",
//       padding: "8px 12px",
//       marginTop: "10px",
//       fontSize: "14px",
//     }}
//   >
//     ⚠️ {duplicateLoginError}
//   </div>
// )}
//    <div className="bottom-text flex justify-center items-center">
//           <p>Designed & Developed by @ 
//             <NavLink to="https://techpromind.com/"
//           className="color: #ff0000"
//            target="_blank">Techpromind
//            </NavLink>
//            </p>
//         </div>

// </form>

//     </div>
//     </div>
//    </div>
//     </>
