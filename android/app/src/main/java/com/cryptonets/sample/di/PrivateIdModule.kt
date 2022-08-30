package com.cryptonets.sample.di

import android.content.Context
import com.cryptonets.sample.utils.Constants
import com.cryptonets.sample.utils.Utils
import com.privateidentity.prividlib.PrividFheFace
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import timber.log.Timber
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
class PrivateIdModule {

    @Singleton
    @Provides
    fun providePrivateFheFace(@ApplicationContext context: Context): PrividFheFace {
        Timber.e("providePrivateFheFace")
        val fileStoragePath: String = Utils.getLocalStoragePath(context)
        Utils.makeFileStorage(fileStoragePath)
        Utils.makeFileStorage(Utils.getImageStoragePath(context))
        Utils.makeFileStorage(Utils.getDocumentStoragePath(context))
        val prividFheFace = PrividFheFace(fileStoragePath, context)
        prividFheFace.FHEConfigureUrl(Constants.BASE_URL_SO_CALLS, Constants.BASE_URL_PARAM_ID)
        prividFheFace.FHEConfigureUrl(Constants.HEADER, Constants.HEADER_KEY_PARAM_ID)
        return prividFheFace
    }
}