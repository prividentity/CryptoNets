package com.cryptonets.sample.utils

import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.LifecycleOwner
import dagger.hilt.android.qualifiers.ApplicationContext
import timber.log.Timber
import javax.inject.Inject

class PermissionObserver @Inject constructor(@ApplicationContext private val context: Context) {

    companion object {
        fun isPermissionGranted(context: Context, permission: String): Boolean {
            return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
        }
    }

    private var requestPermissionLauncher: ActivityResultLauncher<Array<String>>? = null
    private var onPermissionResult: ((Boolean, Map<String, Boolean>) -> Unit)? = null

    private fun initIfNeeded(owner: LifecycleOwner) {
        if (requestPermissionLauncher != null) return

        val permissionCallback: ((Map<String, Boolean>) -> Unit) = {
            val isAllPermissionGranted = it.values.reduce { v1, v2 -> v1 && v2 }
            onPermissionResult?.invoke(isAllPermissionGranted, it)
        }
        if (owner is Fragment) {
            requestPermissionLauncher = owner.requireActivity().activityResultRegistry.register(
                "requestPermissionLauncher", owner,
                ActivityResultContracts.RequestMultiplePermissions()
            ) {
                permissionCallback.invoke(it)
            }
        } else if (owner is ComponentActivity) {
            requestPermissionLauncher = owner.registerForActivityResult(
                ActivityResultContracts.RequestMultiplePermissions()
            ) {
                permissionCallback.invoke(it)
            }
        }
    }

    fun init(lifecycleOwner: LifecycleOwner) {
        initIfNeeded(lifecycleOwner)
    }

    fun requestPermissionIfNeeded(
            permissions: Array<String>,
            onPermissionResult: ((Boolean, Map<String, Boolean>) -> Unit)? = null) {
        val isAllPermissionsAccepted = permissions.map {
            isPermissionGranted(context, it)
        }.reduce { value1, value2 ->
            value1 && value2
        }

        if (isAllPermissionsAccepted) {
            val map = HashMap<String, Boolean>()
            permissions.forEach {
                map[it] = true
            }
            onPermissionResult?.invoke(true, map)
            return
        }
        Timber.i("request permission: $permissions")
        this.onPermissionResult = onPermissionResult
        requestPermissionLauncher?.launch(permissions)
    }
}