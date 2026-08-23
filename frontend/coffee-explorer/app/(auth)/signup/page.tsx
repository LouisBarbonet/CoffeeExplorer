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
import styles from "../login/login.module.scss";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();

  const signupMutation = useMutation({
    mutationFn: () =>
      apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
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
          <p className={`text-sm ${styles.tagline}`}>Join your friends on their coffee-shop passport.</p>
          <p className={`mt-1 text-xs ${styles.est}`}>• EST. 2026 •</p>
        </div>

        <form
          className={`flex flex-col gap-4 p-6 ${styles.card}`}
          onSubmit={(e) => {
            e.preventDefault();
            signupMutation.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {signupMutation.isError && (
            <p className={`text-sm ${styles.error}`} role="alert">
              {signupMutation.error instanceof ApiError
                ? signupMutation.error.message
                : "Something went wrong"}
            </p>
          )}
          <Button type="submit" size="lg" disabled={signupMutation.isPending} className="mt-1">
            {signupMutation.isPending ? "Creating account…" : "Create account"}
          </Button>
          <p className={`text-center text-sm ${styles.tagline}`}>
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
