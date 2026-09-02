"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const authSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthFormValues = z.infer<typeof authSchema>;

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormValues, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault(); // <-- CRITICAL: Prevent page reload
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        if (!data.fullName) {
          setError("Full name is required");
          setIsLoading(false);
          return;
        }
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: { full_name: data.fullName } }
        });

        if (error) {
          console.error("Sign-up error:", error.message);
          alert(error.message); // Show error to user so it's not silent
          setIsLoading(false);
          return;
        }

        console.log("Sign-up success:", authData);
        router.replace("/workspaces");
        router.refresh(); // Forces Next.js to update server components with the new auth session
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          console.error("Sign-in error:", error.message);
          alert(error.message); // Show error to user so it's not silent
          setIsLoading(false);
          return;
        }

        console.log("Sign-in success:", authData);
        router.replace("/workspaces");
        router.refresh(); // Forces Next.js to update server components with the new auth session
      }
    } catch (err: any) {
      console.error("Unexpected error during auth:", err);
      alert(err?.message || "An unexpected error occurred");
      setError(err?.message || "An error occurred");
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    reset();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      {isSignUp && (
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Name
          </label>
          <div>
            <input
              id="fullName"
              type="text"
              {...register("fullName")}
              className="appearance-none block w-full px-4 py-3 bg-white/50 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm text-slate-900 transition-all"
              placeholder="John Doe"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
            )}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          {isSignUp ? "Work Email" : "Email address"}
        </label>
        <div>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="appearance-none block w-full px-4 py-3 bg-white/50 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm text-slate-900 transition-all"
            placeholder="user@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
          Password
        </label>
        <div>
          <input
            id="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            {...register("password")}
            className="appearance-none block w-full px-4 py-3 bg-white/50 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm text-slate-900 transition-all"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
      </div>

      {isSignUp && (
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
            Confirm Password
          </label>
          <div>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              className="appearance-none block w-full px-4 py-3 bg-white/50 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm text-slate-900 transition-all"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded bg-white"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
            Remember me
          </label>
        </div>

        {!isSignUp && (
          <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Forgot password?
            </a>
          </div>
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (isSignUp ? "Signing up..." : "Signing in...") : (isSignUp ? "Sign up" : "Sign in")}
        </button>
      </div>

      <div className="text-center mt-4">
        <button 
          type="button" 
          onClick={toggleMode}
          className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>
      </div>
    </form>
  );
}
