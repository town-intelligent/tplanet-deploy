// src/pages/.../AddAccount.jsx
import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useDepartments } from "../../utils/multi-tenant";
import { addAccount } from "../../utils/Accounts";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_HOST_URL_TPLANET; // e.g. https://beta-tplanet-backend.ntsdgs.tw

const AddAccount = () => {
  const [formData, setFormData] = useState({
    handler: "",       // -> hoster
    email: "",
    department: "",    // -> undertake
    role: "會員",  // 固定為會員
    phone: "",         // -> phone_number
    enabled: true,     // 後端目前固定啟用；預留
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ ok: null, msg: "" });
  const { t } = useTranslation();
  const departments = useDepartments();

  const roleMap = {
    user: "會員",
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    if (!formData.handler.trim()) return t("addAccount.validation_handler_required");
    if (!formData.email.trim()) return t("addAccount.validation_email_required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return t("addAccount.validation_email_invalid");
    if (!formData.department) return t("addAccount.validation_department_required");
    if (!formData.role) return t("addAccount.validation_role_required");
    if (!formData.phone.trim()) return t("addAccount.validation_phone_required");
    // 可選：簡單電話檢查（允許數字與 - ）
    if (!/^[0-9\-+() ]{6,20}$/.test(formData.phone)) return t("addAccount.validation_phone_invalid");
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

    const payload = {
      email: formData.email.trim(),
      undertake: formData.department,         // 地方團隊
      hoster: formData.handler.trim(),        // 承辦窗口
        // role: roleMap[formData.role] || formData.role
      role: formData.role,
      phone_number: formData.phone.trim(),
      enabled: formData.enabled,
    };

    try {
      setSubmitting(true);
      const result = await addAccount(payload);

      if (!result.success) {
        throw new Error(result.message);
      }

      setStatus({ ok: true, msg: result.message });

      // 清空表單（保留 enabled 的勾選習慣）
      setFormData((s) => ({
        handler: "",
        email: "",
        department: "",
        role: "會員",
        phone: "",
        enabled: s.enabled,
      }));
    } catch (err) {
      setStatus({ ok: false, msg: err.message || t("addAccount.create_fail") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-5 h-full">
      <p className="text-2xl text-center mb-4">{t("addAccount.title")}</p>

      {status.ok === true && <Alert variant="success">{status.msg}</Alert>}
      {status.ok === false && <Alert variant="danger">{status.msg}</Alert>}

      <Form onSubmit={handleSubmit} className="max-w-[800px] mx-auto">
        <div className="bg-white p-4 rounded shadow-sm">
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formHandler">
                <Form.Label>{t("addAccount.handler")}</Form.Label>
                <Form.Control
                  type="text"
                  name="handler"
                  placeholder={t("addAccount.handler_placeholder")}
                  value={formData.handler}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formEmail">
                <Form.Label>{t("addAccount.email")} ({t("addAccount.email_hint")})</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder={t("addAccount.email_placeholder")}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formDepartment">
                <Form.Label>{t("addAccount.department")}</Form.Label>
                <Form.Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t("addAccount.department_placeholder")}</option>
                  {departments.map((dept, i) => (
                    <option key={dept.id || i} value={dept.name || dept}>
                      {dept.name || dept}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formRole">
                <Form.Label>{t("addAccount.role")}</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.role}
                  readOnly
                  className="bg-gray-100"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group controlId="formPhone">
                <Form.Label>{t("addAccount.phone")}</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  placeholder={t("addAccount.phone_placeholder")}
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="flex justify-center my-3">
          <Form.Group controlId="formEnabled" className="d-flex align-items-center">
            <Form.Check
              type="checkbox"
              label={t("addAccount.enable")}
              name="enabled"
              checked={!!formData.enabled}
              onChange={(e) =>
                setFormData((s) => ({
                  ...s,
                  enabled: e.target.checked,
                }))
              }
              className="me-2"
            />

            <small className="text-muted">{t("addAccount.enable_hint")}</small>
          </Form.Group>
        </div>

        <div className="text-center">
          <Button type="submit" variant="dark" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {t("addAccount.submitting")}
              </>
            ) : (
              t("addAccount.title")
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default AddAccount;
