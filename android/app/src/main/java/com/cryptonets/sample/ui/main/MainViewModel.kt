package com.cryptonets.sample.ui.main

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cryptonets.sample.R
import com.cryptonets.sample.utils.MyCameraHandler
import com.cryptonets.sample.utils.ResourceProvider
import com.cryptonets.sample.utils.toLiveData
import com.privateidentity.prividlib.ImageRawDataInfo
import com.privateidentity.prividlib.PrividFheFace
import com.privateidentity.prividlib.ResponseModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
        private val resourceProvider: ResourceProvider, private val prividFheFace: PrividFheFace
) : ViewModel() {

    private val _sampleTypeLiveData = MutableLiveData(SampleType.Validity)
    val sampleTypeLiveData = _sampleTypeLiveData.toLiveData()

    private var _statusLiveData = MutableLiveData(Status())
    val statusLiveData = _statusLiveData.toLiveData()

    private var isEnrolled = false
    private val enrollImageByteArray = arrayListOf<ByteArray>()

    fun onImageAvailable(imageDetails: ImageRawDataInfo, cameraHandler: MyCameraHandler) {
        when (_sampleTypeLiveData.value) {
            SampleType.Validity          -> {
                isValid(imageDetails, cameraHandler)
            }
            SampleType.Enrolling         -> {
                enroll(imageDetails, cameraHandler)
            }
            SampleType.ContinuousPredict -> {
                predictContinuously(imageDetails, cameraHandler)
            }
            SampleType.Delete            -> {
                deleteContinuously(imageDetails, cameraHandler)
            }
            else                         -> {} // should never happen
        }
    }

    fun onIsValidClicked() {
        _sampleTypeLiveData.value = SampleType.Validity
        clearData()
    }

    fun onContinuousPredictClicked() {
        _sampleTypeLiveData.value = SampleType.ContinuousPredict
        clearData()
    }

    fun onDeleteClicked() {
        _sampleTypeLiveData.value = SampleType.Delete
        clearData()
    }

    fun onEnrollClicked() {
        _sampleTypeLiveData.value = SampleType.Enrolling
        clearData()
    }

    private fun clearData() {
        _statusLiveData.value = Status()
        isEnrolled = false
        enrollImageByteArray.clear()
    }

    private fun isValid(imageRawDataInfo: ImageRawDataInfo, cameraHandler: MyCameraHandler) {
        viewModelScope.launch {
            cameraHandler.isProcessingImage = true
            val responseIsValid = withContext(Dispatchers.IO) {
                prividFheFace.isValid(
                    imageRawDataInfo.imageData,
                    imageRawDataInfo.width,
                    imageRawDataInfo.height,
                    0
                )
            }
            if (responseIsValid.status == 0) {
                _statusLiveData.value = Status(resourceProvider.getString(R.string.face_valid_message))
            } else {
                _statusLiveData.value = Status(resourceProvider.getString(R.string.face_invalid_message))
            }
            cameraHandler.isProcessingImage = false
        }
    }

    private fun predictContinuously(imageDetails: ImageRawDataInfo, cameraHandler: MyCameraHandler) {
        viewModelScope.launch {
            cameraHandler.isProcessingImage = true
            predictUser(imageDetails)?.let {
                val status1 = resourceProvider.getString(R.string.face_valid_message)
                val status2 = resourceProvider.getString(R.string.predict_uuid_, it.piModel.uuid)
                val status3 = resourceProvider.getString(R.string.predict_guid_, it.piModel.guid)
                _statusLiveData.value = Status(status1, status2, status3)
            } ?: run {
                _statusLiveData.value = Status(resourceProvider.getString(R.string.face_invalid_message))
            }
            cameraHandler.isProcessingImage = false
        }
    }

    private suspend fun predictUser(imageRawDataInfo: ImageRawDataInfo): ResponseModel? {
        return withContext(Dispatchers.IO) {
            val responsePredict = withContext(Dispatchers.IO) {
                prividFheFace.predict(imageRawDataInfo.imageData, imageRawDataInfo.width, imageRawDataInfo.height)
            }
            return@withContext responsePredict
        }
    }

    private fun deleteContinuously(imageRawDataInfo: ImageRawDataInfo, cameraHandler: MyCameraHandler) {
        viewModelScope.launch {
            cameraHandler.isProcessingImage = true
            predictUser(imageRawDataInfo)?.let {
                if (it.status == 0) {
                    val status1 = resourceProvider.getString(R.string.deletion_status_deleting)
                    val status2 = resourceProvider.getString(R.string.predict_uuid_, it.piModel.uuid)
                    val status3 = resourceProvider.getString(R.string.predict_guid_, it.piModel.guid)
                    _statusLiveData.value = Status(status1, status2, status3)
                    val deleteResult = withContext(Dispatchers.IO) {
                        prividFheFace.delete(it.piModel.uuid)
                    }
                    if (deleteResult.status == 0) {
                        _statusLiveData.value = Status(
                            resourceProvider.getString(R.string.deletion_status_success),
                            status2, status3
                        )
                    } else {
                        _statusLiveData.value = Status(
                            resourceProvider.getString(R.string.deletion_status_failed),
                            status2, status3
                        )
                    }
                } else {
                    // No user
                }
            } ?: run {
//                _statusLiveData.value = Status(resourceProvider.getString(R.string.face_invalid_message))
            }
            cameraHandler.isProcessingImage = false
        }
    }

    private fun enroll(imageRawDataInfo: ImageRawDataInfo, cameraHandler: MyCameraHandler) {
        if (isEnrolled) return
        viewModelScope.launch {
            cameraHandler.isProcessingImage = true
            val responseIsValid = withContext(Dispatchers.IO) {
                prividFheFace.isValid(imageRawDataInfo.imageData, imageRawDataInfo.width, imageRawDataInfo.height, 1)
            }
            if (responseIsValid.status == 0) {
                enrollImageByteArray.add(imageRawDataInfo.imageData)
                val status1 = resourceProvider.getString(R.string.face_valid_message)
                val percent =
                    resourceProvider.getString(
                        R.string.enroll_progress_, (enrollImageByteArray.size * 100 / 10).toString()
                    )
                _statusLiveData.value = Status(status1, "", percent)
                if (enrollImageByteArray.size == 10) {
                    isEnrolled = true
                    val enrollResult = withContext(Dispatchers.IO) {
                        prividFheFace.enroll(
                            enrollImageByteArray, imageRawDataInfo.height, imageRawDataInfo.width,
                            imageRawDataInfo.byteCount
                        )
                    }
                    if (enrollResult.status == 0) {
                        val guid = enrollResult.piModel.guid
                        val uuid = enrollResult.piModel.uuid

                        val status2 = resourceProvider.getString(R.string.enroll_success)
                        val status4 = resourceProvider.getString(R.string.enrolled_uuid_, uuid)
                        val status5 = resourceProvider.getString(R.string.enrolled_guid_, guid)
                        _statusLiveData.value = Status(status1, status2, percent, status4, status5)
                    } else {
                        val status2 = resourceProvider.getString(R.string.enroll_failed)
                        _statusLiveData.value = Status(status1, status2, percent)
                        enrollImageByteArray.clear()
                        isEnrolled = false
                    }

                }
            } else {
                _statusLiveData.value = Status(
                    resourceProvider.getString(R.string.face_invalid_message),
                    resourceProvider.getString(R.string.enroll_please_look_at_the_camera)
                )
            }

            cameraHandler.isProcessingImage = false
        }
    }
}

enum class SampleType {
    Validity,
    Enrolling,
    ContinuousPredict,
    Delete
}

data class Status(
        val status1: String = "", val status2: String = "", val status3: String = "", val status4: String = "", val
        status5: String = "")