import { Injectable, NgZone } from '@angular/core';
import { loadPrivIdModule } from '@privateid/cryptonets-web-sdk';
import { getUrlParameter } from '../utils';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WasmService {
  private isLoading = false;
  private ready = false;
  private wasmStatus: any = { isChecking: true };

  constructor(private ngZone: NgZone) {}

  public async init(): Promise<void> {
    console.log({ environment });
    const apiKey = getUrlParameter('api_key', environment.API_KEY);
    const apiUrl = getUrlParameter('api_url', environment.API_URL);
    const apiOrchestrationUrl = getUrlParameter(
      'api_url',
      environment.API_ORCHESTRATION
    );
    const wasmUrl = getUrlParameter('api_url', environment.API_URL_WASM);
    // const apiUrl = getUrlParameter('api_url', environment.API_URL);
    const isSupported = await loadPrivIdModule(
      apiUrl,
      apiKey,
      apiOrchestrationUrl,
      wasmUrl,
      true
    );
    this.ngZone.run(() => {
      if (isSupported.support) {
        this.ready = true;
        this.wasmStatus = { isChecking: false, ...isSupported };
      } else {
        this.ready = false;
        this.wasmStatus = { isChecking: false, ...isSupported };
      }
    });
  }

  public async useWasm(): Promise<{ ready: boolean; wasmStatus: any }> {
    if (this.ready) {
      return { ready: this.ready, wasmStatus: this.wasmStatus };
    }

    return { ready: this.ready, wasmStatus: this.wasmStatus };
  }
}
