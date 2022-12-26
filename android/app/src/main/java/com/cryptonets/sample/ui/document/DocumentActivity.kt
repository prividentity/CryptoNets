package com.cryptonets.sample.ui.document

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.Size
import android.view.LayoutInflater
import android.view.Window
import android.view.WindowManager
import androidx.activity.viewModels
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.cryptonets.sample.R
import com.cryptonets.sample.databinding.ActivityDocumentBinding
import com.cryptonets.sample.ui.base.BaseCameraActivity
import com.cryptonets.sample.ui.main.MainActivity
import com.cryptonets.sample.ui.main.SampleType
import com.cryptonets.sample.ui.main.Status
import com.cryptonets.sample.utils.ImageListener
import com.cryptonets.sample.utils.Utils
import com.cryptonets.sample.utils.setColorFilter
import com.privateidentity.prividlib.model.ImageData
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class DocumentActivity : BaseCameraActivity<ActivityDocumentBinding>() {
    private val viewModel by viewModels<DocumentViewModel>()

    override val getBindingInflater: (LayoutInflater) -> ActivityDocumentBinding
        get() = ActivityDocumentBinding::inflate

    override fun getImageListener(): ImageListener {
        return {
            viewModel.onImageAvailable(it, cameraHandler!!)
        }
    }

    override fun getPreviewView(): PreviewView {
        return binding.viewFinder
    }

    override fun getCameraSize(): Size {
        return Utils.getSizeMax()
    }

    override fun getSelectedCamera(): Int {
        return 1
    }

    override fun initBeforeSetContent() {
        super.initBeforeSetContent()
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        window.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
    }

    override fun onViewCreated(savedInstanceState: Bundle?) {
        super.onViewCreated(savedInstanceState)
        observeLiveData()
        binding.btnScanDLFrontSide.setOnClickListener {
            viewModel.onDLFrontsideClicked()
        }
        binding.btnScanDLBackSide.setOnClickListener {
            viewModel.onDLBacksideClicked()
        }
    }

    private fun observeLiveData() {
        viewModel.statusLiveData.observe(this) {
            if (it == null) return@observe
            binding.tvStatus1.text = it.status1
            binding.tvStatus2.text = it.status2
            binding.tvStatus3.text = it.status3
        }

        viewModel.sampleTypeLiveData.observe(this) {
            val hlColor = Color.RED
            val normalColor = ContextCompat.getColor(this, R.color.purple_500)
            binding.btnScanDLFrontSide.setColorFilter(normalColor)
            binding.btnScanDLBackSide.setColorFilter(normalColor)
            when (it) {
                SampleType.DL_FrontSide -> {
                    binding.btnScanDLFrontSide.setColorFilter(hlColor)
                    binding.ivGuide.setImageResource(R.drawable.bg_dl)
                }
                SampleType.DL_BackSide  -> {
                    binding.btnScanDLBackSide.setColorFilter(hlColor)
                    binding.ivGuide.setImageResource(R.drawable.bg_dl_back)
                }
                else                    -> {}
            }

        }
    }

    override fun onBackPressed() {
        cameraHandler?.unbindCamera()
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }

}