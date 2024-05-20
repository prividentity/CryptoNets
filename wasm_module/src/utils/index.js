import Platform from "platform";

export const getDisplayedMessage = (result) => {
  switch (result) {
    case -1:
      return "No Face";
    case 0:
      return "Face detected";
    case 1:
      return "Image Spoof";
    case 2:
      return "Video Spoof";
    case 3:
      return "Video Spoof";
    case 4:
      return "Too far away";
    case 5:
      return "Too far to right";
    case 6:
      return "Too far to left";
    case 7:
      return "Too far up";
    case 8:
      return "Too far down";
    case 9:
      return "Too blurry";
    case 10:
      return "PLEASE REMOVE EYEGLASSES";
    case 11:
      return "PLEASE REMOVE FACEMASK";
    default:
      return "";
  }
};

export const isIOS = Platform.os.family === "iOS";
export const osVersion = Number(Platform.os.version);
export const isAndroid = Platform.os.family === "Android";
export const isMobile = isIOS || isAndroid;

export function getQueryParams(queryString) {
  const query = queryString.split("+").join(" ");
  const params = {};

  const regex = /(?:\?|&|;)([^=]+)=([^&|;]+)/g;
  const tokens = regex.exec(query);

  if (tokens && tokens.length > 2) params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  return params;
}

export const isBackCamera = (availableDevices, currentDevice) => {
  const mediaDevice = availableDevices.find((device) => device.value === currentDevice);
  return mediaDevice?.label?.toLowerCase().includes("back");
};

export const canvasSizeOptions = [
  { label: "10K", value: "10K" },
  { label: "8K", value: "8K" },
  { label: "5K", value: "5K" },
  { label: "4K", value: "4K" },
  { label: "2K", value: "2K" },
  { label: "FHD (1080p)", value: "FHD" },
  { label: "UXGA", value: "UXGA" },
  { label: "FACETIME", value: "FACETIME" },
];

export const WIDTH_TO_STANDARDS = {
  1552: "FACETIME",
  1600: "UXGA",
  1920: "FHD",
  2560: "2K",
  4096: "4K",
  4032: "4K",
  5120: "5K",
  7680: "8K",
  10240: "10K",
};

const WEB_CANVAS_SIZE = {
  "10K": { width: 10240, height: 4320 },
  "8K": { width: 7680, height: 4320 },
  "5K": { width: 5120, height: 2880 },
  "4K": { width: 4096, height: 2160 },
  "2K": { width: 2560, height: 1440 },
  FHD: { width: 1920, height: 1080 },
  iPhoneCC: { width: 1920, height: 1440 },
  UXGA: { width: 1600, height: 1200 },
  FACETIME: { width: 1552, height: 1552 },
};

const MOBILE_CANVAS_SIZE = {
  "2K": { width: 2560, height: 1440 },
  FHD: { width: 1920, height: 1080 },
  UXGA: { width: 1600, height: 1200 },
};

export const CANVAS_SIZE = isMobile ? MOBILE_CANVAS_SIZE : WEB_CANVAS_SIZE;

export const mapDevices = (devices) => ({ label: devices.label, value: devices.deviceId });

export function getUrlParameter(sParam, defaultValue) {
  const sPageURL = window.location.search.substring(1);
  const sURLVariables = sPageURL.split("&");
  let sParameterName;
  let i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split("=");

    if (sParameterName[0] === sParam) {
      return typeof sParameterName[1] === undefined ? defaultValue : decodeURIComponent(sParameterName[1]);
    }
  }
  return defaultValue;
}

export const setMax2KForMobile = (width) => {
  if (!isMobile) return width;
  return Math.min(width, 2560);
};

export const getScaledBoundingBox = (scanResult, videoElement) => {
  if (!scanResult || !videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return;
  }

  const originalImageWidth = scanResult.image_width;
  const originalImageHeight = scanResult.image_height;
  const videoElementWidth = videoElement.offsetWidth;
  const videoElementHeight = videoElement.offsetHeight;
  const originalAspectRatio = originalImageWidth / originalImageHeight;
  const videoAspectRatio = videoElementWidth / videoElementHeight;
  let scaleX, scaleY, scaledTopLeftX, scaledTopLeftY, scaledDocumentWidth, scaledDocumentHeight;

  if (originalAspectRatio > videoAspectRatio) {
    const croppedImageWidth = originalImageHeight * videoAspectRatio;
    const croppedImageX = (originalImageWidth - croppedImageWidth) / 2;
    scaleX = videoElementWidth / croppedImageWidth;
    scaleY = videoElementHeight / originalImageHeight;
    scaledTopLeftX = (scanResult.doc_x1 - croppedImageX) * scaleX;
    scaledTopLeftY = scanResult.doc_y1 * scaleY;
    scaledDocumentWidth = scanResult.cropped_doc_width * scaleX;
    scaledDocumentHeight = scanResult.cropped_doc_height * scaleY;
  } else {
    const croppedImageHeight = originalImageWidth / videoAspectRatio;
    const croppedImageY = (originalImageHeight - croppedImageHeight) / 2;
    scaleX = videoElementWidth / originalImageWidth;
    scaleY = videoElementHeight / croppedImageHeight;
    scaledTopLeftX = scanResult.doc_x1 * scaleX;
    scaledTopLeftY = (scanResult.doc_y1 - croppedImageY) * scaleY;
    scaledDocumentWidth = scanResult.cropped_doc_width * scaleX;
    scaledDocumentHeight = scanResult.cropped_doc_height * scaleY;
  }
  const roughScale = scaleX + scaleY / 2;
  return {
    doc_x1: scaledTopLeftX,
    doc_y1: scaledTopLeftY,
    cropped_doc_width: scaledDocumentWidth,
    cropped_doc_height: scaledDocumentHeight,
    roughScale,
  };
};
