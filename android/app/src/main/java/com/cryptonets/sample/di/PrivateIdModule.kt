package com.cryptonets.sample.di

import android.content.Context
import com.cryptonets.sample.utils.Constants
import com.privateidentity.prividlib.PrivateIdentity
import com.privateidentity.prividlib.config.*
import com.privateidentity.prividlib.config.ConfigObject.ConfigObjectBuilder
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
            .Builder(context, Constants.API_KEY, Constants.DEFAULT_SERVER_URL)
            .logEnabled(true)
            .build()

        val privateIdentity = PrivateIdentity(config)
        return privateIdentity
    }
}