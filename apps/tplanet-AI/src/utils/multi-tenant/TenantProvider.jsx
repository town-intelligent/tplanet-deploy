/**
 * TenantProvider - Loads tenant config and provides context.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TenantContext, DEFAULT_CONFIG, createInitialState, setTenantOverride } from './TenantContext';

async function fetchTenantConfig(tenantId, configUrl) {
  const url = configUrl.replace('{tenant}', tenantId);
  const response = await fetch(url, { headers: { 'X-Tenant-ID': tenantId } });
  if (!response.ok) throw new Error(`Failed to fetch tenant config: ${response.status}`);
  const data = await response.json();
  return data.data || data;
}

export function TenantProvider({ children, configUrl, staticConfig, onTenantChange }) {
  const [state, setState] = useState(createInitialState);
  const fetchedRef = useRef({});

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `${state.tenant}:${configUrl}`;

    // Prevent duplicate fetches for the same tenant/configUrl
    if (fetchedRef.current[cacheKey]) {
      return;
    }

    async function loadConfig() {
      if (staticConfig?.[state.tenant]) {
        setState(prev => ({
          ...prev,
          config: { ...DEFAULT_CONFIG, ...staticConfig[state.tenant] },
          loading: false,
        }));
        fetchedRef.current[cacheKey] = true;
        return;
      }

      if (!configUrl) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const config = await fetchTenantConfig(state.tenant, configUrl);
        if (!cancelled) {
          setState(prev => ({ ...prev, config: { ...DEFAULT_CONFIG, ...config }, loading: false, error: null }));
          fetchedRef.current[cacheKey] = true;
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to load tenant config:', error);
          setState(prev => ({ ...prev, loading: false, error }));
        }
      }
    }

    loadConfig();
    return () => { cancelled = true; };
  }, [state.tenant, configUrl, staticConfig]);

  useEffect(() => {
    if (onTenantChange && !state.loading) onTenantChange(state.tenant, state.config);
  }, [state.tenant, state.config, state.loading, onTenantChange]);

  const setTenant = useCallback((tenantId) => {
    setTenantOverride(tenantId);
    setState(prev => ({ ...prev, tenant: tenantId, loading: true }));
  }, []);

  // Memoize context value to prevent infinite re-renders
  const contextValue = useMemo(() => ({
    tenant: state.tenant,
    config: state.config,
    loading: state.loading,
    error: state.error,
    setTenant,
  }), [state.tenant, state.config, state.loading, state.error, setTenant]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

export default TenantProvider;
