/**
 * Tenant detection utilities.
 * Detects current tenant from subdomain, header, or localStorage.
 */

const SUBDOMAIN_MAP = {
  'nantou': 'nantou-gov',
  'newtaipei': 'newtaipei-city',
  'taichung': 'taichung-city',
};

/**
 * Detect tenant from current hostname.
 * @returns {string} Tenant ID
 */
export function detectTenantFromHostname() {
  const hostname = window.location.hostname;

  // Check subdomain pattern: {tenant}.domain.com
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const subdomain = parts[0].toLowerCase();

    // Skip common subdomains
    if (['www', 'api', 'localhost'].includes(subdomain)) {
      return 'default';
    }

    // Map subdomain to tenant ID
    if (SUBDOMAIN_MAP[subdomain]) {
      return SUBDOMAIN_MAP[subdomain];
    }

    // Use subdomain directly as tenant ID
    if (subdomain !== 'localhost' && subdomain !== '127') {
      return subdomain;
    }
  }

  return 'default';
}

/**
 * Detect tenant from X-Tenant-ID header (set by reverse proxy).
 * @returns {string|null} Tenant ID or null
 */
export function detectTenantFromHeader() {
  // This would be set by the server in meta tag or window object
  return window.__TENANT_ID__ || null;
}

/**
 * Detect tenant from localStorage (for development/testing).
 * @returns {string|null} Tenant ID or null
 */
export function detectTenantFromStorage() {
  try {
    return localStorage.getItem('tenant_id');
  } catch {
    return null;
  }
}

/**
 * Detect tenant using priority order.
 * Priority: header > storage > hostname > default
 * @returns {string} Tenant ID
 */
export function detectTenant() {
  return (
    detectTenantFromHeader() ||
    detectTenantFromStorage() ||
    detectTenantFromHostname()
  );
}

/**
 * Set tenant ID in localStorage (for development).
 * @param {string} tenantId - Tenant ID to set
 */
export function setTenantOverride(tenantId) {
  try {
    if (tenantId) {
      localStorage.setItem('tenant_id', tenantId);
    } else {
      localStorage.removeItem('tenant_id');
    }
  } catch {
    // Ignore storage errors
  }
}

export default detectTenant;
