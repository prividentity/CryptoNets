package com.cryptonets.sample.ui.base

import android.os.Bundle
import android.view.LayoutInflater
import androidx.appcompat.app.AppCompatActivity
import androidx.viewbinding.ViewBinding

abstract class ViewBindingActivity<VB : ViewBinding> : AppCompatActivity() {
    private var _binding: ViewBinding? = null
    protected abstract val getBindingInflater: (LayoutInflater) -> VB
    protected abstract fun onViewCreated(savedInstanceState: Bundle?)

    protected val binding: VB
        get() = _binding as VB

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        _binding = getBindingInflater.invoke(LayoutInflater.from(this))
        setContentView(_binding!!.root)
        onViewCreated(savedInstanceState)
    }

    override fun onDestroy() {
        super.onDestroy()
        _binding = null
    }
}