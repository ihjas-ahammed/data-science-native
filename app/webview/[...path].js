import React from 'react';
import { View, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';

const WebViewComponent = () => {
    const { path } = useLocalSearchParams();
    const fullPath = Array.isArray(path) ? path.join('/') : path;

    // Check if running in Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';

    // Use different base paths based on environment
    const basePath = isExpoGo
        ? 'https://ihjas-ahammed.github.io/'
        : 'file:///android_asset/';

    // Construct the final URI
    const assetPath = isExpoGo
        ? `${basePath}${fullPath}`
        : `${basePath}/${fullPath}`;

    /*'.markdown-body {
                max-width: 100%;
                padding: 30px;
                background: rgb(0, 0, 0);
                color:#fff;
                border-radius: 10px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            }'*/
    // Custom CSS to inject
    const customStyles = `
    document.querySelectorAll('.markdown-body').forEach(element => {
      element.style.background = 'rgb(255,255,255)';
      element.style.color = 'rgb(0,0,0)';
    });
  `;

    const resourceCacheScript = `
    (function() {
      // Function to fetch and cache a resource
      function cacheResource(url) {
        if (!url || url.startsWith('data:') || url.startsWith('blob:')) return Promise.resolve();
        const cacheKey = 'cached_' + btoa(url);
        if (localStorage.getItem(cacheKey)) return Promise.resolve();

        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                localStorage.setItem(cacheKey, xhr.responseText);
                console.log('Cached: ' + url);
                resolve();
              } catch (e) {
                console.log('localStorage error for ' + url + ': ' + e.message);
                resolve(); // Continue even if storage fails
              }
            } else {
              console.log('Failed to load ' + url + ': ' + xhr.status);
              reject();
            }
          };
          xhr.onerror = () => {
            console.log('Network error for ' + url);
            reject();
          };
          xhr.send();
        });
      }

      // Collect all resources from the page
      function collectResources() {
        const resources = new Set();
        
        // Scripts
        document.querySelectorAll('script[src]').forEach(script => {
          resources.add(script.src);
        });
        
        // Stylesheets
        document.querySelectorAll('link[rel="stylesheet"][href]').forEach(link => {
          resources.add(link.href);
        });
        
        // Images (optional, if you want to cache them)
        document.querySelectorAll('img[src]').forEach(img => {
          resources.add(img.src);
        });

        return Array.from(resources);
      }

      // Monitor dynamically added resources
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length) {
            collectResources().forEach(url => cacheResource(url).catch(() => {}));
          }
        });
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });

      // Initial caching on load
      window.addEventListener('load', () => {
        const resources = collectResources();
        resources.forEach(url => cacheResource(url).catch(() => {}));
      });

      // Re-inject cached resources offline
      window.addEventListener('load', () => {
        const resources = collectResources();
        resources.forEach(url => {
          const cacheKey = 'cached_' + btoa(url);
          const cachedContent = localStorage.getItem(cacheKey);
          if (cachedContent) {
            if (url.endsWith('.js') || url.includes('.js?')) {
              const script = document.createElement('script');
              script.text = cachedContent;
              document.body.appendChild(script);
            } else if (url.endsWith('.css') || url.includes('.css?')) {
              const style = document.createElement('style');
              style.textContent = cachedContent;
              document.head.appendChild(style);
            }
          }
        });
      });
    })();
  `;
    console.log('Running in Expo Go:', isExpoGo);
    console.log('Route params:', path);
    console.log('Full path:', fullPath);
    console.log('Asset URI:', assetPath);

    return (
        <SafeAreaView className="flex-1 bg-black">
            <WebView
                source={{ uri: assetPath }}
                style={{ flex: 1 }}
                originWhitelist={['*']}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={Platform.OS === 'android' && !isExpoGo}
                allowFileAccessFromFileURLs={Platform.OS === 'android' && !isExpoGo}
                cacheEnabled={true} // Enable caching
                cacheMode={Platform.OS === 'android' ? 'LOAD_CACHE_ELSE_NETWORK' : undefined} // Cache first, then network
                domStorageEnabled={true} // For localStorage
                javaScriptEnabled={true} // Required for scripts
                mixedContentMode={'always'} // Allow mixed content
                injectedJavaScript={`${customStyles}; ${resourceCacheScript}`} // Inject styles and caching logic
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView error:', nativeEvent);
                }}
                onLoad={() => console.log('WebView loaded:', assetPath)}
                renderError={(errorName) => (
                    <View className="flex-1 justify-center items-center bg-black">
                        <Text className="text-red-500 text-lg font-bold">Error: {errorName}</Text>
                        <Text className="text-gray-300 mt-2">Path: {fullPath}</Text>
                        <Text className="text-gray-300 mt-2">Using: {isExpoGo ? 'GitHub' : 'Android Assets'}</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

export default WebViewComponent;