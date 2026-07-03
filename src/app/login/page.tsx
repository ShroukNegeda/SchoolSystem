import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">
            تسجيل الدخول
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-2">
            للمدرسين وشؤون الطلبة والإدارة
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
