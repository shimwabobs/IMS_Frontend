"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import useFetch from "../hooks/useFetch";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const { fetchData, loading, error, success } = useFetch(
    "http://localhost:8000/api/v1/user/verify-otp",
    "POST"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchData({ email, otp });
  };

  useEffect(() => {
    if (success) {
      // delay for a small animation
      setTimeout(() => router.push("/"), 1200);
    }
  }, [success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A47A3] overflow-hidden relative">
      {/* Background glowing shapes */}
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

      {/* Card with motion animation */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-[400px] bg-transparent text-white text-center"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl font-bold mb-4"
        >
          Verify Your Account
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-6 text-white/80"
        >
          Enter the OTP sent to <span className="font-semibold">{email}</span>
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col space-y-4"
        >
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            autoComplete="off"
            required
            maxLength={6}
            className="bg-transparent border border-white/50 rounded-md p-3 placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white text-center text-lg tracking-widest"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            type="submit"
            className="bg-white text-[#0A47A3] font-semibold py-2 rounded-md transition"
          >
            {loading ? "Verifying..." : "VERIFY OTP"}
          </motion.button>
        </motion.form>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 mt-4"
          >
            Invalid OTP. Please try again.
          </motion.p>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center mt-6"
          >
            <CheckCircle className="w-14 h-14 text-green-400 mb-2" />
            <p className="text-green-400 text-lg">OTP Verified!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
