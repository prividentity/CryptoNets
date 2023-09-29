import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { openCamera } from '@privateid/cryptonets-web-sdk';
import { CameraFaceMode } from '@privateid/cryptonets-web-sdk/dist/types';
import { isIphoneCC, mapDevices } from 'src/utils';

@Injectable({
  providedIn: 'root',
})
export class CameraService {
  public readySubject = new BehaviorSubject<boolean>(false);
  private devicesSubject = new BehaviorSubject<
    Array<{ label: string; value: string }>
  >([]);
  private deviceSubject = new BehaviorSubject<string>('');
  private faceModeSubject = new BehaviorSubject<any>(null);
  private cameraFeaturesSubject = new BehaviorSubject<any>({});

  ready$ = this.readySubject.asObservable();
  devices$ = this.devicesSubject.asObservable();
  device$ = this.deviceSubject.asObservable();
  faceMode$ = this.faceModeSubject.asObservable();
  cameraFeatures$ = this.cameraFeaturesSubject.asObservable();

  async init(
    element = 'userVideo',
    requestFaceMode: CameraFaceMode = CameraFaceMode.front,
    requireHD = false,
    onCameraFail = () => {},
    isDocumentScan = false
  ) {
    if (this.readySubject.value) return;

    try {
      const {
        devices = [],
        faceMode,
        settings,
        capabilities,
      } = await openCamera(
        element,
        requireHD,
        null,
        requestFaceMode,
        null,
        isDocumentScan
      );

      if (isIphoneCC(capabilities)) {
        await this.setResolutionForIphoneCC();
      }

      this.cameraFeaturesSubject.next({ settings, capabilities });
      this.faceModeSubject.next(faceMode);

      if (Array.isArray(devices) && devices?.length > 0) {
        const options = devices?.map(mapDevices);
        this.devicesSubject.next(options);
        this.deviceSubject.next(settings?.deviceId as string);
      }

      if (devices?.length === 0) {
        onCameraFail();
        console.log('no camera');
      } else {
        this.readySubject.next(true);
      }
    } catch (e) {
      onCameraFail();
      console.log('Error Message', e);
    }
  }

  async setResolutionForIphoneCC() {
    const video = document.getElementById('userVideo') as HTMLVideoElement;
    const mediaStream = video.srcObject as MediaStream;
    const track = await mediaStream.getTracks()[0];
    const capabilities = track.getCapabilities()
      ? track.getCapabilities()
      : null;

    if (
      capabilities &&
      capabilities?.height?.max === 1440 &&
      capabilities?.width?.max === 1920
    ) {
      await track.applyConstraints({
        advanced: [
          {
            width: 1920,
            height: 1440,
          },
        ],
      });
    }
  }
}
