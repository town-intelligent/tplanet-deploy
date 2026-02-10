import "../progress_bar.css";
import { useState, useEffect } from "react";
import { plan_info, list_plan_tasks } from "../../../utils/Plan";
import { getTaskInfo } from "../../../utils/Task";
import { useParams } from "react-router-dom";
import SdgIconsGenerator from "../../../utils/sdgs/SdgsComment";
import {
  handlePreview,
  handlePrevious,
  handleNextPage,
  handleSave,
} from "../../../utils/CmsAgent";
import ParentTask from "../components/ParentTask";
import { useTranslation } from "react-i18next";

const CmsSdgsSetting = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [projectWeight, setProjectWeight] = useState("");
  const [weightComment, setWeightComment] = useState("");
  const [parentTasks, setParentTasks] = useState([]);
  const { t } = useTranslation();

  const validateFields = () => {
    if (!weightComment || weightComment.trim() === "") {
      alert(t("cmsSdgsSetting.validate_sdgs_comment"));
      return false;
    }

    let parsedComments = {};
    try {
      parsedComments = JSON.parse(weightComment);
    } catch (e) {
      alert(t("cmsSdgsSetting.validate_sdgs_format"));
      return false;
    }

    // 檢查是否有任一被選的 SDG 內容是空的
    const weights = projectWeight?.split(",") || [];
    for (let i = 0; i < weights.length; i++) {
      if (weights[i] === "1") {
        const sdgId = (i + 1).toString();
        const comment = parsedComments[sdgId];
        if (!comment || comment.trim() === "") {
          alert(t("cmsImpact.validate_sdgs_required", { sdgId }));
          return false;
        }
      }
    }

    return true;
  };

  const data = {
    weightComment,
    parentTasks,
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const projectInfo = await plan_info(id);
      setProjectWeight(projectInfo.weight);
      setWeightComment(projectInfo.weight_description);

      // 🧠 若資料庫沒有 weight_description，則嘗試載入 localStorage.ai_sdgs
      if (
        !projectInfo.weight_description ||
        projectInfo.weight_description.trim() === "" ||
        projectInfo.weight_description === "null"
      ) {
        const ai_sdgs = localStorage.getItem("ai_sdgs");
        if (ai_sdgs) {
          try {
            const parsed = JSON.parse(ai_sdgs);
            const formatted = JSON.stringify(parsed);
            setWeightComment(formatted);
            console.log("✅ 已從 localStorage 載入 AI 生成的 SDGs 描述");
          } catch (e) {
            console.error("❌ 載入 AI SDGs 失敗:", e);
          }
        }
      }

      const list_parent_task_uuid = await list_plan_tasks(id, 1);
      if (list_parent_task_uuid.result === false) {
        return;
      }

      const tasks = await Promise.all(
        list_parent_task_uuid.tasks.map((task_uuid) => getTaskInfo(task_uuid))
      );

      if (tasks.length !== 0) {
        setParentTasks(tasks);
      }
    } catch (error) {
      console.error("Error fetching SDGs data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!id) return null;

  return (
    <div className="container pt-3">
      <ul className="progressbar">
        <li className="active done">
          <span>{t("progressbar.step1")}</span>
        </li>
        <li className="active done">
          <span>{t("progressbar.step2")}</span>
        </li>
        <li className="active">
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
        <div className="container pt-5">
          <form id="weight_container" action="">
            <div className="row mt-5 pt-5 align-items-center justify-content-center">
              <div className="col-9 px-0">
                <p className="bg-[#317EE0] py-2 text-white pl-6">
                  {t("cmsSdgsSetting.title")}
                </p>
              </div>
              <div className="col-9 bg-white shadow" id="sdgs_container">
                <SdgIconsGenerator
                  weight={projectWeight}
                  comment={weightComment}
                  setComments={setWeightComment}
                />
              </div>
            </div>

            <div className="row mt-5 align-items-center justify-content-center">
              <div className="col-9 px-0">
                <p className="bg-[#317EE0] py-2 text-white pl-6">{t("cmsImpact.achievement")}</p>
              </div>
            </div>
            <div id="div_parent_task">
              <ParentTask
                parentTasks={parentTasks}
                setParentTasks={setParentTasks}
              />
            </div>

            {/* 按鈕 */}
            <div className="row mt-5 mb-5 pb-3 justify-content-center">
              <div className="col-md-8 mt-5">
                <div className="flex flex-col md:flex-row justify-between space-y-3 md:space-y-0 md:space-x-3">
                  <button
                    type="submit"
                    id="btn_cms_plan_preview"
                    className="btn btn-secondary rounded-pill w-full md:w-1/5"
                    onClick={(event) => handlePreview(event, data, id)}
                  >
                    {t("cmsbutton.preview")}
                  </button>
                  <button
                    type="submit"
                    id="btn_cms_plan_preview"
                    className="btn btn-dark rounded-pill w-full md:w-1/5"
                    onClick={(event) => handlePrevious(event, id)}
                  >
                    {t("cmsbutton.previous")}
                  </button>
                  <button
                    type="button"
                    id="btn_ab_project_next"
                    className="btn btn-dark rounded-pill w-full md:w-1/5"
                    onClick={(event) => {
                      event.preventDefault();
                      if (validateFields()) {
                        handleNextPage(event, data, id);
                      }
                    }}
                  >
                    {t("cmsbutton.next")}
                  </button>
                  <button
                    type="submit"
                    id="btn_cms_plan_save"
                    className="btn btn-success rounded-pill w-full md:w-1/5"
                    onClick={(event) => handleSave(event, data, id)}
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

export default CmsSdgsSetting;
