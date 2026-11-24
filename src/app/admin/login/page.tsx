import { LoginForm } from "@/components/admin/login-form";

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-5">
      <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />
      <LoginForm />
    </main>
  );
}
