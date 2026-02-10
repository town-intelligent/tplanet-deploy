// utils/exporters.js
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, ImageRun } from "docx";
import { saveAs } from "file-saver";

// 把 dataURL 轉 ArrayBuffer
const dataURLToArrayBuffer = (dataURL) => {
  const base64 = dataURL.split(",")[1];
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

// 簡化的 oklch 轉 rgb 函數
const oklchToRgb = (oklchStr) => {
  const match = oklchStr.match(/oklch\(([\d.%\s]+)\)/);
  if (!match) return "#000000";

  const values = match[1].split(/\s+/);
  const l = parseFloat(values[0]) / 100;
  const c = parseFloat(values[1]) || 0;
  const h = parseFloat(values[2]) || 0;

  const hueRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hueRad);
  const b = c * Math.sin(hueRad);

  let r = l + a * 0.5;
  let g = l - a * 0.2 - b * 0.3;
  let blue = l - b * 0.8;

  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  blue = Math.max(0, Math.min(1, blue));

  const rInt = Math.round(r * 255);
  const gInt = Math.round(g * 255);
  const bInt = Math.round(blue * 255);

  return `rgb(${rInt}, ${gInt}, ${bInt})`;
};

// 更完整的樣式替換
const replaceAllOklch = (root) => {
  const replaced = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);

  processElement(root, replaced);
  while (walker.nextNode()) processElement(walker.currentNode, replaced);

  return replaced;
};

const processElement = (el, replaced) => {
  const styles = window.getComputedStyle(el);
  const properties = [
    "color",
    "backgroundColor",
    "borderColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "fill",
    "stroke",
  ];

  properties.forEach((prop) => {
    const value = styles[prop];
    if (value && value.includes("oklch")) {
      const rgb = oklchToRgb(value);
      replaced.push({ el, prop, original: el.style[prop] || "", computedOriginal: value });
      el.style[prop] = rgb;
    }
  });

  if (el.style) {
    for (let i = 0; i < el.style.length; i++) {
      const prop = el.style[i];
      if (prop.startsWith("--")) {
        const value = el.style.getPropertyValue(prop);
        if (value && value.includes("oklch")) {
          const rgb = oklchToRgb(value);
          replaced.push({ el, prop, original: value, isCustomProperty: true });
          el.style.setProperty(prop, rgb);
        }
      }
    }
  }
};

const restoreAll = (replaced) => {
  replaced.forEach(({ el, prop, original, isCustomProperty }) => {
    if (isCustomProperty) {
      if (original) el.style.setProperty(prop, original);
      else el.style.removeProperty(prop);
    } else {
      el.style[prop] = original;
    }
  });
};

// 共用的 html2canvas 選項（強制白底，onclone 也改白）
const getCanvasOptions = (elementId) => ({
  scale: 2,
  useCORS: true,
  allowTaint: true,
  backgroundColor: "#FFFFFF",
  onclone: (clonedDoc) => {
    // 1) 整份文件鋪白底、字改黑
    const html = clonedDoc.documentElement;
    if (html) {
      html.style.background = "#FFFFFF";
      html.style.color = "#000000";
    }
    const body = clonedDoc.body;
    if (body) {
      body.style.background = "#FFFFFF";
      body.style.color = "#000000";
    }
    // 2) 目標節點再保險一次
    const target = clonedDoc.getElementById(elementId);
    if (target) {
      target.style.background = "#FFFFFF";
      target.style.color = "#000000";
    }
  },
});

// 安全決定檔名（空字串也視為未提供）
const resolveFilename = (fallbackName, override) => {
  if (typeof override === "string" && override.trim()) return override.trim();
  return fallbackName;
};

export const exportChartAsPDF = async (elementId, filename, meta) => {
  const node = document.getElementById(elementId);
  if (!node) {
    console.error(`找不到元素: ${elementId}`);
    return;
  }

  let replaced = [];
  try {
    // 先把 oklch 轉掉（避免瀏覽器渲染差異）
    replaced = replaceAllOklch(node);
    await new Promise((r) => setTimeout(r, 100)); // 讓樣式生效

    const canvas = await html2canvas(node, getCanvasOptions(elementId));
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 36;

    // 先鋪白底（雙保險）
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    const availW = pageWidth - margin * 2;
    const availH = pageHeight - margin * 2;
    const imgW = canvas.width;
    const imgH = canvas.height;
    const ratio = Math.min(availW / imgW, availH / imgH);
    const drawW = imgW * ratio;
    const drawH = imgH * ratio;
    const x = margin + (availW - drawW) / 2;
    const y = margin + (availH - drawH) / 2;

    pdf.addImage(imgData, "PNG", x, y, drawW, drawH);

    // 命名：沒給 filename 就用 {元素ID去掉 chart-}_chart.pdf
    const chartId = elementId.replace(/^chart-/, "");
    const defaultName = `${chartId}_chart.pdf`;
    const pdfFilename = resolveFilename(defaultName, filename);

    pdf.save(pdfFilename);
    console.log("PDF 匯出成功:", pdfFilename);
  } catch (error) {
    console.error("PDF 匯出失敗:", error);
    alert("PDF 匯出失敗，請稍後再試");
  } finally {
    if (replaced.length > 0) restoreAll(replaced);
  }
};

export const exportChartAsDocx = async (elementId, filename, meta) => {
  const node = document.getElementById(elementId);
  if (!node) {
    console.error(`找不到元素: ${elementId}`);
    return;
  }

  let replaced = [];
  try {
    replaced = replaceAllOklch(node);
    await new Promise((r) => setTimeout(r, 100));

    const canvas = await html2canvas(node, getCanvasOptions(elementId));
    const dataURL = canvas.toDataURL("image/png");
    const imgBuffer = dataURLToArrayBuffer(dataURL);

    const targetWidth = 600;
    const targetHeight = Math.round((targetWidth * canvas.height) / canvas.width);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  data: imgBuffer,
                  transformation: { width: targetWidth, height: targetHeight },
                }),
              ],
            }),
          ],
        },
      ],
    });

    // 命名：沒給 filename 就用 {元素ID去掉 chart-}_chart.docx
    const chartId = elementId.replace(/^chart-/, "");
    const defaultName = `${chartId}_chart.docx`;
    const docxFilename = resolveFilename(defaultName, filename);

    const blob = await Packer.toBlob(doc);
    saveAs(blob, docxFilename);
    console.log("DOCX 匯出成功:", docxFilename);
  } catch (error) {
    console.error("DOCX 匯出失敗:", error);
    alert("DOCX 匯出失敗，請稍後再試");
  } finally {
    if (replaced.length > 0) restoreAll(replaced);
  }
};