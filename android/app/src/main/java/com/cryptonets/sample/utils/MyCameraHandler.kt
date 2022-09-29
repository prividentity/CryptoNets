package com.cryptonets.sample.utils

import android.annotation.SuppressLint
import android.graphics.Bitmap
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.google.common.util.concurrent.ListenableFuture
import com.privateidentity.prividlib.CommonMethods
import com.privateidentity.prividlib.ImageRawDataInfo
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers
import io.reactivex.rxjava3.core.Observable
import io.reactivex.rxjava3.disposables.CompositeDisposable
import io.reactivex.rxjava3.schedulers.Schedulers
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import timber.log.Timber
import java.util.concurrent.Executor
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class MyCameraHandler(private val activity: FragmentActivity, private val previewView: PreviewView) {
    lateinit var cameraProvider: ProcessCameraProvider
    var isProcessingImage = false
    private val compositeDisposable: CompositeDisposable = CompositeDisposable()
    private var camera: Camera? = null
    private var imageAnalyzeRate = 50 //ms
    private var lastImageAnalyzeTime = 0L
    private var imageListener: ImageListener? = null
    private val executor: Executor = Executors.newSingleThreadExecutor()

    fun setUpCamera(selectedCamera: Int = 0, imageListener: ImageListener) {
        this.imageListener = imageListener
        val cameraProviderFuture: ListenableFuture<ProcessCameraProvider> = ProcessCameraProvider.getInstance(activity)
        Timber.i("setup camera")
        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()
            startCamera(selectedCamera)
        }, ContextCompat.getMainExecutor(activity))
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun startCamera(selectedCamera: Int) {
        CoroutineScope(Dispatchers.Main).launch {
            var cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA
            if (selectedCamera == 0) cameraSelector =
                CameraSelector.DEFAULT_FRONT_CAMERA else cameraSelector =
                CameraSelector.DEFAULT_BACK_CAMERA
            // Preview
            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

            val imageAnalysis = ImageAnalysis.Builder()
                .setTargetResolution(Utils.getSizeSmall())
//                .setTargetResolution(Size(1080, 1080))
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
            imageAnalysis.setAnalyzer(executor, ImageAnalysis.Analyzer { imageProxy ->
                if (isProcessingImage || System.currentTimeMillis() - lastImageAnalyzeTime < imageAnalyzeRate) {
                    imageProxy.close()
                    return@Analyzer
                }
                lastImageAnalyzeTime = System.currentTimeMillis()
                val imageDetails = imageProxy.image?.let { Utils.getByteArrayFromImage(it) }
                if (imageDetails != null) {
                    val imageRaw = CommonMethods.getImageDetailLib(imageDetails, imageProxy.imageInfo.rotationDegrees)
                    imageListener?.invoke(imageRaw)
                }
                imageProxy.close()
            })
            try {
                // Unbind use cases before rebinding
                cameraProvider.unbindAll()
                // Bind use cases to camera
                camera = cameraProvider.bindToLifecycle(
                    activity,
                    cameraSelector,
                    preview,
                    imageAnalysis
                )
//                startPreviewCatcher()
            } catch (exc: Exception) {
                Timber.i(
                    " startCamera exception -- Use case binding failed " + exc.message
                )
            }
        }
    }

    fun unbindCamera() {
        try {
            compositeDisposable.clear()
            camera = null
            activity.runOnUiThread {
                Timber.i("cameraUnBind")
                cameraProvider.unbindAll()
            }
        } catch (e: java.lang.Exception) {
            Timber.i(" ")
        }
    }

    private fun startPreviewCatcher() {
        val disposable = Observable
            .interval(imageAnalyzeRate.toLong(), imageAnalyzeRate.toLong(), TimeUnit.MILLISECONDS)
            .subscribeOn(Schedulers.io())
            .throttleLast(imageAnalyzeRate.toLong(), TimeUnit.MILLISECONDS)
            .observeOn(AndroidSchedulers.mainThread())
            .flatMap {
                if (isProcessingImage || imageListener == null) {
                    return@flatMap Observable.empty<Bitmap>()
                }
                val bitmap = previewView.bitmap
                return@flatMap if (bitmap == null) {
                    Observable.empty()
                } else {
                    Observable.just(bitmap)
                }
            }
            .observeOn(Schedulers.io())
            .map {
                Timber.i("Bitmap size: ${it.width}x${it.height}")
                return@map CommonMethods.getImageDetailLib(it, 0)
            }
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe({
                imageListener?.invoke(it)
            }, {
                Timber.e(it)
            })
        compositeDisposable.add(disposable)
    }
}

typealias ImageListener = (ImageRawDataInfo) -> Unit