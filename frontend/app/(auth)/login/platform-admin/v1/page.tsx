import { SignInForm } from "@/src/features/auth/components/login/SignInForm";

export const metadata = {
  title: "Platform Administration Sign In | VoteX",
  robots: { index: false, follow: false },
};

export default function PlatformAdminLoginPage() {
  return <SignInForm role="admin" adminOnly />;
}
