import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

// Define dependencies (same as in NotesPage)
const DEPENDENCIES = {
  'github-markdown.min.css': 'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css',
  'katex.min.css': 'https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css',
  'showdown.min.js': 'https://cdn.jsdelivr.net/npm/showdown/dist/showdown.min.js',
  'katex.min.js': 'https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js',
  'contrib/auto-render.min.js': 'https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/contrib/auto-render.min.js',
  'mathjax.min.js': 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
  'github.min.css': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css',
  'highlight.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js',
};

// Utility to ensure directory exists
const ensureDirectoryExists = async (dirPath) => {
  const info = await FileSystem.getInfoAsync(dirPath);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
};

// Utility to download files safely
const safeDownloadFile = async (url, filePath) => {
  const info = await FileSystem.getInfoAsync(filePath);
  if (!info.exists) {
    const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
    await ensureDirectoryExists(dirPath);
    const downloadResumable = FileSystem.createDownloadResumable(url, filePath);
    const { status } = await downloadResumable.downloadAsync();
    if (status < 200 || status >= 300) {
      throw new Error(`Download failed with status code: ${status}`);
    }
  }
};

const MarkdownView = ({ markdown }) => {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webViewReady, setWebViewReady] = useState(false);
  const [markdownLoaded, setMarkdownLoaded] = useState(false);
  const [localHtmlPath, setLocalHtmlPath] = useState(null);

  const dataDir = `${FileSystem.documentDirectory}markdown-view`;

  useEffect(() => {
    const setupFiles = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await ensureDirectoryExists(dataDir);

        // Download dependencies
        for (const [fileName, url] of Object.entries(DEPENDENCIES)) {
          const filePath = `${dataDir}/${fileName}`;
          await safeDownloadFile(url, filePath);
        }

        // Download KaTeX fonts
        const fontDir = `${dataDir}/fonts`;
        await ensureDirectoryExists(fontDir);
        const katexCssPath = `${dataDir}/katex.min.css`;
        const cssContent = await FileSystem.readAsStringAsync(katexCssPath, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const fontUrls = new Set();
        const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
        let match;
        while ((match = urlRegex.exec(cssContent)) !== null) {
          if (match[1].startsWith('fonts/')) {
            fontUrls.add(match[1]);
          }
        }
        const katexBaseUrl = 'https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/';
        for (const relativeUrl of fontUrls) {
          const filename = relativeUrl.split('/').pop();
          const absoluteUrl = `${katexBaseUrl}${relativeUrl}`;
          const localFontPath = `${fontDir}/${filename}`;
          await safeDownloadFile(absoluteUrl, localFontPath);
        }

        // Generate static HTML
        const htmlPath = `${dataDir}/index.html`;
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.5, user-scalable=yes">
    <title>Markdown View</title>
    <link rel="stylesheet" href="github-markdown.min.css">
    <link rel="stylesheet" href="katex.min.css">
    <script src="showdown.min.js"></script>
    <script defer src="katex.min.js"></script>
    <script defer src="contrib/auto-render.min.js" onload="tryRenderMath()"></script>
    <script async src="mathjax.min.js"></script>
    <link rel="stylesheet" href="github.min.css">
    <script src="highlight.min.js"></script>
    <style>
    body {
        background: #ffffff;
        padding: 30px;
        margin: 0;
        display: flex;
        width: 100vw;
        font-family: arial;
        color: #000000;
    }
    .markdown-body {
        font-size: 14pt;
        max-width: 100%;
        padding-top: 30px;
        background: #ffffff;
    }
    </style>
    <script>
    function sendToRN(type, message) {
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, message }));
        }
    }
    window.addEventListener('message', function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'updateMarkdown') {
                const md = data.markdown;
                const converter = new showdown.Converter({
                    tables: true,
                    ghCodeBlocks: true,
                    tasklists: true,
                    literalMidWordUnderscores: true,
                    extensions: []
                });
                const html = converter.makeHtml(md);
                document.getElementById('content').innerHTML = html;
                document.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
                if (typeof renderMathInElement === 'function') {
                    renderMathInElement(document.getElementById('content'), {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false },
                        ],
                        throwOnError: false
                    });
                }
                sendToRN('log', 'Markdown processed successfully');
            }
        } catch (e) {
            sendToRN('error', \`Error processing markdown: \${e.message}\`);
        }
    });
    function tryRenderMath() {}
    window.onload = function() {
        sendToRN('log', 'WebView loaded');
        sendToRN('ready', 'WebView is ready');
    };
    </script>
</head>
<body>
    <article id="content" class="markdown-body"></article>
</body>
</html>
        `;
        await FileSystem.writeAsStringAsync(htmlPath, htmlContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        setLocalHtmlPath(htmlPath);
      } catch (err) {
        setError(`Error setting up files: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    setupFiles();
  }, []);

  useEffect(() => {
    if (webViewReady && markdown) {
      webViewRef.current?.postMessage(
        JSON.stringify({ type: 'updateMarkdown', markdown })
      );
    }
  }, [webViewReady, markdown]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        setWebViewReady(true);
      } else if (data.type === 'log') {
        if (data.message === 'Markdown processed successfully') {
          setMarkdownLoaded(true);
        }
        console.log('WebView Log:', data.message);
      } else if (data.type === 'error') {
        console.error('WebView Error:', data.message);
        setError(data.message);
      }
    } catch (err) {
      console.error('Failed to parse WebView message:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10 }}>Loading dependencies...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FF5555' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ uri: `file://${localHtmlPath}` }}
        baseUrl={`file://${dataDir}/`}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        mixedContentMode="always"
        onMessage={handleMessage}
        style={{ flex: 1, backgroundColor: '#fff' }}
      />
      {!markdownLoaded && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ color: '#000', marginTop: 10 }}>
            Loading Markdown...
          </Text>
        </View>
      )}
    </View>
  );
};

export default MarkdownView;