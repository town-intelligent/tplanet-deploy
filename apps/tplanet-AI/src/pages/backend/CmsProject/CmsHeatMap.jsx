import { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useRegions, useDistricts } from "../../../utils/multi-tenant";

const sdgs = [
  "SDG1",
  "SDG2",
  "SDG3",
  "SDG4",
  "SDG5",
  "SDG6",
  "SDG7",
  "SDG8",
  "SDG9",
  "SDG10",
  "SDG11",
  "SDG12",
  "SDG13",
  "SDG14",
  "SDG15",
  "SDG16",
  "SDG17",
];

// 地圖資料從 tenant config 取得

const HeatMap = () => {
  const [district, setDistrict] = useState("all");
  const [selectedSdg, setSelectedSdg] = useState("all");
  const regions = useRegions();
  const districts = useDistricts();

  // 從 tenant config 取得地圖中心點
  const [centerLong, centerLat] = regions.center || [120.9, 23.9];
  const cities = regions.cities || [];

  return (
    <div className="w-5/6 mx-auto mt-4">
      <p className="text-4xl">永續主題：國家推動事務發展計畫</p>
      <div className="flex gap-4">
        <div className="w-32">
          <Form.Select
            aria-label="行政區域"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="">行政區域</option>
            {districts.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </Form.Select>
        </div>
        <div className="w-40">
          <Form.Select
            aria-label="選擇永續發展指標"
            id="sdg_filter"
            value={selectedSdg}
            onChange={(e) => setSelectedSdg(e.target.value)}
          >
            <option value="all">永續發展指標</option>
            {sdgs.map((sdg) => (
              <option key={sdg} value={sdg}>
                {sdg}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>
      <div className="my-4">
        <MapContainer
          className="w-full h-[480px]"
          zoom={regions.zoom || 10}
          center={[centerLat, centerLong]}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {cities.map((city, k) => (
            <CircleMarker
              key={k}
              center={[city.coordinates[1], city.coordinates[0]]}
              radius={10}
              fillOpacity={0.5}
              stroke={false}
            >
              <Tooltip direction="right" offset={[-8, -2]} opacity={1}>
                <div className="flex gap-2.5 p-2 font-semibold">
                  <div className="text-right">
                    <span>鄉鎮區</span>
                    <br />
                    <span>局處</span>
                    <br />
                    <span>總投入經費</span>
                    <br />
                    <span>永續發展指標</span>
                  </div>
                  <div>
                    <span>{city.name}</span>
                    <br />
                    <span>-</span>
                    <br />
                    <span>-</span>
                    <br />
                    <span>-</span>
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="flex justify-end mb-4">
        <Button
          variant="dark"
          className="w-32"
          onClick={() => window.history.back()}
        >
          返回
        </Button>
      </div>
    </div>
  );
};

export default HeatMap;
