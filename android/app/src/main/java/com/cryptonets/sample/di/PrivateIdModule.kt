package com.cryptonets.sample.di

import android.content.Context
import com.cryptonets.sample.utils.Constants
import com.cryptonets.sample.utils.Utils
import com.privateidentity.prividlib.PrivateIdentity
import com.privateidentity.prividlib.config.PrivateIdentityConfig
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
    fun providePrivateIdentity(@ApplicationContext context: Context): PrivateIdentity {
        Timber.e("providePrivateIdentity")
        val config = PrivateIdentityConfig
            .Builder(context, Constants.API_KEY)
            .logEnabled(true)
            .build()
        return PrivateIdentity(config)
    }
}