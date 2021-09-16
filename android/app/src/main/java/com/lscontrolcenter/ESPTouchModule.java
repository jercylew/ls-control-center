package com.lscontrolcenter;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.Map;
import java.util.HashMap;

import android.content.Context;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.util.Log;
import com.facebook.react.bridge.Callback;


public class ESPTouchModule extends ReactContextBaseJavaModule {
    ESPTouchModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "ESPTouchModule";
    }

    @ReactMethod
    public void connectESPDevice(String strSSID, String strBSSID, String strPassword,
                                 int nNumOfDevices, String strTransmissionMethod, Callback callBack) {
        Log.d("ESPTouchModule", "Trying to connect ESP device to: " + strSSID
                + ", BSSID: " + strBSSID + ", NumOfDevice: " + + nNumOfDevices
                + ", Password: " + strPassword + ", Broadcast: " + strTransmissionMethod);

        Boolean bSucceed = true;
        if (strSSID.isEmpty() || strBSSID == null ||
        strBSSID.equals("02:00:00:00:00:00")) {
            bSucceed = false;
            String strMessage = "{\"is_succeed\": false, \"message\": \"Wifi not connected\"}";
            callBack.invoke(strMessage, bSucceed);

            return;
        }

        callBack.invoke(null, bSucceed);
    }

    @ReactMethod
    public  void getSSID(Callback callBack) {
        String strOutSsid = "";

        WifiManager wifiManager = (WifiManager) this.getCurrentActivity()
                .getApplicationContext().getSystemService(Context.WIFI_SERVICE);
//        wifiManager.setWifiEnabled(true);
        WifiInfo wifiInfo = wifiManager.getConnectionInfo();
        strOutSsid = wifiInfo.getSSID();
        Log.d("ESPTouchModule", "Got SSID: " + strOutSsid);
        callBack.invoke(null, strOutSsid);
    }

    @ReactMethod
    public void getBSSID(Callback callBack) {
        String strOutBssid = "";
        WifiManager wifiManager = (WifiManager) this.getCurrentActivity()
                .getApplicationContext().getSystemService(Context.WIFI_SERVICE);
//        wifiManager.setWifiEnabled(true);
        WifiInfo wifiInfo = wifiManager.getConnectionInfo();
        strOutBssid = wifiInfo.getBSSID();
        Log.d("ESPTouchModule", "Got BSSID: " + strOutBssid);
        callBack.invoke(null, strOutBssid);
    }
}
