import { useState, useEffect } from "react";
import "../progress_bar.css";
import { useParams } from "react-router-dom";
import {
  handlePreview,
  handlePrevious,
  handleNextPage,
  handleSave,
} from "../../../utils/CmsAgent";
import { Form } from "react-bootstrap";
import { plan_info } from "../../../utils/Plan";
import { taiwanDistricts } from "../../../data/taiwanDistricts";
import { useTranslation } from "react-i18next";

const CmsContactPerson = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    hoster: "",
    department: "",
    email: "",
    tel: "",
    list_location: "",
  });
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const { t } = useTranslation();

  const validateFields = () => {
    if (!formData.list_location || formData.list_location.trim() === "") {
      alert("請選擇行政區域");
      return false;
    }
    return true;
  };


  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { id, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      locations: {
        ...prev.locations,
        [id]: checked,
      },
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await plan_info(id);

      handleInputChange("hoster", data.hoster);
      handleInputChange("org", data.org);
      handleInputChange("email", data.email);
      handleInputChange("tel", data.tel);
      handleInputChange("list_location", data.location);

      // 回填縣市和鄉鎮選單
      if (data.location) {
        const location = data.location;
        // 檢查是否為「XX縣全區」或「XX市全區」格式
        const fullAreaMatch = location.match(/^(.+[縣市])全區$/);
        if (fullAreaMatch) {
          setSelectedCity(fullAreaMatch[1]);
          setSelectedDistrict("");
        } else {
          // 嘗試找出對應的縣市
          for (const [city, districts] of Object.entries(taiwanDistricts)) {
            if (districts.includes(location)) {
              setSelectedCity(city);
              setSelectedDistrict(location);
              break;
            }
          }
        }
      }

      setFormData((prev) => ({
        ...prev,
      }));
    };
    fetchData();
  }, [id]);

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
        <li className="active done">
          <span>{t("progressbar.step3")}</span>
        </li>
        <li className="active">
          <span>{t("progressbar.step4")}</span>
        </li>
        <li>
          <span></span>
        </li>
      </ul>

      <section>
        <div className="container pt-5">
          <form id="weight_container">
            <div className="row mt-5 pt-5 align-items-center justify-content-center">
              <div className="col-9 px-0">
                <p className="bg-[#317EE0] py-2 text-white pl-6">
                    {t("cmsSdgsSetting.title")}
                </p>
              </div>
              <div className="flex justify-center p-0">
                <div className="flex flex-col col-9">
                  <Form className="bg-white p-3 shadow">
                    <Form.Group className="mb-3">
                      <Form.Label>{t("cmsContact.hoster")}</Form.Label>
                      <Form.Control
                        type="text"
                        id="hoster"
                        maxLength={20}
                        value={formData.hoster}
                        onChange={(e) =>
                          handleInputChange("hoster", e.target.value)
                        }
                      />
                    </Form.Group>

                    {/* 主責局處 }
                    <Form.Group className="mb-3">
                      <Form.Label>主責局處</Form.Label>
                      <Form.Select
                        name="department"
                        value={formData.department}
                        onChange={(e) =>
                          handleInputChange("department", e.target.value)
                        }
                        required
                      >
                        <option value="">選擇局處</option>
                        {departments.map((dept, index) => (
                          <option key={index} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    */}

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        id="email"
                        placeholder={t("cmsContact.email_placeholder")}
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>{t("cmsContact.phone")}</Form.Label>
                      <Form.Control
                        type="tel"
                        id="tel"
                        placeholder={t("cmsContact.phone_placeholder")}
                        maxLength={20}
                        value={formData.tel}
                        onChange={(e) =>
                          handleInputChange("tel", e.target.value)
                        }
                      />
                    </Form.Group>
                  </Form>
                </div>
              </div>

              <div className="flex mt-5 items-center justify-center p-0">
                <div className="col-9">
                  <p className="bg-[#317EE0] py-2 text-white pl-6">{t("cmsContact.location_title")}</p>
                </div>
              </div>
              <div className="col-9 p-3 bg-white shadow">
                <div className="flex gap-3">
                  <Form.Select
                    aria-label="選擇縣市"
                    value={selectedCity}
                    onChange={(e) => {
                      const city = e.target.value;
                      setSelectedCity(city);
                      setSelectedDistrict("");
                      if (city) {
                        handleInputChange("list_location", `${city}全區`);
                      } else {
                        handleInputChange("list_location", "");
                      }
                    }}
                    className="flex-1"
                  >
                    <option value="">{t("cmsContact.select_city")}</option>
                    {Object.keys(taiwanDistricts).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </Form.Select>

                  <Form.Select
                    aria-label="選擇鄉鎮市區"
                    value={selectedDistrict}
                    onChange={(e) => {
                      const district = e.target.value;
                      setSelectedDistrict(district);
                      if (district) {
                        handleInputChange("list_location", district);
                      } else if (selectedCity) {
                        handleInputChange("list_location", `${selectedCity}全區`);
                      }
                    }}
                    className="flex-1"
                    disabled={!selectedCity}
                  >
                    <option value="">{selectedCity ? t("cmsContact.city_all", { city: selectedCity }) : t("cmsContact.select_city_first")}</option>
                    {selectedCity &&
                      taiwanDistricts[selectedCity]?.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                  </Form.Select>
                </div>
              </div>
            </div>

            {/* 按鈕 */}
            <div className="row mt-5 mb-5 pb-3 justify-content-center">
              <div className="col-md-8 mt-5">
                <div className="flex flex-col md:flex-row justify-between space-y-3 md:space-y-0 md:space-x-3">
                  <button
                    type="submit"
                    id="btn_cms_plan_preview"
                    className="btn btn-secondary rounded-pill w-full md:w-1/5"
                    onClick={(event) => handlePreview(event, formData, id)}
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
                        handleNextPage(event, formData, id);
                      }
                    }}
                  >
                    {t("cmsbutton.complete")}
                  </button>
                  <button
                    type="submit"
                    id="btn_cms_plan_save"
                    className="btn btn-success rounded-pill w-full md:w-1/5"
                    onClick={(event) => handleSave(event, formData, id)}
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

export default CmsContactPerson;
