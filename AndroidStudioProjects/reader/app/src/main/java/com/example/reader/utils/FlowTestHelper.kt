package com.example.reader.utils

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object FlowTestHelper {
    fun getTeamStatus(): String {
        return "Agent Team flow is working!"
    }

    fun getTimestamp(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        return sdf.format(Date())
    }
}
