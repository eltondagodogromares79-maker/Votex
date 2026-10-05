import { SignInForm } from "@/src/features/auth/components/login/SignInForm";

export const metadata = {
  title: "Admin Sign In | Votex",
};

export default function AdminLoginPage() {
  return <SignInForm role="admin" />;
}
