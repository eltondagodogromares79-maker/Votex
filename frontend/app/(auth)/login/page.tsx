import { SignInForm } from "@/src/features/auth/components/login/SignInForm";

export const metadata = {
  title: "Sign In | VoteX",
};

export default function LoginPage() {
  return <SignInForm role="audience" generalLogin />;
}
