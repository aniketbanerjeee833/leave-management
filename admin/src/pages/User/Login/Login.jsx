
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { User, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdminLoginMutation } from "@/redux/api/userApi";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [countdownLeft, setCountdownLeft] = useState(0);
  const [duplicateLoginError, setDuplicateLoginError] = useState("");

  const [loginUser, { isLoading: isAdminLoginLoading }] =
    useAdminLoginMutation();

  const {
    register,
    handleSubmit,
  } = useForm();

  // Restore login block after page refresh
  useEffect(() => {
    const saved = localStorage.getItem("blockedUntil");

    if (saved && Number(saved) > Date.now()) {
      setBlockedUntil(Number(saved));
    } else {
      localStorage.removeItem("blockedUntil");
    }
  }, []);

  // Store blocked time
  useEffect(() => {
    if (blockedUntil) {
      localStorage.setItem("blockedUntil", blockedUntil);
    } else {
      localStorage.removeItem("blockedUntil");
    }
  }, [blockedUntil]);

  // Login block countdown
  useEffect(() => {
    if (!blockedUntil) {
      setCountdownLeft(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((blockedUntil - Date.now()) / 1000)
      );

      setCountdownLeft(remaining);

      if (remaining <= 0) {
        setBlockedUntil(null);
      }
    };

    updateCountdown();

    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [blockedUntil]);

  const localTime =
    blockedUntil && blockedUntil > Date.now()
      ? new Date(blockedUntil).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Kolkata",
        })
      : null;

  // Login submit
  const onSubmit = async (data) => {
    setDuplicateLoginError("");

    try {
      const response = await loginUser({
        username: data.username,
        password: data.password,
      }).unwrap();

      if (response?.success) {
        toast.success("Login successful");

        // Redirect using href
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Login error:", err);

      // Too many login attempts
      if (err?.status === 429 && err?.data?.blockedUntil) {
        const blockedTime = new Date(err.data.blockedUntil).getTime();

        setBlockedUntil(blockedTime);

        const readableTime = new Date(blockedTime).toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          }
        );

        toast.error(
          `Too many login attempts. Please try again at ${readableTime}.`
        );
      }

      // Already logged in on another device
      else if (err?.status === 403) {
        const message =
          "You are already logged in on another device. Please log out there or wait until your session expires.";

        toast.error(message);
        setDuplicateLoginError(message);
      }

      // Other errors
      else {
        toast.error(
          err?.data?.message || "Something went wrong. Please try again."
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 h-dvh w-full overflow-hidden bg-white">
      <div className="grid h-full w-full grid-cols-1 sm:grid-cols-12">

        {/* LEFT PANEL - FULL POLICE TRAINING PHOTO */}
        <div className="relative hidden h-full overflow-hidden sm:col-span-6 sm:block">
          <img
            src="/assets/images/police-training-left-panel.png"
            alt="Indian police trainees during training"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* Subtle overlay for a professional appearance */}
          <div className="absolute inset-0 bg-gradient-to-t from-green-950/25 via-transparent to-red-900/10" />
        </div>

        {/* RIGHT PANEL - LOGIN */}
        <div className="col-span-1 flex h-full items-center justify-center overflow-y-auto bg-white px-5 py-5 sm:col-span-6 sm:px-10 lg:px-16">

          <div className="w-full max-w-md">

            {/* Login heading */}
            <div className="mb-9 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-800">
                <ShieldCheck size={30} strokeWidth={1.8} />
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-green-900">
                Login
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Sign in to access the Police Training portal
              </p>

              <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-red-600" />
            </div>

            {/* Login form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              {/* Username */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Username
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <Input
                    type="text"
                    placeholder="Enter your username"
                    autoComplete="username"
                    {...register("username")}
                    required
                    className="h-12 rounded-xl border-gray-300 bg-gray-50 pl-11 text-sm focus-visible:ring-green-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    {...register("password")}
                    required
                    className="h-12 rounded-xl border-gray-300 bg-gray-50 pl-11 pr-12 text-sm focus-visible:ring-green-600"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-green-800"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {/* Login button */}
              <Button
                type="submit"
                disabled={
                  isAdminLoginLoading ||
                  Boolean(duplicateLoginError) ||
                  countdownLeft > 0
                }
                className="mt-2 h-12 w-full rounded-xl bg-green-600 text-base font-semibold text-white shadow-sm transition-colors hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {countdownLeft > 0 ? (
                  <span className="text-sm">
                    Please wait{" "}
                    {String(Math.floor(countdownLeft / 60)).padStart(2, "0")}
                    m{" "}
                    {String(countdownLeft % 60).padStart(2, "0")}s
                  </span>
                ) : isAdminLoginLoading ? (
                  "Logging in..."
                ) : (
                  "Login"
                )}
              </Button>

              {/* Blocked login message */}
              {countdownLeft > 0 && (
                <p className="text-center text-sm text-red-700">
                  Too many login attempts. Try again at{" "}
                  <strong>{localTime}</strong>.
                </p>
              )}

              {/* Duplicate login error */}
              {duplicateLoginError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
                  {duplicateLoginError}
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="mt-10 border-t border-gray-100 pt-5 text-center">
              <p className="text-xs text-gray-400">
                Designed & developed by{" "}
                <a
                  href="https://techpromind.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-green-800 hover:text-red-600 hover:underline"
                >
                  Techpromind
                </a>
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Support: +91 99036 34360 · Mon–Fri, 11am–6pm
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
