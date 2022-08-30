package com.cryptonets.sample.ui.main

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import androidx.activity.viewModels
import androidx.lifecycle.lifecycleScope
import com.cryptonets.sample.databinding.ActivityMainBinding
import com.cryptonets.sample.ui.base.ViewBindingActivity
import com.cryptonets.sample.utils.MyCameraHandler
import com.cryptonets.sample.utils.PermissionObserver
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
            binding.btnIsValid.setTextColor(Color.WHITE)
            binding.btnEnroll.setTextColor(Color.WHITE)
            binding.btnContinuousPredict.setTextColor(Color.WHITE)
            binding.btnDelete.setTextColor(Color.WHITE)

            when (it) {
                SampleType.Validity          -> binding.btnIsValid.setTextColor(Color.BLACK)
                SampleType.Enrolling         -> binding.btnEnroll.setTextColor(Color.BLACK)
                SampleType.ContinuousPredict -> binding.btnContinuousPredict.setTextColor(Color.BLACK)
                SampleType.Delete            -> binding.btnDelete.setTextColor(Color.BLACK)
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