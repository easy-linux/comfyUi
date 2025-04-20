import { addBlobAsJob } from "./jobs";

let isDrawing = false;

const dpr = window.devicePixelRatio || 1;
let cursorUrl = null;
let cursorRadius = 20;
let lastPosition = null;

const onStartDrawing = () => {
  isDrawing = true;
  const maskCanvas = document.getElementById("maskCanvas");
  const image = `<?xml version="1.0" encoding="utf-8"?>
<svg
        aria-hidden='true'
        width="${cursorRadius}" height="${cursorRadius}" viewBox="0 0 ${cursorRadius} ${cursorRadius}"
        fill='none'
        xmlns='http://www.w3.org/2000/svg'>
    <circle cx="${Math.round(cursorRadius / 2)}" cy="${Math.round(cursorRadius / 2)}" r="${Math.round(
    cursorRadius / 2
  )}" fill="green" stroke="blue" stroke-width="0.1" />
</svg>`;
  const blob = new Blob([image], { type: "image/svg+xml" });
  cursorUrl = URL.createObjectURL(blob);
  maskCanvas.style.cursor = `url('${cursorUrl}') ${Math.round(cursorRadius / 2)} ${Math.round(cursorRadius / 2)}, auto`;
};
const onEndDrawing = () => {
  isDrawing = false;
  const maskCanvas = document.getElementById("maskCanvas");
  maskCanvas.style.cursor = "default";
  URL.revokeObjectURL(cursorUrl);
  cursorUrl = null;
  lastPosition = null;
};

const onDrawing = (event) => {
  if (!isDrawing) return;

  const maskCanvas = document.getElementById("maskCanvas");
  if (maskCanvas) {
    const maskCtx = maskCanvas.getContext("2d");
    if (maskCtx) {
      maskCtx.save();
      // maskCtx.scale(dpr, dpr);
      const rect = maskCanvas.getBoundingClientRect();
      // const x = event.offsetX * dpr
      // const y = event.offsetY * dpr

      const scaleX = maskCanvas.width / rect.width;
      const scaleY = maskCanvas.height / rect.height;

      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      maskCtx.globalCompositeOperation = "source-over";

      if (!lastPosition?.x || !lastPosition?.y) {
        maskCtx.fillStyle = "rgba(255, 255, 255, 1)"; // Белый цвет для маски
        maskCtx.beginPath();
        maskCtx.arc(x, y, cursorRadius, 0, 2 * Math.PI);
        maskCtx.fill();
        maskCtx.restore();
      } else {
        maskCtx.beginPath();
        maskCtx.moveTo(lastPosition.x, lastPosition.y);
        maskCtx.lineTo(x, y);
        maskCtx.lineWidth = cursorRadius * 2;
        maskCtx.lineCap = "round";
        maskCtx.strokeStyle = "rgba(255, 255, 255, 1)";
        maskCtx.stroke();
      }
      lastPosition = { x, y };
    }
  }
};

const subscribe = (maskCanvas) => {
  if (maskCanvas) {
    maskCanvas.addEventListener("mousedown", onStartDrawing);
    maskCanvas.addEventListener("mouseup", onEndDrawing);
    maskCanvas.addEventListener("mouseout", onEndDrawing);
    maskCanvas.addEventListener("mousemove", onDrawing);
  }
};

const unsubscribe = () => {
  const maskCanvas = document.getElementById("maskCanvas");
  if (maskCanvas) {
    maskCanvas.removeEventListener("mousedown", onStartDrawing);
    maskCanvas.removeEventListener("mouseup", onEndDrawing);
    maskCanvas.removeEventListener("mouseout", onEndDrawing);
    maskCanvas.removeEventListener("mousemove", onDrawing);
  }
};

const reset = () => {
  isDrawing = false;
  unsubscribe();
};

export const clearMask = () => {
  const maskCanvas = document.getElementById("maskCanvas");
  const maskCtx = maskCanvas.getContext("2d");
  maskCtx.fillStyle = "rgba(0, 0, 0, 1)";
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
};

export const addCanvasToJob = () => {
  const imageCanvas = document.getElementById("imageCanvas");
  imageCanvas.toBlob((blob) => {
    if (blob) {
      addBlobAsJob(blob);
    }
  }, "image/png");
};

export const prepareInPaint = (url) => {
  const container = document.getElementById("canvasContainer");
  const imageCanvas = document.getElementById("imageCanvas");
  const maskCanvas = document.getElementById("maskCanvas");
  const radiusRange = document.querySelector(".radiusRange");

  const imgCtx = imageCanvas.getContext("2d");
  const maskCtx = maskCanvas.getContext("2d");

  subscribe(maskCanvas);

  if (radiusRange) {
    radiusRange.addEventListener("change", (e) => {
      cursorRadius = parseInt(e.target.value);
    });
  }

  const img = new Image();
  img.onload = () => {
    imageCanvas.dataset.realWidth = img.width;
    imageCanvas.dataset.realHeight = img.height;
    const scale = Math.min(container.clientWidth / img.width, container.clientHeight / img.height);
    const width = img.width;
    const height = img.height;

    imageCanvas.width = width;
    imageCanvas.height = height;
    maskCanvas.width = width;
    maskCanvas.height = height;

    imgCtx.drawImage(img, 0, 0, width, height);
    maskCtx.fillStyle = "rgba(0, 0, 0, 1)";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    const widthS = img.width * scale;
    const heightS = img.height * scale;

    imageCanvas.style.width = `${widthS}px`;
    imageCanvas.style.height = `${heightS}px`;

    maskCanvas.style.width = `${widthS}px`;
    maskCanvas.style.height = `${heightS}px`;
  };
  img.src = url;
};

export const setInpaintFile = (file) => {
  if (file) {
    reset();
    const reader = new FileReader();
    reader.onload = (event) => {
      prepareInPaint(event.target.result);
    };

    reader.readAsDataURL(file);
  }
};

export const getImageBase64 = () => {
  const imageCanvas = document.getElementById("imageCanvas");
  if (imageCanvas) {
    const base64URL = imageCanvas.toDataURL("image/png");
    const img = document.createElement("img");
    img.src = base64URL;
    img.setAttribute("class", "test-image");

    img.onload = () => console.log(`Image dimensions: ${img.width} x ${img.height}`);

    // document.body.appendChild(img)
    return base64URL.split(",")[1];
  }
};

export const getMaskBase64 = () => {
  const maskCanvas = document.getElementById("maskCanvas");
  if (maskCanvas) {
    const base64URL = maskCanvas.toDataURL("image/png");
    const img = document.createElement("img");
    img.src = base64URL;

    img.onload = () => console.log(`Mask dimensions: ${img.width} x ${img.height}`);

    img.setAttribute("class", "test-mask");
    // document.body.appendChild(img)
    return base64URL.split(",")[1];
  }
};

export const getMaskBoundingBox = () => {
  const maskCanvas = document.getElementById("maskCanvas");
  const ctx = maskCanvas.getContext("2d");
  const { width, height } = maskCanvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  let hasPixel = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i]; //  (R channel)

      if (alpha > 0) {
        // has mask
        hasPixel = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasPixel) return null; // nothing is found

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
};

export const getSizes = () => {
  const imageCanvas = document.getElementById("imageCanvas");
  return {
    width: imageCanvas.width,
    height: imageCanvas.height,
  };
};
