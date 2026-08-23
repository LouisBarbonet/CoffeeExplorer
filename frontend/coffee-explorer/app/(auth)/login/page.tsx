"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DoodleScatter } from "@/components/brand/doodle-scatter";
import styles from "./login.module.scss";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailId = useId();
  const passwordId = useId();

  const loginMutation = useMutation({
    mutationFn: () =>
      apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
  });

  return (
    <div className={`relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12 ${styles.page}`}>
      <DoodleScatter className="pointer-events-none absolute -top-12 -right-16 h-[28rem] w-[28rem] opacity-70 sm:h-[34rem] sm:w-[34rem]" />

      <div className="relative flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-1">
          <span className={`text-4xl leading-none font-bold tracking-tight ${styles.wordmark}`}>
            Coffee<span className={styles.wordmarkAccent}>Explorer</span>
          </span>
          <p className={`text-sm ${styles.tagline}`}>Your personal coffee-shop passport, one stamp at a time.</p>
          <p className={`mt-1 text-xs ${styles.est}`}>• EST. 2026 •</p>
        </div>

        <form
          className={`flex flex-col gap-4 p-6 ${styles.card}`}
          onSubmit={(e) => {
            e.preventDefault();
            loginMutation.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={passwordId}>Password</Label>
            <Input
              id={passwordId}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {loginMutation.isError && (
            <p className={`text-sm ${styles.error}`} role="alert">
              {loginMutation.error instanceof ApiError
                ? loginMutation.error.message
                : "Something went wrong"}
            </p>
          )}
          <Button type="submit" size="lg" disabled={loginMutation.isPending} className="mt-1">
            {loginMutation.isPending ? "Signing in…" : "Sign in"}
          </Button>
          <p className={`text-center text-sm ${styles.tagline}`}>
            New here?{" "}
            <Link href="/signup" className="underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
