package com.cryptonets.sample.ui.main

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import androidx.activity.viewModels
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.cryptonets.sample.R
import com.cryptonets.sample.databinding.ActivityMainBinding
import com.cryptonets.sample.ui.base.BaseCameraActivity
import com.cryptonets.sample.ui.document.DocumentActivity
import com.cryptonets.sample.utils.ImageListener
import com.cryptonets.sample.utils.setColorFilter
import com.privateidentity.prividlib.model.ImageData
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : BaseCameraActivity<ActivityMainBinding>() {
    private val viewModel by viewModels<MainViewModel>()

    private fun setupViews() {
        binding.btnIsValid.setOnClickListener {
            viewModel.onIsValidClicked()
        }
        binding.btnEstimateAge.setOnClickListener {
            viewModel.onEstimateAgeClicked()
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
        binding.btnScanDLFrontSide.setOnClickListener {
            cameraHandler?.unbindCamera()
            startActivity(Intent(this, DocumentActivity::class.java))
            finish()
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
            binding.btnEstimateAge.setColorFilter(normalColor)

            when (it) {
                SampleType.Validity          -> binding.btnIsValid.setColorFilter(hlColor)
                SampleType.Enrolling         -> binding.btnEnroll.setColorFilter(hlColor)
                SampleType.ContinuousPredict -> binding.btnContinuousPredict.setColorFilter(hlColor)
                SampleType.Delete            -> binding.btnDelete.setColorFilter(hlColor)
                SampleType.DL_FrontSide      -> binding.btnScanDLFrontSide.setColorFilter(hlColor)
                SampleType.EstimateAge       -> binding.btnEstimateAge.setColorFilter(hlColor)
                else                         -> {}
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


    override val getBindingInflater: (LayoutInflater) -> ActivityMainBinding
        get() = ActivityMainBinding::inflate

    override fun getImageListener(): ImageListener {
        return {
            viewModel.onImageAvailable(it, cameraHandler!!)
        }
    }

    override fun getPreviewView(): PreviewView {
        return binding.viewFinder
    }

    override fun onViewCreated(savedInstanceState: Bundle?) {
        super.onViewCreated(savedInstanceState)
        observeLiveData()
        setupViews()
    }

}