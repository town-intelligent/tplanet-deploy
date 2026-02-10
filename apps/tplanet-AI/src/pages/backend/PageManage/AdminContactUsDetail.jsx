import React, { useEffect, useState } from "react";
//import { mockup_get } from "../utils/Mockup.jsx";
import SdgsModal from "../../backend/components/SdgSelect.jsx";
//import Banner from "../assets/contact-us-banner.png";
import { Form, Button } from "react-bootstrap";
import SliderCaptchaComponent from "../../../utils/Captcha.jsx";
import { useDepartments } from "../../../utils/multi-tenant";

export default function ContactUsPage({
  selectedContactDetail,
  setSelectedContactDetail,
  setCurrentView,
}) {
  const departments = useDepartments();
  //const [bannerUrl, setBannerUrl] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedSDGs, setSelectedSDGs] = useState([]);
  const [formData, setFormData] = useState({
    name: selectedContactDetail.name,
    email: selectedContactDetail.email,
    company: selectedContactDetail.company,
    department: selectedContactDetail.department,
    phone: selectedContactDetail.phone,
    sdgs: selectedContactDetail.issue,
    needs: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      sdgs: selectedSDGs,
    }));
  }, [selectedSDGs]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = () => {
    if (!isVerified) {
      alert("請先驗證");
    }
    console.log("submit");
  };

  const handleBackToTable = () => {
    setCurrentView("table");
    setSelectedContactDetail(null);
  };

  //   useEffect(() => {
  //     const fetchData = async () => {
  //       // mockup 取得 banner
  //       const form = new FormData();
  //       form.append("email", "forus999@gmail.com");
  //       const obj_mockup = await mockup_get(form);

  //       try {
  //         if (obj_mockup.description?.["contact-us-banner-img"]) {
  //           const imgPath = obj_mockup.description["contact-us-banner-img"];
  //           setBannerUrl(import.meta.env.VITE_HOST_URL_TPLANET + imgPath);
  //         }
  //       } catch (e) {
  //         console.log(e);
  //       }
  //     };

  //     fetchData();
  //   }, []);

  return (
    <div>
      {/* Banner */}
      {/* <div
        id="contact_us_banner_1"
        style={{
          backgroundImage: `url(${bannerUrl || Banner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "200px",
        }}
      /> */}

      <div className="w-5/6 mx-auto my-4">
        <Button variant="dark" onClick={handleBackToTable}>
          回列表列
        </Button>
      </div>
      <Form className="w-5/6 mx-auto py-10">
        <div className="flex justify-between">
          <div className="col-md-5">
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>*姓名</Form.Label>
              <Form.Control
                type="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>公司名稱</Form.Label>
              <Form.Control
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>*聯絡電話</Form.Label>
              <Form.Control
                type="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </div>

          <div className="col-md-5">
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>*電子郵件</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>關注議題</Form.Label>
              <SdgsModal
                selectedSDGs={selectedSDGs}
                setSelectedSDGs={setSelectedSDGs}
              />
            </Form.Group>
          </div>
        </div>
        <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
          <Form.Label>*需求</Form.Label>
          <Form.Control
            as="textarea"
            name="needs"
            rows={3}
            value={formData.needs}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <div className="flex justify-center">
          <SliderCaptchaComponent
            isVerified={isVerified}
            setIsVerified={setIsVerified}
          />
        </div>
        <div className="flex justify-center">
          <Button variant="secondary" onClick={handleSubmit}>
            確定送出
          </Button>
        </div>
      </Form>
    </div>
  );
}
