import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-extrabold text-[var(--color-primary-dark)]">
            إنشاء حساب جديد
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-2">
            للمدرسين وشؤون الطلبة — حدد بياناتك ووظيفتك بالمدرسة
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-sm">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
