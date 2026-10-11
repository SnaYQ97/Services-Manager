import { getSettings } from "@/actions/settings";
import SessionSettingsForm from "@/components/Management/SessionSettingsForm";
import { isManager } from "@/lib/session";

export default async function SettingsPage() {
  // layout pokazuje komunikat o braku dostępu, a strona renderuje się równolegle
  if (!(await isManager())) return null;
  return <SessionSettingsForm initial={await getSettings()} />;
}
