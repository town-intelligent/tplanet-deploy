// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Nav from "./pages/components/Nav";
import Footer from "./pages/components/Footer";

import Home from "./pages/Home";
import Kpi from "./pages/kpi/Kpi";
import ProjectContent from "./pages/kpi/components/ProjectContent";
import KpiFilter from "./pages/kpi/KpiFilter";
import NewList from "./pages/NewList";
import NewsContent from "./pages/NewContent";
import ContactUs from "./pages/ContactUs";

import AISecretary from "./pages/backend/AISecretary";
import AccountList from "./pages/backend/AccountList";
import AddAccount from "./pages/backend/AddAccount";
import UserPage from "./pages/backend/UserPage";
import Dashboard from "./pages/backend/Dashboard";
import AdminDashboard from "./pages/backend/AdminDashboard";
import CmsAgent from "./pages/backend/CmsAgent";

import HeatMap from "./pages/backend/CmsProject/CmsHeatMap";
import SROI from "./pages/backend/CmsProject/CmsSROI";
import CmsSroiEvidence from "./pages/backend/CmsProject/CmsSroiEvidence";
import CmsPlanInfo from "./pages/backend/CmsProject/CmsPlanInfo";
import CmsSdgsSetting from "./pages/backend/CmsProject/CmsSdgsSetting";
import CmsImpact from "./pages/backend/CmsProject/CmsImpact";
import CmsContactPerson from "./pages/backend/CmsProject/CmsContactPerson";
import AdminIndex from "./pages/backend/PageManage/AdminIndex";
import AdminNewsList from "./pages/backend/PageManage/AdminNewsList";
import AdminContactUs from "./pages/backend/PageManage/AdminContactUs";
import TenantList from "./pages/backend/PageManage/TenantList";
import TenantHub from "./pages/backend/PageManage/TenantHub";
import DevUserSwitcher from "./pages/backend/DevUserSwitcher";
import SuperuserDashboard from "./pages/backend/SuperuserDashboard";
import SiteWizard from "./pages/backend/PageManage/SiteWizard";
import DeleteAccount from "./pages/backend/DeleteAccount";

import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgetPw from "./pages/ForgetPw";
import ResetPw from "./pages/ResetPw";
import { AuthProvider } from "./utils/ProtectRoute";
import { TenantProvider } from "./utils/TenantContext";
import { ProtectedRoute, BackendRedirect } from "./components/ProtectedRoute";

import TranslateScope from "./utils/TranslateScope";

function App() {
  // 訪客計數功能
  useEffect(() => {
    const recordVisitor = async () => {
      // 檢查是否已經在本次 session 記錄過
      if (!sessionStorage.getItem('visitor_recorded')) {
        try {
          const response = await fetch(`${import.meta.env.VITE_HOST_URL_TPLANET}/api/dashboard/visitors`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Visitor recorded:', data);
            // 標記此 session 已記錄
            sessionStorage.setItem('visitor_recorded', 'true');
          } else {
            console.error('Failed to record visitor:', response.status);
          }
        } catch (error) {
          console.error('Error recording visitor:', error);
        }
      }
    };

    // 在應用程式載入時記錄訪客
    recordVisitor();
  }, []); // 只在組件初次掛載時執行

  const Layout = ({ children, footerFixed = false }) => {
    if (footerFixed) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-auto">{children}</div>
          <div className="flex-shrink-0">
            <Footer />
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-full flex flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    );
  };

  return (
    <TenantProvider configUrl={`${import.meta.env.VITE_HOST_URL_TPLANET}/api/tenant/config`}>
    <AuthProvider>
      <BrowserRouter>
        <div className="h-screen flex flex-col">
          <a
            href="#main-content"
            tabIndex="1"
            className="sr-only focus:not-sr-only absolute top-0 left-0 px-4 py-2 z-99 bg-amber-300"
            title="跳到主要內容"
          >
            跳到主要內容
          </a>

          {/* Header */}
          <div className="bg-white shadow-md flex-shrink-0 fixed top-0 left-0 right-0 z-50">
            <Nav />
          </div>

          {/* Main Content */}
          <main id="main-content" className="flex-1 w-full bg-gray-100 pt-20">
            <TranslateScope>
            <Routes>
              {/* Frontend */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/kpi" element={<Layout><Kpi /></Layout>} />
              <Route path="/content/:id" element={<Layout><ProjectContent /></Layout>} />
              <Route path="/kpi_filter/:id" element={<Layout><KpiFilter /></Layout>} />
              <Route path="/news_list" element={<Layout><NewList /></Layout>} />
              <Route path="/news_content/:id" element={<Layout footerFixed><NewsContent /></Layout>} />
              <Route path="/contact_us" element={<Layout><ContactUs /></Layout>} />
              <Route path="/signin" element={<Layout><SignIn /></Layout>} />
              <Route path="/signup" element={<Layout><SignUp /></Layout>} />
              <Route path="/forget_pw" element={<Layout><ForgetPw /></Layout>} />

              {/* Backend - 根據權限自動導向 */}
              <Route path="/backend" element={<BackendRedirect />} />

              {/* Backend - 會員可用 (hosters[1:]) */}
              <Route path="/backend/ai-secretary" element={<ProtectedRoute><AISecretary /></ProtectedRoute>} />
              <Route path="/backend/user-page" element={<ProtectedRoute><Layout footerFixed><UserPage /></Layout></ProtectedRoute>} />
              <Route path="/backend/dashboard" element={<ProtectedRoute requiredAccess="member"><Layout footerFixed><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/backend/cms_agent" element={<ProtectedRoute><Layout><CmsAgent /></Layout></ProtectedRoute>} />
              <Route path="/backend/heat_map/:id" element={<ProtectedRoute><Layout><HeatMap /></Layout></ProtectedRoute>} />
              <Route path="/backend/reset_pw" element={<Layout><ResetPw /></Layout>} />
              <Route path="/backend/cms_sroi/:id" element={<ProtectedRoute><Layout><SROI /></Layout></ProtectedRoute>} />
              <Route path="/backend/cms_sroi_evidence/:id" element={<ProtectedRoute><Layout><CmsSroiEvidence /></Layout></ProtectedRoute>} />
              <Route path="/backend/cms_plan_info/:id" element={<ProtectedRoute><Layout><CmsPlanInfo /></Layout></ProtectedRoute>} />
              <Route path="/backend/cms_sdgs_setting/:id" element={<ProtectedRoute><Layout><CmsSdgsSetting /></Layout></ProtectedRoute>} />
              <Route path="/backend/cms_impact/:id" element={<ProtectedRoute><Layout><CmsImpact /></Layout></ProtectedRoute>} />
              <Route path="/backend/cms_contact_person/:id" element={<ProtectedRoute><Layout><CmsContactPerson /></Layout></ProtectedRoute>} />

              {/* Backend - 站長專用 (hosters[0]) */}
              <Route path="/backend/admin_dashboard" element={<ProtectedRoute requiredAccess="admin"><Layout footerFixed><AdminDashboard /></Layout></ProtectedRoute>} />
              <Route path="/backend/admin_index" element={<ProtectedRoute requiredAccess="admin"><Layout footerFixed><AdminIndex /></Layout></ProtectedRoute>} />
              <Route path="/backend/admin_news_list" element={<ProtectedRoute requiredAccess="admin"><Layout><AdminNewsList /></Layout></ProtectedRoute>} />
              <Route path="/backend/admin_contact_us" element={<ProtectedRoute requiredAccess="admin"><Layout><AdminContactUs /></Layout></ProtectedRoute>} />
              <Route path="/backend/admin_agent_accountDelete" element={<ProtectedRoute><Layout><DeleteAccount /></Layout></ProtectedRoute>} />
              <Route path="/backend/account-list" element={<ProtectedRoute requiredAccess="admin"><Layout footerFixed><AccountList /></Layout></ProtectedRoute>} />
              <Route path="/backend/account-list/add-account" element={<ProtectedRoute requiredAccess="admin"><Layout footerFixed><AddAccount /></Layout></ProtectedRoute>} />

              {/* Superuser Dashboard */}
              <Route path="/backend/superuser_dashboard" element={<ProtectedRoute requiredAccess="superuser"><Layout footerFixed><SuperuserDashboard /></Layout></ProtectedRoute>} />

              {/* Dev Tools - 開發測試用，無權限限制 */}
              <Route path="/backend/dev/switch-user" element={<Layout footerFixed><DevUserSwitcher /></Layout>} />

              {/* Tenant Management - Superuser 專用 */}
              <Route path="/backend/tenant" element={<ProtectedRoute requiredAccess="superuser"><Layout footerFixed><TenantHub /></Layout></ProtectedRoute>} />
              <Route path="/backend/tenant/list" element={<ProtectedRoute requiredAccess="superuser"><Layout footerFixed><TenantList /></Layout></ProtectedRoute>} />
              <Route path="/backend/tenant/create" element={<ProtectedRoute requiredAccess="superuser"><Layout footerFixed><SiteWizard /></Layout></ProtectedRoute>} />
              <Route path="/backend/tenant/:tenantId/edit" element={<ProtectedRoute requiredAccess="superuser"><Layout footerFixed><SiteWizard /></Layout></ProtectedRoute>} />
            </Routes>
            </TranslateScope>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
    </TenantProvider>
  );
}

export default App;