import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Alert, Spinner, Row, Col } from "react-bootstrap";
import { useDepartments } from "../multi-tenant";

const API_BASE = import.meta.env.VITE_HOST_URL_TPLANET;

const EditAccountModal = ({ show, onHide, account, onAccountUpdated }) => {
  const departments = useDepartments();
  const [formData, setFormData] = useState({
    email: "",
    handler: "",       // -> hoster
    department: "",    // -> undertake
    role: "",
    phone: "",         // -> phone_number
    enabled: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ ok: null, msg: "" });

  const roleMap = {
    admin: "系統管理員",
    user: "一般使用者",
  };

  const reverseRoleMap = {
    "系統管理員": "admin",
    "系統管理者": "admin", // 處理可能的變體
    "一般使用者": "user",
  };

  // 當 account 改變時，更新表單資料
  useEffect(() => {
    if (account && show) {
      setFormData({
        email: account.email || "",
        handler: account.host || "",           // 從 host 對應到 handler
        department: account.organization || "", // 從 organization 對應到 department
        role: reverseRoleMap[account.role] || "user", // 轉換回前端的 admin/user 格式
        phone: account.phone_number || "",
        enabled: true, // 目前後端沒有提供此欄位，預設為 true
      });
      setStatus({ ok: null, msg: "" }); // 重置狀態
    }
  }, [account, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    if (!formData.handler.trim()) return "請輸入承辦窗口";
    if (!formData.email.trim()) return "請輸入電子郵件";
    if (!/\S+@\S+\.\S+/.test(formData.email)) return "電子郵件格式不正確";
    if (!formData.department) return "請選擇地方團隊";
    if (!formData.role) return "請選擇帳號角色";
    if (!formData.phone.trim()) return "請輸入聯絡電話";
    // 簡單電話檢查
    if (!/^[0-9\-+() ]{6,20}$/.test(formData.phone)) return "電話格式不正確";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ ok: null, msg: "" });

    const err = validate();
    if (err) {
      setStatus({ ok: false, msg: err });
      return;
    }

    // 準備傳送給後端的資料格式
    const payload = {
      email: formData.email.trim(),           // 必要欄位，用來識別使用者
      undertake: formData.department,         // 地方團隊
      hoster: formData.handler.trim(),        // 承辦窗口
      role: roleMap[formData.role] || formData.role, // 轉換為後端使用的中文角色
      phone_number: formData.phone.trim(),
    };

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/accounts/modify_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      // 根據你的後端回應格式處理
      if (!res.ok || (data.result === false)) {
        const msg = data?.content?.error || data?.error || data?.message || `修改失敗（HTTP ${res.status})`;
        throw new Error(msg);
      }

      setStatus({ ok: true, msg: "帳號資訊修改成功！" });
      
      // 通知父組件更新資料
      if (onAccountUpdated) {
        onAccountUpdated();
      }

      // 延遲關閉 Modal，讓使用者看到成功訊息
      setTimeout(() => {
        onHide();
        setStatus({ ok: null, msg: "" });
      }, 1500);

    } catch (err) {
      setStatus({ ok: false, msg: err.message || "修改失敗" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStatus({ ok: null, msg: "" });
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>編輯帳號 - {formData.email}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {status.ok === true && <Alert variant="success">{status.msg}</Alert>}
        {status.ok === false && <Alert variant="danger">{status.msg}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="editHandler">
                <Form.Label>承辦窗口</Form.Label>
                <Form.Control
                  type="text"
                  name="handler"
                  placeholder="請輸入承辦窗口"
                  value={formData.handler}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="editEmail">
                <Form.Label>電子郵件</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="請輸入電子郵件"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly
                  className="bg-gray-100"
                  title="電子郵件不可修改"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="editDepartment">
                <Form.Label>地方團隊</Form.Label>
                <Form.Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">選擇局處</option>
                  {departments.map((dept, i) => (
                    <option key={dept.id || i} value={dept.name || dept}>
                      {dept.name || dept}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="editRole">
                <Form.Label>帳號角色</Form.Label>
                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="">選擇角色</option>
                  <option value="admin">系統管理員</option>
                  <option value="user">一般使用者</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group controlId="editPhone">
                <Form.Label>聯絡電話</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  placeholder="請輸入聯絡電話"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex align-items-center mb-3">
            <Form.Group controlId="editEnabled" className="d-flex align-items-center">
              <Form.Check
                type="checkbox"
                label="啟用帳號"
                name="enabled"
                checked={formData.enabled}
                onChange={handleChange}
                className="me-2"
              />
              <small className="text-muted">勾選此項目以啟用帳號</small>
            </Form.Group>
          </div>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              處理中…
            </>
          ) : (
            "儲存修改"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditAccountModal;