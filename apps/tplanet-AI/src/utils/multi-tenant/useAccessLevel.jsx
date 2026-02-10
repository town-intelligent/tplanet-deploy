/**
 * useAccessLevel - Check user's access level based on hosters whitelist.
 */
import { useMemo } from 'react';
import { useHosters, useSuperusers, useTenant } from './TenantContext';

/**
 * Access levels for the backend.
 */
export const ACCESS_LEVEL = {
  NONE: 'none',       // 一般註冊用戶，無後台權限
  MEMBER: 'member',   // hosters[1:] 會員，可進 dashboard
  ADMIN: 'admin',     // hosters[0] 站長，可進 admin_dashboard
  SUPERUSER: 'superuser', // 超級使用者，可進所有後台
};

/**
 * Hook to get current user's access level.
 * @returns {{ accessLevel: string, isAdmin: boolean, isMember: boolean, isSuperuser: boolean, hasBackendAccess: boolean, loading: boolean }}
 */
export function useAccessLevel() {
  const { loading } = useTenant();
  const hosters = useHosters();
  const superusers = useSuperusers();
  const email = localStorage.getItem('email') || '';

  return useMemo(() => {
    // 還在載入中，不要判斷權限
    if (loading) {
      return {
        accessLevel: ACCESS_LEVEL.NONE,
        isAdmin: false,
        isMember: false,
        isSuperuser: false,
        hasBackendAccess: false,
        loading: true,
      };
    }

    if (!email || !hosters.length) {
      return {
        accessLevel: ACCESS_LEVEL.NONE,
        isAdmin: false,
        isMember: false,
        isSuperuser: false,
        hasBackendAccess: false,
        loading: false,
      };
    }

    // 超級使用者：同時擁有 admin + member 權限
    const isSuperuser = superusers.includes(email);
    const isHostersAdmin = email === hosters[0];
    const isMemberOnly = hosters.slice(1).includes(email);

    // 超級使用者或 hosters[0] 都是 admin
    const isAdmin = isSuperuser || isHostersAdmin;
    // 超級使用者、admin、或 hosters[1:] 都是 member
    const isMember = isSuperuser || isHostersAdmin || isMemberOnly;

    let accessLevel = ACCESS_LEVEL.NONE;
    if (isSuperuser) {
      accessLevel = ACCESS_LEVEL.SUPERUSER;
    } else if (isHostersAdmin) {
      accessLevel = ACCESS_LEVEL.ADMIN;
    } else if (isMemberOnly) {
      accessLevel = ACCESS_LEVEL.MEMBER;
    }

    return {
      accessLevel,
      isAdmin,
      isMember,
      isSuperuser,
      hasBackendAccess: isAdmin || isMember,
      loading: false,
    };
  }, [email, hosters, superusers, loading]);
}

export default useAccessLevel;
