package com.cryptonets.sample.ui.base

import android.os.Bundle
import android.util.Size
import androidx.camera.view.PreviewView
import androidx.lifecycle.lifecycleScope
import androidx.viewbinding.ViewBinding
import com.cryptonets.sample.utils.ImageListener
import com.cryptonets.sample.utils.MyCameraHandler
import com.cryptonets.sample.utils.PermissionObserver
import com.cryptonets.sample.utils.Utils
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber
import javax.inject.Inject

abstract class BaseCameraActivity<VB : ViewBinding> : ViewBindingActivity<VB>() {
    @Inject
    lateinit var permissionObserver: PermissionObserver
    protected var cameraHandler: MyCameraHandler? = null

    abstract fun getImageListener(): ImageListener
    abstract fun getPreviewView(): PreviewView
    open fun getCameraSize() = Utils.getSizeSmall()
    open fun getSelectedCamera() = 0

    private fun setUpCamera() {
        permissionObserver.requestPermissionIfNeeded(
            arrayOf(android.Manifest.permission.CAMERA)
        ) { allPermissionGranted, map ->
            Timber.i("map = $map")
            if (allPermissionGranted) {
                openCamera()
            }
        }
    }

    private fun openCamera() {
        lifecycleScope.launchWhenCreated {
            if (cameraHandler == null) {
                cameraHandler = MyCameraHandler(this@BaseCameraActivity, getPreviewView())
            }
            cameraHandler?.setUpCamera(
                size = getCameraSize(), selectedCamera = getSelectedCamera(), imageListener = getImageListener()
            )
        }
    }

    override fun onViewCreated(savedInstanceState: Bundle?) {
        permissionObserver.init(this)
        setUpCamera()
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraHandler?.unbindCamera()
    }
}