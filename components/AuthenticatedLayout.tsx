import { auth } from '@/auth';
import { getTenantBySlug } from '@/lib/tenant';
import AppLayout from './AppLayout';
import { getSessionData } from '@/lib/types/auth';

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = getSessionData(await auth());

  if (!session) {
    return <>{children}</>;
  }

  const tenantSlug = session.tenantSlug;
  const userName = session.user?.name || session.user?.email || 'User';

  let tenantName = tenantSlug;
  try {
    const tenant = await getTenantBySlug(tenantSlug);
    if (tenant) {
      tenantName = tenant.name;
    }
  } catch (e) {
    // Ignore error, use slug as fallback
  }

  return (
    <AppLayout tenantName={tenantName} userName={userName}>
      {children}
    </AppLayout>
  );
}
