import Platform from 'platform';

export const getDisplayedMessage = (result) => {
  switch (result) {
    case -1:
      return 'No Face';
    case 0:
      return 'Face detected';
    case 1:
      return 'Image Spoof';
    case 2:
      return 'Video Spoof';
    case 3:
      return 'Video Spoof';
    case 4:
      return 'Too far away';
    case 5:
      return 'Too far to right';
    case 6:
      return 'Too far to left';
    case 7:
      return 'Too far up';
    case 8:
      return 'Too far down';
    case 9:
      return 'Too blurry';
    case 10:
      return 'PLEASE REMOVE EYEGLASSES';
    case 11:
      return 'PLEASE REMOVE FACEMASK';
    default:
      return '';
  }
};

export const isIOS = Platform.os.family === 'iOS';
export const osVersion = Number(Platform.os.version);
export const isAndroid = Platform.os.family === 'Android';
export const isMobile = isIOS || isAndroid;

export function getQueryParams(queryString) {
  const query = queryString.split('+').join(' ');
  const params = {};

  const regex = /(?:\?|&|;)([^=]+)=([^&|;]+)/g;
  const tokens = regex.exec(query);

  if (tokens && tokens.length > 2) params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  return params;
}

export const isBackCamera = (availableDevices, currentDevice) => {
  const mediaDevice = availableDevices.find((device) => device.value === currentDevice);
  return mediaDevice?.label?.toLowerCase().includes('back');
};
