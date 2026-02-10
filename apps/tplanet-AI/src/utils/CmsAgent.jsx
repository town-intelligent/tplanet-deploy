import { plan_submit, createFormData } from "./Plan";
import { parentTaskSubmit, childTaskSubmit } from "./Task";

const CMS_PROJECT_SUBMIT_PAGES = [
  "cms_plan_info",
  "cms_sdgs_setting",
  "cms_impact",
  "cms_contact_person",
];

const CMS_SUPPORT_FORMAT = ["cms_missions_display", "cms_deep_participation"];

const getPageIndex = (page) => {
  const supportFormatIndex = CMS_SUPPORT_FORMAT.indexOf(page);
  if (supportFormatIndex !== -1) return 3;

  return CMS_PROJECT_SUBMIT_PAGES.indexOf(page);
};

const getIndexPage = (index) => {
  return CMS_PROJECT_SUBMIT_PAGES[index];
};

const navigateTo = (path) => {
  window.location.href = path;
};

// Submit form data & preview
export const handlePreview = async (event, projectData, id) => {
  event.preventDefault();
  try {
    const formData = createFormData(projectData);

    // 提交表單邏輯
    const response = await plan_submit(formData, id);
    navigateTo(`/content/${id}`);
    console.log("Form submission response:", response);
  } catch (error) {
    console.error("Error during form submission:", error);
  }
};

// Previous page
export const handlePrevious = (event, id) => {
  const path = window.location.pathname;
  const segments = path.split("/");
  const page = segments[2];
  const currentIndex = getPageIndex(page);

  event.preventDefault();
  if (page === "cms_missions_display") {
    navigateTo(`/backend/cms_impact/${id}`);
  } else if (currentIndex > 0) {
    navigateTo(`/backend/${getIndexPage(currentIndex - 1)}/${id}`);
  } else {
    navigateTo(`/backend/${getIndexPage(0)}/${id}`);
  }
};

// Submit form data & to next page
export const handleNextPage = async (event, projectData, id) => {
  const path = window.location.pathname;
  const segments = path.split("/");
  const page = segments[2];
  const currentIndex = getPageIndex(page);

  event.preventDefault();
  try {
    const formData = createFormData(projectData);
    // 提交表單邏輯
    const response = await plan_submit(formData, id);

    if (page === "cms_impact") {
      await parentTaskSubmit(projectData, id);
    }

    if (page === "cms_deep_participation") {
      await childTaskSubmit(projectData, id);
      navigateTo(`/backend/cms_impact/${id}`);
      return;
    }

    if (page === "cms_contact_person") {
      navigateTo(`/content/${id}`);
      return;
    }
    if (currentIndex < CMS_PROJECT_SUBMIT_PAGES.length - 1) {
      navigateTo(`/backend/${getIndexPage(currentIndex + 1)}/${id}`);
    } else {
      navigateTo(
        `/backend/${getIndexPage(CMS_PROJECT_SUBMIT_PAGES.length - 1)}/${id}`
      );
    }
    console.log("Form submission response:", response);
  } catch (error) {
    console.error("Error during form submission:", error);
  }
};

// Submit form data
export const handleSave = async (event, projectData, id) => {
  const path = window.location.pathname;
  const segments = path.split("/");
  const page = segments[2];

  event.preventDefault();
  try {
    const formData = createFormData(projectData);

    // 提交表單邏輯
    const response = await plan_submit(formData, id);

    if (page === "cms_impact") {
      await parentTaskSubmit(projectData, id);
    }

    if (page === "cms_deep_participation") {
      await childTaskSubmit(projectData, id);
    }
    alert("儲存成功");
    console.log("Form submission response:", response);
  } catch (error) {
    console.error("Error during form submission:", error);
  }
};
