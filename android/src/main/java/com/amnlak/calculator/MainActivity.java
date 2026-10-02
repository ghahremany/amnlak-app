package com.amnlak.calculator;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {

    private WebView web;
    private ValueCallback<Uri[]> filePathCallback;
    private LocationManager locationManager;
    private LocationListener locationListener;
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int LOCATION_PERMISSION_REQUEST = 1002;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setTheme(R.style.AppTheme);          // پایان اسپلش‌اسکرین

        web = new WebView(this);
        web.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        web.setBackgroundColor(0xFFF2F6FB);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setLoadWithOverviewMode(false);
        s.setUseWideViewPort(false);
        s.setBuiltInZoomControls(false);
        s.setSupportZoom(false);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(url);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(request.getUrl().toString());
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST);
                    return true;
                } catch (ActivityNotFoundException e) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, "فایل‌خوان روی گوشی در دسترس نیست", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });

        web.addJavascriptInterface(new Bridge(), "Android");
        web.loadUrl("file:///android_asset/www/index.html");
        setContentView(web);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            View d = getWindow().getDecorView();
            d.setSystemUiVisibility(d.getSystemUiVisibility());
        }
    }

    private void requestUserLocation() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] {
                    android.Manifest.permission.ACCESS_FINE_LOCATION,
                    android.Manifest.permission.ACCESS_COARSE_LOCATION
            }, LOCATION_PERMISSION_REQUEST);
            return;
        }
        findAndSendLocation();
    }

    private void findAndSendLocation() {
        try {
            locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            if (locationManager == null) { sendLocationErrorToWeb(); return; }
            if (locationListener != null) {
                try { locationManager.removeUpdates(locationListener); }
                catch (SecurityException ignored) {}
            }

            Location best = null;
            String[] providers = new String[] {
                    LocationManager.NETWORK_PROVIDER,
                    LocationManager.GPS_PROVIDER
            };
            for (String provider : providers) {
                try {
                    Location candidate = locationManager.getLastKnownLocation(provider);
                    if (candidate != null && (best == null
                            || candidate.getTime() > best.getTime()
                            || (candidate.hasAccuracy() && best.hasAccuracy()
                                && candidate.getAccuracy() < best.getAccuracy()))) {
                        best = candidate;
                    }
                } catch (SecurityException ignored) {}
            }
            if (best != null) sendLocationToWeb(best);

            locationListener = new LocationListener() {
                @Override
                public void onLocationChanged(Location location) {
                    sendLocationToWeb(location);
                }
                @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
                @Override public void onProviderEnabled(String provider) {}
                @Override public void onProviderDisabled(String provider) {}
            };

            boolean providerRequested = false;
            for (String provider : providers) {
                try {
                    if (locationManager.isProviderEnabled(provider)) {
                        locationManager.requestSingleUpdate(provider, locationListener, Looper.getMainLooper());
                        providerRequested = true;
                    }
                } catch (SecurityException ignored) {}
            }
            if (!providerRequested && best == null) sendLocationErrorToWeb();
        } catch (Exception ignored) {
            sendLocationErrorToWeb();
        }
    }

    private void sendLocationToWeb(final Location location) {
        if (location == null || web == null) return;
        final String js = "window.onNativeLocation && window.onNativeLocation("
                + Double.toString(location.getLatitude()) + ","
                + Double.toString(location.getLongitude()) + ","
                + Float.toString(location.hasAccuracy() ? location.getAccuracy() : 0f) + ")";
        runOnUiThread(new Runnable() {
            @Override public void run() { web.evaluateJavascript(js, null); }
        });
    }

    private void sendLocationErrorToWeb() {
        if (web == null) return;
        runOnUiThread(new Runnable() {
            @Override public void run() {
                web.evaluateJavascript("window.onNativeLocationError && window.onNativeLocationError()", null);
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != LOCATION_PERMISSION_REQUEST) return;
        boolean granted = false;
        for (int result : grantResults) {
            if (result == PackageManager.PERMISSION_GRANTED) { granted = true; break; }
        }
        if (granted) findAndSendLocation();
        else sendLocationErrorToWeb();
    }

    private boolean handleUrl(String url) {
        if (url.startsWith("file://")) return false;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "برنامه‌ای برای باز کردن این لینک روی گوشی نصب نیست", Toast.LENGTH_SHORT).show();
        }
        return true;
    }

    public class Bridge {
        @JavascriptInterface
        public void requestLocation() {
            runOnUiThread(new Runnable() {
                @Override public void run() { requestUserLocation(); }
            });
        }

        @JavascriptInterface
        public void share(final String text) {
            runOnUiThread(new Runnable() {
                public void run() {
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType("text/plain");
                    i.putExtra(Intent.EXTRA_TEXT, text);
                    startActivity(Intent.createChooser(i, "اشتراک‌گذاری"));
                }
            });
        }

        @JavascriptInterface
        public void call(final String number) {
            runOnUiThread(new Runnable() {
                public void run() {
                    try {
                        startActivity(new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + number)));
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, number, Toast.LENGTH_LONG).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void sms(final String number, final String body) {
            runOnUiThread(new Runnable() {
                public void run() {
                    try {
                        Intent i = new Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:" + number));
                        if (body != null && body.length() > 0) i.putExtra("sms_body", body);
                        startActivity(i);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "ارسال پیامک ممکن نشد", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void copy(final String text) {
            runOnUiThread(new Runnable() {
                public void run() {
                    ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    cm.setPrimaryClip(ClipData.newPlainText("amnlak", text));
                    Toast.makeText(MainActivity.this, "متن در کلیپ‌بورد کپی شد", Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void open(final String url) {
            runOnUiThread(new Runnable() {
                public void run() { handleUrl(url); }
            });
        }

        @JavascriptInterface
        public void toast(final String msg) {
            runOnUiThread(new Runnable() {
                public void run() { Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show(); }
            });
        }

        @JavascriptInterface
        public void theme(final boolean dark) {
            runOnUiThread(new Runnable() {
                public void run() {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        int c = dark ? 0xFF052D5C : 0xFF075FB5;
                        getWindow().setStatusBarColor(c);
                        getWindow().setNavigationBarColor(dark ? 0xFF0D1420 : 0xFFFFFFFF);
                        View dv = getWindow().getDecorView();
                        int f = dv.getSystemUiVisibility();
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            f = dark ? (f & ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR)
                                     : (f | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
                            dv.setSystemUiVisibility(f);
                        }
                    }
                    web.setBackgroundColor(dark ? 0xFF0D1420 : 0xFFF2F6FB);
                }
            });
        }

        @JavascriptInterface
        public void exit() {
            runOnUiThread(new Runnable() {
                public void run() { finish(); }
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST && filePathCallback != null) {
            Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            filePathCallback.onReceiveValue(result);
            filePathCallback = null;
        }
    }

    @Override
    protected void onDestroy() {
        if (locationManager != null && locationListener != null) {
            try { locationManager.removeUpdates(locationListener); }
            catch (SecurityException ignored) {}
        }
        if (web != null) {
            web.removeJavascriptInterface("Android");
            web.destroy();
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (web == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("window.appBack && window.appBack()", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String value) {
                if (!"true".equals(value)) finish();
            }
        });
    }
}
