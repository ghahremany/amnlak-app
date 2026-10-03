package com.amnlak.calculator;

import android.app.Activity;
import android.app.AlertDialog;
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
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.Settings;
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
    private WebView printWeb;
    private ValueCallback<Uri[]> filePathCallback;
    private LocationManager locationManager;
    private LocationListener locationListener;
    private boolean permissionDialogVisible;
    private boolean locationDialogVisible;
    private boolean waitingForAppSettings;
    private boolean waitingForLocationSettings;
    private boolean freshLocationRequested;
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int LOCATION_PERMISSION_REQUEST = 1002;
    private static final String LOCATION_PREFS = "amnlak_location_preferences";
    private static final String LOCATION_PERMISSION_ASKED = "location_permission_asked";

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

    private boolean hasLocationPermission() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M
                || checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean isLocationServiceEnabled() {
        try {
            locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            if (locationManager == null) return false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return locationManager.isLocationEnabled();
            }
            return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
                    || locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
        } catch (Exception ignored) {
            return false;
        }
    }

    private void requestUserLocation() {
        if (!hasLocationPermission()) {
            requestOrExplainLocationPermission();
            return;
        }
        if (!isLocationServiceEnabled()) {
            showLocationDisabledDialog();
            return;
        }
        findAndSendLocation();
    }

    private void requestOrExplainLocationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            requestUserLocation();
            return;
        }
        boolean askedBefore = getSharedPreferences(LOCATION_PREFS, MODE_PRIVATE)
                .getBoolean(LOCATION_PERMISSION_ASKED, false);
        boolean canExplain = shouldShowRequestPermissionRationale(android.Manifest.permission.ACCESS_FINE_LOCATION)
                || shouldShowRequestPermissionRationale(android.Manifest.permission.ACCESS_COARSE_LOCATION);
        if (!askedBefore) {
            requestLocationPermissionFromSystem();
        } else if (canExplain) {
            showPermissionExplanationDialog();
        } else {
            showPermissionSettingsDialog();
        }
    }

    private void requestLocationPermissionFromSystem() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            requestUserLocation();
            return;
        }
        getSharedPreferences(LOCATION_PREFS, MODE_PRIVATE).edit()
                .putBoolean(LOCATION_PERMISSION_ASKED, true).apply();
        requestPermissions(new String[] {
                android.Manifest.permission.ACCESS_FINE_LOCATION,
                android.Manifest.permission.ACCESS_COARSE_LOCATION
        }, LOCATION_PERMISSION_REQUEST);
    }

    private void showPermissionExplanationDialog() {
        if (permissionDialogVisible || isFinishing()) return;
        permissionDialogVisible = true;
        new AlertDialog.Builder(this)
                .setTitle("اجازه دسترسی به موقعیت")
                .setMessage("برای نمایش محل شما روی نقشه، امنلاک به مجوز موقعیت مکانی نیاز دارد.")
                .setPositiveButton("دادن مجوز", (dialog, which) -> requestLocationPermissionFromSystem())
                .setNegativeButton("فعلاً نه", (dialog, which) -> sendLocationErrorToWeb())
                .setOnDismissListener(dialog -> permissionDialogVisible = false)
                .show();
    }

    private void showPermissionSettingsDialog() {
        if (permissionDialogVisible || isFinishing()) return;
        permissionDialogVisible = true;
        new AlertDialog.Builder(this)
                .setTitle("مجوز موقعیت غیرفعال است")
                .setMessage("مجوز موقعیت امنلاک داده نشده یا قبلاً رد شده است. وارد تنظیمات برنامه شوید و Location یا موقعیت مکانی را فعال کنید.")
                .setPositiveButton("تنظیمات برنامه", (dialog, which) -> openAppLocationSettings())
                .setNegativeButton("انصراف", (dialog, which) -> sendLocationErrorToWeb())
                .setOnDismissListener(dialog -> permissionDialogVisible = false)
                .show();
    }

    private void showLocationDisabledDialog() {
        if (locationDialogVisible || isFinishing()) return;
        locationDialogVisible = true;
        new AlertDialog.Builder(this)
                .setTitle("موقعیت مکانی خاموش است")
                .setMessage("برای نمایش موقعیت شما روی نقشه، GPS یا سرویس موقعیت مکانی گوشی را روشن کنید.")
                .setPositiveButton("رفتن به تنظیمات GPS", (dialog, which) -> openLocationSettings())
                .setNegativeButton("انصراف", (dialog, which) -> sendLocationErrorToWeb())
                .setOnDismissListener(dialog -> locationDialogVisible = false)
                .show();
    }

    private void openLocationSettings() {
        try {
            waitingForLocationSettings = true;
            startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS));
        } catch (Exception first) {
            try {
                startActivity(new Intent(Settings.ACTION_SETTINGS));
            } catch (Exception ignored) {
                waitingForLocationSettings = false;
                Toast.makeText(this, "بازکردن تنظیمات GPS ممکن نشد", Toast.LENGTH_SHORT).show();
                sendLocationErrorToWeb();
            }
        }
    }

    private void openAppLocationSettings() {
        try {
            waitingForAppSettings = true;
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + getPackageName()));
            startActivity(intent);
        } catch (Exception ignored) {
            waitingForAppSettings = false;
            Toast.makeText(this, "بازکردن تنظیمات برنامه ممکن نشد", Toast.LENGTH_SHORT).show();
            sendLocationErrorToWeb();
        }
    }

    private void findAndSendLocation() {
        try {
            locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            if (locationManager == null) { sendLocationErrorToWeb(); return; }
            if (!isLocationServiceEnabled()) { showLocationDisabledDialog(); return; }
            if (locationListener != null) {
                try { locationManager.removeUpdates(locationListener); }
                catch (SecurityException ignored) {}
            }

            boolean requireFresh = freshLocationRequested;
            freshLocationRequested = false;
            Location best = null;
            String[] providers;
            if (requireFresh && locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                providers = new String[] { LocationManager.GPS_PROVIDER };
            } else if (requireFresh) {
                providers = new String[] { LocationManager.NETWORK_PROVIDER };
            } else {
                providers = new String[] {
                        LocationManager.NETWORK_PROVIDER,
                        LocationManager.GPS_PROVIDER
                };
            }
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
            if (best != null && !requireFresh) sendLocationToWeb(best);

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
        freshLocationRequested = false;
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
        if (hasLocationPermission()) {
            if (isLocationServiceEnabled()) findAndSendLocation();
            else showLocationDisabledDialog();
            return;
        }
        boolean canExplain = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && (shouldShowRequestPermissionRationale(android.Manifest.permission.ACCESS_FINE_LOCATION)
                || shouldShowRequestPermissionRationale(android.Manifest.permission.ACCESS_COARSE_LOCATION));
        if (canExplain) showPermissionExplanationDialog();
        else showPermissionSettingsDialog();
    }

    private void printHtmlDocument(final String requestedTitle, final String html) {
        if (html == null || html.trim().length() == 0) {
            Toast.makeText(this, "گزارشی برای چاپ آماده نشده است", Toast.LENGTH_SHORT).show();
            return;
        }
        final String title = requestedTitle == null || requestedTitle.trim().length() == 0
                ? "گزارش UTM امنلاک" : requestedTitle.trim();
        try {
            final WebView printer = new WebView(this);
            printWeb = printer;
            WebSettings settings = printer.getSettings();
            settings.setJavaScriptEnabled(false);
            settings.setDefaultTextEncodingName("UTF-8");
            settings.setLoadWithOverviewMode(true);
            settings.setUseWideViewPort(true);
            printer.setWebViewClient(new WebViewClient() {
                private boolean started;
                @Override
                public void onPageFinished(WebView view, String url) {
                    if (started || isFinishing()) return;
                    started = true;
                    try {
                        PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                        if (printManager == null) {
                            Toast.makeText(MainActivity.this, "سرویس چاپ اندروید در دسترس نیست", Toast.LENGTH_SHORT).show();
                            return;
                        }
                        String jobName = "امنلاک - " + title;
                        PrintDocumentAdapter adapter = printer.createPrintDocumentAdapter(jobName);
                        PrintAttributes attributes = new PrintAttributes.Builder()
                                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                                .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                                .setMinMargins(new PrintAttributes.Margins(350, 350, 350, 350))
                                .build();
                        printManager.print(jobName, adapter, attributes);
                        Toast.makeText(MainActivity.this, "پرینتر یا ذخیره به‌صورت PDF را انتخاب کنید", Toast.LENGTH_LONG).show();
                        printWeb = null;
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "ساخت خروجی چاپ ممکن نشد", Toast.LENGTH_SHORT).show();
                    }
                }
            });
            printer.loadDataWithBaseURL("file:///android_asset/www/", html, "text/html", "UTF-8", null);
        } catch (Exception e) {
            printWeb = null;
            Toast.makeText(this, "بازکردن سرویس چاپ ممکن نشد", Toast.LENGTH_SHORT).show();
        }
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
        public void requestFreshLocation() {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    freshLocationRequested = true;
                    requestUserLocation();
                }
            });
        }

        @JavascriptInterface
        public void printHtml(final String title, final String html) {
            runOnUiThread(new Runnable() {
                @Override public void run() { printHtmlDocument(title, html); }
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
    protected void onResume() {
        super.onResume();
        final boolean returnedFromAppSettings = waitingForAppSettings;
        final boolean returnedFromLocationSettings = waitingForLocationSettings;
        waitingForAppSettings = false;
        waitingForLocationSettings = false;
        if (!returnedFromAppSettings && !returnedFromLocationSettings) return;
        if (web == null) return;
        web.postDelayed(() -> {
            if (returnedFromAppSettings && !hasLocationPermission()) {
                Toast.makeText(MainActivity.this, "مجوز موقعیت هنوز فعال نشده است", Toast.LENGTH_SHORT).show();
                sendLocationErrorToWeb();
            } else if (returnedFromLocationSettings && !isLocationServiceEnabled()) {
                Toast.makeText(MainActivity.this, "GPS هنوز خاموش است", Toast.LENGTH_SHORT).show();
                sendLocationErrorToWeb();
            } else {
                requestUserLocation();
            }
        }, 350);
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
        if (printWeb != null) {
            printWeb.destroy();
            printWeb = null;
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
