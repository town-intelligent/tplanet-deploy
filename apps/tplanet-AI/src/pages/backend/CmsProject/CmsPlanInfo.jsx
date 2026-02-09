import { useState, useCallback, useEffect } from "react";
import imageIcon from "../../../assets/image_icon.svg";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../progress_bar.css";
import { useDropzone } from "react-dropzone";
import { useParams } from "react-router-dom";
import { plan_info } from "../../../utils/Plan";
import Loading from "../../../assets/loading.png";
import {
  handlePreview,
  handleNextPage,
  handleSave,
} from "../../../utils/CmsAgent";
import { useDepartments } from "../../../utils/multi-tenant";
import { Form } from "react-bootstrap";
import DateIcon from "../../../assets/date-icon.svg";
import CmsPlanDefault from "../../../assets/cms_plan_default.png";
import { useTranslation } from "react-i18next";

const CmsPlanInfo = () => {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [projectA, setProjectA] = useState("");
  const [projectB, setProjectB] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [budget, setBudget] = useState(null);
  const [philosophy, setPhilosophy] = useState("");
  const [isBudgetRevealed, setIsBudgetRevealed] = useState(true);
  const [coverImg, setCoverImg] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const departments = useDepartments();

  const projectData = {
    name,
    projectA,
    projectB,
    startDate,
    dueDate,
    budget,
    philosophy,
    isBudgetRevealed,
  };

  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (id) {
        const obj_project = await plan_info(id);
        if (obj_project) {
          if (obj_project.img) {
            setCoverImg(
              `${
                import.meta.env.VITE_HOST_URL_TPLANET
              }/static/project/${id}/media/cover/cover.png`
            );
          }
          if (obj_project.name) {
            setName(obj_project.name);
          }
          if (obj_project.project_a) {
            setProjectA(obj_project.project_a);
          }
          if (obj_project.project_b) {
            setProjectB(obj_project.project_b);
          }
          if (obj_project.period) {
            const [start, end] = obj_project.period.split(" - ");
            if (start && end) {
              setStartDate(new Date(start));
              setDueDate(new Date(end));
            }
          }
          if (obj_project.budget) {
            setBudget(obj_project.budget);
          }
          if (obj_project.philosophy) {
            setPhilosophy(obj_project.philosophy);
          }
          if (obj_project.isBudgetRevealed !== undefined) {
            setIsBudgetRevealed(obj_project.isBudgetRevealed);
          }
        }
      }
    };

    fetchProjectInfo();
  }, [id]);

  const submitProjectCover = async (base64Img, uuid) => {
    const formdata = new FormData();
    formdata.append("uuid", uuid);
    formdata.append("img", base64Img);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/push_project_cover`,
        {
          method: "POST",
          body: formdata,
          redirect: "follow",
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const handleUploadCover = async (file) => {
    setLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const base64Img = canvas.toDataURL("image/jpeg");
        const result = await submitProjectCover(base64Img, id);
        if (result.result === "true") {
          alert("更新成功");
          setCoverImg(base64Img);
        } else {
          alert("更新失敗，請洽系統管理員。");
        }
        setLoading(false);
      };
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      handleUploadCover(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
  });

  const handleNextWithCover = async (event) => {
    event.preventDefault();

    // 如果沒有封面，先上傳預設圖片
    if (!coverImg) {
      try {
        // 把預設圖片轉成 Base64
        const response = await fetch(CmsPlanDefault);
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64Img = reader.result;

          // 上傳封面
          const result = await submitProjectCover(base64Img, id);
          if (result.result === "true") {
            setCoverImg(base64Img);
          } else {
            alert("上傳預設封面失敗，請洽系統管理員。");
          }

          // 確保封面處理完再進入下一步
          handleNextPage(event, projectData, id);
        };

        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("上傳預設圖片失敗:", error);
        alert("上傳預設封面失敗，請洽系統管理員。");
      }
    } else {
      // 已有封面，直接進下一步
      handleNextPage(event, projectData, id);
    }
  };

  // 檢查欄位是否都填寫
  const validateFields = () => {
    if (!name.trim()) {
      alert(t("cmsplaninfo.validate_name"));
      return false;
    }
    if (!projectB.trim()) {
      alert(t("cmsplaninfo.validate_department"));
      return false;
    }
    if (!startDate || !dueDate) {
      alert(t("cmsplaninfo.validate_period"));
      return false;
    }
    if (!budget || isNaN(budget)) {
      alert(t("cmsplaninfo.validate_budget"));
      return false;
    }
    if (!philosophy.trim()) {
      alert(t("cmsplaninfo.validate_philosophy"));
      return false;
    }

    return true;
  };

  return (
    <div className="container pt-3">
      <ul className="progressbar">
        <li className="active">
          <span>{t("progressbar.step1")}</span>
        </li>
        <li>
          <span>{t("progressbar.step2")}</span>
        </li>
        <li>
          <span>{t("progressbar.step3")}</span>
        </li>
        <li>
          <span>{t("progressbar.step4")}</span>
        </li>
        <li>
          <span></span>
        </li>
      </ul>

      <section>
        <div className="container">
          <form>
            <div className="row mt-5 pt-5 align-items-center justify-content-center">
              <div className="col-9">
                <p className="bg-[#317EE0] py-2 text-white pl-6">
                  {t("cmsplaninfo.cover_title")}
                </p>
              </div>
              <div className="col-9">
                <div
                  id="coverImg"
                  className="d-flex flex-column align-items-center justify-content-center bg-white shadow"
                  style={{
                    height: "300px",
                  }}
                  {...getRootProps()}
                >
                  <input {...getInputProps()} />
                  <div className="d-flex flex-column align-items-center justify-content-center">
                    {!coverImg ? (
                      <div className="d-flex flex-column align-items-center justify-content-center">
                        <button type="button" className="btn" id="btnUploadImg">
                          <img
                            id="divUploadImg"
                            className="bg-contain w-24"
                            src={imageIcon}
                          ></img>
                        </button>
                        <p className="text-center small mt-3">
                          {t("cmsplaninfo.cover_upload_hint")}
                        </p>
                      </div>
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center">
                        <img
                          //id="divUploadImg"
                          className="bg-contain max-h-72"
                          src={coverImg || CmsPlanDefault}
                          alt="Upload Icon"
                        />
                      </div>
                    )}
                    {loading && (
                      <div id="loading" className="z-50">
                        <div id="loading-text">
                          <p>{t("cmsplaninfo.uploading")}</p>
                        </div>
                        <div id="loading-spinner">
                          <img src={Loading} alt="Loading" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="row mt-4 align-items-center justify-content-center">
              <div className="col-9">
                <p className="bg-[#317EE0] py-2 text-white pl-6">
                  {/* <a style={{ color: "Tomato" }}>(*必填) </a> */}
                  {t("cmsplaninfo.project_name_title")}
                </p>
              </div>
              <div className="col-9">
                <input
                  id="name"
                  className="form-control"
                  type="text"
                  placeholder={t("cmsplaninfo.project_name_placeholder")}
                  maxLength="30"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="row mt-4 align-items-center justify-content-center">
              <div className="col-9">
                <p className="bg-[#317EE0] py-2 text-white pl-6">{t("cmsplaninfo.company_title")}</p>
              </div>
              <div className="col-9">
                <input
                  id="project_a"
                  className="form-control"
                  type="text"
                  placeholder=""
                  maxLength="20"
                  value="Second Home"
                  readOnly
                  //onChange={(e) => setProjectA(e.target.value)}
                />
              </div>
            </div>

            <div className="row mt-4 align-items-center justify-content-center">
              <div className="col-9">
                <p className="bg-[#317EE0] py-2 text-white pl-6">{t("cmsplaninfo.department_title")}</p>
              </div>
              <div className="col-9">
                {/* <input
                  id="project_b"
                  className="form-control"
                  type="text"
                  placeholder="主責局處"
                  maxLength="20"
                  value={projectB}
                  onChange={(e) => setProjectB(e.target.value)}
                /> */}
                <Form.Select
                  className=" text-sm text-gray-500"
                  value={projectB}
                  onChange={(e) => setProjectB(e.target.value)}
                >
                  <option value="">{t("cmsplaninfo.department_title")}</option>
                  {departments.map((dept, index) => (
                    <option key={dept.id || index} value={dept.name || dept}>
                      {dept.name || dept}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>

            <div className="row mt-4 align-items-center justify-content-center">
              <div className="col-9">
                <p className="bg-[#317EE0] py-2 text-white pl-6 text-center">
                  {t("cmsplaninfo.period_title")}
                </p>
              </div>
              <div className="col-9 flex justify-between items-center">
                <div className="mb-0 bg-white px-4 py-2.5 w-full shadow">
                  <div className="input-group date w-full flex justify-center ">
                    <DatePicker
                      id="project_start_date"
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      className="form-control w-full border-0 focus:!outline-none focus:!ring-0 focus:!border-0"
                      placeholderText={t("cmsplaninfo.start_date")}
                    />

                    <img src={DateIcon} alt="date_icon" width={20} />
                  </div>
                </div>
                <div className="w-20 h-1 bg-black mx-4"></div>
                <div className="mb-0 bg-white px-4 py-2.5 w-full shadow">
                  <div className="input-group date flex justify-center">
                    <DatePicker
                      id="project_due_date"
                      selected={dueDate}
                      onChange={(date) => setDueDate(date)}
                      className="form-control w-full border-0 focus:!outline-none focus:!ring-0 focus:!border-0"
                      placeholderText={t("cmsplaninfo.end_date")}
                    />
                    <img src={DateIcon} alt="date_icon" width={20} />
                  </div>
                </div>
              </div>
            </div>

            <div className="row mt-4 align-items-center justify-content-center">
              <div className="col-9">
                <p className="bg-[#317EE0] py-2 text-white pl-6">
                  {/* <a style={{ color: "Tomato" }}>(*請輸入整數) </a> */}
                  {t("cmsplaninfo.budget_title")}
                </p>
              </div>
              <div className="col-9">
                <input
                  id="budget"
                  className="form-control"
                  type="number"
                  placeholder={t("cmsplaninfo.budget_placeholder")}
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>

            <div className="row mt-4 align-items-center justify-content-center">
              <div className="col-9">
                <p className="bg-[#317EE0] py-2 text-white pl-6">{t("cmsplaninfo.philosophy_title")}</p>
              </div>
              <div className="col-9">
                <Form.Control 
                  as="textarea" 
                  rows={4} 
                  value={philosophy}
                  onChange={(e) => setPhilosophy(e.target.value)}
                  placeholder={t("cmsplaninfo.philosophy_placeholder")}
                />
              </div>
            </div>

            <div className="row mt-5 mb-5 pb-3 justify-content-center">
              <div className="col-md-8 mt-5">
                <div className="flex flex-col md:flex-row justify-between space-y-3 md:space-y-0 md:space-x-3">
                  <button
                    type="submit"
                    id="btn_cms_plan_preview"
                    className="btn btn-secondary rounded-pill w-full md:w-1/5"
                    onClick={(event) => handlePreview(event, projectData, id)}
                  >
                    {t("cmsbutton.preview")}
                  </button>
                  <button
                    type="submit"
                    id="btn_ab_project_next"
                    className="btn btn-dark rounded-pill w-full md:w-1/5"
                    onClick={(event) => {
                      event.preventDefault();
                      if (validateFields()) {
                        handleNextWithCover(event);
                      }
                    }}
                  >
                    {t("cmsbutton.next")}
                  </button>
                  <button
                    type="submit"
                    id="btn_cms_plan_save"
                    className="btn btn-success rounded-pill w-full md:w-1/5"
                    onClick={(event) => handleSave(event, projectData, id)}
                  >
                    {t("cmsbutton.save")}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default CmsPlanInfo;
