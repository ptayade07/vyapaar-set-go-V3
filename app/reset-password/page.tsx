import { ResetPasswordForm } from "@/frontend/components/reset-password-form";

type Props = {
  searchParams?: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params?.token ?? null;

  return (
    <div className="min-h-screen overflow-y-auto bg-[var(--background)] px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-600 text-4xl font-bold text-white shadow-lg">
            व
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Vyapaar Set Go</h1>
          <p className="mt-1 text-sm text-gray-500">Naya password set karo — Set a new password</p>
        </div>

        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
