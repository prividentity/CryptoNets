export const mapDevices = (devices: any) => ({
  label: devices.label,
  value: devices.deviceId,
});

export const isIphoneCC = (capabilities: MediaTrackCapabilities | null) =>
  capabilities &&
  capabilities?.height?.max === 1440 &&
  capabilities?.width?.max === 1920;

const WEB_CANVAS_SIZE = {
  '10K': { width: 10240, height: 4320 },
  '8K': { width: 7680, height: 4320 },
  '5K': { width: 5120, height: 2880 },
  '4K': { width: 4096, height: 2160 },
  '2K': { width: 2560, height: 1440 },
  FHD: { width: 1920, height: 1080 },
  iPhoneCC: { width: 1920, height: 1440 },
  UXGA: { width: 1600, height: 1200 },
  SXGA: { width: 1280, height: 1024 },
  SXGA2: { width: 1280, height: 960 },
};

const MOBILE_CANVAS_SIZE = {
  '2K': { width: 2560, height: 1440 },
  FHD: { width: 1920, height: 1080 },
  UXGA: { width: 1600, height: 1200 },
  SXGA: { width: 1280, height: 1024 },
  SXGA2: { width: 1280, height: 960 },
};

export const CANVAS_SIZE: any =
  window.innerWidth < 767 ? MOBILE_CANVAS_SIZE : WEB_CANVAS_SIZE;

export function getUrlParameter(sParam: string, defaultValue: null | string) {
  const sPageURL = window.location.search.substring(1);
  const sURLVariables = sPageURL.split('&');
  let sParameterName;
  let i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return typeof sParameterName[1] === undefined
        ? defaultValue
        : decodeURIComponent(sParameterName[1]);
    }
  }
  return defaultValue;
}

export const canvasSizeOptions = [
  { label: '10K', value: '10K' },
  { label: '8K', value: '8K' },
  { label: '5K', value: '5K' },
  { label: '4K', value: '4K' },
  { label: '2K', value: '2K' },
  { label: 'FHD (1080p)', value: 'FHD' },
  { label: 'UXGA', value: 'UXGA' },
  { label: 'SXGA', value: 'SXGA' },
  { label: 'SXGA2', value: 'SXGA2' },
];

export const WIDTH_TO_STANDARDS: any = {
  1600: 'UXGA',
  1920: 'FHD',
  2560: '2K',
  4096: '4K',
  4032: '4K',
  5120: '5K',
  7680: '8K',
  10240: '10K',
};

export const ElementId = 'userVideo';

export const frontDocumentStatusMessage = [
  'Success',
  '',
  'Too blurry, please hold still',
  'Move Closer',
  'Please show front of the ID',
  'Please hold still',
  'Move just a little closer',
  'SYSTEM ERROR. Please try again later.',
  'Please show ID at the center of the screen',
];
