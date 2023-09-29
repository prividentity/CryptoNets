import { Injectable } from '@angular/core';
import {
  convertCroppedImage,
  isValidPhotoID,
} from '@privateid/cryptonets-web-sdk';
import { BehaviorSubject } from 'rxjs';
import { CANVAS_SIZE } from '../utils';

@Injectable({
  providedIn: 'root',
})
export class ScanBackDocumentService {
  private barcodeStatusCodeSubject = new BehaviorSubject<any>(null);
  private scannedCodeDataSubject = new BehaviorSubject<any>(null);
  private scannedCodeData: any = {};
  private isFound = false;

  // raw byte
  private inputImageData: any = null;
  private croppedDocumentRaw: any = null;
  private croppedBarcodeRaw: any = null;

  // image width
  private croppedDocumentWidth: any = null;
  private croppedBarcodeWidth: any = null;

  // image height
  private croppedDocumentHeight: any = null;
  private croppedBarcodeHeight: any = null;

  // base64 image
  private inputImageBase64: any = null;
  private croppedDocumentBase64: any = null;
  private croppedBarcodeBase64: any = null;

  public barcodeStatusCode: any = null;

  constructor() {}

  private documentCallback = (result: any) => {
    if (result.status === 'WASM_RESPONSE') {
      console.log(result);
      this.barcodeStatusCode = result.returnValue.op_status;
      this.barcodeStatusCodeSubject.next(result.returnValue.op_status);
      if (result.returnValue.op_status === 0) {
        this.scannedCodeData = result.returnValue;
        this.scannedCodeDataSubject.next(result.returnValue);
        const {
          crop_doc_width,
          crop_doc_height,
          crop_barcode_width,
          crop_barcode_height,
        } = result.returnValue;
        this.croppedDocumentWidth = crop_doc_width;
        this.croppedDocumentHeight = crop_doc_height;
        this.croppedBarcodeWidth = crop_barcode_width;
        this.croppedBarcodeHeight = crop_barcode_height;
        this.isFound = true;
        return;
      } else {
        this.croppedDocumentWidth = null;
        this.croppedDocumentHeight = null;
        this.croppedBarcodeWidth = null;
        this.croppedBarcodeHeight = null;
      }
    }
    this.croppedBarcodeRaw = null;
    this.croppedDocumentRaw = null;
    this.inputImageData = null;
    this.scanBackDocument();
  };

  getBarcodeStatusCodeObservable() {
    return this.barcodeStatusCodeSubject.asObservable();
  }

  getScannedCodObservable() {
    return this.scannedCodeDataSubject.asObservable();
  }

  private async convertImageToBase64(
    imageData: any,
    width: any,
    height: any,
    setState: (value: any) => void
  ) {
    if (imageData.length === width * height * 4) {
      const imageBase64 = await convertCroppedImage(imageData, width, height);
      setState(imageBase64);
    }
  }

  // Converting imageInput
  private convertInputImageToBase64() {
    if (this.inputImageData && this.isFound && this.scannedCodeData) {
      this.convertImageToBase64(
        this.inputImageData,
        this.scannedCodeData?.image_width,
        this.scannedCodeData?.image_height,
        (base64: any) => {
          this.inputImageBase64 = base64;
        }
      );
    }
  }

  // Converting Cropped Document
  private convertCroppedDocumentToBase64() {
    if (
      this.isFound &&
      this.croppedDocumentRaw &&
      this.croppedDocumentWidth &&
      this.croppedDocumentHeight
    ) {
      this.convertImageToBase64(
        this.croppedDocumentRaw,
        this.croppedDocumentWidth,
        this.croppedDocumentHeight,
        (base64: any) => {
          this.croppedDocumentBase64 = base64;
        }
      );
    }
  }

  // Converting Cropped Barcode
  private convertCroppedBarcodeToBase64() {
    if (
      this.croppedBarcodeRaw &&
      this.croppedBarcodeWidth &&
      this.croppedBarcodeHeight &&
      this.isFound
    ) {
      this.convertImageToBase64(
        this.croppedBarcodeRaw,
        this.croppedBarcodeWidth,
        this.croppedBarcodeHeight,
        (base64: any) => {
          this.croppedBarcodeBase64 = base64;
        }
      );
    }
  }

  // onSuccess Callback
  private onSuccess(callback: (data: any) => void) {
    if (
      this.isFound &&
      this.inputImageBase64 &&
      this.croppedBarcodeBase64 &&
      this.scannedCodeData
    ) {
      callback({
        inputImage: this.inputImageBase64,
        croppedDocument: this.croppedDocumentBase64,
        croppedBarcode: this.croppedBarcodeBase64,
        barcodeData: this.scannedCodeData,
      });
    } else if (
      this.isFound &&
      this.croppedBarcodeBase64 &&
      this.scannedCodeData.firstName &&
      !this.scannedCodeData.crop_doc_width
    ) {
      callback({
        inputImage: this.inputImageBase64,
        croppedDocument: this.croppedDocumentBase64,
        croppedBarcode: this.croppedBarcodeBase64,
        barcodeData: this.scannedCodeData,
      });
    }
  }

  public scanBackDocument(canvasSize?: any) {
    const canvasObj = canvasSize ? CANVAS_SIZE?.[canvasSize] : {};
    isValidPhotoID(
      'PHOTO_ID_BACK' as any,
      this.documentCallback,
      undefined as any,
      // @ts-ignore
      { document_scan_barcode_only: true },
      canvasObj
    )
      .then((allData: any) => {
        const { croppedBarcode, croppedDocument, imageData } = allData;
        this.croppedDocumentRaw = croppedDocument;
        this.croppedBarcodeRaw = croppedBarcode;
        this.inputImageData = imageData;

        this.convertInputImageToBase64();
        this.convertCroppedDocumentToBase64();
        this.convertCroppedBarcodeToBase64();
        this.onSuccess((data) => {
          // Call your success callback here with the data
          console.log(data);
        });
      })
      .catch((error) => console.log(error, 'error'));
  }
}
