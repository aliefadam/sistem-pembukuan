import { Head, useForm } from "@inertiajs/react";
import { FormEvent } from "react";
import { Button, Input } from "../../components/ui";

export default function Login() {
  const form = useForm({
    email: "",
    password: "",
    remember: false,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    form.post("/login", {
      onFinish: () => form.reset("password"),
    });
  }

  return (
    <>
      <Head title="Masuk" />
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-lg shadow-blue-600/30">
              <i className="fi fi-rr-briefcase" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Pembukuan Usaha
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Masuk untuk melanjutkan ke aplikasi
            </p>
          </div>

          <form
            onSubmit={submit}
            className="flex flex-col gap-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          >
            <Input
              label="Email"
              type="email"
              autoComplete="username"
              autoFocus
              required
              value={form.data.email}
              onChange={(event) => form.setData("email", event.target.value)}
              error={form.errors.email}
            />
            <Input
              label="Kata Sandi"
              type="password"
              autoComplete="current-password"
              required
              value={form.data.password}
              onChange={(event) => form.setData("password", event.target.value)}
              error={form.errors.password}
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.data.remember}
                onChange={(event) => form.setData("remember", event.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Ingat saya
            </label>
            <Button type="submit" fullWidth loading={form.processing}>
              Masuk
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
