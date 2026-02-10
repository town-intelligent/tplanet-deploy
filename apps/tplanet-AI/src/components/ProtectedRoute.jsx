/**
 * ProtectedRoute - Route protection based on hosters whitelist.
 */
import { Navigate } from 'react-router-dom';
import { useAccessLevel, ACCESS_LEVEL } from '../utils/multi-tenant';

/**
 * Protected route for backend access.
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {'superuser' | 'admin' | 'member' | 'any'} props.requiredAccess - Required access level
 *   - 'superuser': Only superusers can access
 *   - 'admin': Only hosters[0] or superusers can access
 *   - 'member': Only hosters[1:] can access
 *   - 'any': Any user in hosters can access (default)
 * @param {string} props.redirectTo - Redirect path if unauthorized (default: '/')
 */
export function ProtectedRoute({
  children,
  requiredAccess = 'any',
  redirectTo = '/'
}) {
  const { accessLevel, isAdmin, isMember, isSuperuser, hasBackendAccess, loading } = useAccessLevel();

  // 等待 tenant config 載入完成
  if (loading) {
    return <div className="flex justify-center items-center h-screen">載入中...</div>;
  }

  // 檢查是否有權限
  let hasAccess = false;

  switch (requiredAccess) {
    case 'superuser':
      hasAccess = isSuperuser;
      break;
    case 'admin':
      hasAccess = isAdmin;
      break;
    case 'member':
      hasAccess = isMember;
      break;
    case 'any':
    default:
      hasAccess = hasBackendAccess;
      break;
  }

  if (!hasAccess) {
    // 無權限，導向指定頁面
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

/**
 * Redirect based on access level.
 * - Admin → admin_dashboard
 * - Member → dashboard
 * - None → home
 */
export function BackendRedirect() {
  const { isAdmin, isMember, isSuperuser, loading } = useAccessLevel();

  // 等待 tenant config 載入完成
  if (loading) {
    return <div className="flex justify-center items-center h-screen">載入中...</div>;
  }

  // Superuser 導向專屬 dashboard
  if (isSuperuser) {
    return <Navigate to="/backend/superuser_dashboard" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/backend/admin_dashboard" replace />;
  }

  if (isMember) {
    return <Navigate to="/backend/dashboard" replace />;
  }

  // 無權限，導向首頁
  return <Navigate to="/" replace />;
}

export default ProtectedRoute;
