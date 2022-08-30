package com.cryptonets.sample.utils

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Resources
import android.graphics.*
import android.graphics.drawable.AnimatedVectorDrawable
import android.media.Image
import android.os.Environment
import android.util.Patterns
import android.util.Size
import android.widget.ImageView
import android.widget.Toast
import androidx.vectordrawable.graphics.drawable.AnimatedVectorDrawableCompat
import timber.log.Timber
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream


object Utils {
    const val TAG: String = "CommonMethods"
    fun getSizeSmall(): Size {
        return Size(480, 640)
    }

    fun getSizeMax(): Size {

//        return Size(1080, 1920)

//            return Size(1920, 1207)
//            return Size(1152, 2048)
//            return Size(1944, 2592)
//            return Size(1080, 1920)
//            return Size(1520, 2688)
//            return Size(1536, 2048)
//            return Size(2160, 3840)
        return Size(getScreenWidth(), getScreenHeight())
    }

    fun showLog(TAG: String, message: String) {
        Timber.d("$TAG: $message")
    }

    fun animateView(view: ImageView) {

        when (val drawable = view.drawable) {
            is AnimatedVectorDrawableCompat -> drawable.start()
            is AnimatedVectorDrawable       -> drawable.start()
        }
    }

    fun showToast(message: String, context: Context) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    fun getByteArrayFromImage(image: Image): Bitmap {
        val yBuffer = image.planes[0].buffer // Y
        val vuBuffer = image.planes[2].buffer // VU

        val ySize = yBuffer.remaining()
        val vuSize = vuBuffer.remaining()

        val nv21 = ByteArray(ySize + vuSize)

        yBuffer.get(nv21, 0, ySize)
        vuBuffer.get(nv21, ySize, vuSize)

        val yuvImage = YuvImage(nv21, ImageFormat.NV21, image.width, image.height, null)

        val out = ByteArrayOutputStream()
        yuvImage.compressToJpeg(Rect(0, 0, yuvImage.width, yuvImage.height), 100, out)
        val imageBytes = out.toByteArray()
        return BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
    }

    fun getByteArrayFromImage1(image: Image): ByteArray {
        val yBuffer = image.planes[0].buffer // Y
        val vuBuffer = image.planes[2].buffer // VU

        val ySize = yBuffer.remaining()
        val vuSize = vuBuffer.remaining()

        val nv21 = ByteArray(ySize + vuSize)

        yBuffer.get(nv21, 0, ySize)
        vuBuffer.get(nv21, ySize, vuSize)

        val yuvImage = YuvImage(nv21, ImageFormat.NV21, image.width, image.height, null)

        val out = ByteArrayOutputStream()
        yuvImage.compressToJpeg(Rect(0, 0, yuvImage.width, yuvImage.height), 100, out)
        return out.toByteArray()

    }

    fun makeFileStorage(filePath: String): Boolean {
        val dir = File(filePath)
        if (!dir.exists() && !dir.mkdirs()) {
            showLog(TAG, "makeFileStorage folder_not_created")
            return false
            //            CommonMethods.showLog(TAG, "makeFileStorage folder_not_created");
        } else {
            return true
        }
    }

    fun getLocalStoragePath(context: Context): String {
        return context.filesDir.absolutePath + "/privid_local_storage/"
    }

    fun getImageStoragePath(context: Context): String {
        return context.filesDir.absolutePath + "/images/"
    }

    fun getDocumentStoragePath(context: Context): String {
        return context.filesDir.absolutePath + "/documents/"
    }

    fun isEmailValid(email: String): Boolean {
        return email.isNotEmpty() && Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }

    @SuppressLint("NewApi")
    fun saveImage(bitmap: Bitmap?, context: Context): String {
        try {
            val saved: Boolean
            val fos: OutputStream?
            val fileName =
                getDocumentStoragePath(context) + System.currentTimeMillis() + ".png"

            val image = File(fileName)
            fos = FileOutputStream(image)

            saved = bitmap?.compress(Bitmap.CompressFormat.PNG, 100, fos) == true
            fos.flush()
            fos.close()
            return if (saved) fileName else "0"
        } catch (e: java.lang.Exception) {
            showLog(TAG, "exception  saveImage " + e.message)
            return "0"
        }
    }

    fun saveImageTesting(bitmap: Bitmap, context: Context, nameWithoutExtension: String): String {
        try {
            val saved: Boolean
            val fos: OutputStream?
            val fileName = context.getExternalFilesDir(
                Environment.DIRECTORY_PICTURES
            )!!.absolutePath + "/" + nameWithoutExtension + ".png"

            val image = File(fileName)
            fos = FileOutputStream(image)

            saved = bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos) == true
            fos.flush()
            fos.close()
            return if (saved) fileName else "0"
        } catch (e: java.lang.Exception) {
            showLog(TAG, "exception  saveImage " + e.message)
            return "0"
        }
    }
}

fun getScreenWidth(): Int {
    return Resources.getSystem().displayMetrics.widthPixels
}

fun getScreenHeight(): Int {
    return Resources.getSystem().displayMetrics.heightPixels
}