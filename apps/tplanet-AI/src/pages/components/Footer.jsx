import { useState, useEffect } from "react";
import DefaultLogo from "../../assets/logo.svg";
import FbIcon from "../../assets/fb-icon.svg";
import YoutubeIcon from "../../assets/youtube-icon.svg";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useBrandName, useLogoUrl, useSocialLinks, usePrivacyUrl, useTenant } from "../../utils/multi-tenant";

const Footer = () => {
  const [todayViews, setTodayViews] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const { t } = useTranslation();
  const brandName = useBrandName();
  const { loading } = useTenant();
  const tenantLogoUrl = useLogoUrl();
  const logoSrc = loading ? null : (tenantLogoUrl || DefaultLogo);
  const socialLinks = useSocialLinks();
  const privacyUrl = usePrivacyUrl();

  useEffect(() => {
    // 取得瀏覽量數據
    const fetchViewCounts = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_HOST_URL_TPLANET}/api/dashboard/visitors`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 計算今日瀏覽量
        const today = new Date().toISOString().split("T")[0]; // 格式: 2025-09-12
        const todayData = data.visitors.find((v) => v.date === today);
        setTodayViews(todayData ? todayData.count : 0);

        // 計算總瀏覽量
        const total = data.visitors.reduce(
          (sum, visitor) => sum + visitor.count,
          0
        );
        setTotalViews(total);
      } catch (error) {
        console.error("Error fetching view counts:", error);
        // 發生錯誤時使用預設值
        setTodayViews(0);
        setTotalViews(0);
      }
    };

    fetchViewCounts();
  }, []);

  const socialLinkItems = [
    {
      href: "/",
      imgSrc: logoSrc,
      height: "35px",
      title: brandName,
    },
    ...(socialLinks.facebook ? [{
      href: socialLinks.facebook,
      imgSrc: FbIcon,
      height: "25px",
      title: `${brandName} Facebook`,
    }] : []),
    ...(socialLinks.youtube ? [{
      href: socialLinks.youtube,
      imgSrc: YoutubeIcon,
      height: "25px",
      title: `${brandName} YouTube`,
    }] : []),
  ];

  const navLinks = [
    {
      id: "about_fot1",
      href: "/",
      text: brandName,
      title: brandName,
      i18nKey: null,  // 使用 brandName 而非 i18n
    },
    { href: "/kpi", text: "永續專案", title: "永續專案", i18nKey: "nav.sustainable" },
    { href: "/news_list", text: "最新消息", title: "最新消息", i18nKey: "nav.news" },
    {
      id: "contact_us_fot1",
      href: "/contact_us",
      text: "聯絡我們",
      title: "聯絡我們",
      i18nKey: "footer.links.contact"
    },
    ...(privacyUrl ? [{
      href: privacyUrl,
      text: "隱私權條款",
      title: "隱私權條款",
      i18nKey: "footer.links.privacy"
    }] : []),
  ];

  return (
    <footer className="bg-white">
      <Container fluid>
        <Row className="justify-center pt-4 px-10">
          {/* Desktop Navigation */}
          <Col lg={9} className="d-none d-lg-block">
            <div className="h-100 flex items-center justify-center md:justify-start mt-2 mt-lg-0 z-18">
              {navLinks.map((link, index) => (
                <p
                  key={index}
                  className="mr-3 mb-0"
                  id={link.id}
                  style={link.hidden ? { display: "none" } : {}}
                >
                  <a
                    href={link.href}
                    className="text-black !no-underline px-0 font-bold"
                    title={link.i18nKey ? t(link.i18nKey) : link.title}
                  >
                    {link.i18nKey ? t(link.i18nKey) : link.text}
                  </a>
                </p>
              ))}
            </div>
          </Col>

          {/* Social Media Icons */}
          <Col lg={3} className="mb-4 mb-lg-0">
            <div className="flex h-100 items-center justify-center lg:justify-end">
              <div className="flex flex-row gap-2.5">
                {socialLinkItems.map((link, index) => (
                  <a
                    key={index}
                    className="text-decoration-none"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.title}
                  >
                    <img
                      className={`${
                        index !== socialLinkItems.length - 1 ? "mr-1" : ""
                      } footer_images`}
                      src={link.imgSrc}
                      alt={link.title}
                      style={{ height: link.height }}
                    />
                  </a>
                ))}
              </div>
            </div>
          </Col>

          {/* Mobile Navigation */}
          <div className="flex flex-wrap justify-center d-lg-none z-18">
            {navLinks.map((link, index) => (
              <p
                key={`mobile-${index}`}
                className={`${
                  index !== navLinks.length - 1 ? "mr-3" : ""
                } mb-0`}
                id={link.id?.replace("fot1", "fot2")}
                style={link.hidden ? { display: "none" } : {}}
              >
                <a
                  href={link.href}
                  className="text-black !no-underline px-0 font-bold"
                  title={link.i18nKey ? t(link.i18nKey) : link.title}
                >
                  {link.i18nKey ? t(link.i18nKey) : link.text}
                </a>
              </p>
            ))}
          </div>
        </Row>

        {/* Copyright */}
        <div className="py-4 relative">
          <div className="flex items-center justify-center relative">
            {/* 置中版權文字 */}
            <p id="copyright" className="font-bold mb-0 text-center">
              Copyright © {brandName}. All rights reserved.
            </p>

            {/* 右側瀏覽量統計 */}
            <div className="absolute right-0 flex items-center text-xs text-gray-800 pr-4">
              {/* 今日瀏覽量 */}
              <span className="flex items-center mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1 text-[var(--tenant-primary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 
               0 8.268 2.943 9.542 7-1.274 4.057-5.064 
               7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span className="text-[var(--tenant-primary)] font-medium">{t("footer.todayViews")}</span>
                <span className="ml-1">{todayViews} {t("footer.times")}</span>
              </span>

              {/* 總瀏覽量 */}
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1 text-[var(--tenant-primary)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M2 11a1 1 0 011-1h2a1 1 0 
                   011 1v5a1 1 0 01-1 1H3a1 
                   1 0 01-1-1v-5zM8 7a1 1 
                   0 011-1h2a1 1 0 011 1v9a1 
                   1 0 01-1 1H9a1 1 0 
                   01-1-1V7zM14 3a1 1 
                   0 011-1h2a1 1 0 
                   011 1v13a1 1 0 
                   01-1 1h-2a1 1 0 
                   01-1-1V3z"
                  />
                </svg>
                <span className="text-[var(--tenant-primary)] font-medium">{t("footer.totalViews")}</span>
                <span className="ml-1">{totalViews} {t("footer.times")}</span>
              </span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
