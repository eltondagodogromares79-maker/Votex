"use client";

import { useState } from "react";
import { EyeIcon } from "@/src/features/auth/components/register/AuthIcons";
import { AuthInput } from "./AuthInput";

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export function PasswordInput({
  label,
  error,
  required,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <AuthInput
        {...props}
        label={label}
        error={error}
        required={required}
        type={showPassword ? "text" : "password"}
      />

      <button
        type="button"
        onClick={() => setShowPassword((value) => !value)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="absolute right-3 top-[2.1rem] text-white/40 hover:text-white/80 transition-colors"
      >
        <EyeIcon open={showPassword} />
      </button>
    </div>
  );
}