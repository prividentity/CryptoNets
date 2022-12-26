package com.cryptonets.sample.utils

import android.annotation.SuppressLint
import android.util.Size
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.google.common.util.concurrent.ListenableFuture
import com.privateidentity.prividlib.model.ImageData
import io.reactivex.rxjava3.disposables.CompositeDisposable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import timber.log.Timber
import java.util.concurrent.Executor
import java.util.concurrent.Executors

class MyCameraHandler(private val activity: FragmentActivity, private val previewView: PreviewView) {
    lateinit var cameraProvider: ProcessCameraProvider
    var isProcessingImage = false
    private val compositeDisposable: CompositeDisposable = CompositeDisposable()
    private var camera: Camera? = null
    private var imageAnalyzeRate = 50 //ms
    private var lastImageAnalyzeTime = 0L
    private var imageListener: ImageListener? = null
    private val executor: Executor = Executors.newSingleThreadExecutor()
    var selectedCamera = 0
        private set
    var cameraSize: Size? = null
        private set

    fun setUpCamera(selectedCamera: Int = 0, size: Size, imageListener: ImageListener) {
        this.selectedCamera = selectedCamera
        this.cameraSize = size
        this.imageListener = imageListener
        val cameraProviderFuture: ListenableFuture<ProcessCameraProvider> = ProcessCameraProvider.getInstance(activity)
        Timber.i("setup camera")
        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()
            startCamera(selectedCamera, size)
        }, ContextCompat.getMainExecutor(activity))
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun startCamera(selectedCamera: Int, size: Size) {
        Timber.e("start Camera size: $size")
        CoroutineScope(Dispatchers.Main).launch {
            val cameraSelector =
                if (selectedCamera == 0) CameraSelector.DEFAULT_FRONT_CAMERA else CameraSelector.DEFAULT_BACK_CAMERA
            // Preview
            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

            val imageAnalysis = ImageAnalysis.Builder()
                .setTargetResolution(size)
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
            imageAnalysis.setAnalyzer(executor, ImageAnalysis.Analyzer { imageProxy ->
                if (isProcessingImage || System.currentTimeMillis() - lastImageAnalyzeTime < imageAnalyzeRate) {
                    imageProxy.close()
                    return@Analyzer
                }
                lastImageAnalyzeTime = System.currentTimeMillis()
                val bitmap = imageProxy.image?.let { Utils.getByteArrayFromImage(it) }
                if (bitmap != null) {
                    val rotatedBitmap = Utils.rotateBitmap(bitmap, imageProxy.imageInfo.rotationDegrees)
                    imageListener?.invoke(ImageData(rotatedBitmap))
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
            } catch (exc: Exception) {
                Timber.i(
                    " startCamera exception -- Use case binding failed " + exc.message
                )
            }
        }
    }

    fun unbindCamera() {
        try {
            if (camera == null) return
            compositeDisposable.clear()
            camera = null
            Timber.i("cameraUnBind")
            cameraProvider.unbindAll()
        } catch (e: java.lang.Exception) {
            Timber.i(" ")
        }
    }
}

typealias ImageListener = (ImageData) -> Unit