import { SignInForm } from "@/src/features/auth/components/login/SignInForm";

export const metadata = {
  title: "Audience Sign In | Votex",
};

export default function AudienceLoginPage() {
  return <SignInForm role="audience" />;
}
