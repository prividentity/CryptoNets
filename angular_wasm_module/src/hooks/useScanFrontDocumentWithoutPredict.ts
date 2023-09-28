import { Injectable } from '@angular/core';
import {
  convertCroppedImage,
  isValidPhotoID,
} from '@privateid/cryptonets-web-sdk';
import { CANVAS_SIZE } from '../utils';
import { DocType } from '@privateid/cryptonets-web-sdk/dist/types';
import Rerun from '../utils/reRuncheck';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScanFrontDocumentService {
  private resultResponseSubject = new BehaviorSubject<any>(null);

  private isFound = false;
  private resultStatus: any = null;
  private inputImageData: any = null;
  private croppedDocumentRaw: any = null;
  private croppedMugshotRaw: any = null;
  private resultResponse: any = null;
  private returnValue: any = {};
  private rerunAction: Rerun;
  public mugshotBase64: string = '';
  public croppedDocumentBase64: string = '';

  constructor() {
    // Initialize the RerunAction instance
    this.rerunAction = new Rerun(this.scanFrontDocument.bind(this));
  }

  private convertImageToBase64(
    imageData: any,
    width: any,
    height: any,
    setState: any
  ): void {
    try {
      if (imageData.length === width * height * 4) {
        convertCroppedImage(imageData, width, height).then((imageBase64) => {
          setState(imageBase64);
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

  public async scanFrontDocument(
    canvasSize?: any,
    initializeCanvas?: any
  ): Promise<void> {
    this.rerunAction.doInterval();
    const canvasObj = canvasSize ? CANVAS_SIZE[canvasSize] : {};

    try {
      const result: any = await isValidPhotoID(
        DocType.PHOTO_ID_FRONT,
        initializeCanvas || this.documentCallback.bind(this), // Bind the callback to the instance
        undefined as any,
        {
          input_image_format: 'rgba',
        } as any,
        canvasObj
      );

      const { imageData, croppedDocument, croppedMugshot } = result;
      if (imageData && croppedDocument && croppedMugshot) {
        this.inputImageData = imageData;
        this.croppedDocumentRaw = croppedDocument;
        this.croppedMugshotRaw = croppedMugshot;
        this.doConvert();
        this.convertCroppedDocument();
      }
    } catch (e) {
      console.log(e);
    }
  }

  public async doConvert() {
    const mugshotBase64 = await convertCroppedImage(
      this.croppedMugshotRaw,
      this.resultResponse.cropped_face_width,
      this.resultResponse.cropped_face_height
    );

    this.mugshotBase64 = mugshotBase64;
  }

  public async convertCroppedDocument() {
    const mugshotBase64 = await convertCroppedImage(
      this.croppedDocumentRaw,
      this.resultResponse.cropped_doc_width,
      this.resultResponse.cropped_doc_height
    );

    this.croppedDocumentBase64 = mugshotBase64
  }

  private documentCallback(result: any): void {
    this.rerunAction.RerunAction = false;
    this.resultResponse = result.returnValue;
    this.resultResponseSubject.next(result.returnValue);
    if (
      result.returnValue.op_status === 0 ||
      result.returnValue.op_status === 10
    ) {
      this.rerunAction.clearCheck();
      const { predict_status } = result.returnValue;
      if (
        result.returnValue.cropped_face_width &&
        result.returnValue.cropped_face_height
      ) {
        this.isFound = true;
        this.resultStatus = predict_status;
        this.returnValue = result.returnValue;
      } else {
        this.inputImageData = null;
        this.croppedDocumentRaw = null;
        this.croppedMugshotRaw = null;
        this.scanFrontDocument();
      }
    } else {
      this.inputImageData = null;
      this.croppedDocumentRaw = null;
      this.croppedMugshotRaw = null;
      this.scanFrontDocument();
    }
  }

  getResultResponseObservable() {
    return this.resultResponseSubject.asObservable();
  }
}
