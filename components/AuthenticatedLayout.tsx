import { auth } from '@/auth';
import { getTenantBySlug } from '@/lib/tenant';
import AppLayout from './AppLayout';

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    return <>{children}</>;
  }

  const tenantSlug = (session as any).tenantSlug as string;
  const userName = (session as any).user?.name || (session as any).user?.email;

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
