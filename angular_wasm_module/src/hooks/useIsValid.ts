import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isValid } from '@privateid/cryptonets-web-sdk';

@Injectable({
  providedIn: 'root',
})
export class IsValidService {
  private antispoofPerformedSubject = new BehaviorSubject<string>('');
  private antispoofStatusSubject = new BehaviorSubject<string>('');
  private isValidStatusSubject = new BehaviorSubject<string>('');

  antispoofPerformed$: Observable<string> =
    this.antispoofPerformedSubject.asObservable();
  antispoofStatus$: Observable<string> =
    this.antispoofStatusSubject.asObservable();
  isValidStatus$: Observable<string> = this.isValidStatusSubject.asObservable();

  constructor() {}

  private callback = (response: any) => {
    console.log('isValid Response:', response);

    if (response?.returnValue?.faces?.length > 0) {
      this.antispoofPerformedSubject.next(
        response?.returnValue?.faces[0].anti_spoof_performed
      );
      this.antispoofStatusSubject.next(
        response?.returnValue?.faces[0].anti_spoof_status
      );
      this.isValidStatusSubject.next(response?.returnValue?.faces[0].status);
    } else {
      this.antispoofPerformedSubject.next('');
      this.antispoofStatusSubject.next('');
      this.isValidStatusSubject.next('');
    }
    this.isValidCall();
  };

  async isValidCall(skipAntispoof = true): Promise<void> {
    try {
      await isValid(this.callback, null as any, {
        input_image_format: 'rgba',
        antispoof_face_margin: 2,
        angle_rotation_left_threshold: 5.0,
        angle_rotation_right_threshold: 5.0,
        threshold_user_too_far: 0.1,
        gray_scale_threshold: 25.0,
        anti_spoofing_threshold: 0.5,
        gray_scale_variance_threshold: 100.0,
      });
    } catch (error) {
      // Handle error if necessary
    }
  }
}
