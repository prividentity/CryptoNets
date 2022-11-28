package com.cryptonets.sample.ui.main

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cryptonets.sample.R
import com.cryptonets.sample.utils.MyCameraHandler
import com.cryptonets.sample.utils.ResourceProvider
import com.cryptonets.sample.utils.toLiveData
import com.privateidentity.prividlib.PrivateIdentity
import com.privateidentity.prividlib.model.FacePredictResult
import com.privateidentity.prividlib.model.FaceValidation
import com.privateidentity.prividlib.model.ImageData
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val resourceProvider: ResourceProvider, private val privateIdentity: PrivateIdentity
) : ViewModel() {

    private val _sampleTypeLiveData = MutableLiveData(SampleType.Validity)
    val sampleTypeLiveData = _sampleTypeLiveData.toLiveData()

    private var _statusLiveData = MutableLiveData(Status())
    val statusLiveData = _statusLiveData.toLiveData()

    private var isEnrolled = false
    private val enrollingImages = arrayListOf<ImageData>()

    fun onImageAvailable(imageData: ImageData, cameraHandler: MyCameraHandler) {
        when (_sampleTypeLiveData.value) {
            SampleType.Validity          -> {
                isValid(imageData, cameraHandler)
            }
            SampleType.Enrolling         -> {
                enroll(imageData, cameraHandler)
            }
            SampleType.ContinuousPredict -> {
                predictContinuously(imageData, cameraHandler)
            }
            SampleType.Delete            -> {
                deleteContinuously(imageData, cameraHandler)
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
        enrollingImages.clear()
    }

    private fun isValid(imageData: ImageData, cameraHandler: MyCameraHandler) {
        viewModelScope.launch {
            cameraHandler.isProcessingImage = true
            val responseIsValid = withContext(Dispatchers.IO) {
                privateIdentity.validate(imageData)
            }
            if (responseIsValid.faceValidation == FaceValidation.ValidBiometric) {
                _statusLiveData.value = Status(resourceProvider.getString(R.string.face_valid_message))
            } else {
                _statusLiveData.value = Status(resourceProvider.getString(R.string.face_invalid_message))
            }
            cameraHandler.isProcessingImage = false
        }
    }

    private fun predictContinuously(imageDa: ImageData, cameraHandler: MyCameraHandler) {
        viewModelScope.launch {
            cameraHandler.isProcessingImage = true
            predictUser(imageDa)?.let {
                val status1 = if (!it.uuid.isNullOrEmpty()) resourceProvider.getString(
                    R.string.face_valid_message
                ) else resourceProvider.getString(R.string.user_not_enrolled)
                val status2 = resourceProvider.getString(R.string.predict_uuid_, it.uuid)
                val status3 = resourceProvider.getString(R.string.predict_guid_, it.guid)
                _statusLiveData.value = Status(status1, status2, status3)
            } ?: run {
                _statusLiveData.value = Status(resourceProvider.getString(R.string.face_invalid_message))
            }
            cameraHandler.isProcessingImage = false
        }
    }

    private suspend fun predictUser(imageData: ImageData): FacePredictResult? {
        return withContext(Dispatchers.IO) {
            val responsePredict = withContext(Dispatchers.IO) {
                privateIdentity.predict(imageData)
            }
            return@withContext responsePredict
        }
    }

    private fun deleteContinuously(imageData: ImageData, cameraHandler: MyCameraHandler) {
        viewModelScope.launch {
            cameraHandler.isProcessingImage = true
            predictUser(imageData)?.let {
                if (!it.uuid.isNullOrEmpty()) {
                    val status1 = resourceProvider.getString(R.string.deletion_status_deleting)
                    val status2 = resourceProvider.getString(R.string.predict_uuid_, it.uuid)
                    val status3 = resourceProvider.getString(R.string.predict_guid_, it.guid)
                    _statusLiveData.value = Status(status1, status2, status3)
                    val deleteResult = withContext(Dispatchers.IO) {
                        privateIdentity.delete(it.uuid!!)
                    }
                    deleteResult?.let {
                        _statusLiveData.value = Status(
                            resourceProvider.getString(R.string.deletion_status_success),
                            status2, status3
                        )
                    } ?: run {
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

    private fun enroll(imageData: ImageData, cameraHandler: MyCameraHandler) {
        if (isEnrolled) return
        viewModelScope.launch {
            cameraHandler.isProcessingImage = true
            val faceValidateResult = withContext(Dispatchers.IO) {
                privateIdentity.validateToEnroll(imageData)
            }
            if (faceValidateResult.faceValidation == FaceValidation.ValidBiometric) {
                enrollingImages.add(imageData)
                val status1 = resourceProvider.getString(R.string.face_valid_message)
                val percent =
                    resourceProvider.getString(
                        R.string.enroll_progress_, (enrollingImages.size * 100 / 10).toString()
                    )
                _statusLiveData.value = Status(status1, "", percent)
                if (enrollingImages.size == 10) {
                    isEnrolled = true
                    val enrollResult = withContext(Dispatchers.IO) {
                        privateIdentity.enroll(enrollingImages)
                    }

                    enrollResult?.let {
                        val guid = it.guid
                        val uuid = it.uuid

                        val status2 = resourceProvider.getString(R.string.enroll_success)
                        val status4 = resourceProvider.getString(R.string.enrolled_uuid_, uuid)
                        val status5 = resourceProvider.getString(R.string.enrolled_guid_, guid)
                        _statusLiveData.value = Status(status1, status2, percent, status4, status5)
                    } ?: run {
                        val status2 = resourceProvider.getString(R.string.enroll_failed)
                        _statusLiveData.value = Status(status1, status2, percent)
                        enrollingImages.clear()
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