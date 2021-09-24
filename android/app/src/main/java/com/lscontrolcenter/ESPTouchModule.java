package com.lscontrolcenter;


import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.HashMap;

import com.espressif.iot.esptouch.EsptouchTask;
import com.espressif.iot.esptouch.IEsptouchResult;
import com.espressif.iot.esptouch.IEsptouchTask;
import com.espressif.iot.esptouch.util.ByteUtil;
import com.espressif.iot.esptouch.util.TouchNetUtil;

import android.content.Context;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.AsyncTask;
import android.util.Log;
import com.facebook.react.bridge.Callback;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;


public class ESPTouchModule extends ReactContextBaseJavaModule {
    private static final String TAG = ESPTouchModule.class.getSimpleName();
    public static final String TRANSMISSION_BROADCAST = "broadcast";
    public static final String TRANSMISSION_MULTICAST = "multicast";
    private EsptouchAsyncTask4 mTask;

    ESPTouchModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "ESPTouchModule";
    }

    /**
     *
     * @param strSSID
     * @param strBSSID
     * @param strPassword
     * @param nNumOfDevices
     * @param strTransmissionMethod
     * @param callBack
     * @apiNote exec_status: 0 => Connecting, 1 => Connected, -1 => Failed
     */
    @ReactMethod
    public void connectESPDevice(String strSSID, String strBSSID, String strPassword,
                                 int nNumOfDevices, String strTransmissionMethod, Callback callBack) {
        Log.d("ESPTouchModule", "Trying to connect ESP device to: " + strSSID
                + ", BSSID: " + strBSSID + ", NumOfDevice: " + + nNumOfDevices
                + ", Password: " + strPassword + ", Broadcast: " + strTransmissionMethod);

        if (strSSID.isEmpty() || strBSSID == null ||
                strBSSID.equals("02:00:00:00:00:00")) {
            JSONObject jsonMsg = new JSONObject();
            try {
                jsonMsg.accumulate("is_succeed", false);
                jsonMsg.accumulate("message", "App not connected to Wifi");
            } catch (JSONException e) {
                e.printStackTrace();
            }

            String strErrJson = jsonMsg.toString();
            callBack.invoke(strErrJson, null);

            return;
        }

        byte[] ssid = ByteUtil.getBytesByString(strSSID);
        byte[] password = ByteUtil.getBytesByString(strPassword);
        byte[] bssid = TouchNetUtil.parseBssid2bytes(strBSSID);
        byte[] deviceCount = Integer.toString(nNumOfDevices).getBytes();
        byte[] broadcast = {(byte) (strTransmissionMethod == TRANSMISSION_BROADCAST
                ? 1 : 0)};

        if (mTask != null) {
            mTask.cancelEsptouch();
        }
        mTask = new EsptouchAsyncTask4(this.getCurrentActivity().getApplicationContext(),
                this.getReactApplicationContext());
        mTask.execute(ssid, bssid, password, deviceCount, broadcast);

        JSONObject jsonMsg = new JSONObject();
        try {
            jsonMsg.accumulate("is_succeed", true);
            jsonMsg.accumulate("message", "Connecting...");
            jsonMsg.accumulate("exec_status", 0);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        String strMsgJson = jsonMsg.toString();
        callBack.invoke(null, strMsgJson);
    }

    @ReactMethod
    public  void getSSID(Callback callBack) {
        String strOutSsid = "";

        WifiManager wifiManager = (WifiManager) this.getCurrentActivity()
                .getApplicationContext().getSystemService(Context.WIFI_SERVICE);
//        wifiManager.setWifiEnabled(true);
        WifiInfo wifiInfo = wifiManager.getConnectionInfo();
        strOutSsid = com.espressif.iot.esptouch2.provision.TouchNetUtil.getSsidString(wifiInfo);
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

    private static class EsptouchAsyncTask4 extends AsyncTask<byte[], IEsptouchResult,
                List<IEsptouchResult>> {
        private Context mContext;
        private ReactApplicationContext mReactAppContext;

        private final Object mLock = new Object();
        private IEsptouchTask mEsptouchTask;

        EsptouchAsyncTask4(Context context, ReactApplicationContext reactAppContext) {
            mContext = context;
            mReactAppContext = reactAppContext;
        }

        void cancelEsptouch() {
            cancel(true);
            if (mEsptouchTask != null) {
                mEsptouchTask.interrupt();
            }

            JSONObject jsonMsg = new JSONObject();
            try {
                jsonMsg.accumulate("is_succeed", false);
                jsonMsg.accumulate("message", "Cancelled");
                jsonMsg.accumulate("exec_status", -1);
            } catch (JSONException e) {
                e.printStackTrace();
            }

            String strMsgJson = jsonMsg.toString();
            sendEventToJs("esp_conn_update", strMsgJson);
        }

        @Override
        protected void onPreExecute() {
            JSONObject jsonMsg = new JSONObject();
            try {
                jsonMsg.accumulate("is_succeed", true);
                jsonMsg.accumulate("message", "Started");
                jsonMsg.accumulate("exec_status", 0);
            } catch (JSONException e) {
                e.printStackTrace();
            }

            String strMsgJson = jsonMsg.toString();
            sendEventToJs("esp_conn_update", strMsgJson);
        }

        @Override
        protected void onProgressUpdate(IEsptouchResult... values) {
            IEsptouchResult result = values[0];
            Log.i(TAG, "EspTouchResult: " + result);

            JSONObject jsonMsg = new JSONObject();
            JSONObject jsonDevDetails = new JSONObject();
            try {
                jsonMsg.accumulate("is_succeed", true);
                jsonMsg.accumulate("message", "Current device connected");
                jsonMsg.accumulate("exec_status", 0);

                jsonDevDetails.accumulate("bssid", result.getBssid());
                jsonDevDetails.accumulate("ip", result.getInetAddress().getHostAddress());
                jsonMsg.accumulate("dev_details", jsonDevDetails);
            } catch (JSONException e) {
                e.printStackTrace();
            }

            String strMsgJson = jsonMsg.toString();
            sendEventToJs("esp_conn_update", strMsgJson);
        }

        @Override
        protected List<IEsptouchResult> doInBackground(byte[]... params) {
            int taskResultCount;
            synchronized (mLock) {
                byte[] apSsid = params[0];
                byte[] apBssid = params[1];
                byte[] apPassword = params[2];
                byte[] deviceCountData = params[3];
                byte[] broadcastData = params[4];
                taskResultCount = deviceCountData.length == 0 ? -1 : Integer.parseInt(new String(deviceCountData));
                mEsptouchTask = new EsptouchTask(apSsid, apBssid, apPassword, mContext);
                mEsptouchTask.setPackageBroadcast(broadcastData[0] == 1);
                mEsptouchTask.setEsptouchListener(this::publishProgress);

                Log.d(TAG, "apSsid: " + apSsid + ", apBssid: " + apBssid + ", apPassword: " +
                        apPassword + ", deviceCountData: " + deviceCountData +
                        ", broadcastData: " + broadcastData);
            }
            return mEsptouchTask.executeForResults(taskResultCount);
        }

        @Override
        protected void onPostExecute(List<IEsptouchResult> result) {
            if (result == null) {
                JSONObject jsonMsg = new JSONObject();
                try {
                    jsonMsg.accumulate("is_succeed", false);
                    jsonMsg.accumulate("message", "Failed to connect ESP device");
                    jsonMsg.accumulate("exec_status", -1);
                } catch (JSONException e) {
                    e.printStackTrace();
                }

                String strErrJson = jsonMsg.toString();
                sendEventToJs("esp_conn_update", strErrJson);
                return;
            }

            IEsptouchResult firstResult = result.get(0);
            if (firstResult.isCancelled()) {
                return;
            }

            if (!firstResult.isSuc()) {
                JSONObject jsonMsg = new JSONObject();
                try {
                    jsonMsg.accumulate("is_succeed", false);
                    jsonMsg.accumulate("message", "Failed to connect ESP device");
                    jsonMsg.accumulate("exec_status", -1);
                } catch (JSONException e) {
                    e.printStackTrace();
                }

                String strErrJson = jsonMsg.toString();
                sendEventToJs("esp_conn_update", strErrJson);
                return;
            }


            JSONObject jsonMsg = new JSONObject();
            try {
                jsonMsg.accumulate("is_succeed", true);
                jsonMsg.accumulate("message", "All device connected");
                jsonMsg.accumulate("exec_status", 1);

                JSONArray jaDevDetails = new JSONArray();
                for (IEsptouchResult touchResult : result) {
                    JSONObject jsonDev = new JSONObject();
                    jsonDev.accumulate("bssid", touchResult.getBssid());
                    jsonDev.accumulate("ip", touchResult.getInetAddress().getHostAddress());
                    jaDevDetails.put(jsonDev);
                }

                jsonMsg.accumulate("dev_details", jaDevDetails);
            } catch (JSONException e) {
                e.printStackTrace();
            }

            String strMsgJson = jsonMsg.toString();
            sendEventToJs("esp_conn_update", strMsgJson);
        }

        public void sendEventToJs(String eventName,Object obj){
            mReactAppContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName,obj);
        }
    }
}
