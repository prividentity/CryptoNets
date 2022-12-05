package com.cryptonets.sample.ui.main

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.cryptonets.sample.R
import com.cryptonets.sample.databinding.ActivityMainBinding
import com.cryptonets.sample.ui.base.ViewBindingActivity
import com.cryptonets.sample.utils.MyCameraHandler
import com.cryptonets.sample.utils.PermissionObserver
import com.cryptonets.sample.utils.setColorFilter
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.delay
import timber.log.Timber
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ViewBindingActivity<ActivityMainBinding>() {
    @Inject
    lateinit var permissionObserver: PermissionObserver
    private var cameraHandler: MyCameraHandler? = null
    private val viewModel by viewModels<MainViewModel>()

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

    private fun setupViews() {
        binding.btnIsValid.setOnClickListener {
            viewModel.onIsValidClicked()
        }
        binding.btnEnroll.setOnClickListener {
            viewModel.onEnrollClicked()
        }
        binding.btnDelete.setOnClickListener {
            viewModel.onDeleteClicked()

        }
        binding.btnContinuousPredict.setOnClickListener {
            viewModel.onContinuousPredictClicked()
        }
    }

    private fun observeLiveData() {
        viewModel.sampleTypeLiveData.observe(this) {
            val hlColor = Color.RED
            val normalColor = ContextCompat.getColor(this, R.color.purple_500)

            binding.btnIsValid.setColorFilter(normalColor)
            binding.btnEnroll.setColorFilter(normalColor)
            binding.btnContinuousPredict.setColorFilter(normalColor)
            binding.btnDelete.setColorFilter(normalColor)
            binding.btnScanDLFrontSide.setColorFilter(normalColor)

            when (it) {
                SampleType.Validity          -> binding.btnIsValid.setColorFilter(hlColor)
                SampleType.Enrolling         -> binding.btnEnroll.setColorFilter(hlColor)
                SampleType.ContinuousPredict -> binding.btnContinuousPredict.setColorFilter(hlColor)
                SampleType.Delete            -> binding.btnDelete.setColorFilter(hlColor)
                SampleType.DL_FrontSide      -> binding.btnScanDLFrontSide.setColorFilter(hlColor)
                null                         -> {}
            }
        }

        viewModel.statusLiveData.observe(this) {
            if (it == null) return@observe
            binding.tvStatus1.text = it.status1
            binding.tvStatus2.text = it.status2
            binding.tvStatus3.text = it.status3
            binding.tvStatus4.text = it.status4
            binding.tvStatus5.text = it.status5
        }
    }

    private fun openCamera() {
        lifecycleScope.launchWhenCreated {
            delay(1000)
            if (cameraHandler == null) {
                cameraHandler = MyCameraHandler(this@MainActivity, binding.viewFinder)
            }
            cameraHandler?.setUpCamera {
                viewModel.onImageAvailable(it, cameraHandler!!)
            }
        }
    }

    override val getBindingInflater: (LayoutInflater) -> ActivityMainBinding
        get() = ActivityMainBinding::inflate

    override fun onViewCreated(savedInstanceState: Bundle?) {
        permissionObserver.init(this)
        setUpCamera()
        observeLiveData()
        setupViews()
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraHandler?.unbindCamera()
    }
}