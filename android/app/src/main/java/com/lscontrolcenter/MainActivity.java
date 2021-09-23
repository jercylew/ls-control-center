package com.lscontrolcenter;

import com.espressif.iot.esptouch2.provision.TouchNetUtil;
import com.facebook.react.ReactActivity;

import android.Manifest;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Bundle;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.SpannableStringBuilder;
import android.text.style.ForegroundColorSpan;
import android.util.Log;

import androidx.core.location.LocationManagerCompat;

import java.net.InetAddress;

public class MainActivity extends ReactActivity {
  private static final int REQUEST_PERMISSION = 0x01;
  private static final String TAG = MainActivity.class.getSimpleName();

  private String mSsid;
  private byte[] mSsidBytes;
  private String mBssid;
  private WifiManager mWifiManager;

  protected static class StateResult {
    public CharSequence message = null;

    public boolean permissionGranted = false;

    public boolean locationRequirement = false;

    public boolean wifiConnected = false;
    public boolean is5G = false;
    public InetAddress address = null;
    public String ssid = null;
    public byte[] ssidBytes = null;
    public String bssid = null;
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "LSControlCenter";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      String[] permissions = {Manifest.permission.ACCESS_FINE_LOCATION};
      requestPermissions(permissions, REQUEST_PERMISSION);
    }

    MainApplication.getInstance().observeBroadcast(this, broadcast -> {
      Log.d(TAG, "onCreate: Broadcast=" + broadcast);
      onWifiChanged();
    });

    mWifiManager = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
  }

  private StateResult check() {
    StateResult result = checkPermission();
    if (!result.permissionGranted) {
      return result;
    }
    result = checkLocation();
    result.permissionGranted = true;
    if (result.locationRequirement) {
      return result;
    }
    result = checkWifi();
    result.permissionGranted = true;
    result.locationRequirement = false;
    return result;
  }

  protected StateResult checkPermission() {
    StateResult result = new StateResult();
    result.permissionGranted = false;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      boolean locationGranted = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
              == PackageManager.PERMISSION_GRANTED;
      if (!locationGranted) {
        String[] splits = getString(R.string.esptouch_message_permission).split("\n");
        if (splits.length != 2) {
          throw new IllegalArgumentException("Invalid String @RES esptouch_message_permission");
        }
        SpannableStringBuilder ssb = new SpannableStringBuilder(splits[0]);
        ssb.append('\n');
        SpannableString clickMsg = new SpannableString(splits[1]);
        ForegroundColorSpan clickSpan = new ForegroundColorSpan(0xFF0022FF);
        clickMsg.setSpan(clickSpan, 0, clickMsg.length(), Spannable.SPAN_INCLUSIVE_INCLUSIVE);
        ssb.append(clickMsg);
        result.message = ssb;
        return result;
      }
    }

    result.permissionGranted = true;
    return result;
  }

  protected StateResult checkLocation() {
    StateResult result = new StateResult();
    result.locationRequirement = true;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      LocationManager manager = getSystemService(LocationManager.class);
      boolean enable = manager != null && LocationManagerCompat.isLocationEnabled(manager);
      if (!enable) {
        result.message = getString(R.string.esptouch_message_location);
        return result;
      }
    }

    result.locationRequirement = false;
    return result;
  }

  protected StateResult checkWifi() {
    StateResult result = new StateResult();
    result.wifiConnected = false;
    WifiInfo wifiInfo = mWifiManager.getConnectionInfo();
    boolean connected = TouchNetUtil.isWifiConnected(mWifiManager);
    if (!connected) {
      result.message = getString(R.string.esptouch_message_wifi_connection);
      return result;
    }

    String ssid = TouchNetUtil.getSsidString(wifiInfo);
    int ipValue = wifiInfo.getIpAddress();
    if (ipValue != 0) {
      result.address = TouchNetUtil.getAddress(wifiInfo.getIpAddress());
    } else {
      result.address = TouchNetUtil.getIPv4Address();
      if (result.address == null) {
        result.address = TouchNetUtil.getIPv6Address();
      }
    }

    result.wifiConnected = true;
    result.message = "";
    result.is5G = TouchNetUtil.is5G(wifiInfo.getFrequency());
    if (result.is5G) {
      result.message = getString(R.string.esptouch_message_wifi_frequency);
    }
    result.ssid = ssid;
    result.ssidBytes = TouchNetUtil.getRawSsidBytesOrElse(wifiInfo, ssid.getBytes());
    result.bssid = wifiInfo.getBSSID();

    return result;
  }

  private void onWifiChanged() {
    StateResult stateResult = check();
    mSsid = stateResult.ssid;
    mSsidBytes = stateResult.ssidBytes;
    mBssid = stateResult.bssid;
    CharSequence message = stateResult.message;
    boolean confirmEnable = false;
    if (stateResult.wifiConnected) {
      confirmEnable = true;
      if (stateResult.is5G) {
        message = getString(R.string.esptouch1_wifi_5g_message);
      }
    } else {
//      if (mTask != null) {
//        mTask.cancelEsptouch();
//        mTask = null;
//        new AlertDialog.Builder(EspTouchActivity.this)
//                .setMessage(R.string.esptouch1_configure_wifi_change_message)
//                .setNegativeButton(android.R.string.cancel, null)
//                .show();
//      }
    }

//    mBinding.apSsidText.setText(mSsid);
//    mBinding.apBssidText.setText(mBssid);
//    mBinding.messageView.setText(message);
//    mBinding.confirmBtn.setEnabled(confirmEnable);
  }
}
