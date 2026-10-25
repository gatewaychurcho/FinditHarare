package zw.co.finditharare;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Vibrator;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> fileUploadCallback;
    private final static int FILE_CHOOSER_RESULT_CODE = 1001;
    private static final String LOCAL_APP_URL = "file:///android_asset/index.html";
    private static final String REMOTE_API_BASE = "https://finditharare.vercel.app";
    private static final String APP_URL = LOCAL_APP_URL;
    private static final String CHANNEL_ID = "findit_harare_live_channel";
    private static final String CHANNEL_NAME = "Findit Harare Live Alerts";
    private static final String PREFS_NAME = "findit_native_prefs";

    private boolean isAppInBackground = false;
    private long lastBackgroundPollMs = System.currentTimeMillis();
    private Handler backgroundHandler;
    private Runnable backgroundRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }

        createNotificationChannel();
        requestAppPermissions();

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setGeolocationDatabasePath(getFilesDir().getPath());
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);

        // Offline caching mode (like inDrive): Cache first if offline, default when connected
        android.net.ConnectivityManager cm = (android.net.ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        android.net.NetworkInfo activeNetwork = cm != null ? cm.getActiveNetworkInfo() : null;
        boolean isConnected = activeNetwork != null && activeNetwork.isConnectedOrConnecting();
        if (isConnected) {
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        } else {
            settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        }

        // Expose Native Android Notification & Session Bridge to JavaScript
        webView.addJavascriptInterface(new FinditNativeBridge(), "FinditNative");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("tel:") || url.startsWith("whatsapp:") || url.startsWith("mailto:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }
                return false;
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                try {
                    view.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
                } catch (Exception ignored) {}
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Ensure bridge is synced after page load
                view.evaluateJavascript("if(typeof window.syncNativeSessionBridge==='function') window.syncNativeSessionBridge();", null);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE);
                } catch (Exception e) {
                    fileUploadCallback = null;
                    return false;
                }
                return true;
            }
        });

        webView.loadUrl(APP_URL);
        setupBackgroundPolling();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Live Harare service requests, provider bids, arriving alerts, and chat messages.");
            channel.enableLights(true);
            channel.setLightColor(Color.BLUE);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 200, 100, 200});
            channel.setShowBadge(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void requestAppPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String[] permissions;
            if (Build.VERSION.SDK_INT >= 33) {
                permissions = new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                    Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.CAMERA,
                    Manifest.permission.VIBRATE,
                    Manifest.permission.POST_NOTIFICATIONS
                };
            } else {
                permissions = new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                    Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.CAMERA,
                    Manifest.permission.VIBRATE
                };
            }
            requestPermissions(permissions, 2002);
        }
    }

    public class FinditNativeBridge {
        @JavascriptInterface
        public void triggerNotification(String title, String message, int notificationId) {
            showSystemNotification(title, message, notificationId);
        }

        @JavascriptInterface
        public boolean hasOverlayPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                return android.provider.Settings.canDrawOverlays(MainActivity.this);
            }
            return true;
        }

        @JavascriptInterface
        public void requestOverlayPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    if (!android.provider.Settings.canDrawOverlays(MainActivity.this)) {
                        Intent intent = new Intent(
                            android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:" + getPackageName())
                        );
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                    }
                } catch (Exception ignored) {}
            }
        }

        @JavascriptInterface
        public void triggerIncomingCall(String callerName, String callType, String channelId) {
            runOnUiThread(() -> triggerIncomingCallAlert(callerName, callType, channelId));
        }

        @JavascriptInterface
        public void syncUserSession(String userId, String role, String userName, String categoriesCsv) {
            try {
                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                prefs.edit()
                    .putString("userId", userId != null ? userId : "")
                    .putString("role", role != null ? role : "CUSTOMER")
                    .putString("userName", userName != null ? userName : "")
                    .putString("categories", categoriesCsv != null ? categoriesCsv : "")
                    .apply();
            } catch (Exception e) {}
        }
    }

    public void triggerIncomingCallAlert(String callerName, String callType, String channelId) {
        try {
            // 1. Wake device screen up
            android.os.PowerManager pm = (android.os.PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                android.os.PowerManager.WakeLock wl = pm.newWakeLock(
                    android.os.PowerManager.FULL_WAKE_LOCK |
                    android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP |
                    android.os.PowerManager.ON_AFTER_RELEASE,
                    "FinditHarare:IncomingCallWake"
                );
                wl.acquire(10000);
            }
        } catch (Exception ignored) {}

        try {
            // 2. Vibrate phone with call ring pattern
            Vibrator vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null) {
                vibrator.vibrate(new long[]{0, 800, 400, 800, 400, 800}, -1);
            }
        } catch (Exception ignored) {}

        // 3. Post full screen incoming call alert
        showSystemNotification(
            "📞 Incoming " + (callType != null ? callType : "Audio") + " Call",
            (callerName != null && !callerName.isEmpty() ? callerName : "Findit User") + " is calling you on Findit Harare...",
            9999
        );

        // 4. Bring app activity to front if overlay is permitted
        try {
            Intent bringToFront = new Intent(this, MainActivity.class);
            bringToFront.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            startActivity(bringToFront);
        } catch (Exception ignored) {}
    }

    public void showSystemNotification(String title, String message, int notificationId) {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            // Wake up device screen for incoming task alert or call
            try {
                android.os.PowerManager pm = (android.os.PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    android.os.PowerManager.WakeLock wl = pm.newWakeLock(
                        android.os.PowerManager.FULL_WAKE_LOCK |
                        android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP |
                        android.os.PowerManager.ON_AFTER_RELEASE,
                        "FinditHarare:IncomingAlert"
                    );
                    wl.acquire(3000);
                }
            } catch (Exception ignored) {}

            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(this, notificationId, intent, flags);

            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                builder = new Notification.Builder(this, CHANNEL_ID);
            } else {
                builder = new Notification.Builder(this);
                builder.setPriority(Notification.PRIORITY_MAX);
                builder.setDefaults(Notification.DEFAULT_ALL);
            }

            builder.setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(new Notification.BigTextStyle().bigText(message))
                .setContentIntent(pendingIntent)
                .setFullScreenIntent(pendingIntent, true)
                .setAutoCancel(true)
                .setVibrate(new long[]{0, 250, 150, 250});

            manager.notify(notificationId, builder.build());
        } catch (Exception e) {}
    }

    private void setupBackgroundPolling() {
        backgroundHandler = new Handler(Looper.getMainLooper());
        backgroundRunnable = new Runnable() {
            @Override
            public void run() {
                if (isAppInBackground) {
                    performBackgroundHttpPoll();
                }
                backgroundHandler.postDelayed(this, 6000);
            }
        };
        backgroundHandler.postDelayed(backgroundRunnable, 6000);
    }

    private void performBackgroundHttpPoll() {
        new Thread(() -> {
            try {
                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String userId = prefs.getString("userId", "");
                String role = prefs.getString("role", "CUSTOMER");
                String cats = prefs.getString("categories", "");
                long since = lastBackgroundPollMs;

                // 1. Check for incoming calls in background (calls take top priority)
                if (userId != null && !userId.isEmpty()) {
                    try {
                        String callCheckUrl = REMOTE_API_BASE + "/api/calls/check?userId=" + Uri.encode(userId);
                        URL callUrl = new URL(callCheckUrl);
                        HttpURLConnection callConn = (HttpURLConnection) callUrl.openConnection();
                        callConn.setRequestMethod("GET");
                        callConn.setConnectTimeout(3500);
                        callConn.setReadTimeout(3500);

                        if (callConn.getResponseCode() == 200) {
                            BufferedReader callReader = new BufferedReader(new InputStreamReader(callConn.getInputStream()));
                            StringBuilder callSb = new StringBuilder();
                            String cLine;
                            while ((cLine = callReader.readLine()) != null) {
                                callSb.append(cLine);
                            }
                            callReader.close();

                            JSONObject callRes = new JSONObject(callSb.toString());
                            JSONObject incomingCall = callRes.optJSONObject("incomingCall");
                            if (incomingCall != null) {
                                String callerName = incomingCall.optString("callerName", "Findit User");
                                String callType = incomingCall.optString("callType", "Voice");
                                String channelId = incomingCall.optString("channelId", "");
                                runOnUiThread(() -> triggerIncomingCallAlert(callerName, callType, channelId));
                            }
                        }
                        callConn.disconnect();
                    } catch (Exception ignored) {}
                }

                // 2. Poll for push alerts & bids
                String pollUrl = REMOTE_API_BASE + "/api/notifications/poll?userId=" + Uri.encode(userId)
                    + "&role=" + Uri.encode(role)
                    + "&categories=" + Uri.encode(cats)
                    + "&since=" + since;

                URL url = new URL(pollUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);

                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    reader.close();

                    JSONObject res = new JSONObject(sb.toString());
                    lastBackgroundPollMs = res.optLong("serverTime", System.currentTimeMillis());
                    JSONArray notifs = res.optJSONArray("notifications");
                    if (notifs != null && notifs.length() > 0) {
                        for (int i = 0; i < notifs.length(); i++) {
                            JSONObject n = notifs.getJSONObject(i);
                            int id = n.optInt("id", 1000 + i);
                            String title = n.optString("title", "Findit Harare");
                            String body = n.optString("body", "");
                            showSystemNotification(title, body, id);
                        }
                    }
                }
                conn.disconnect();
            } catch (Exception e) {}
        }).start();
    }

    @Override
    protected void onPause() {
        super.onPause();
        isAppInBackground = true;
        // Never pause WebView timers so in-flight tasks and WebSockets stay alive
        if (webView != null) {
            webView.resumeTimers();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        isAppInBackground = false;
        lastBackgroundPollMs = System.currentTimeMillis();
        if (webView != null) {
            webView.resumeTimers();
            webView.evaluateJavascript("if(typeof window.fetchState==='function') window.fetchState(true);", null);
        }
    }

    @Override
    protected void onDestroy() {
        if (backgroundHandler != null && backgroundRunnable != null) {
            backgroundHandler.removeCallbacks(backgroundRunnable);
        }
        super.onDestroy();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (fileUploadCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
                fileUploadCallback.onReceiveValue(results);
                fileUploadCallback = null;
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    /**
     * 1-Step Back Navigation for Android Hardware / Gesture Back Button
     */
    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript(
                "(function() { " +
                "  if (typeof window.handleAndroidBack === 'function') { " +
                "    return window.handleAndroidBack(); " +
                "  } " +
                "  return false; " +
                "})();",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if ("true".equals(value)) {
                            // Successfully handled by in-app navigation (closed modal/tab/drawer)
                        } else if (webView.canGoBack()) {
                            webView.goBack();
                        } else {
                            MainActivity.super.onBackPressed();
                        }
                    }
                }
            );
        } else {
            super.onBackPressed();
        }
    }
}
