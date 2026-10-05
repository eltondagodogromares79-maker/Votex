import { SignInForm } from "@/src/features/auth/components/login/SignInForm";

export const metadata = {
  title: "Tabulator Sign In | Votex",
};

export default function TabulatorLoginPage() {
  return <SignInForm role="tabulator" />;
}
