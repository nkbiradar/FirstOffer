package com.firstoffer.app;

import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

/**
 * FirstOffer's whole UI is the live Next.js site loaded remotely (see
 * capacitor.config.ts's `server.url` — no local static bundle). The two
 * things Capacitor's default Activity does NOT already do correctly for a
 * site like this are handled here, natively, without touching any web code:
 *
 *  1. Android back button should navigate WebView history (opportunity list
 *     -> opportunity detail -> back), not just exit the app immediately.
 *  2. Apply buttons use <a target="_blank"> for every destination except
 *     mailto: (see components UnlockContactCard / opportunity detail page).
 *     Android's WebView silently swallows target="_blank" clicks unless
 *     WebChromeClient#onCreateWindow is implemented — Capacitor's default
 *     BridgeWebChromeClient does not implement it. Without this override,
 *     every "Apply Now" / Google Form / career-page link would do nothing
 *     when tapped. This override extracts the target URL and routes it
 *     through Bridge#launchIntent(), the same logic Capacitor already uses
 *     for normal navigation — so capacitor.config.ts's `allowNavigation`
 *     list (Google OAuth, Supabase, Razorpay) still applies consistently:
 *     those stay inside the app WebView, everything else (company sites,
 *     Google Forms, mailto:) opens via Android's system chooser (browser
 *     or mail app), exactly like a normal browser's target="_blank" would.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();

        // 1. Back button -> WebView history first, system default after.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    setEnabled(true);
                }
            }
        });

        // 2. target="_blank" links -> open via the system (browser/mail
        // app), same allowlist rules as normal navigation.
        webView.getSettings().setSupportMultipleWindows(true);
        webView.setWebChromeClient(
            new BridgeWebChromeClient(getBridge()) {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    WebView transport = new WebView(view.getContext());
                    transport.setWebViewClient(
                        new WebViewClient() {
                            @Override
                            public boolean shouldOverrideUrlLoading(WebView childView, android.webkit.WebResourceRequest request) {
                                Uri url = request.getUrl();
                                if (url != null) {
                                    getBridge().launchIntent(url);
                                }
                                return true;
                            }
                        }
                    );
                    WebView.WebViewTransport t = (WebView.WebViewTransport) resultMsg.obj;
                    t.setWebView(transport);
                    resultMsg.sendToTarget();
                    return true;
                }
            }
        );
    }
}
