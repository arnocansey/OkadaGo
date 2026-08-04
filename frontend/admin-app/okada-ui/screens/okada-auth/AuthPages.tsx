"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import authBg from "../../images/auth-bg.png";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useAuth } from "@/lib/auth";
import { adminLogin, passengerLogin, passengerSignup, riderLogin, riderSignup } from "@/lib/auth-requests";
import { useToastAndLoader } from "@/components/providers/toast-and-loader-provider";

type AuthState = "login" | "signup" | "forgot";
type AuthAudience = "passenger" | "rider" | "admin";

const motorcycleTaxiCountryOptions = [
  { code: "+233", country: "Ghana" },
  { code: "+234", country: "Nigeria" },
  { code: "+254", country: "Kenya" },
  { code: "+256", country: "Uganda" },
  { code: "+250", country: "Rwanda" },
  { code: "+255", country: "Tanzania" },
  { code: "+229", country: "Benin" },
  { code: "+228", country: "Togo" },
  { code: "+232", country: "Sierra Leone" }
];

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").replace(/^0+/, "");
}

function buildE164(countryCode: string, phoneLocal: string) {
  return `${countryCode}${normalizePhone(phoneLocal)}`;
}

function getPasswordStrength(password: string) {
  if (!password) {
    return {
      score: 0,
      label: "Too weak",
      helper: "Use 8 or more characters for a stronger password."
    };
  }

  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      score,
      label: "Weak",
      helper: "Add more characters and mix letters, numbers, and symbols."
    };
  }

  if (score === 2) {
    return {
      score,
      label: "Fair",
      helper: "Add a number or symbol to make it stronger."
    };
  }

  if (score === 3) {
    return {
      score,
      label: "Good",
      helper: "Strong enough, but a symbol or extra length would make it better."
    };
  }

  return {
    score,
    label: "Strong",
    helper: "Great password strength."
  };
}

export function AuthPages({
  initialAuthState = "login",
  audience = "passenger"
}: {
  initialAuthState?: AuthState;
  audience?: AuthAudience;
}) {
  const router = useRouter();
  const { getDevice, setSession, session, status } = useAuth();
  const { showToast, showLoader, hideLoader } = useToastAndLoader();
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+233");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    setAuthState(initialAuthState);
    setErrorMessage(null);
    setInfoMessage(null);
  }, [initialAuthState]);

  const routeLinks = useMemo(() => {
    if (audience === "rider") {
      return {
        login: "/rider/login",
        signup: "/rider/signup",
        forgot: "/rider/forgot-password",
        success: "/rider"
      };
    }

    if (audience === "admin") {
      return {
        login: "/login",
        signup: "/login",
        forgot: "/login",
        success: "/"
      };
    }

    return {
      login: "/login",
      signup: "/signup",
      forgot: "/forgot-password",
      success: "/passenger"
    };
  }, [audience]);

  function resolvePostAuthTarget() {
    if (typeof window === "undefined") {
      return routeLinks.success;
    }

    const redirect = new URLSearchParams(window.location.search).get("redirect");
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      return redirect;
    }

    return routeLinks.success;
  }

  function navigateAfterAuth(target: string) {
    // Admin routes are gated by a cookie in proxy.ts. Soft client navigations can race
    // that gate, so use a full navigation so the cookie is present on the next request.
    if (audience === "admin") {
      window.location.assign(target);
      return;
    }

    router.push(target);
  }

  useEffect(() => {
    if (audience !== "admin") {
      return;
    }

    if (status === "authenticated" && session?.user?.role === "admin") {
      window.location.replace(resolvePostAuthTarget());
    }
  }, [audience, status, session, routeLinks.success]);

  const copy = useMemo(() => {
    if (audience === "rider") {
      return {
        brandBody:
          "Join verified riders earning every day across Accra and Kumasi. Fast payouts, insured trips, and a dashboard built for the hustle.",
        loginTitle: "Welcome back, rider",
        loginDescription: "Enter your phone number to continue to your rider dashboard.",
        signupTitle: "Create rider account",
        signupDescription: "Set up your rider profile to start receiving trips.",
        forgotDescription: "Enter your phone number to request a rider password reset.",
        loginAltText: "Need a rider account? ",
        loginAltCta: "Create one",
        signupCta: "Create Rider Account"
      };
    }

    if (audience === "admin") {
      return {
        brandBody:
          "Operate rider approvals, payouts, safety reports, and live city activity from one secure command center.",
        loginTitle: "Admin sign in",
        loginDescription: "Use your admin email and password to access platform operations.",
        signupTitle: "Create account",
        signupDescription: "Admin self-signup is not enabled on the web client.",
        forgotDescription: "Password reset is currently handled by the platform owner.",
        loginAltText: "Need admin access? ",
        loginAltCta: "Contact the platform owner",
        signupCta: "Create Account"
      };
    }

    return {
      brandBody:
        "Join over 50,000 riders in Accra and Kumasi who trust OkadaGo for their daily commute. Fast, insured, and professional.",
      loginTitle: "Welcome back",
      loginDescription: "Enter your phone number to continue.",
      signupTitle: "Create account",
      signupDescription: "Start your journey with OkadaGo today.",
      forgotDescription: "Enter your phone number to request a password reset.",
      loginAltText: "New to OkadaGo? ",
      loginAltCta: "Create an account",
      signupCta: "Create Account"
    };
  }, [audience]);

  async function onLoginSubmit(event: React.FormEvent) {
    event.preventDefault();
    showLoader("Signing you in...");
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const device = getDevice();
      const session =
        audience === "admin"
          ? await adminLogin({
              email: email.trim(),
              password,
              device,
              totpCode: totpCode.trim() || undefined,
              backupCode: backupCode.trim() || undefined
            })
          : audience === "rider"
            ? await riderLogin({
                phoneLocal: normalizePhone(phoneLocal),
                phoneE164: buildE164(countryCode, phoneLocal),
                password,
                device
              })
            : await passengerLogin({
                phoneLocal: normalizePhone(phoneLocal),
                phoneE164: buildE164(countryCode, phoneLocal),
                password,
                device
              });

      setSession(session);
      showToast("Welcome back!", "success");
      navigateAfterAuth(resolvePostAuthTarget());
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to sign in right now.";
      if (audience === "admin" && /two-factor|backup code/i.test(msg)) {
        setNeedsTotp(true);
        if (!totpCode.trim() && !backupCode.trim()) {
          setInfoMessage("Enter your authenticator code or a one-time backup code to finish signing in.");
          setErrorMessage(null);
          showToast("Two-factor code required", "info");
          return;
        }
      }
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      hideLoader();
    }
  }

  async function onSignupSubmit(event: React.FormEvent) {
    event.preventDefault();
    showLoader("Creating your account...");
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const normalizedPhone = normalizePhone(phoneLocal);
      const device = getDevice();

      const session =
        audience === "rider"
          ? await riderSignup({
              fullName,
              email: email.trim() || undefined,
              phoneCountryCode: countryCode,
              phoneLocal: normalizedPhone,
              phoneE164: buildE164(countryCode, normalizedPhone),
              preferredCurrency: "GHS",
              password,
              city: "Accra",
              device
            })
          : await passengerSignup({
              fullName,
              email: email.trim() || undefined,
              phoneCountryCode: countryCode,
              phoneLocal: normalizedPhone,
              phoneE164: buildE164(countryCode, normalizedPhone),
              preferredCurrency: "GHS",
              password,
              defaultServiceCity: "Accra",
              preferredPayment: "cash",
              device
            });

      setSession(session);
      showToast("Welcome to OkadaGo!", "success");
      navigateAfterAuth(resolvePostAuthTarget());
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to create your account right now.";
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      hideLoader();
    }
  }

  function onForgotSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    const msg =
      audience === "admin"
        ? "Admin password reset is not connected on the web client yet. Please contact the platform owner."
        : "Password reset is not connected to the backend yet. Please contact support or return to login for now.";
    setInfoMessage(msg);
    showToast(msg, "warning");
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col md:min-h-screen md:flex-row font-sans">
      {/* Left side brand column */}
      <div className="hidden md:flex md:w-1/2 bg-[#0a0b0d] relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0">
          <img
            src={authBg.src}
            alt="City Background"
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0d] via-[#0a0b0d]/80 to-[#0a0b0d]/28" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0a0b0d]/70 to-transparent" />
        </div>

        <Link href="/" className="relative z-10 flex items-center w-fit">
          <BrandMark variant="wordmark" onDark product={audience === "rider" ? "rider" : "passenger"} height={32} priority />
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-sm text-white backdrop-blur-md">
            <Shield className="w-4 h-4 text-primary" />
            Your safety is our priority
          </div>
          <h1 className="mb-6 mt-6 text-4xl font-bold leading-tight lg:text-5xl">
            Move through the city with confidence.
          </h1>
          <p className="text-lg text-white/80">{copy.brandBody}</p>
        </motion.div>
      </div>

      {/* Right side form column */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto bg-white text-foreground px-5 py-8 sm:px-8 sm:py-10 md:p-12">
        <div className="w-full max-w-md md:max-w-lg">
          <div className="mb-6 flex justify-start">
            <Link
              href="/"
              className="auth-home-link"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to OkadaGo home
            </Link>
          </div>

          <Link href="/" className="mb-10 flex items-center md:hidden w-fit">
            <BrandMark variant="wordmark" height={30} priority />
          </Link>

          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {errorMessage}
              </motion.div>
            )}
            {infoMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {infoMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {authState === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <div className="mb-8 text-center md:text-left">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900">{copy.loginTitle}</h2>
                  <p className="text-slate-600">{copy.loginDescription}</p>
                </div>

                <form onSubmit={onLoginSubmit} className="space-y-5">
                  {audience === "admin" ? (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@okadago.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex">
                        <select
                          aria-label="Country code"
                          className="min-h-12 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-[#f7c600]"
                          value={countryCode}
                          onChange={(event) => setCountryCode(event.target.value)}
                        >
                          {motorcycleTaxiCountryOptions.map((option) => (
                            <option key={option.code} value={option.code}>
                              {option.country} ({option.code})
                            </option>
                          ))}
                        </select>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="024 123 4567"
                          className="min-w-0 rounded-l-none"
                          value={phoneLocal}
                          onChange={(event) => setPhoneLocal(event.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href={routeLinks.forgot}
                        className="text-sm font-semibold hover:underline"
                        style={{ color: "#8a6c00" }}
                      >
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="........"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {audience === "admin" && needsTotp && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="totp">Authenticator code</Label>
                        <Input
                          id="totp"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          value={totpCode}
                          onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ""))}
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="backup">Or backup code</Label>
                        <Input
                          id="backup"
                          type="text"
                          placeholder="XXXX-XXXX"
                          value={backupCode}
                          onChange={(event) => setBackupCode(event.target.value.toUpperCase())}
                        />
                        <p className="text-xs text-slate-500">
                          Use either your authenticator app code or a one-time backup code.
                        </p>
                      </div>
                    </div>
                  )}

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button type="submit" className="h-12 w-full bg-primary text-base text-[#0a0b0d] hover:bg-primary/90" disabled={loading}>
                      {loading ? "Please wait..." : "Log in"}
                    </Button>
                  </motion.div>
                </form>

                <div className="mt-8 text-center text-sm">
                  <span className="text-slate-600">{copy.loginAltText}</span>
                  <Link
                    href={routeLinks.signup}
                    className="font-bold hover:underline"
                    style={{ color: "#8a6c00" }}
                  >
                    {copy.loginAltCta}
                  </Link>
                </div>
              </motion.div>
            )}

            {authState === "signup" && audience !== "admin" && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <Link
                  href={routeLinks.login}
                  className="mb-6 flex items-center text-sm font-semibold transition-colors hover:text-[#8a6c00]"
                  style={{ color: "#334155" }}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back to login
                </Link>

                <div className="mb-8">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900">{copy.signupTitle}</h2>
                  <p className="text-slate-600">{copy.signupDescription}</p>
                </div>

                <form onSubmit={onSignupSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="Kwame"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Mensah"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <div className="flex">
                      <select
                        aria-label="Country code"
                        className="min-h-12 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-[#f7c600]"
                        value={countryCode}
                        onChange={(event) => setCountryCode(event.target.value)}
                      >
                        {motorcycleTaxiCountryOptions.map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.country} ({option.code})
                          </option>
                        ))}
                      </select>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="024 123 4567"
                        className="min-w-0 rounded-l-none"
                        value={phoneLocal}
                        onChange={(event) => setPhoneLocal(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors outline-none"
                        aria-label={showSignupPassword ? "Hide password" : "Show password"}
                      >
                        {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {Array.from({ length: 4 }).map((_, index) => {
                        const active = index < passwordStrength.score;
                        const muted = index === passwordStrength.score - 1 && passwordStrength.score === 3;

                        return (
                          <div
                            key={index}
                            className="h-2 flex-1 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: active
                                ? muted
                                  ? "#9EC5B7"
                                  : "#f7c600"
                                : "#D7DEE7",
                              boxShadow: active && !muted ? "0 1px 6px rgba(247, 198, 0, 0.2)" : "none"
                            }}
                          />
                        );
                      })}
                    </div>
                    <p className="mt-1 text-xs font-semibold transition-colors duration-300" style={{ color: passwordStrength.score >= 3 ? "#8a6c00" : "#64748B" }}>
                      {passwordStrength.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {passwordStrength.helper}
                    </p>
                  </div>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button type="submit" className="h-12 w-full bg-primary text-base text-[#0a0b0d] hover:bg-primary/90" disabled={loading}>
                      {loading ? "Creating account..." : copy.signupCta}
                    </Button>
                  </motion.div>

                  <p className="mt-4 text-center text-xs text-slate-500">
                    By creating an account, you agree to our{" "}
                    <a href="#" className="font-medium text-slate-700 underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="font-medium text-slate-700 underline">
                      Privacy Policy
                    </a>.
                  </p>
                </form>
              </motion.div>
            )}

            {authState === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <Link
                  href={routeLinks.login}
                  className="mb-8 flex items-center text-sm font-semibold transition-colors hover:text-[#8a6c00]"
                  style={{ color: "#334155" }}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back to login
                </Link>

                <div className="mb-8">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900">Reset password</h2>
                  <p className="text-slate-600">{copy.forgotDescription}</p>
                </div>

                <form onSubmit={onForgotSubmit} className="space-y-6">
                  {audience === "admin" ? (
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Admin Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="admin@okadago.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="forgot-phone">Phone Number</Label>
                      <div className="flex">
                        <select
                          aria-label="Country code"
                          className="min-h-12 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-[#f7c600]"
                          value={countryCode}
                          onChange={(event) => setCountryCode(event.target.value)}
                        >
                          {motorcycleTaxiCountryOptions.map((option) => (
                            <option key={option.code} value={option.code}>
                              {option.country} ({option.code})
                            </option>
                          ))}
                        </select>
                        <Input
                          id="forgot-phone"
                          type="tel"
                          placeholder="024 123 4567"
                          className="min-w-0 rounded-l-none"
                          value={phoneLocal}
                          onChange={(event) => setPhoneLocal(event.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button type="submit" className="h-12 w-full bg-primary text-base text-[#0a0b0d] hover:bg-primary/90" disabled={loading}>
                      Continue
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
