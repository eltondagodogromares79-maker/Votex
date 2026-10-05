import { SignInForm } from "@/src/features/auth/components/login/SignInForm";

export const metadata = {
  title: "Coordinator Sign In | Votex",
};

export default function CoordinatorLoginPage() {
  return <SignInForm role="coordinator" />;
}
