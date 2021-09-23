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
            String strErrJson = "{\"is_succeed\": false, \"message\": " +
                    "\"App not connected to Wifi\"}";
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

        String strMsgJson = "{\"is_succeed\": true, \"message\": \"Connecting...\"," +
                " \"exec_status\": 0}";
        callBack.invoke(null, strMsgJson);
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

            String strMsgJson = "{\"is_succeed\": false, \"message\": \"Cancelled\"," +
                        " \"exec_status\": -1}";
            sendEventToJs("esp_conn_update", strMsgJson);
        }

        @Override
        protected void onPreExecute() {
            String strMsgJson = "{\"is_succeed\": true, \"message\": \"Started\"," +
                    " \"exec_status\": 0}";
            sendEventToJs("esp_conn_update", strMsgJson);
        }

        @Override
        protected void onProgressUpdate(IEsptouchResult... values) {
            IEsptouchResult result = values[0];
            Log.i(TAG, "EspTouchResult: " + result);

            String strDevDetails = String.format(Locale.ENGLISH,
                    "{\"bssid\": \"%s\", \"ip\": \"%s\"}",
                    result.getBssid(), result.getInetAddress().getHostAddress());
            String strMsgJson = String.format(Locale.ENGLISH,
                    "{\"is_succeed\": true, \"message\": \"Current device connected\"," +
                            " \"exec_status\": 0, \"dev_details\": \"%s\"}", strDevDetails);
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
            }
            return mEsptouchTask.executeForResults(taskResultCount);
        }

        @Override
        protected void onPostExecute(List<IEsptouchResult> result) {
            if (result == null) {
                String strErrJson = "{\"is_succeed\": false, \"message\": " +
                        "\"Failed to connect ESP device\", \"exec_status\": -1}";
                sendEventToJs("esp_conn_update", strErrJson);
                return;
            }

            // check whether the task is cancelled and no results received
            IEsptouchResult firstResult = result.get(0);
            if (firstResult.isCancelled()) {
                return;
            }
            // the task received some results including cancelled while
            // executing before receiving enough results

            if (!firstResult.isSuc()) {
                String strMsgJson =
                        "{\"is_succeed\": false, \"message\": \"Failed to connect ESP device\"," +
                                " \"exec_status\": -1}";
                sendEventToJs("esp_conn_update", strMsgJson);
                return;
            }

            String strListDevDetails = "[";
            boolean bFirstItem = true;
            for (IEsptouchResult touchResult : result) {
                String strDevDetails = String.format(Locale.ENGLISH,
                        "{\"bssid\": \"%s\", \"ip\": \"%s\"}",
                        touchResult.getBssid(), touchResult.getInetAddress().getHostAddress());

                if (bFirstItem) {
                    bFirstItem = false;
                }
                else {
                    strDevDetails = "," + strDevDetails;
                }

                strListDevDetails += strDevDetails;
            }
            strListDevDetails += "]";

            String strMsgJson = String.format(Locale.ENGLISH,
                    "{\"is_succeed\": true, \"message\": \"All device connected\"," +
                            " \"exec_status\": 1, \"dev_details\": \"%s\"}", strListDevDetails);
            sendEventToJs("esp_conn_update", strMsgJson);
        }

        public void sendEventToJs(String eventName,Object obj){
            mReactAppContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName,obj);
        }
    }
}
