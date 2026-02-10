import { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { getWeightMeta } from "../../utils/sdgs/Weight";

const GenerateSdgsModal = ({ taskId, weight, handleInputChange }) => {
  const [weights, setWeights] = useState(new Array(27).fill(0));
  const [selectedWeights, setSelectedWeights] = useState(new Array(27).fill(0));
  const [weightData, setWeightData] = useState([]); //for ModalData
  const [isLoading, setIsLoading] = useState(false);
  const WEIGHTS = ["SDGs", "CommunityDevelopment", "FiveWaysofLife"];
  const [show, setShow] = useState(false);

  const fetchSDGsData = async () => {
    setIsLoading(true);
    try {
      const weightDetails = [];
      let globalIdCounter = 1;

      for (const weight of WEIGHTS) {
        const data = await getWeightMeta(weight);
        const categories = data.content.categories.map((category) => {
          return {
            ...category,
            id: globalIdCounter++,
            thumbnail: category.thumbnail.replace(
              "/static/imgs",
              "/src/assets"
            ),
          };
        });

        weightDetails.push(...categories);
      }

      setWeightData(weightDetails);
    } catch (error) {
      console.error("Error fetching SDGs data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!weight) {
      setWeights(new Array(27).fill(0));
    } else {
      const weightArray = Object.values(JSON.parse(weight)).map(Number);
      setWeights(weightArray);
    }

    fetchSDGsData();
  }, [weight]);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSelect = (index) => {
    const newSelectedWeights = [...selectedWeights];
    newSelectedWeights[index] = newSelectedWeights[index] === 1 ? 0 : 1;
    setSelectedWeights(newSelectedWeights);
  };

  const handleAdd = () => {
    const sdgsArray = selectedWeights
      .map((w, index) => (w === 1 ? { sdg: index + 1, des: "" } : null))
      .filter((item) => item !== null);

    const result = [{ task_parent_id: taskId }, ...sdgsArray];

    handleInputChange("tasks", JSON.stringify(result));

    setWeights(selectedWeights);
    handleClose();
  };

  const handleRemove = (index) => {
    const newWeights = [...weights];
    newWeights[index] = 0;
    setWeights(newWeights);
    setSelectedWeights(newWeights);
  };

  return (
    <>
      <p></p>
      <div className="sdgs-container d-flex">
        <div className="d-block">
          <Button
            id="icon_btn"
            className="btn-light btn-outline-dark rounded-0 participation-margin mt-md-0 mr-3 d-flex justify-content-center align-items-center w-20 h-20 cursor-pointer"
            onClick={handleShow}
          >
            +
          </Button>
        </div>
        <div id="icon_container" className="flex flex-wrap gap-2 ">
          {weights.map((w, index) => {
            if (w === 1 && weightData[index]) {
              const iconInfo = weightData[index];
              return (
                <div
                  key={index}
                  className="position-relative d-flex justify-content-center align-items-center w-20 h-20"
                >
                  <img
                    className="w-100 h-100"
                    src={iconInfo.thumbnail}
                    alt={`Icon ${index + 1}`}
                  />
                  <button
                    className="position-absolute top-0 right-0 border-0 text-white bg-black opacity-50 w-6 h-6"
                    onClick={() => handleRemove(index)}
                  >
                    &times;
                  </button>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>新增 SDGs 指標</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="flex-wrap">
            {weights.map((w, index) => {
              if (w === 0 && weightData[index]) {
                const iconInfo = weightData[index];
                return (
                  <button
                    key={index}
                    className={`flex items-center gap-3 w-full border-1 mt-2 h-20 rounded-md ${
                      selectedWeights[index] ? "bg-gray-300" : ""
                    }`}
                    onClick={() => handleSelect(index)}
                  >
                    <div
                      key={index}
                      className="w-[60px] h-[60px] ml-3 flex-shrink-0 "
                    >
                      <img
                        className="w-full h-full object-contain"
                        src={iconInfo.thumbnail}
                        alt={`Icon ${index + 1}`}
                      />
                    </div>
                    <p className="m-0">{iconInfo.title}</p>
                  </button>
                );
              }
              return null;
            })}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            關閉
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            新增
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default GenerateSdgsModal;
