/**
 * TenantContext - Re-exports from multi-tenant module.
 *
 * For backward compatibility. New code should import from:
 *   import { TenantProvider, useTenant } from '@/utils/multi-tenant';
 */

export {
  TenantProvider,
  TenantThemeProvider,
  useTenant,
  useFeature,
  useTenantTheme,
  detectTenant,
  setTenantOverride,
} from './multi-tenant';

export { TENANT_CONFIG } from './multi-tenant/tenantConfig';

// Legacy default export
export { TenantProvider as default } from './multi-tenant';
