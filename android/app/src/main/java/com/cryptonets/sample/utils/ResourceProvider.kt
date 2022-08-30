package com.cryptonets.sample.utils

import android.content.Context
import androidx.annotation.StringRes
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ResourceProvider @Inject constructor(@ApplicationContext context: Context) {
    private val resource = context.resources

    fun getString(@StringRes id: Int, vararg objects: Any?): String {
        return resource.getString(id, *objects)
    }
}