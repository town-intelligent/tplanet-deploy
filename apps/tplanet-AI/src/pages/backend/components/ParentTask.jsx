import { useState, useEffect, useCallback } from "react";
import { Form, Container, Col, Row, Modal, Button } from "react-bootstrap";
import imageIcon from "../../../assets/image_icon.svg";
import Delete from "../../../assets/delete_icon.svg";
import DateIcon from "../../../assets/date-icon.svg";
import { useDropzone } from "react-dropzone";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { submitTask, deleteTask, submitTaskCover } from "../../../utils/Task";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../../utils/Transform";
import i18n from "../../../utils/i18n";

const TaskBlock = ({ task, updateTask, removeTask }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState(() => {
    const periodDates = task.period?.split("-") || [];
    return {
      ...task,
      startDate: periodDates[0] ? new Date(periodDates[0]) : null,
      dueDate: periodDates[1] ? new Date(periodDates[1]) : null,
    };
  });
  const [modalShow, setModalShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    updateTask(taskData);
  }, [taskData, updateTask]);

  const handleInputChange = (field, value) => {
    setTaskData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

        try {
          const result = await submitTaskCover(base64Img, task.uuid);
          if (result.result === "true") {
            alert(i18n.t("cmsImpact.update_success"));
            handleInputChange(
              "thumbnail",
              `${
                import.meta.env.VITE_HOST_URL_TPLANET
              }/static/project/${id}/tasks/${task.uuid}/cover.png`
            );
          } else {
            alert(i18n.t("cmsImpact.update_fail"));
          }
        } catch (error) {
          console.error("Error updating cover:", error);
          alert(i18n.t("cmsImpact.update_fail"));
        } finally {
          setLoading(false);
        }
      };
      img.onerror = () => {
        console.error("Error loading image");
        alert(i18n.t("cmsImpact.image_load_fail"));
        setLoading(false);
      };
    };
    reader.onerror = () => {
      console.error("Error reading file");
      alert(i18n.t("cmsImpact.file_read_fail"));
      setLoading(false);
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

  const handleDeleteTask = async (event) => {
    event.preventDefault();
    const response = await deleteTask(task.uuid);
    if (response.result === true) {
      removeTask(task.uuid);
      alert(i18n.t("cmsImpact.delete_success"));
    } else {
      alert(i18n.t("cmsImpact.delete_fail"));
    }
  };

  const handleSubmitTask = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData();

      formData.append("email", localStorage.getItem("email"));
      formData.append("uuid", id);
      formData.append("task", taskData.uuid);
      formData.append("name", taskData.name);
      formData.append("task_start_date", formatDate(taskData.startDate));
      formData.append("task_due_date", formatDate(taskData.dueDate));
      formData.append("overview", taskData.overview);
      formData.append("gps_flag", taskData.gps);

      const response = await submitTask(formData);
      if (response) {
        localStorage.setItem("uuid_project", id);
        navigate(`/backend/cms_missions_display/${id}?task=${taskData.uuid}`);
      } else {
        alert(i18n.t("cmsImpact.update_fail"));
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="parent-task-block mb-4 p-0 rounded row align-items-center justify-content-center">
      <div className="py-3 px-4 col-9 bg-white position-relative shadow">
        {/* 右上角刪除按鈕 */}
        <div
          className="position-absolute"
          style={{ top: "10px", right: "2px", zIndex: 10 }}
        >
          <button type="button" className="" onClick={() => setModalShow(true)}>
            <img src={Delete} alt="刪除" width={20} />
          </button>
        </div>
        {/* 上方三個圖片上傳區域 */}
        <Col md={12} className="mb-4">
  <div className="d-flex justify-content-center">
    {/* 單一圖片上傳區域 */}
    <div
      className="border d-flex flex-column align-items-center justify-content-center"
      style={{ width: "250px", height: "200px" }}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <div className="d-flex flex-column align-items-center justify-content-center">
        {!taskData.thumbnail ? (
          <div className="d-flex flex-column align-items-center justify-content-center">
            <button type="button" className="btn border-0">
              <img
                className="bg-contain w-16 mb-2"
                src={imageIcon}
                alt="Upload Icon"
              />
            </button>
            <span className="text-muted small">{i18n.t("cmsImpact.upload_photo")}</span>
          </div>
        ) : (
          <div className="d-flex flex-column align-items-center justify-content-center">
            <img
              id="divUploadImg"
              className="bg-contain max-h-72"
              src={`${
                import.meta.env.VITE_HOST_URL_TPLANET
              }/static/project/${id}/tasks/${task.uuid}/cover.png`}
              alt="Task Cover"
            />
          </div>
        )}
      </div>
    </div>
  </div>
</Col>

        {/* 下方表單區域 */}
        <Col md={12}>
          <div className="d-flex gap-4">
            {/* 左側 - 活動設計名稱和專案日期 */}
            <div style={{ flex: "1" }}>
              <Form.Group className="mb-3">
                <Form.Label>{i18n.t("cmsImpact.task_name_uuid", { uuid: taskData.uuid })}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={i18n.t("cmsImpact.task_name_placeholder")}
                  value={taskData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{i18n.t("cmsImpact.project_date")}</Form.Label>
                <div className="d-flex gap-3">
                  <div className="position-relative flex-1">
                    <DatePicker
                      id="project_start_date"
                      selected={taskData.startDate}
                      onChange={(date) => handleInputChange("startDate", date)}
                      className="form-control"
                    />
                    <span className="position-absolute top-50 end-3 translate-middle-y">
                      <img src={DateIcon} alt="date" width={20} />
                    </span>
                  </div>
                  <span className="align-self-center">—</span>
                  <div className="position-relative flex-1">
                    <DatePicker
                      id="project_due_date"
                      selected={taskData.dueDate}
                      onChange={(date) => handleInputChange("dueDate", date)}
                      className="form-control"
                    />
                    <span className="position-absolute top-50 end-3 translate-middle-y">
                      <img src={DateIcon} alt="date" width={20} />
                    </span>
                  </div>
                </div>
              </Form.Group>
            </div>

            {/* 右側 - 理念傳達 */}
            <div style={{ flex: "1" }}>
              <Form.Group className="mb-3">
                <Form.Label>{i18n.t("cmsImpact.concept")}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  placeholder={i18n.t("cmsImpact.concept_placeholder")}
                  value={taskData.overview}
                  onChange={(e) =>
                    handleInputChange("overview", e.target.value)
                  }
                />
              </Form.Group>
            </div>
          </div>
        </Col>
      </div>

      <Modal
        aria-labelledby="contained-modal-title-vcenter"
        centered
        show={modalShow}
        onHide={() => setModalShow(false)}
      >
        <Modal.Body>
          <div className="modal-body m-auto text-xl text-center">
            {i18n.t("cmsImpact.delete_confirm")}
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center border-0">
          <Button
            variant="secondary"
            className="rounded-pill w-36"
            onClick={() => setModalShow(false)}
          >
            {i18n.t("cmsImpact.cancel")}
          </Button>
          <Button
            variant="danger"
            className="rounded-pill w-36"
            id="delete-task"
            onClick={handleDeleteTask}
          >
            {i18n.t("cmsImpact.confirm")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

const ParentTaskBlock = ({ parentTasks, setParentTasks }) => {
  const { id } = useParams();

  const addParentTask = async (objTask = null) => {
    if (!objTask) {
      const formData = new FormData();
      formData.append("email", localStorage.getItem("email"));
      formData.append("uuid", id);

      const response = await submitTask(formData);
      if (!response) {
        console.log("Error, submit task failed.");
        return;
      }
      const newTask = {
        uuid: response,
        name: "",
        period: "",
        overview: "",
        thumbnail: "",
        gps: false,
        startDate: null,
        dueDate: null,
      };

      setParentTasks((prev) => [newTask, ...prev]);
    } else {
      const periodDates = objTask.period?.split("-") || [];
      const newTask = {
        ...objTask,
        startDate: periodDates[0] ? new Date(periodDates[0]) : null,
        dueDate: periodDates[1] ? new Date(periodDates[1]) : null,
      };

      setParentTasks((prev) => [...prev, newTask]);
    }
  };

  const updateTask = useCallback(
    (updatedTask) => {
      setParentTasks((prev) =>
        prev.map((task) =>
          task.uuid === updatedTask.uuid ? updatedTask : task
        )
      );
    },
    [setParentTasks]
  );

  const removeTask = useCallback(
    (uuid) => {
      setParentTasks((prev) => prev.filter((task) => task.uuid !== uuid));
    },
    [setParentTasks]
  );

  return (
    <Container id="div_parent_task">
      <div className="row justify-content-center my-2">
        <div className="col-9 px-0">
          <Button
            type="button"
            id="add_parent_tasks"
            className="w-full bg-white border-0 shadow"
            variant="light"
            onClick={() => addParentTask()}
          >
            + {i18n.t("cmsImpact.add_activity")}
          </Button>
        </div>
      </div>

      {parentTasks.map((task) => (
        <TaskBlock
          key={task.uuid}
          task={task}
          updateTask={updateTask}
          removeTask={removeTask}
        />
      ))}
    </Container>
  );
};

export default ParentTaskBlock;
