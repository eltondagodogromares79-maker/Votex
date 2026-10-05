import { SignInForm } from "@/src/features/auth/components/login/SignInForm";

export const metadata = {
  title: "Judge Sign In | Votex",
};

export default function JudgeLoginPage() {
  return <SignInForm role="judge" />;
}
