// utils/exporters.js
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";
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
  // 提取 oklch 值
  const match = oklchStr.match(/oklch\(([\d.%\s]+)\)/);
  if (!match) return "#000000";

  const values = match[1].split(/\s+/);
  const l = parseFloat(values[0]) / 100; // lightness 0-1
  const c = parseFloat(values[1]) || 0; // chroma
  const h = parseFloat(values[2]) || 0; // hue

  // 簡單的近似轉換（實際 oklch 轉換很複雜）
  // 這裡提供一個基本的近似值
  const hueRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hueRad);
  const b = c * Math.sin(hueRad);

  // 基本的 Lab 到 RGB 轉換（簡化版）
  let r = l + a * 0.5;
  let g = l - a * 0.2 - b * 0.3;
  let blue = l - b * 0.8;

  // 確保值在 0-1 範圍內
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  blue = Math.max(0, Math.min(1, blue));

  // 轉換為 0-255
  const rInt = Math.round(r * 255);
  const gInt = Math.round(g * 255);
  const bInt = Math.round(blue * 255);

  return `rgb(${rInt}, ${gInt}, ${bInt})`;
};

// 更完整的樣式替換函數
const replaceAllOklch = (root) => {
  const replaced = [];
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );

  // 處理根元素
  processElement(root, replaced);

  // 處理所有子元素
  while (walker.nextNode()) {
    processElement(walker.currentNode, replaced);
  }

  return replaced;
};

const processElement = (el, replaced) => {
  const styles = window.getComputedStyle(el);

  // 需要檢查的 CSS 屬性
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
      replaced.push({
        el,
        prop,
        original: el.style[prop] || "",
        computedOriginal: value,
      });
      el.style[prop] = rgb;
    }
  });

  // 處理 CSS 變數中的 oklch
  if (el.style) {
    for (let i = 0; i < el.style.length; i++) {
      const prop = el.style[i];
      if (prop.startsWith("--")) {
        const value = el.style.getPropertyValue(prop);
        if (value && value.includes("oklch")) {
          const rgb = oklchToRgb(value);
          replaced.push({
            el,
            prop,
            original: value,
            isCustomProperty: true,
          });
          el.style.setProperty(prop, rgb);
        }
      }
    }
  }
};

const restoreAll = (replaced) => {
  replaced.forEach(({ el, prop, original, isCustomProperty }) => {
    if (isCustomProperty) {
      if (original) {
        el.style.setProperty(prop, original);
      } else {
        el.style.removeProperty(prop);
      }
    } else {
      el.style[prop] = original;
    }
  });
};

export const exportChartAsPDF = async (
  elementId,
  filename = "chart.pdf",
  meta
) => {
  const node = document.getElementById(elementId);
  if (!node) {
    console.error(`找不到元素: ${elementId}`);
    return;
  }

  let replaced = [];

  try {
    // 強制替換掉 oklch
    replaced = replaceAllOklch(node);

    // 等待一下讓樣式生效
    await new Promise((resolve) => setTimeout(resolve, 100));

    // const canvas = await html2canvas(node, {
    //   scale: 2,
    //   useCORS: true,
    //   allowTaint: true,
    //   backgroundColor: "#ffffff",
    //   width: node.scrollWidth,
    //   height: node.scrollHeight,
    // });
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        // 在複製的文檔中強制設定白色背景
        const clonedNode = clonedDoc.getElementById(elementId);
        if (clonedNode) {
          clonedNode.style.backgroundColor = "#ffffff";
          clonedNode.style.overflow = "visible";
          clonedNode.style.maxWidth = "none";
          clonedNode.style.width = "auto";
          clonedNode.style.height = "auto";
          
          // 設定所有子元素
          const allElements = clonedNode.getElementsByTagName("*");
          for (let el of allElements) {
            const computedBg = window.getComputedStyle(el).backgroundColor;
            if (computedBg === "transparent" || computedBg === "rgba(0, 0, 0, 0)") {
              el.style.backgroundColor = "transparent";
            }
          }
        }
      },
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 36;

    // 只添加圖片，移除所有文字
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

    // 使用 id_chart.pdf 格式的檔名
    const chartId = elementId.replace("chart-", ""); // 移除 'chart-' 前綴
    const pdfFilename = `${chartId}_chart.pdf`;

    pdf.save(pdfFilename);

    console.log("PDF 匯出成功:", pdfFilename);
  } catch (error) {
    console.error("PDF 匯出失敗:", error);
    alert("PDF 匯出失敗，請稍後再試");
  } finally {
    // 匯出後還原樣式
    if (replaced.length > 0) {
      restoreAll(replaced);
    }
  }
};

export const exportChartAsDocx = async (
  elementId,
  filename = "chart.docx",
  meta
) => {
  const node = document.getElementById(elementId);
  if (!node) {
    console.error(`找不到元素: ${elementId}`);
    return;
  }

  let replaced = [];

  try {
    // 強制替換掉 oklch
    replaced = replaceAllOklch(node);

    // 等待一下讓樣式生效
    await new Promise((resolve) => setTimeout(resolve, 100));

    // const canvas = await html2canvas(node, {
    //   scale: 2,
    //   useCORS: true,
    //   allowTaint: true,
    //   backgroundColor: "#ffffff",
    // });

    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        // 在複製的文檔中強制設定白色背景
        const clonedNode = clonedDoc.getElementById(elementId);
        if (clonedNode) {
          clonedNode.style.backgroundColor = "#ffffff";
          clonedNode.style.overflow = "visible";
          clonedNode.style.maxWidth = "none";
          clonedNode.style.width = "auto";
          clonedNode.style.height = "auto";
          
          // 設定所有子元素
          const allElements = clonedNode.getElementsByTagName("*");
          for (let el of allElements) {
            const computedBg = window.getComputedStyle(el).backgroundColor;
            if (computedBg === "transparent" || computedBg === "rgba(0, 0, 0, 0)") {
              el.style.backgroundColor = "transparent";
            }
          }
        }
      },
    });
    
    const dataURL = canvas.toDataURL("image/png");
    const imgBuffer = dataURLToArrayBuffer(dataURL);

    // 只包含圖片，移除文字內容
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  data: imgBuffer,
                  transformation: {
                    width: 600,
                    height: Math.round((600 * canvas.height) / canvas.width),
                  },
                }),
              ],
            }),
          ],
        },
      ],
    });

    // 使用 id_chart.docx 格式的檔名
    const chartId = elementId.replace("chart-", ""); // 移除 'chart-' 前綴
    const docxFilename = `${chartId}_chart.docx`;

    const blob = await Packer.toBlob(doc);
    saveAs(blob, docxFilename);

    console.log("DOCX 匯出成功:", docxFilename);
  } catch (error) {
    console.error("DOCX 匯出失敗:", error);
    alert("DOCX 匯出失敗，請稍後再試");
  } finally {
    // 匯出後還原樣式
    if (replaced.length > 0) {
      restoreAll(replaced);
    }
  }
};
