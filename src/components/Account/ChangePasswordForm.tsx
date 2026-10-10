"use client";

import { useActionState } from "react";
import { changeOwnPassword } from "@/actions/account";

const ChangePasswordForm = () => {
  const [result, formAction, isPending] = useActionState(changeOwnPassword, null);

  return (
    <form action={formAction} className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-3 max-w-sm text-sm">
      <h2 className="font-semibold text-gray-800">Zmiana hasła</h2>
      <input name="currentPassword" type="password" required autoComplete="current-password" placeholder="Obecne hasło" className="border border-gray-200 rounded-md px-3 py-2" />
      <input name="newPassword" type="password" required autoComplete="new-password" placeholder="Nowe hasło" className="border border-gray-200 rounded-md px-3 py-2" />
      <input name="repeatPassword" type="password" required autoComplete="new-password" placeholder="Powtórz nowe hasło" className="border border-gray-200 rounded-md px-3 py-2" />
      {result && (
        <p className={result.ok ? 'text-green-700' : 'text-red-600'}>
          {result.ok ? 'Hasło zmienione.' : result.error}
        </p>
      )}
      <button disabled={isPending} className="self-start px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40">
        Zmień hasło
      </button>
    </form>
  );
};

export default ChangePasswordForm;
