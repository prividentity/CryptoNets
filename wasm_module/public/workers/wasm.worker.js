/* eslint-disable no-eval */
/* eslint-disable default-param-last */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
// importScripts('https://unpkg.com/comlink/dist/umd/comlink.js');
importScripts('./unpkg.js');

let wasmPrivModule;
let apiUrl;
let apiKey;
let wasmModule;
let debugType;
let inputPtr;
let imageInputSize;
let barCodePtr;
let privid_wasm_result = null;
let wasmSession = null;
let setCache = true;
let checkWasmLoaded = false;
let wasmPrivAntispoofModule;
let checkAntispoofLoaded = false;

const isLoad = (simd, url, key, module, debug_type, cacheConfig = true) =>
  new Promise(async (resolve, reject) => {
    apiUrl = url;
    apiKey = key;
    wasmModule = module;
    if (debug_type) {
      debugType = debug_type;
    }
    setCache = cacheConfig;

    if (module === 'voice') {
      importScripts('../wasm/voice/simd/privid_fhe.js');
      const wasm = await fetch('../wasm/voice/simd/privid_fhe.wasm');
      const buffer = await wasm.arrayBuffer();
      wasmPrivModule = await createTFLiteModule({ wasmBinary: buffer });
      console.log(wasmPrivModule);

      await wasmPrivModule._privid_voice_init(parseInt(debug_type, 10));
      const version = await wasmPrivModule._privid_module_get_version();
      resolve(`loaded wasm privid verison ${version}`);
    } else if (['face', 'face_mask'].includes(module)) {
      const moduleName = 'privid_fhe';
      const modulePath = simd ? 'simd' : 'noSimd';

      const cachedModule = await readKey(module);
      const fetchdWasmVersion = await fetch(`../wasm/${module}/${modulePath}/version.json`);
      const fetchdVersion = await fetchdWasmVersion.json();
      console.log(
        `check version ${`${
          cachedModule ? cachedModule?.version.toString() : 'no cached version'
        } - ${fetchdVersion?.version.toString()}`}`,
      );
      if (cachedModule && cachedModule?.version.toString() === fetchdVersion?.version.toString()) {
        if (!wasmPrivModule) {
          const { cachedWasm, cachedScript } = cachedModule;
          eval(cachedScript);
          wasmPrivModule = await createTFLiteModule({ wasmBinary: cachedWasm });
          if (!checkWasmLoaded) {
            await initializeWasmSession(url, key, debugType);
            checkWasmLoaded = true;
          }
        }

        resolve('Cache Loaded');
      } else {
        const wasm = await fetch(`../wasm/${module}/${modulePath}/${moduleName}.wasm`);
        const script = await fetch(`../wasm/${module}/${modulePath}/${moduleName}.js`);

        const scriptBuffer = await script.text();
        const buffer = await wasm.arrayBuffer();
        eval(scriptBuffer);

        wasmPrivModule = await createTFLiteModule({ wasmBinary: buffer });

        if (!checkWasmLoaded) {
          await initializeWasmSession(url, key, debugType);
          checkWasmLoaded = true;
        }

        const version = wasmPrivModule.UTF8ToString(wasmPrivModule._get_version());
        await putKey(module, buffer, scriptBuffer, version);
        resolve('Loaded');
      }
    } else {
      reject(new Error('Incorrect WASM'));
    }
  });

const loadAntispoof = (simd) =>
  new Promise(async (resolve, reject) => {
    // eslint-disable-next-line no-lone-blocks
    {
      if (simd) {
        // loading simd antispoof model
        try {
          importScripts('../wasm/face_mask/simd/antispoof.js');
          const wasm = await fetch('../wasm/face_mask/simd/antispoof.wasm');
          const buffer = await wasm.arrayBuffer();
          wasmPrivAntispoofModule = await createTFLiteModule({ wasmBinary: buffer });
          console.log(wasmPrivAntispoofModule);
          const result = await wasmPrivAntispoofModule._loadModels();
          console.log(`loaded simd wasm antispoof models ${result}`);
          checkAntispoofLoaded = true;
          resolve(true);
        } catch (e) {
          console.log(e);
          resolve(false);
        }
      } else {
        try {
          // loading nonSimd antispoof model
          importScripts('../wasm/face_mask/noSimd/antispoof_nosimd.js');
          const wasm = await fetch('../wasm/face_mask/noSimd/antispoof_nosimd.wasm');
          const buffer = await wasm.arrayBuffer();
          wasmPrivAntispoofModule = await createTFLiteModule({ wasmBinary: buffer });
          console.log(wasmPrivAntispoofModule);
          const result = await wasmPrivAntispoofModule._loadModels();
          console.log(`loaded noSimd wasm antispoof models ${result}`);
          checkAntispoofLoaded = true;
          resolve(true);
        } catch (e) {
          console.log(e);
          resolve(false);
        }
      }
    }
  });

function flatten(arrays, TypedArray) {
  const arr = new TypedArray(arrays.reduce((n, a) => n + a.length, 0));
  let i = 0;
  arrays.forEach((a) => {
    arr.set(a, i);
    i += a.length;
  });
  return arr;
}

async function deleteUUID(uuid, cb) {
  privid_wasm_result = cb;
  const encoder = new TextEncoder();
  const uuid_bytes = encoder.encode(`${uuid}\0`);

  const uuidInputSize = uuid.length;
  const uuidInputPtr = wasmPrivModule._malloc(uuidInputSize);
  wasmPrivModule.HEAP8.set(uuid_bytes, uuidInputPtr / uuid_bytes.BYTES_PER_ELEMENT);

  wasmPrivModule._privid_user_delete(wasmSession, null, 0, uuidInputPtr, uuidInputSize, 0, 0);
  wasmPrivModule._free(uuidInputPtr);
}

const isValidBarCode = async (imageInput, simd, cb, config, debug_type = 0) => {
  privid_wasm_result = cb;
  if (!wasmPrivModule) {
    console.log('loaded for first wsm wrkr', simd);
    await isLoad(simd, apiUrl, apiKey, wasmModule, debugType);
  }
  configGlobal = config;

  const { data: imageData } = imageInput;

  const imageInputSize = imageData.length * imageData.BYTES_PER_ELEMENT;
  if (!barCodePtr) {
    barCodePtr = wasmPrivModule._malloc(imageInputSize);
  }
  wasmPrivModule.HEAP8.set(imageData, barCodePtr / imageData.BYTES_PER_ELEMENT);

  console.log('-----------------GOING TO WASM---------------');

  // Cropped Document malloc
  const croppedDocumentBufferFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
  const croppedDocumentBufferLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

  // Cropped Barcode malloc
  const croppedBarcodeBufferFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
  const croppedBarcodeBufferLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

  const encoder = new TextEncoder();
  const config_bytes = encoder.encode(`${config}\0`);

  const configInputSize = config.length;
  const configInputPtr = wasmPrivModule._malloc(configInputSize);
  wasmPrivModule.HEAP8.set(config_bytes, configInputPtr / config_bytes.BYTES_PER_ELEMENT);

  let result = null;
  try {
    result = wasmPrivModule._privid_doc_scan_barcode(
      wasmSession,
      configInputPtr,
      configInputSize,
      barCodePtr,
      imageInput.width,
      imageInput.height,
      croppedDocumentBufferFirstPtr,
      croppedDocumentBufferLenPtr,
      croppedBarcodeBufferFirstPtr,
      croppedBarcodeBufferLenPtr,
      null,
      0,
    );
  } catch (err) {
    console.error('-----------_E_-----------', err);
  }

  const [croppedDocumentBufferSize] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, croppedDocumentBufferLenPtr, 1);
  let croppedDocumentBufferSecPtr = null;
  if (croppedDocumentBufferSize > 0) {
    [croppedDocumentBufferSecPtr] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, croppedDocumentBufferFirstPtr, 1);
  }

  const croppedDocumentBufferPtr = new Uint8Array(
    wasmPrivModule.HEAPU8.buffer,
    croppedDocumentBufferSecPtr,
    croppedDocumentBufferSize,
  );
  const croppedDocumentData = Uint8ClampedArray.from(croppedDocumentBufferPtr);

  // Cropped Barcode
  const [croppedBarcodeBufferSize] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, croppedBarcodeBufferLenPtr, 1);
  let croppedBarcodeBufferSecPtr = null;
  if (croppedBarcodeBufferSize > 0) {
    [croppedBarcodeBufferSecPtr] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, croppedBarcodeBufferFirstPtr, 1);
  }

  const croppedBarcodeBufferPtr = new Uint8Array(
    wasmPrivModule.HEAPU8.buffer,
    croppedBarcodeBufferSecPtr,
    croppedBarcodeBufferSize,
  );
  const croppedBarcodeData = Uint8ClampedArray.from(croppedBarcodeBufferPtr);

  wasmPrivModule._privid_free_char_buffer(croppedBarcodeBufferSecPtr);
  wasmPrivModule._privid_free_char_buffer(croppedDocumentBufferSecPtr);
  wasmPrivModule._free(barCodePtr);
  barCodePtr = null;
  wasmPrivModule._free(croppedDocumentBufferFirstPtr);
  wasmPrivModule._free(croppedDocumentBufferLenPtr);
  wasmPrivModule._free(croppedBarcodeBufferFirstPtr);
  wasmPrivModule._free(croppedBarcodeBufferLenPtr);
  wasmPrivModule._free(configInputPtr);

  const croppedDocument = croppedDocumentBufferSize > 0 ? croppedDocumentData : null;
  const croppedBarcode = croppedBarcodeBufferSize > 0 ? croppedBarcodeData : null;

  return { result, croppedDocument, croppedBarcode };
};

const scanDocument = async (imageInput, simd, cb, doPredict, config, debug_type = 0) => {
  privid_wasm_result = cb;
  if (!wasmPrivModule) {
    console.log('loaded for first wsm wrkr', simd);
    await isLoad(simd, apiUrl, apiKey, wasmModule, debugType);
  }
  configGlobal = config;
  // const version = wasmPrivModule._get_version();
  // console.log('Version = ', version);

  const encoder = new TextEncoder();
  const config_bytes = encoder.encode(`${config}\0`);

  const configInputSize = config.length;
  const configInputPtr = wasmPrivModule._malloc(configInputSize);
  wasmPrivModule.HEAP8.set(config_bytes, configInputPtr / config_bytes.BYTES_PER_ELEMENT);

  const { data: imageData } = imageInput;
  const imageInputSize = imageData.length * imageData.BYTES_PER_ELEMENT;

  if (!inputPtr) {
    inputPtr = wasmPrivModule._malloc(imageInputSize);
  }

  wasmPrivModule.HEAP8.set(imageData, inputPtr / imageData.BYTES_PER_ELEMENT);

  // Cropped Document malloc
  const croppedDocumentBufferFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
  const croppedDocumentBufferLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

  // Cropped Mugshot malloc
  const croppedMugshotBufferFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
  const croppedMugshotBufferLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

  let result = null;

  console.log('-----------------GOING TO WASM---------------');
  try {
    result = wasmPrivModule._privid_doc_scan_face(
      wasmSession,
      configInputPtr,
      configInputSize,
      inputPtr,
      imageInput.width,
      imageInput.height,
      croppedDocumentBufferFirstPtr,
      croppedDocumentBufferLenPtr,
      croppedMugshotBufferFirstPtr,
      croppedMugshotBufferLenPtr,
      null,
      0,
    );
  } catch (err) {
    console.error('-----------------ERROR---------------', err);
    return;
  }

  // Document
  const [croppedDocumentBufferSize] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, croppedDocumentBufferLenPtr, 1);
  let croppedDocumentBufferSecPtr = null;
  if (croppedDocumentBufferSize > 0) {
    [croppedDocumentBufferSecPtr] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, croppedDocumentBufferFirstPtr, 1);
  }

  const croppedDocumentBufferPtr = new Uint8Array(
    wasmPrivModule.HEAPU8.buffer,
    croppedDocumentBufferSecPtr,
    croppedDocumentBufferSize,
  );
  const croppedDocumentData = Uint8ClampedArray.from(croppedDocumentBufferPtr);

  // Mugshot
  const [croppedMugshotBufferSize] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, croppedMugshotBufferLenPtr, 1);
  let croppedMugshotBufferSecPtr = null;
  if (croppedDocumentBufferSize > 0) {
    [croppedMugshotBufferSecPtr] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, croppedMugshotBufferFirstPtr, 1);
  }
  const croppedMugshotBufferPtr = new Uint8Array(
    wasmPrivModule.HEAPU8.buffer,
    croppedMugshotBufferSecPtr,
    croppedMugshotBufferSize,
  );
  const croppedMugshotData = Uint8ClampedArray.from(croppedMugshotBufferPtr);

  // console.log('MODULE LIST: ', wasmPrivModule);
  wasmPrivModule._privid_free_char_buffer(croppedMugshotBufferSecPtr);
  wasmPrivModule._privid_free_char_buffer(croppedDocumentBufferSecPtr);
  wasmPrivModule._free(croppedDocumentBufferFirstPtr);
  wasmPrivModule._free(croppedDocumentBufferLenPtr);
  wasmPrivModule._free(croppedMugshotBufferFirstPtr);
  wasmPrivModule._free(croppedMugshotBufferLenPtr);
  wasmPrivModule._free(configInputPtr);
  wasmPrivModule._free(inputPtr);
  inputPtr = null;

  const croppedDocument = croppedDocumentBufferSize > 0 ? croppedDocumentData : null;

  const croppedMugshot = croppedMugshotBufferSize > 0 ? croppedMugshotData : null;

  console.log(result, '-----------------OUT OF WASM---------------');
  // doReassign({ result, croppedDocument, croppedMugshot, imageInput });
  // eslint-disable-next-line consistent-return, no-param-reassign
  return { result, croppedDocument, croppedMugshot };
};

const FHE_enrollOnefa = async (originalImages, simd, debug_type = 0, cb, config = {}) => {
  privid_wasm_result = cb;

  if (!wasmPrivModule) {
    console.log('loaded for first wsm wrkr', simd, action);
    await isLoad(simd, apiUrl, apiKey, wasmModule, debugType);
  }
  // console.log('-------WASM----WORKER------', simd, action);
  const numImages = originalImages.length;
  const imageInput = flatten(
    originalImages.map((x) => x.data),
    Uint8Array,
  );
  // const version = wasmPrivModule._get_version();
  // console.log('Version = ', version);

  const encoder = new TextEncoder();
  const config_bytes = encoder.encode(`${config}\0`);

  const configInputSize = config.length;
  const configInputPtr = wasmPrivModule._malloc(configInputSize);
  wasmPrivModule.HEAP8.set(config_bytes, configInputPtr / config_bytes.BYTES_PER_ELEMENT);

  const imageInputSize = imageInput.length * imageInput.BYTES_PER_ELEMENT;
  const imageInputPtr = wasmPrivModule._malloc(imageInputSize);

  wasmPrivModule.HEAP8.set(imageInput, imageInputPtr / imageInput.BYTES_PER_ELEMENT);

  const resultFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
  // create a pointer to interger to hold the length of the output buffer
  const resultLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

  try {
    wasmPrivModule._privid_enroll_onefa(
      wasmSession /* session pointer */,
      configInputPtr,
      configInputSize,
      imageInputPtr /* input images */,
      numImages /* number of input images */,
      originalImages[0].data.length /* size of one image */,
      originalImages[0].width /* width of one image */,
      originalImages[0].height /* height of one image */,
      null /* embeddings output */,
      null /* length of embeddings out */,
      true /* remove bad embeddings flag */,
      null /* augmentations out buffer */,
      null /* length of augmentations out buffer */,
      resultFirstPtr /* operation result output buffer */,
      resultLenPtr /* operation result buffer length */,
    );
  } catch (e) {
    console.error('---------__E__-------', e);
  }

  wasmPrivModule._free(imageInputPtr);
  wasmPrivModule._free(resultFirstPtr);
  wasmPrivModule._free(resultLenPtr);

  wasmPrivModule._free(configInputPtr);
};

const FHE_predictOnefa = async (originalImages, simd, debug_type = 0, cb, config = {}) => {
  privid_wasm_result = cb;
  if (!wasmPrivModule) {
    console.log('loaded for first wsm wrkr', simd, action);
    await isLoad(simd, apiUrl, apiKey, wasmModule, debugType);
  }

  const numImages = originalImages.length;
  const imageInput = flatten(
    originalImages.map((x) => x.data),
    Uint8Array,
  );
  // const version = wasmPrivModule._get_version();
  // console.log('Version = ', version);

  const encoder = new TextEncoder();
  const config_bytes = encoder.encode(`${config}\0`);

  const configInputSize = config.length;
  const configInputPtr = wasmPrivModule._malloc(configInputSize);
  wasmPrivModule.HEAP8.set(config_bytes, configInputPtr / config_bytes.BYTES_PER_ELEMENT);

  const imageInputSize = imageInput.length * imageInput.BYTES_PER_ELEMENT;
  const imageInputPtr = wasmPrivModule._malloc(imageInputSize);

  wasmPrivModule.HEAP8.set(imageInput, imageInputPtr / imageInput.BYTES_PER_ELEMENT);

  const resultFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
  // create a pointer to interger to hold the length of the output buffer
  const resultLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

  try {
    wasmPrivModule._privid_face_predict_onefa(
      wasmSession /* session pointer */,
      configInputPtr,
      configInputSize,
      imageInputPtr /* input images */,
      numImages /* number of input images */,
      originalImages[0].data.length /* size of one image */,
      originalImages[0].width /* width of one image */,
      originalImages[0].height /* height of one image */,
      null /* embeddings output */,
      null /* length of embeddings out */,
      true /* remove bad embeddings flag */,
      null /* augmentations out buffer */,
      null /* length of augmentations out buffer */,
      resultFirstPtr /* operation result output buffer */,
      resultLenPtr /* operation result buffer length */,
    );
  } catch (e) {
    console.error('---------__E__-------', e);
  }

  wasmPrivModule._free(imageInputPtr);
  wasmPrivModule._free(configInputPtr);
  wasmPrivModule._free(resultFirstPtr);
  wasmPrivModule._free(resultLenPtr);
};

const isValidInternal = async (
  data,
  width,
  height,
  simd,
  debug_type = 0,
  cb,
  config = JSON.stringify({ input_image_format: 'rgba' }),
) => {
  privid_wasm_result = cb;

  if (!wasmPrivModule) {
    console.log('loaded for first wsm wrkr', simd, action);
    await isLoad(simd, apiUrl, apiKey, wasmModule, debugType);
  }

  const imageSize = data.length * data.BYTES_PER_ELEMENT;

  const isValidPtr = wasmPrivModule._malloc(imageSize);
  wasmPrivModule.HEAP8.set(data, isValidPtr / data.BYTES_PER_ELEMENT);

  const resultFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
  // create a pointer to interger to hold the length of the output buffer
  const resultLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

  const encoder = new TextEncoder();
  const config_bytes = encoder.encode(`${config}\0`);
  const configInputSize = config.length;
  const configInputPtr = wasmPrivModule._malloc(configInputSize);
  wasmPrivModule.HEAP8.set(config_bytes, configInputPtr / config_bytes.BYTES_PER_ELEMENT);

  try {
    wasmPrivModule._privid_validate(
      wasmSession,
      isValidPtr,
      width,
      height,
      configInputPtr,
      configInputSize,
      resultFirstPtr,
      resultLenPtr,
    );
  } catch (e) {
    console.log('_______privid_validate', e);
  }

  wasmPrivModule._free(isValidPtr);
  wasmPrivModule._free(configInputPtr);
  wasmPrivModule._free(resultFirstPtr);
  wasmPrivModule._free(resultLenPtr);
};

const antispoofCheck = async (data, width, height) => {
  is_spoof = -1;
  const imageSize = data.length * data.BYTES_PER_ELEMENT;

  const imagePtr = wasmPrivAntispoofModule._malloc(imageSize);
  wasmPrivAntispoofModule.HEAP8.set(data, imagePtr / data.BYTES_PER_ELEMENT);

  try {
    is_spoof = wasmPrivAntispoofModule._predict(imagePtr, width, height);
    const isImageFilled = new Float32Array(
      wasmPrivAntispoofModule.HEAPF32.buffer,
      wasmPrivAntispoofModule._getImageFilledOffset(),
      1,
    )[0];
    // console.log('isImageFilled: ', isImageFilled);
    // const modelResults = new Int32Array(
    //   wasmPrivAntispoofModule.HEAP32.buffer,
    //   wasmPrivAntispoofModule._getAntiSpoofingOffset(),
    //   4,
    // );
    // console.log('modelResults: ', modelResults);
    if (isImageFilled) {
      is_spoof = -1;
    }
  } catch (e) {
    console.log('_predict', e);
  }
  wasmPrivAntispoofModule._free(imagePtr);

  return { livenessCheck: is_spoof };
};

const prividAgePredict = async (
  data,
  width,
  height,
  simd,
  debug_type = 0,
  cb,
  config = JSON.stringify({ input_image_format: 'rgba' }),
) => {
  privid_wasm_result = cb;

  if (!wasmPrivModule) {
    console.log('loaded for first wsm wrkr', simd);
    await isLoad(simd, apiUrl, apiKey, wasmModule, debugType);
  }
  // Initialize Session
  // await initializeWasmSession(apiUrl, apiKey);

  const imageSize = data.length * data.BYTES_PER_ELEMENT;

  const isValidPtr = wasmPrivModule._malloc(imageSize);
  wasmPrivModule.HEAP8.set(data, isValidPtr / data.BYTES_PER_ELEMENT);

  const resultFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
  // create a pointer to interger to hold the length of the output buffer
  const resultLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

  const encoder = new TextEncoder();
  const config_bytes = encoder.encode(`${config}\0`);
  const configInputSize = config.length;
  const configInputPtr = wasmPrivModule._malloc(configInputSize);
  wasmPrivModule.HEAP8.set(config_bytes, configInputPtr / config_bytes.BYTES_PER_ELEMENT);

  try {
    await wasmPrivModule._privid_estimate_age(
      wasmSession,
      isValidPtr,
      width,
      height,
      configInputPtr,
      configInputSize,
      resultFirstPtr,
      resultLenPtr,
    );
  } catch (e) {
    console.log('_____ PREDICT AGE: ', result);
  }

  wasmPrivModule._free(isValidPtr);
  wasmPrivModule._free(configInputPtr);
  wasmPrivModule._free(resultFirstPtr);
};

const isValidFrontDocument = async (imagePtr, width, height, simd, action, debug_type = 0, cb) => {
  privid_wasm_result = cb;

  if (!wasmPrivModule) {
    console.log('loaded for first wsm wrkr', simd, apiUrl, debugType, wasmModule);
    await isLoad(simd, apiUrl, apiKey, wasmModule, debug_type);
  }

  const result = wasmPrivModule._is_valid(action, imagePtr, width, height, 0, 0, 0);
  wasmPrivModule._free(imagePtr);

  return result;
};

const isValidVoice = (data, action, params, recordDuration, simd, debug_type = 0) =>
  new Promise(async (resolve) => {
    if (!wasmPrivModule) {
      console.log('loaded for first wsm wrkr', simd, apiUrl, debugType, wasmModule);
      await isLoad(simd, apiUrl, apiKey, wasmModule, debug_type);
    }
    const fs = params.sampleRate;
    const channels = params.channelCount;
    const stride = 1;
    const data_BYTES_PER_ELEMENT = 2;
    const voiceSizeMax = fs * channels * recordDuration * data_BYTEPER_ELEMENT;
    const voiceSize = data.byteLength;

    console.log('data.byteLength', data.byteLength, data_BYTES_PER_ELEMENT, voiceSizeMax);
    const voicePtr = wasmPrivModule._malloc(voiceSize * data_BYTES_PER_ELEMENT);
    wasmPrivModule.HEAP8.set(data, voicePtr / data_BYTES_PER_ELEMENT);

    const outBufferSize = voiceSize;
    const outBufferPtr = wasmPrivModule._malloc(outBufferSize * data_BYTES_PER_ELEMENT);
    const result = wasmPrivModule._privid_voice_is_valid(
      action,
      voicePtr,
      voiceSize,
      fs,
      channels,
      stride,
      outBufferPtr,
    );
    const AugmputArray = new Uint8Array(wasmPrivModule.HEAPU8.buffer, outBufferPtr);
    const voiceData = Uint8ClampedArray.from(AugmputArray);

    // const dataArray = new TextDecoder().decode(voiceData);

    await wasmPrivModule._free(outBufferPtr);
    await wasmPrivModule._free(voicePtr);
    resolve({ result, voiceData, data });
  });

const voicePredict = (voiceData) =>
  new Promise(async (resolve) => {
    setTimeout(() => {
      console.log(voiceData, '-----');
      resolve(1);
    }, 5000);
  });

function readKey(key) {
  if (!indexedDB) return Promise.reject(new Error('IndexedDB not available'));

  return new Promise((resolve, reject) => {
    const open = indexedDB.open('/privid-wasm', 21);

    open.onerror = function () {
      resolve(false);
      console.log('Private Browser. ');
    };

    open.onupgradeneeded = function () {
      open.result.createObjectStore('/privid-wasm');
    };

    open.onsuccess = function () {
      const db = open.result;
      const tx = db.transaction('/privid-wasm', 'readwrite');
      const store = tx.objectStore('/privid-wasm');
      const getKey = store.get(key);

      getKey.onsuccess = function () {
        resolve(getKey.result);
      };

      tx.onerror = function () {
        reject(tx.error);
      };

      tx.oncomplete = function () {
        try {
          db.close();
        } catch (e) {
          //
        }
      };
    };
  });
}

function putKey(key, cachedWasm, cachedScript, version) {
  if (!indexedDB) return Promise.reject(new Error('IndexedDB not available'));

  return new Promise((resolve, reject) => {
    const open = indexedDB.open('/privid-wasm', 21);

    open.onerror = function () {
      resolve(false);
      console.log('Private Browser.');
    };

    open.onupgradeneeded = function () {
      open.result.createObjectStore('/privid-wasm');
    };

    open.onsuccess = function () {
      const db = open.result;
      const tx = db.transaction('/privid-wasm', 'readwrite');
      const store = tx.objectStore('/privid-wasm');
      const getKey = store.put({ cachedWasm, cachedScript, version }, key);

      getKey.onsuccess = function () {
        resolve('saved');
      };

      tx.onerror = function () {
        reject(tx.error);
      };

      tx.oncomplete = function () {
        try {
          db.close();
        } catch (e) {
          //
        }
      };
    };
  });
}

async function setCacheConfiguration() {
  console.log('initializing setCacheConfiguration');
  const db = indexedDB.open('test');
  db.onerror = function () {
    console.log('Private browser no cache');
  };
  db.onsuccess = async function () {
    const cacheObj = JSON.stringify({ cache_type: setCache ? 'basic' : 'nocache' });
    const encoder = new TextEncoder();
    const cache_config_bytes = encoder.encode(`${cacheObj}\0`);

    const cacheInputSize = cacheObj.length;
    const cacheInputPtr = wasmPrivModule._malloc(cacheInputSize);

    wasmPrivModule.HEAP8.set(cache_config_bytes, cacheInputPtr / cache_config_bytes.BYTES_PER_ELEMENT);
    await wasmPrivModule._privid_set_configuration(wasmSession, cacheInputPtr, cacheInputSize);
    // await wasmPrivModule._privid_set_default_configuration(wasmSession, 1);
    wasmPrivModule._free(cacheInputPtr);
  };
}

/**
 * @brief A closure to create a string buffer arguments that can be used with wasm calls
 * for a given javascript value.
 * This is suitable for native calls that have string input arguments represented with contigious
 * string_buffer,sizeofbuffer arguments.
 * If the 'text' argument is null or undefined or NaN then the arguments generated  are [null,0]
 * @usage
 *
 var url_args= buffer_args(url);
 var key_args= buffer_args(key);
 var session_out_ptr = output_ptr();
 const s_result = wasmPrivModule._privid_initialize_session(
      ...key_args.args(),
      ...url_args.args(),
      debug_type,
      session_out_ptr.outer_ptr(),
    );
    url_args.free();
    key_args.free();
    //get
    var session = session_out_ptr.inner_ptr();
 *
 *  when .free() is called the closure can be reused to create a buffer for the same string with which, it was created with
 *  over and over again.
 */
const buffer_args = function (text) {
  let strInputtPtr = null;
  let strInputSize = 0;
  let argsv = [];
  return {
    args: () => {
      do {
        if (argsv.length > 0) break;
        argsv = [null, 0];
        if (text === null) break;
        if (text === undefined) break;
        // eslint-disable-next-line use-isnan
        if (text === NaN) break;
        const str = `${text}`;
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        strInputSize = bytes.length * bytes.BYTES_PER_ELEMENT;
        strInputtPtr = wasmPrivModule._malloc(strInputSize);
        wasmPrivModule.HEAP8.set(bytes, strInputtPtr / bytes.BYTES_PER_ELEMENT);
        argsv = [strInputtPtr, strInputSize];
      } while (false);
      return argsv;
    },
    free: () => {
      if (strInputtPtr) {
        wasmPrivModule._free(strInputtPtr);
        strInputtPtr = null;
        strInputSize = 0;
        argsv = [];
      }
    },
  };
};

/**
 * @brief A closure to create an output 32bits pointer closure.
 * This is usefull for allocating a native address and pass it to the
 * 'wasmPrivModule' so it can return in the address of a buffer (or an object like session)
 * that was allocated inside the wasm. This typically, correspond to
 * an argument of type void** (marked output argument) to pass to a native wasm
 * call.
 * @usage var myoutput_ptr = output_ptr();
 * when passing the output pointer to the 'wasmPrivModule' module use
 * wasmPrivModule.nativecall(myoutput_ptr.outer_ptr());
 * Then pull out the the allocated buffer by the wasm call this way:
 * @code
 * my_buffer_or_structure = myoutput_ptr.inner_ptr();
 * @note It is the responsability of the caller to free the pointer returned by this inner_ptr()
 */
const output_ptr = function () {
  let out_ptr = null;
  let in_ptr = null;
  const free_ptr = (ptr) => {
    if (ptr) {
      wasmPrivModule._free(ptr);
      // eslint-disable-next-line no-param-reassign
      ptr = null;
    }
  };
  return {
    /**
     * @brief  Allocates a pointer to contain the result and return it,
     * if the container is already created it will be returned
     */
    outer_ptr: () => {
      // TODO: may be used SharedArrayBuffer() instead
      // allocate memory the expected pointer (outer pointer or container)  
      if (!out_ptr) out_ptr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
      return out_ptr;
    },
    /**
     * @brief Creates a javascript Uint32Array pointer to contain the result pointed by outer_ptr and return it,
     * It is the responsability of the caller to free the pointer returned by this function
     */
    inner_ptr: () => {
      //  If we did not allocate yet the output buffer return null
      if (!out_ptr) return null;
      // if we already have our inner pointer for this closure return it 
      if (in_ptr) return in_ptr;
      // Access  the outer pointer as an arry of uint32 which conatin a single cell
      // whose value is the pointer allocated in the wasm module (inner pointer of the output param)      
      // and return it
      [in_ptr] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, out_ptr, 1);
      return in_ptr;
    },
  };
};

async function initializeWasmSession(url, key, debug_type) {
  console.log('checking session if available:', wasmSession);
  if (!wasmSession) {
    const url_args = buffer_args(url);
    const key_args = buffer_args(key);
    const session_out_ptr = output_ptr();
    const s_result = wasmPrivModule._privid_initialize_session(
      ...key_args.args(),
      ...url_args.args(),
      debug_type,
      session_out_ptr.outer_ptr(),
    );
    url_args.free();
    key_args.free();

    if (s_result) {
      console.log('[FAR_DEBUG] : session initialized successfully');
    } else {
      console.log('[FAR_DEBUG] : session initialized failed');
      return;
    }

    // get our inner session created by wasm and free the outer container ptr
    wasmSession = session_out_ptr.inner_ptr();
    
    await wasmPrivModule._privid_set_default_configuration(wasmSession, 1);
    if (setCache) {
      await setCacheConfiguration();
    }
  } else {
    console.log('wasm Session', wasmSession);
    console.log('Wasm session is available. Skipping creating session');
  }
}

const prividFaceISO = (imageInput, simd, debug_type = 0, cb, config = {}) =>
  new Promise(async (resolve) => {
    privid_wasm_result = cb;
    if (!wasmPrivModule) {
      console.log('loaded for first wsm wrkr', simd, action);
      await isLoad(simd, apiUrl, apiKey, wasmModule, debugType);
    }

    const { data: imageData } = imageInput;

    const imageInputSize = imageData.length * imageData.BYTES_PER_ELEMENT;

    const encoder = new TextEncoder();
    const config_bytes = encoder.encode(`${config}\0`);
    console.log('CONFIG STRING:', config);
    const configInputSize = config.length;
    const configInputPtr = wasmPrivModule._malloc(configInputSize);
    wasmPrivModule.HEAP8.set(config_bytes, configInputPtr / config_bytes.BYTES_PER_ELEMENT);
    // console.log('=====> config bytes FACE_ISO', config_bytes);
    const imageInputPtr = wasmPrivModule._malloc(imageInputSize);

    wasmPrivModule.HEAP8.set(imageInput, imageInputPtr / imageInput.BYTES_PER_ELEMENT);

    const BufferSize = wasmPrivModule._spl_image_embedding_length();
    // // outupt  ptr
    const outputBufferSize = BufferSize * 4 * 80;
    const outputBufferPtr = wasmPrivModule._malloc(outputBufferSize);

    const resultFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    // create a pointer to interger to hold the length of the output buffer
    const resultLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

    // Initialize Session
    // await initializeWasmSession(apiUrl, apiKey);

    let result = null;
    try {
      result = wasmPrivModule._privid_face_iso(
        wasmSession,
        imageInputPtr,
        imageInput.width /* width of one image */,
        imageInput.height /* height of one image */,
        configInputPtr,
        configInputSize,
        resultFirstPtr,
        resultLenPtr,
        outputBufferPtr,
        outputBufferSize,
      );
    } catch (e) {
      console.log('________ priv_face_iso _______', e);
    }

    const [imageOutputBufferSize] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, outputBufferSize, 1);
    let imageOutputBufferSizeSecPtr = null;
    if (imageOutputBufferSize > 0) {
      [imageOutputBufferSizeSecPtr] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, outputBufferPtr, 1);
    }

    const imageOutputBufferPtr = new Uint8Array(
      wasmPrivModule.HEAPU8.buffer,
      imageOutputBufferSizeSecPtr,
      imageOutputBufferSize,
    );
    const imageOutputBuffer = Uint8ClampedArray.from(imageOutputBufferPtr);

    wasmPrivModule._privid_free_char_buffer(imageOutputBufferSizeSecPtr);
    wasmPrivModule._free(imageInputPtr);
    wasmPrivModule._free(configInputPtr);
    wasmPrivModule._free(resultFirstPtr);
    wasmPrivModule._free(outputBufferPtr);

    const imageOutput = imageOutputBufferSize > 0 ? imageOutputBuffer : null;

    resolve({ result, imageOutput });
  });

const prividFaceCompareLocal = (imageInputA, imageInputB, simd, debug_type = 0, cb, config = {}) =>
  new Promise(async (resolve) => {
    privid_wasm_result = cb;
    if (!wasmPrivModule) {
      console.log('loaded for first wsm wrkr', simd, action);
      await isLoad(simd, apiUrl, apiKey, wasmModule, debugType);
    }

    // First Image A
    const { data: imageDataA } = imageInputA;
    const imageInputSizeA = imageDataA.length * imageDataA.BYTES_PER_ELEMENT;
    const imageInputPtrA = wasmPrivModule._malloc(imageInputSizeA);
    wasmPrivModule.HEAP8.set(imageDataA, imageInputPtrA / imageDataA.BYTES_PER_ELEMENT);

    // Second Image B
    const { data: imageDataB } = imageInputB;
    const imageInputSizeB = imageDataB.length * imageDataB.BYTES_PER_ELEMENT;
    const imageInputPtrB = wasmPrivModule._malloc(imageInputSizeB);
    wasmPrivModule.HEAP8.set(imageDataB, imageInputPtrB / imageDataB.BYTES_PER_ELEMENT);

    const encoder = new TextEncoder();
    const config_bytes = encoder.encode(`${config}\0`);

    console.log('CONFIG STRING:', config);
    const configInputSize = config.length;
    const configInputPtr = wasmPrivModule._malloc(configInputSize);
    wasmPrivModule.HEAP8.set(config_bytes, configInputPtr / config_bytes.BYTES_PER_ELEMENT);

    const resultFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    // create a pointer to interger to hold the length of the output buffer
    const resultLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

    // Initialize Session
    // await initializeWasmSession(apiUrl, apiKey);

    let result = null;
    try {
      result = wasmPrivModule._privid_face_compare_local(
        wasmSession,
        configInputPtr,
        configInputSize,
        imageInputPtrA,
        imageInputA.data.length,
        imageInputA.width,
        imageInputA.height,
        imageInputPtrB,
        imageInputB.data.length,
        imageInputB.width,
        imageInputB.height,
        resultFirstPtr,
        resultLenPtr,
      );
    } catch (e) {
      console.log('________ face compare local _______', e);
    }

    wasmPrivModule._privid_free_char_buffer(configInputPtr);
    wasmPrivModule._free(imageInputPtrA);
    wasmPrivModule._free(imageInputPtrB);
    wasmPrivModule._free(resultFirstPtr);
    wasmPrivModule._free(resultLenPtr);

    resolve({ result });
  });

Comlink.expose({
  FHE_enrollOnefa,
  FHE_predictOnefa,
  isValidInternal,
  prividAgePredict,
  isLoad,
  loadAntispoof,
  voicePredict,
  isValidVoice,
  scanDocument,
  isValidBarCode,
  deleteUUID,
  prividFaceISO,
  prividFaceCompareLocal,
  antispoofCheck,
});
