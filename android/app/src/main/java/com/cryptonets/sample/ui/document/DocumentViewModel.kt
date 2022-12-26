package com.cryptonets.sample.ui.document

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cryptonets.sample.R
import com.cryptonets.sample.ui.main.SampleType
import com.cryptonets.sample.ui.main.Status
import com.cryptonets.sample.utils.MyCameraHandler
import com.cryptonets.sample.utils.ResourceProvider
import com.cryptonets.sample.utils.toLiveData
import com.privateidentity.prividlib.PrivateIdentity
import com.privateidentity.prividlib.model.ImageData
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class DocumentViewModel @Inject constructor(
    private val resourceProvider: ResourceProvider, private val privateIdentity: PrivateIdentity
) : ViewModel() {

    private val _sampleTypeLiveData = MutableLiveData(SampleType.DL_FrontSide)
    val sampleTypeLiveData = _sampleTypeLiveData.toLiveData()

    private var _statusLiveData = MutableLiveData(Status())
    val statusLiveData = _statusLiveData.toLiveData()

    fun onImageAvailable(imageData: ImageData, cameraHandler: MyCameraHandler) {
        when (_sampleTypeLiveData.value) {
            SampleType.DL_FrontSide -> {
                scanDLFrontside(imageData, cameraHandler)
            }
            SampleType.DL_BackSide  -> {
                scanDLBackSide(imageData, cameraHandler)
            }
            else                    -> {}
        }
    }

    private fun scanDLFrontside(imageData: ImageData, cameraHandler: MyCameraHandler) {
        viewModelScope.launch {
            cameraHandler.isProcessingImage = true
            val documentResult = withContext(Dispatchers.IO) {
                privateIdentity.validateDocument(imageData)
            }
            val status1 = if (documentResult.isValid) documentResult.predictMessage else resourceProvider.getString(
                R.string.dl_invalid
            )
            val status2 = resourceProvider.getString(R.string.predict_uuid_, documentResult.uuid)
            val status3 = resourceProvider.getString(R.string.predict_guid_, documentResult.guid)
            _statusLiveData.value = Status(status1, status2, status3)
            cameraHandler.isProcessingImage = false
        }
    }

    private fun scanDLBackSide(imageData: ImageData, cameraHandler: MyCameraHandler) {
        viewModelScope.launch {
            cameraHandler.isProcessingImage = true
            val barcodeResult = withContext(Dispatchers.IO) {
                privateIdentity.validateBarcode(imageData)
            }
            Timber.e("barcode result = $barcodeResult")

            val status = Status()
            val status1 = if (barcodeResult.isValid) resourceProvider.getString(
                R.string.dl_valid_barcode
            ) else resourceProvider.getString(
                R.string.dl_invalid
            )
            status.status1 = status1
            if (barcodeResult.isValid) {
                status.status2 = "${barcodeResult.firstName} ${barcodeResult.middleName} ${barcodeResult.lastName}"
                status.status3 = barcodeResult.streetAddress1
            }
            _statusLiveData.value = status

            cameraHandler.isProcessingImage = false
        }
    }

    fun onDLFrontsideClicked() {
        _sampleTypeLiveData.value = SampleType.DL_FrontSide
        clearData()
    }

    fun onDLBacksideClicked() {
        _sampleTypeLiveData.value = SampleType.DL_BackSide
        clearData()
    }

    private fun clearData() {
        _statusLiveData.value = Status()
    }

}