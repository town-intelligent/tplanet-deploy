import React, { useState, useEffect, useMemo } from "react";
import { mockup_get } from "../../../utils/Mockup";
import { Button, Form } from "react-bootstrap";
import View from "../../../assets/pen.svg";
import Delete from "../../../assets/trash.svg";
import AdminContactUsDetail from "./AdminContactUsDetail";

const ContactUsComponent = () => {
  const [contacts] = useState([
    {
      id: "84434154",
      name: "陳竹新",
      email: "aewiejofawf@gmail.com",
      company: "新竹XXXXXXX.....",
      department: "財政處",
      phone: "02419411241",
      issue: "SDG 4",
    },
    {
      id: "84434154",
      name: "陳竹新",
      email: "aewiejofawf@gmail.com",
      company: "新竹XXXXXXX.....",
      department: "財政處",
      phone: "02419411241",
      issue: "SDG 5",
    },
    {
      id: "84434154",
      name: "陳竹新",
      email: "aewiejofawf@gmail.com",
      company: "新竹XXXXXXX.....",
      department: "財政處",
      phone: "02419411241",
      issue: "SDG 4",
    },
    {
      id: "84434154",
      name: "陳竹新",
      email: "aewiejofawf@gmail.com",
      company: "新竹XXXXXXX.....",
      department: "財政處",
      phone: "02419411241",
      issue: "SDG 4",
    },
    {
      id: "84434154",
      name: "陳竹新",
      email: "aewiejofawf@gmail.com",
      company: "新竹XXXXXXX.....",
      department: "財政處",
      phone: "02419411241",
      issue: "SDG 4",
    },
    {
      id: "84434154",
      name: "陳竹新",
      email: "aewiejofawf@gmail.com",
      company: "新竹XXXXXXX.....",
      department: "財政處",
      phone: "02419411241",
      issue: "SDG 4",
    },
    {
      id: "84434154",
      name: "陳竹新",
      email: "aewiejofawf@gmail.com",
      company: "新竹XXXXXXX.....",
      department: "財政處",
      phone: "02419411241",
      issue: "SDG 4",
    },
    {
      id: "84434154",
      name: "陳竹新",
      email: "aewiejofawf@gmail.com",
      company: "新竹XXXXXXX.....",
      department: "財政處",
      phone: "02419411241",
      issue: "SDG 4",
    },
  ]);
  const [currentView, setCurrentView] = useState("table");
  const [selectedContactDetail, setSelectedContactDetail] = useState(null);
  const [bannerImage, setBannerImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const itemsPerPage = 20;

  const loadBanner = async () => {
    try {
      // 設置 banner 圖片
      const form = new FormData();
      form.append("email", localStorage.getItem("email"));
      const objMockup = await mockup_get(form);

      if (objMockup.description) {
        setBannerImage(
          `${import.meta.env.VITE_HOST_URL_TPLANET}${objMockup.description["contact-us-banner-img"]}`
        );
      }
    } catch (error) {
      console.error("載入新聞資料時發生錯誤:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanner();
  }, []);

  const handleImageUpload = (file, key) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      alert("僅支援 JPG, JPEG, PNG 格式");
      return;
    }

    if (file.size > maxSize) {
      alert("檔案大小不得超過 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerImage(() => e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const ImageEditor = ({
    imageKey,
    label,
    currentImage,
    className = "img-fluid",
  }) => {
    // 判斷圖片來源：如果是 data URL (base64) 就直接使用，否則加上 API URL
    const getImageSrc = (imageData) => {
      if (!imageData) return currentImage; // fallback 圖片

      // 如果是 base64 data URL (上傳的新圖片)
      if (typeof imageData === "string" && imageData.startsWith("data:")) {
        return imageData;
      }

      // 如果是從 API 來的檔案路徑
      return `${imageData}`;
    };

    return (
      <div className="relative">
        <img
          className=""
          src={getImageSrc(bannerImage)}
          alt={label}
          onError={(e) => {
            // 如果圖片載入失敗，使用 fallback 圖片
            e.target.src = currentImage;
          }}
          style={{
            backgroundImage: `url(${bannerImage})`,
            height: "300px",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="absolute bottom-0 right-0">
          <button
            onClick={() =>
              document.getElementById(`upload-${imageKey}`).click()
            }
            className="bg-[#317EE0] text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            編輯圖片
          </button>
          <input
            id={`upload-${imageKey}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files[0] &&
              handleImageUpload(e.target.files[0], imageKey)
            }
          />
        </div>
      </div>
    );
  };

  // 計算分頁資料
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return contacts.slice(startIndex, endIndex);
  }, [contacts, currentPage, itemsPerPage]);

  // 計算總頁數
  const totalPages = Math.ceil(contacts.length / itemsPerPage);

  // 當 contacts 改變時重置到第一頁
  useEffect(() => {
    setCurrentPage(1);
  }, [contacts]);

  // 處理全選 - 只針對當前頁面的資料
  const handleSelectAll = (checked) => {
    if (checked) {
      // 將當前頁面的所有帳號ID加入選取清單
      const currentPageIds = paginatedData.map((contact) => contact.id);
      const newSelectedAccounts = [
        ...new Set([...selectedAccounts, ...currentPageIds]),
      ];
      setSelectedAccounts(newSelectedAccounts);
    } else {
      // 從選取清單中移除當前頁面的所有帳號ID
      const currentPageIds = paginatedData.map((contact) => contact.id);
      setSelectedAccounts(
        selectedAccounts.filter((id) => !currentPageIds.includes(id))
      );
    }
  };

  // 處理單個選擇
  const handleSelectContact = (contactId, checked) => {
    if (checked) {
      setSelectedAccounts([...selectedAccounts, contactId]);
    } else {
      setSelectedAccounts(selectedAccounts.filter((id) => id !== contactId));
    }
  };

  // 檢查當前頁面是否全選
  const isCurrentPageAllSelected = useMemo(() => {
    if (paginatedData.length === 0) return false;
    return paginatedData.every((contact) =>
      selectedAccounts.includes(contact.id)
    );
  }, [paginatedData, selectedAccounts]);

  // 檢查當前頁面是否部分選取
  const isCurrentPageIndeterminate = useMemo(() => {
    if (paginatedData.length === 0) return false;
    const selectedInCurrentPage = paginatedData.filter((contact) =>
      selectedAccounts.includes(contact.id)
    ).length;
    return (
      selectedInCurrentPage > 0 && selectedInCurrentPage < paginatedData.length
    );
  }, [paginatedData, selectedAccounts]);

  // 頁面切換處理
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 生成頁碼按鈕
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    // 計算顯示範圍
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 調整開始頁面以確保顯示足夠的按鈕
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 上一頁按鈕
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        上一頁
      </button>
    );

    // 第一頁（如果需要）
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-50"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="px-2">
            ...
          </span>
        );
      }
    }

    // 頁碼按鈕
    for (let page = startPage; page <= endPage; page++) {
      buttons.push(
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-3 py-1 mx-1 border rounded ${
            currentPage === page
              ? "bg-blue-500 text-white border-blue-500"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          {page}
        </button>
      );
    }

    // 最後一頁（如果需要）
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="px-2">
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-50"
        >
          {totalPages}
        </button>
      );
    }

    // 下一頁按鈕
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        下一頁
      </button>
    );

    return buttons;
  };

  // 處理查看詳細資料
  const handleViewDetail = (contact) => {
    setSelectedContactDetail(contact);
    setCurrentView("detail");
  };

  // 處理刪除
  const handleDelete = (contact) => {
    if (confirm(`確定要刪除 ${contact.name} 的資料嗎？`)) {
      console.log("刪除聯絡人:", contact);
    }
  };

  if (loading) {
    return <div className="text-center">載入中...</div>;
  }

  // 切到detail頁面
  if (currentView === "detail") {
    return (
      <div className="w-full max-w-7xl mx-auto p-4">
        <div className="container w-full">
          <div className="text-center w-full">
            <ImageEditor
              imageKey="banner-image"
              label="Project Banner"
              currentImage="/api/placeholder/1200/400"
              className="img-fluid"
            />
          </div>
        </div>
        <AdminContactUsDetail
          selectedContactDetail={selectedContactDetail}
          setCurrentView={setCurrentView}
          setSelectedContactDetail={setSelectedContactDetail}
        />
      </div>
    );
  }

  return (
    <div>
      <section className="flex-grow mt-5">
        {/* Banner 區域 */}
        <div className="container w-full">
          <div className="text-center w-full">
            <ImageEditor
              imageKey="banner-image"
              label="Project Banner"
              currentImage="/api/placeholder/1200/400"
              className="img-fluid"
            />
          </div>
        </div>
        <div className="w-5/6 mx-auto my-4">
          <Button variant="dark" href="/backend/admin_dashboard">
            回到控制首頁
          </Button>
        </div>

        <div className="w-5/6 mx-auto mb-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-x-auto">
                <table className="w-full min-w-max">
                  {/* 表頭 - 固定 */}
                  <thead className="bg-[#4472C4] text-white sticky top-0">
                    <tr>
                      <th className="p-3 text-center w-16 min-w-16">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-white"
                          checked={isCurrentPageAllSelected}
                          ref={(input) => {
                            if (input)
                              input.indeterminate = isCurrentPageIndeterminate;
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          aria-label="選擇當前頁面全部聯絡人"
                        />
                      </th>
                      <th className="p-3 text-center font-medium whitespace-nowrap w-32 min-w-32">
                        編號
                      </th>
                      <th className="p-3 text-center font-medium whitespace-nowrap w-24 min-w-24">
                        姓名
                      </th>
                      <th className="p-3 text-center font-medium whitespace-nowrap w-48 min-w-48">
                        電子郵件
                      </th>
                      <th className="p-3 text-center font-medium whitespace-nowrap w-40 min-w-40">
                        公司名稱
                      </th>
                      <th className="p-3 text-center font-medium whitespace-nowrap w-32 min-w-32">
                        地方團隊
                      </th>
                      <th className="p-3 text-center font-medium whitespace-nowrap w-36 min-w-36">
                        聯絡電話
                      </th>
                      <th className="p-3 text-center font-medium whitespace-nowrap w-32 min-w-32">
                        關注議題
                      </th>
                      <th className="p-3 text-center font-medium whitespace-nowrap w-24 min-w-24"></th>
                    </tr>
                  </thead>

                  {/* 表格內容 - 可滾動 */}
                  <tbody className="divide-y divide-gray-200">
                    {contacts.length === 0 ? (
                      <tr>
                        <td
                          colSpan="9"
                          className="text-center py-8 text-gray-500"
                        >
                          沒有找到符合條件的聯絡人
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((contact, index) => (
                        <tr
                          key={contact.id}
                          className={
                            ((currentPage - 1) * itemsPerPage + index) % 2 === 0
                              ? "bg-white hover:bg-gray-50"
                              : "bg-gray-50 hover:bg-gray-100"
                          }
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300"
                              checked={selectedAccounts.includes(contact.id)}
                              onChange={(e) =>
                                handleSelectContact(
                                  contact.id,
                                  e.target.checked
                                )
                              }
                              aria-label="選擇聯絡人"
                            />
                          </td>
                          <td className="p-4 text-center text-gray-700 whitespace-nowrap">
                            {contact.id}
                          </td>
                          <td className="p-4 text-center text-gray-700 whitespace-nowrap">
                            {contact.name}
                          </td>
                          <td className="p-4 text-center text-gray-700 whitespace-nowrap">
                            {contact.email}
                          </td>
                          <td className="p-4 text-center text-gray-700 whitespace-nowrap">
                            {contact.company}
                          </td>
                          <td className="p-4 text-center text-gray-700 whitespace-nowrap">
                            {contact.department}
                          </td>
                          <td className="p-4 text-center text-gray-700 whitespace-nowrap">
                            {contact.phone}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              {contact.issue}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="查看"
                                onClick={() => handleViewDetail(contact)}
                              >
                                <img src={View} alt="檢視" width={16} />
                              </button>
                              <button
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="刪除"
                                onClick={() => handleDelete(contact)}
                              >
                                <img src={Delete} alt="刪除" width={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* 分頁控制項 */}
                {contacts.length > 0 && (
                  <div className="mt-4 flex items-center justify-between px-4 py-3">
                    {/* 資料統計 */}
                    <div className="text-sm text-gray-700">
                      顯示 {(currentPage - 1) * itemsPerPage + 1} 到{" "}
                      {Math.min(currentPage * itemsPerPage, contacts.length)}{" "}
                      項，共 {contacts.length} 項
                    </div>

                    {/* 分頁按鈕 */}
                    {totalPages > 1 && (
                      <div className="flex items-center">
                        {renderPaginationButtons()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUsComponent;
