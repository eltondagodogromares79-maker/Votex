import { SignInForm } from "@/src/features/auth/components/login/SignInForm";

export const metadata = {
  title: "Organization Owner Sign In | Votex",
};

export default function OrgOwnerLoginPage() {
  return <SignInForm role="org_owner" />;
}
