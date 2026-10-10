"use client";

import { useActionState } from "react";
import { login } from "@/actions/account";

const LoginForm = ({ callbackUrl }: { callbackUrl: string }) => {
  const [error, formAction, isPending] = useActionState(login, null);

  return (
    <form action={formAction} className="bg-white rounded-lg shadow-sm p-6 flex flex-col gap-4 w-full max-w-sm mt-12">
      <h1 className="text-2xl font-bold text-gray-900">Logowanie</h1>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <input name="email" type="email" required autoComplete="username" placeholder="E-mail" className="border border-gray-200 rounded-md px-3 py-2" />
      <input name="password" type="password" required autoComplete="current-password" placeholder="Hasło" className="border border-gray-200 rounded-md px-3 py-2" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={isPending} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40">
        {isPending ? 'Logowanie…' : 'Zaloguj'}
      </button>
    </form>
  );
};

export default LoginForm;
