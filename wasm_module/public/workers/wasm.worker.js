/* eslint-disable no-eval */
/* eslint-disable default-param-last */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
importScripts('https://unpkg.com/comlink/dist/umd/comlink.js');

let wasmPrivModule;
let apiUrl;
let apiKey;
let wasmModule;
let debugType;
let inputPtr;
let imageInputSize;
let configGlobal;
let barCodePtr;
let privid_wasm_result = null;

const isLoad = (simd, url, key, module, debug_type = '0') =>
  new Promise(async (resolve, reject) => {
    apiUrl = url;
    apiKey = key;
    wasmModule = module;
    debugType = debug_type;

    if (module === 'voice') {
      importScripts('../wasm/voice/simd/privid_fhe.js');

      const wasm = await fetch('../wasm/voice/simd/privid_fhe.wasm');
      const buffer = await wasm.arrayBuffer();
      wasmPrivModule = await createTFLiteModule({ wasmBinary: buffer });
      console.log(wasmPrivModule);

      await wasmPrivModule._privid_voice_init(parseInt(debug_type, 10));
      const verison = await wasmPrivModule._privid_module_get_version();
      resolve(`loaded wasm privid verison ${verison}`);
    } else if (['face', 'face_mask'].includes(module)) {
      const moduleName = 'privid_fhe';
      const modulePath = simd ? 'simd' : 'noSimd';

      const cachedModule = await readKey(module);
      const fetchdWasmVersion = await fetch(`../wasm/${module}/${modulePath}/version.json`);
      const fetchdVersion = await fetchdWasmVersion.json();
      console.log(cachedModule?.version, Number(fetchdVersion?.version));
      if (cachedModule?.version === Number(fetchdVersion?.version)) {
        const { cachedWasm, cachedScript } = cachedModule;
        eval(cachedScript);

        wasmPrivModule = await createTFLiteModule({ wasmBinary: cachedWasm });
        await wasmPrivModule._FHE_init(parseInt(debug_type, 10));

        {
          const encoder = new TextEncoder();
          const url_bytes = encoder.encode(`${url}0`);
          url_bytes[url_bytes.length - 1] = 0;

          const urlInputSize = url_bytes.length * url_bytes.BYTES_PER_ELEMENT;
          const urlInputtPtr = wasmPrivModule._malloc(urlInputSize);
          wasmPrivModule.HEAP8.set(url_bytes, urlInputtPtr / url_bytes.BYTES_PER_ELEMENT);
          console.log('------->Before Wasm PrivModule ccall', url);
          wasmPrivModule.ccall('FHE_configure_url', 'int', [], [42, urlInputtPtr, url ? url.length + 1 : 0]);
          wasmPrivModule._free(urlInputtPtr);
        }
        {
          const encoder = new TextEncoder();
          const key_bytes = encoder.encode(`${key}0`);
          key_bytes[key_bytes.length - 1] = 0;

          const keyInputSize = key_bytes.length * key_bytes.BYTES_PER_ELEMENT;
          const keyInputtPtr = wasmPrivModule._malloc(keyInputSize);
          wasmPrivModule.HEAP8.set(key_bytes, keyInputtPtr / key_bytes.BYTES_PER_ELEMENT);

          wasmPrivModule.ccall('FHE_configure_url', 'int', [], [46, keyInputtPtr, key.length]);
          wasmPrivModule._free(keyInputtPtr);
        }
        resolve('Loaded');
      } else {
        const wasm = await fetch(`../wasm/${module}/${modulePath}/${moduleName}.wasm`);
        const script = await fetch(`../wasm/${module}/${modulePath}/${moduleName}.js`);

        const scriptBuffer = await script.text();
        const buffer = await wasm.arrayBuffer();
        eval(scriptBuffer);

        wasmPrivModule = await createTFLiteModule({ wasmBinary: buffer });

        await wasmPrivModule._FHE_init(parseInt(debug_type, 10));
        const version = wasmPrivModule._get_version();

        await putKey(module, buffer, scriptBuffer, version);

        const encoder = new TextEncoder();
        const url_bytes = encoder.encode(`${url}0`);
        url_bytes[url_bytes.length - 1] = 0;

        const urlInputSize = url_bytes.length * url_bytes.BYTES_PER_ELEMENT;
        const urlInputtPtr = wasmPrivModule._malloc(urlInputSize);
        wasmPrivModule.HEAP8.set(url_bytes, urlInputtPtr / url_bytes.BYTES_PER_ELEMENT);

        wasmPrivModule.ccall('FHE_configure_url', 'int', [], [42, urlInputtPtr, url ? url.length + 1 : 0]);
        wasmPrivModule._free(urlInputtPtr);
        resolve('Loaded');
      }
    } else {
      reject(new Error('Incorrect WASM'));
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

function deleteUUID(uuid, cb) {
  privid_wasm_result = cb;
  const encoder = new TextEncoder();
  const uuid_bytes = encoder.encode(`${uuid}\0`);

  // console.log('[FAR_DEBUG] : Calling session preparation')
  const sessionFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
  const s_result = wasmPrivModule._privid_initialize_session_join(sessionFirstPtr, null);
  if (s_result) {
    console.log('[FAR_DEBUG] : session initialized successfully');
  } else {
    console.log('[FAR_DEBUG] : session initialized failed');
  }
  // console.log('[FAR_DEBUG] : Getting session second pointer')
  const [sessionSecPtr] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, sessionFirstPtr, 1);
  // console.log(`[FAR_DEBUG] : Session second pointer = [${  sessionSecPtr  }]`)

  const uuidInputSize = uuid.length;
  const uuidInputPtr = wasmPrivModule._malloc(uuidInputSize);
  wasmPrivModule.HEAP8.set(uuid_bytes, uuidInputPtr / uuid_bytes.BYTES_PER_ELEMENT);

  wasmPrivModule._privid_user_delete(sessionSecPtr, null, 0, uuidInputPtr, uuidInputSize, 0, 0);
  wasmPrivModule._free(uuidInputPtr);
}

const isValidBarCode = (imageInput, simd, cb, config, debug_type = 0) =>
  new Promise(async (resolve, reject) => {
    privid_wasm_result = cb;
    if (!wasmPrivModule) {
      console.log('loaded for first wsm wrkr', simd);
      await isLoad(simd, apiUrl, apiKey, wasmModule, debugType);
    }
    const version = wasmPrivModule._get_version();
    console.log('Version = ', version);
    console.log('BARCODE SCAN =========== IMAGE INPUT ', imageInput);
    const { data: imageData } = imageInput;

    const imageInputSize = imageData.length * imageData.BYTES_PER_ELEMENT;
    if (!barCodePtr) {
      barCodePtr = wasmPrivModule._malloc(imageInputSize);
    }
    wasmPrivModule.HEAP8.set(imageData, barCodePtr / imageData.BYTES_PER_ELEMENT);

    console.log('-----------------GOING TO WASM---------------');

    const outputBufferFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    const outputBufferLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

    // // create a pointer to interger to hold the length of the output buffer
    // const resultFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    // const resultLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

    const encoder = new TextEncoder();
    const config_bytes = encoder.encode(`${config}\0`);

    const configInputSize = config.length;
    const configInputPtr = wasmPrivModule._malloc(configInputSize);
    wasmPrivModule.HEAP8.set(config_bytes, configInputPtr / config_bytes.BYTES_PER_ELEMENT);
    let result = null;
    try {
      result = await wasmPrivModule._is_valid(
        1100,
        barCodePtr,
        imageInput.width,
        imageInput.height,
        // null,
        // 0,
        outputBufferFirstPtr,
        outputBufferLenPtr,
        // resultFirstPtr,
        // resultLenPtr,
        null,
        0,
        configInputPtr,
        configInputSize,
      );
    } catch (err) {
      console.error('-----------_E_-----------', err);
      reject(new Error(err));
    }
    // console.log("===================WASM=WORKER==BEFORE STATUS CHECK============")
    // const href = [];
    // // let conf_score = null;
    // const userData = {};
    // try {
    //   const [resultLength] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, resultLenPtr, 1);
    //   console.log("===> ResultLength", resultLength);
    //   if (resultLength > 0) {
    //     const [resultSecPtr] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, resultFirstPtr, 1);
    //     const resultDataArray = new Uint8Array(wasmPrivModule.HEAPU8.buffer, resultSecPtr, resultLength);
    //     const resultString = String.fromCharCode.apply(null, resultDataArray);
    //     console.log('resultString =====>', JSON.parse(resultString));
    //    const res = JSON.parse(resultString);
    //     const userAttributes = [
    //       'firstName',
    //       'lastName',
    //       'dateOfBirth',
    //       'streetAddress1',
    //       'streetAddress2',
    //       'state',
    //       'city',
    //       'postalCode',
    //       'country',
    //       'barcode_string',
    //       'ResStreetAddress1',
    //       'ResStreetAddress2',
    //       'barcodeHash128_string',
    //       'documentId',
    //       'expirationDate',
    //       'gender',
    //       'height',
    //       'issueDate',
    //       'issuingCountry',
    //       'middleName',
    //       'placeOfBirth',
    //     ];

    //     userAttributes.forEach((attr) => (userData[attr] = res[attr]));

    //     console.log("USER DATA AFTER LOOP", userData);

    //     wasmPrivModule._free(resultSecPtr);
    //   }
    //   wasmPrivModule._free(resultLength);
    // } catch (e) {
    //   console.log('==parsing block==', e);
    // }
    // wasmPrivModule._free(resultFirstPtr);
    // wasmPrivModule._free(resultLenPtr);
    // const [outputBufferSize] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, outputBufferLenPtr, 1);
    // const [outputBufferSecPtr] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, outputBufferFirstPtr, 1);
    // const outputBufferPtr = new Uint8Array(wasmPrivModule.HEAPU8.buffer, outputBufferSecPtr, outputBufferSize);

    // const imgData = Uint8ClampedArray.from(outputBufferPtr);

    // const image = new ImageData(imgData, res.crop_doc_width, res.crop_doc_height);
    // //   conf_score = res.barcode_conf_score;
    // //   console.log('---------resultString--back-------', res);
    // // const href = [];
    // href.push(image);

    // //   wasmPrivModule._free(inputPtr);
    // //   wasmPrivModule._free(outputBufferSecPtr);
    // //   // wasmPrivModule._free(outputBufferSize)
    wasmPrivModule._free(outputBufferFirstPtr);
    wasmPrivModule._free(outputBufferLenPtr);
    // wasmPrivModule._free(resultFirstPtr);
    // wasmPrivModule._free(resultLenPtr);

    //   inputPtr = undefined;
    // } else {
    //   wasmPrivModule._free(outputBufferFirstPtr);
    //   wasmPrivModule._free(outputBufferLenPtr);
    //   wasmPrivModule._free(resultFirstPtr);
    //   wasmPrivModule._free(resultLenPtr);
    // }

    if (result === 0 || result === -10) {
      wasmPrivModule._free(barCodePtr);
      barCodePtr = null;
    }
    wasmPrivModule._free(configInputPtr);
    // console.log(conf_score, '-----------------conf_score---------------');

    // resolve({ result, href, conf_score, userData });
    resolve({ result });
  });

const configureBlur = async (paramID, param) => {
  if (!wasmPrivModule) {
    console.log('loaded for first wsm wrkr', simd, action);
  }
  return wasmPrivModule._FHE_configure(paramID, param);
};

const scanDocument = async (imageInput, simd, cb, doPredict, config, debug_type = 0) =>
  new Promise(async (resolve, reject) => {
    privid_wasm_result = cb;
    if (!wasmPrivModule) {
      console.log('loaded for first wsm wrkr', simd);
      await isLoad(simd, apiUrl, apiKey, wasmModule, debugType);
    }
    configGlobal = config;
    const version = wasmPrivModule._get_version();
    console.log('Version = ', version);

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

    // const outputBufferFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    // const outputBufferLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

    // const resultFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    // // create a pointer to intechromger to hold the length of the output buffer
    // const resultLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

    console.log('-----------------GOING TO WASM---------------');

    const sessionFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    const s_result = wasmPrivModule._privid_initialize_session_join(sessionFirstPtr, null);
    if (s_result) {
      console.log('[FAR_DEBUG] : session initialized successfully');
    } else {
      console.log('[FAR_DEBUG] : session initialized failed');
    }
    // console.log('[FAR_DEBUG] : Getting session second pointer')
    const [sessionSecPtr] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, sessionFirstPtr, 1);
    let result = null;
    try {
      console.log("==== module list ==>",wasmPrivModule);
      result = wasmPrivModule._privid_doc_scan_face(
        sessionSecPtr,
        configInputPtr,
        configInputSize,
        inputPtr,
        imageInput.width,
        imageInput.height,
        null,
        0,
        null,
        0,
      );
    } catch (err) {
      console.error('-----------------ERROR---------------', err);
      reject(new Error(err));
      return;
    }

    console.log(result, '-----------------OUT OF WASM---------------');
    resolve({ result });
  });

const FHE_enrollOnefa = (originalImages, simd, debug_type = 0, cb, config = {}) =>
  new Promise(async (resolve) => {
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
    const version = wasmPrivModule._get_version();
    console.log('Version = ', version);

    const encoder = new TextEncoder();
    const config_bytes = encoder.encode(`${config}\0`);

    const configInputSize = config.length;
    const configInputPtr = wasmPrivModule._malloc(configInputSize);
    wasmPrivModule.HEAP8.set(config_bytes, configInputPtr / config_bytes.BYTES_PER_ELEMENT);

    const imageInputSize = imageInput.length * imageInput.BYTES_PER_ELEMENT;
    const imageInputPtr = wasmPrivModule._malloc(imageInputSize);

    wasmPrivModule.HEAP8.set(imageInput, imageInputPtr / imageInput.BYTES_PER_ELEMENT);

    // const BufferSize = wasmPrivModule._spl_image_embedding_length();

    // outupt  ptr
    // const outputBufferSize = BufferSize * 4 * 80;
    // const outputBufferPtr = wasmPrivModule._malloc(outputBufferSize);

    // const augmBufferSize = 224 * 224 * 4 * 100;
    // const augmBufferPtr = wasmPrivModule._malloc(augmBufferSize);

    const resultFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    // create a pointer to interger to hold the length of the output buffer
    const resultLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    let result = null;
    console.log('wasmPrivModule', wasmPrivModule);

    // console.log('[FAR_DEBUG] : Calling session preparation')
    const sessionFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    const s_result = wasmPrivModule._privid_initialize_session_join(sessionFirstPtr, null);
    if (s_result) {
      console.log('[FAR_DEBUG] : session initialized successfully');
    } else {
      console.log('[FAR_DEBUG] : session initialized failed');
    }
    // console.log('[FAR_DEBUG] : Getting session second pointer')
    const [sessionSecPtr] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, sessionFirstPtr, 1);
    // console.log(`[FAR_DEBUG] : Session second pointer = [${  sessionSecPtr  }]`)

    // console.log('[FAR_DEBUG] : Calling enroll_onefa')
    try {
      result = await wasmPrivModule._privid_enroll_onefa(
        sessionSecPtr /* session pointer */,
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
    // console.log('[FAR_DEBUG] : enroll_onefa done')

    /*
    const href = [];
    if (['900', '901', '902', '903'].includes(debug_type)) {
      const num = action ? 80 : 1;
      const AugmputArray = new Uint8Array(wasmPrivModule.HEAPU8.buffer, augmBufferPtr, 224 * 224 * 4 * num);

      const img_width = 224;
      const img_height = 224;
      const dataLength = 200704;

      const numImages = AugmputArray.length / dataLength;

      for (let i = 0; i < numImages; i++) {
        const img = AugmputArray.slice(i * dataLength, (i + 1) * dataLength);
        const img_data = Uint8ClampedArray.from(img);

        const image = new ImageData(img_data, img_width, img_height);

        href.push(image);
      }
    }
    */
    wasmPrivModule._free(imageInputPtr);
    // wasmPrivModule._free(outputBufferPtr);
    // wasmPrivModule._free(augmBufferPtr);
    wasmPrivModule._free(resultFirstPtr);

    resolve({ result });
  });

const FHE_predictOnefa = (originalImages, simd, debug_type = 0, cb, config = {}) =>
  new Promise(async (resolve) => {
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
    const version = wasmPrivModule._get_version();
    console.log('Version = ', version);

    const encoder = new TextEncoder();
    const config_bytes = encoder.encode(`${config}\0`);

    const configInputSize = config.length;
    const configInputPtr = wasmPrivModule._malloc(configInputSize);
    wasmPrivModule.HEAP8.set(config_bytes, configInputPtr / config_bytes.BYTES_PER_ELEMENT);
    console.log('=====> config bytes PREDICT', config_bytes);
    const imageInputSize = imageInput.length * imageInput.BYTES_PER_ELEMENT;
    const imageInputPtr = wasmPrivModule._malloc(imageInputSize);

    wasmPrivModule.HEAP8.set(imageInput, imageInputPtr / imageInput.BYTES_PER_ELEMENT);

    // const BufferSize = wasmPrivModule._spl_image_embedding_length();

    // // outupt  ptr
    // const outputBufferSize = BufferSize * 4 * 80;
    // const outputBufferPtr = wasmPrivModule._malloc(outputBufferSize);

    // const augmBufferSize = 224 * 224 * 4 * 100;
    // const augmBufferPtr = wasmPrivModule._malloc(augmBufferSize);

    const resultFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    // create a pointer to interger to hold the length of the output buffer
    const resultLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    let result = null;
    console.log('wasmPrivModule', wasmPrivModule);

    const sessionFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    const s_result = wasmPrivModule._privid_initialize_session_join(sessionFirstPtr, null);
    if (s_result) {
      console.log('[FAR_DEBUG] : session initialized successfully');
    } else {
      console.log('[FAR_DEBUG] : session initialized failed');
    }

    const [sessionSecPtr] = new Uint32Array(wasmPrivModule.HEAPU8.buffer, sessionFirstPtr, 1);

    try {
      result = await wasmPrivModule._privid_face_predict_onefa(
        sessionSecPtr /* session pointer */,
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

    // const href = [];
    // if (['900', '901', '902', '903'].includes(debug_type)) {
    //   const num = action ? 80 : 1;
    //   const AugmputArray = new Uint8Array(wasmPrivModule.HEAPU8.buffer, augmBufferPtr, 224 * 224 * 4 * num);

    //   const img_width = 224;
    //   const img_height = 224;
    //   const dataLength = 200704;

    //   const numImages = AugmputArray.length / dataLength;

    //   for (let i = 0; i < numImages; i++) {
    //     const img = AugmputArray.slice(i * dataLength, (i + 1) * dataLength);
    //     const img_data = Uint8ClampedArray.from(img);

    //     const image = new ImageData(img_data, img_width, img_height);

    //     href.push(image);
    //   }
    // }

    wasmPrivModule._free(imageInputPtr);
    // wasmPrivModule._free(outputBufferPtr);
    // wasmPrivModule._free(augmBufferPtr);
    wasmPrivModule._free(resultFirstPtr);

    resolve({ result });
  });

const isValidInternal = (
  data,
  width,
  height,
  simd,
  action,
  debug_type = 0,
  cb,
  config = JSON.stringify({ input_image_format: 'rgba' }),
) =>
  new Promise(async (resolve) => {
    privid_wasm_result = cb;

    if (wasmPrivModule === undefined) {
      console.log('loaded for first wsm wrkr', simd, apiUrl, debugType, wasmModule);
      await isLoad(simd, apiUrl, apiKey, wasmModule, debug_type);
    }

    const imageSize = data.length * data.BYTES_PER_ELEMENT;

    const isValidPtr = wasmPrivModule._malloc(imageSize);
    wasmPrivModule.HEAP8.set(data, isValidPtr / data.BYTES_PER_ELEMENT);

    // const outputBufferFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    // const outputBufferLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

    // const resultFirstPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);
    // create a pointer to interger to hold the length of the output buffer
    // const resultLenPtr = wasmPrivModule._malloc(Int32Array.BYTES_PER_ELEMENT);

    const encoder = new TextEncoder();
    const config_bytes = encoder.encode(`${config}\0`);
    const configInputSize = config.length;
    const configInputPtr = wasmPrivModule._malloc(configInputSize);
    wasmPrivModule.HEAP8.set(config_bytes, configInputPtr / config_bytes.BYTES_PER_ELEMENT);
    console.log('[FAR_DEBUG] : Calling is_valid');
    const result = await wasmPrivModule._is_valid(
      action,
      isValidPtr,
      width,
      height,
      null,
      0,
      null /* resultFirstPtr, */,
      0 /* resultLenPtr, */,
      configInputPtr,
      configInputSize,
    );
    console.log('[FAR_DEBUG] : is_valid result = ', result);
    if (result >= 0) {
      console.log(
        '[FAR_DEBUG] : Operation executed successfully. Result shall be returned in the JS callback synchronously or asynchronously',
      );
    } else {
      console.log('[FAR_DEBUG] : Operation failed to execute');
    }

    console.log('[FAR_DEBUG] : Now freeing the locally allocated buffers');
    wasmPrivModule._free(isValidPtr);
    wasmPrivModule._free(configInputPtr);
    console.log('[FAR_DEBUG] : Done with is_valid');

    resolve({ result });
  });

const isValidFrontDocument = (imagePtr, width, height, simd, action, debug_type = 0, cb) =>
  new Promise(async (resolve) => {
    privid_wasm_result = cb;

    if (!wasmPrivModule) {
      console.log('loaded for first wsm wrkr', simd, apiUrl, debugType, wasmModule);
      await isLoad(simd, apiUrl, apiKey, wasmModule, debug_type);
    }

    const result = wasmPrivModule._is_valid(action, imagePtr, width, height, 0, 0, 0);
    wasmPrivModule._free(imagePtr);

    resolve(result);
  });

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
      reject(open.error);
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
        db.close();
      };
    };
  });
}

function putKey(key, cachedWasm, cachedScript, version) {
  if (!indexedDB) return Promise.reject(new Error('IndexedDB not available'));

  return new Promise((resolve, reject) => {
    const open = indexedDB.open('/privid-wasm', 21);

    open.onerror = function () {
      reject(open.error);
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
        db.close();
      };
    };
  });
}

Comlink.expose({
  FHE_enrollOnefa,
  FHE_predictOnefa,
  isValidInternal,
  isLoad,
  voicePredict,
  isValidVoice,
  scanDocument,
  isValidBarCode,
  deleteUUID,
  configureBlur,
});
