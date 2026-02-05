"use client";

import React, { useEffect, useState } from "react";
import useFetch from "../hooks/useFetch";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type LoginForm = {
  email: string;
  password: string;
};

type RegistrationForm = {
  Fullname: string;
  email: string;
  role: "user" | "admin";
  password: string;
};

const LoginComponent = () => {
  const router = useRouter();
  const [toggle, setToggle] = useState(true);

  const [loginForm, setLoginForm] = useState<LoginForm>({ email: "", password: "" });
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm>({
    Fullname: "",
    email: "",
    role: "user",
    password: "",
  });

  const {
    result: resultLogin,
    error: errorLogin,
    success: successLogin,
    loading: loadingLogin,
    fetchData: fetchLogin,
  } = useFetch("http://localhost:8000/api/v1/user/login", "POST");

  const {
    result: resultRegister,
    error: errorRegister,
    success: successRegister,
    loading: loadingRegister,
    fetchData: fetchRegister,
  } = useFetch("http://localhost:8000/api/v1/user/register", "POST");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchLogin(loginForm);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchRegister(registrationForm);
  };

  useEffect(() => {
    if (successLogin && resultLogin) router.push("/dashboard");
  }, [successLogin, resultLogin, router]);

  useEffect(() => {
    if (successRegister && resultRegister)
      router.push(`/verify-otp?email=${registrationForm.email}`);
  }, [successRegister, resultRegister, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A47A3] overflow-hidden relative">
      {/* Background glow animation */}
      <div className="absolute w-[800px] h-[800px] bg-[#124BB8] rounded-full blur-3xl opacity-30 -top-60 -left-60 animate-pulse"></div>
      <div className="absolute w-[700px] h-[700px] bg-[#1E56C3] rounded-full blur-3xl opacity-30 bottom-0 right-0 animate-[float_6s_ease-in-out_infinite]"></div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(20px);
          }
        }
      `}</style>

      {/* Animated card */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center w-[400px]"
      >
        {/* Logo with text on the right */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="mb-10 flex items-center justify-center gap-3"
        >
          <ShoppingCart className="w-12 h-12 stroke-white" />
          <div className="flex flex-col">
            <span className="text-white text-2xl font-bold leading-tight">
              3B Traders
            </span>
            <span className="text-white/90 text-lg font-medium">
              Smart IMS
            </span>
          </div>
        </motion.div>

        {/* Form switching animation */}
        <AnimatePresence mode="wait">
          {toggle ? (
            <motion.form
              key="login"
              onSubmit={handleLogin}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col space-y-4"
            >
              <input
                type="email"
                placeholder="EMAIL"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="bg-transparent border border-white/50 rounded-md p-3 placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <input
                type="password"
                placeholder="PASSWORD"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="bg-transparent border border-white/50 rounded-md p-3 placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loadingLogin}
                className="bg-white text-[#0A47A3] font-semibold py-2 rounded-md transition"
              >
                {loadingLogin ? "Logging in..." : "LOGIN"}
              </motion.button>
              <p className="text-sm text-center mt-2 cursor-pointer hover:underline">
                Forgot password?
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              onSubmit={handleRegister}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col space-y-4 text-white"
            >
              <input
                type="text"
                placeholder="FULL NAME"
                required
                value={registrationForm.Fullname}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, Fullname: e.target.value })
                }
                className="bg-transparent border border-white/50 rounded-md p-3 placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <input
                type="email"
                placeholder="EMAIL"
                required
                value={registrationForm.email}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, email: e.target.value })
                }
                className="bg-transparent border border-white/50 rounded-md p-3 placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <input
                type="password"
                placeholder="PASSWORD"
                required
                value={registrationForm.password}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, password: e.target.value })
                }
                className="bg-transparent border border-white/50 rounded-md p-3 placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <select
                value={registrationForm.role}
                onChange={(e) =>
                  setRegistrationForm({
                    ...registrationForm,
                    role: e.target.value as "user" | "admin",
                  })
                }
                className="bg-transparent border border-white/50 rounded-md p-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option className="text-black" value="user">User</option>
                <option className="text-black" value="admin">Admin</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="bg-white text-[#0A47A3] font-semibold py-2 rounded-md transition"
              >
                {loadingRegister ? "Registering..." : "REGISTER"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Toggle button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setToggle((prev) => !prev)}
          className="text-white/80 text-sm underline mt-6 hover:text-white transition"
        >
          {toggle ? "No account? Register" : "Already have an account? Login"}
        </motion.button>

        {(errorLogin || errorRegister) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 bg-red-500 px-4 py-2 rounded text-white text-sm"
          >
            {errorLogin || errorRegister}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default LoginComponent;