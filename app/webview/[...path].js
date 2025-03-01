import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Markdown placeholder for template
const MARKDOWN_PLACEHOLDER = "%MARKDOWN_CONTENT%";

const INDEX_HTML_CONTENT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=0.8, user-scalable=yes">
    <title>Notes Preview</title>
    <!-- GitHub Markdown CSS -->
    <link rel="stylesheet" href="github-markdown.min.css"
        integrity="sha512-H5FUvsR2W84sZ09/w6oFuncsnL1edP8HkvL8B2FZdT1TcXzw1MpL#1EdU0jN17xHxaqBZv4iSaS5S0Zd7l3F1lg" crossorigin="anonymous">
    <!-- KaTeX CSS -->
    <link rel="stylesheet" href="katex.min.css"
        integrity="sha384-zh0CIslj+VczCZtlzBcjt5ppRcsAmDnRem7ESsYwWwg3m/OaJ2l4x7YBZl9Kxxib" crossorigin="anonymous">
    <!-- Showdown -->
    <script src="showdown.min.js"></script>
    <!-- KaTeX JS (deferred for performance) -->
    <script defer src="katex.min.js"
        integrity="sha384-Rma6DA2IPUwhNxmrB/7S3Tno0YY7sFu9WSYMCuulLhIqYSGZ2gKCJWIqhBWqMQfh" crossorigin="anonymous"></script>
    <!-- KaTeX Auto-Render (deferred) -->
    <script defer src="contrib/auto-render.min.js"
        integrity="sha384-hCXGrW6PitJEwbkoStFjeJxv+fSOOQKOPbJxSfM6G5sWZjAyWhXiTIIAmQqnlLlh" crossorigin="anonymous"
        onload="tryRenderMath()"></script>
    <!-- MathJax (async for optional math rendering) -->
    <script id="MathJax-script" async src="mathjax.min.js"></script>
    <!-- Highlight.js for Code Syntax Highlighting -->
    <link rel="stylesheet" href="github-dark.min.css">
    <script src="highlight.min.js"></script>
    <style>
    body {
        background: #000;
        padding: 30px;
        margin: 0;
        display: flex;
        width: 100vw;
        color: #fff;
    }
    .markdown-body {
        max-width: 100%;
        padding: 0;
        margin: 0;
        color: #fff;
    }
    </style>
    <script>
        function sendToRN(type, message) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type, message }));
            }
        }
        function reportLoadError(resource) {
            sendToRN('error', \`Failed to load resource: \${resource}\`);
        }
        window.onerror = function(message, source, lineno, colno, error) {
            sendToRN('error', \`Script error: \${message} at \${source}:\${lineno}:\${colno}\`);
        };
        window.onload = function() {
            if (!document.getElementById('content')) {
                sendToRN('error', 'HTML loading failed: Content element not found');
            } else {
                sendToRN('log', 'HTML content loaded successfully');
                processMarkdown();
            }
            document.body.style.zoom = '90%';
        };
        setTimeout(function() {
            if (!window.showdown || !window.hljs || !window.katex) {
                sendToRN('error', 'HTML loading timeout: Essential libraries not loaded');
            }
        }, 5000);
        function tryRenderMath() {
            if (typeof renderMathInElement === 'function') {
                sendToRN('log', 'renderMathInElement is defined');
                const mathElements = document.body.getElementsByTagName('*');
                let mathCount = 0;
                for (let el of mathElements) {
                    if (el.textContent.match(/[$\\[\]()]/)) {
                        mathCount++;
                    }
                }
                sendToRN('log', \`Found \${mathCount} potential math elements\`);
                renderMathInElement(document.body, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                    ],
                    throwOnError: false
                });
                sendToRN('log', 'renderMathInElement called');
            } else {
                sendToRN('error', 'renderMathInElement is not defined');
            }
        }
        function processMarkdown() {
            try {
                const md = ${MARKDOWN_PLACEHOLDER}
                let converter = new showdown.Converter({
                    tables: true,
                    ghCodeBlocks: true,
                    tasklists: true,
                    literalMidWordUnderscores: true,
                    extensions: []
                });
                document.getElementById("content").innerHTML = converter.makeHtml(md);
                document.querySelectorAll("pre code").forEach(block => hljs.highlightElement(block));
                tryRenderMath();
                sendToRN('log', 'Markdown processed successfully');
            } catch (e) {
                sendToRN('error', \`Markdown processing error: \${e.message}\`);
            }
        }
    </script>
</head>
<body>
    <article id="content" class="markdown-body"></article>
</body>
</html>
`;

const DEPENDENCIES = {
  'github-markdown.min.css': 'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css',
  'katex.min.css': 'https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css',
  'showdown.min.js': 'https://cdn.jsdelivr.net/npm/showdown/dist/showdown.min.js',
  'katex.min.js': 'https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js',
  'contrib/auto-render.min.js': 'https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/contrib/auto-render.min.js',
  'mathjax.min.js': 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
  'github-dark.min.css': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github-dark.min.css',
  'highlight.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js',
};

const NotesPage = () => {
  const basepath = useLocalSearchParams()?.path;
  const path = Array.isArray(basepath) ? basepath.join('/') : (basepath || 'default.md');

  if (path.endsWith('.html') || path.endsWith('/')) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <WebView
          className="mt-10"
          originWhitelist={['*']}
          source={{ uri: `https://ihjas-ahammed.github.io/${path}` }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </SafeAreaView>
    );
  }

  const webViewRef = useRef(null);
  const [localHtmlPath, setLocalHtmlPath] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [markdown, setMarkdown] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [markdownLoaded, setMarkdownLoaded] = useState(false)
  const [loadingMessage, setsetLoadingMessage] = useState("Preparing...")

  const ensureDirectoryExists = async (dirPath) => {
    try {
      const dirExists = await RNFS.exists(dirPath);
      if (!dirExists) {
        console.log(`Creating directory: ${dirPath}`);
        await RNFS.mkdir(dirPath, { NSURLIsExcludedFromBackupKey: true });
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        const parentDir = dirPath.substring(0, dirPath.lastIndexOf('/'));
        await ensureDirectoryExists(parentDir);
        await RNFS.mkdir(dirPath, { NSURLIsExcludedFromBackupKey: true });
      } else {
        throw err;
      }
    }
  };

  // A helper that resets progress and downloads a file while updating progress correctly.
  const safeDownloadFile = async (url, filePath, onProgress) => {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        onProgress(100);
        return;
      }
      setLoadingMessage(`Downloading: ${url.split('/').pop()}`);
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
      await ensureDirectoryExists(dirPath);
      const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
        background: false,
        discretionary: false,
        cacheable: false,
        progress: (res) => {
          if (res.contentLength > 0) {
            const percent = Math.min((res.bytesWritten / res.contentLength) * 100, 100);
            onProgress(percent);
          }
        },
      }).promise;
      if (result.statusCode < 200 || result.statusCode >= 300) {
        throw new Error(`Download failed with status code: ${result.statusCode}`);
      }
      console.log(`Successfully downloaded ${url} to ${filePath}`);
    } catch (err) {
      console.error(`Failed to download ${url} to ${filePath}:`, err);
      throw err;
    }
  };

  // Handle cloud sync manually
  const handleCloudAction = async () => {
    setIsLoading(true);
    setLoadingMessage('Syncing with cloud...');
    try {
      const dataDir = `${RNFS.DocumentDirectoryPath}/notes`;
      let mdFilePath = `${dataDir}/${path}`;
      if (!path.includes('.')) {
        mdFilePath = `${dataDir}/${path}/index.md`;
      }
      const exists = await RNFS.exists(mdFilePath);
      if (exists) await RNFS.unlink(mdFilePath);
      const mdUrl = `https://ihjas-ahammed.github.io/${path}`;
      await safeDownloadFile(mdUrl, mdFilePath, (percent) => setProgress(Math.min(percent, 100)));
      const mdContent = await RNFS.readFile(mdFilePath, 'utf8');
      setMarkdown(mdContent);
      const htmlPath = `${dataDir}/index.html`;
      const jsonMarkdown = JSON.stringify(mdContent);
      const htmlContent = INDEX_HTML_CONTENT_TEMPLATE.replace(MARKDOWN_PLACEHOLDER, jsonMarkdown);

      await RNFS.writeFile(htmlPath, htmlContent, 'utf8');
      setLocalHtmlPath(`file://${htmlPath}`);
      webViewRef.current?.reload();
    } catch (err) {
      setError(`Cloud sync failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const setupFiles = async () => {
      setIsLoading(true);
      setError(null);
      setProgress(0);
      try {
        const dataDir = `${RNFS.DocumentDirectoryPath}/notes`;
        const htmlPath = `${dataDir}/index.html`;
        let mdFilePath = `${dataDir}/${path}`;
        if (!path.includes('.')) {
          mdFilePath = `${dataDir}/${path}/index.md`;
        }
        const mdFileDir = mdFilePath.substring(0, mdFilePath.lastIndexOf('/'));
        await ensureDirectoryExists(dataDir);
        await ensureDirectoryExists(mdFileDir);

        let filesDownloaded = 0;
        const fontCount = 25; // Estimated number of fonts for KaTeX v0.16.21
        const totalFiles = Object.keys(DEPENDENCIES).length + 1 + fontCount; // dependencies + markdown + fonts

        // Download dependencies
        for (const [fileName, url] of Object.entries(DEPENDENCIES)) {
          const filePath = `${dataDir}/${fileName}`;
          await safeDownloadFile(url, filePath, (percent) => {
            setProgress(Math.min(((filesDownloaded + (percent / 100)) / totalFiles) * 100, 100));
          });
          filesDownloaded += 1;
          setProgress(Math.min((filesDownloaded / totalFiles) * 100, 100));
        }

        // Download markdown file
        let mdContent = '';
        const mdFileExists = await RNFS.exists(mdFilePath);
        if (mdFileExists) {
          mdContent = await RNFS.readFile(mdFilePath, 'utf8');
          filesDownloaded += 1;
          setProgress(Math.min((filesDownloaded / totalFiles) * 100, 100));
        } else {
          try {
            const mdUrl = `https://ihjas-ahammed.github.io/${path}`;
            await safeDownloadFile(mdUrl, mdFilePath, (percent) => {
              setProgress(Math.min(((filesDownloaded + (percent / 100)) / totalFiles) * 100, 100));
            });
            mdContent = await RNFS.readFile(mdFilePath, 'utf8');
            filesDownloaded += 1;
            setProgress(Math.min((filesDownloaded / totalFiles) * 100, 100));
          } catch (err) {
            mdContent = `# ${path.split('/').pop().replace('.md', '')}\n\nStart writing...\n\nInline: $E = mc^2$\n\nDisplay:\n$$\\int_0^1 x^2 dx = \\frac{1}{3}$$\n\n\`\`\`javascript\nconsole.log("Hello");\n\`\`\``;
            await RNFS.writeFile(mdFilePath, mdContent, 'utf8');
            filesDownloaded += 1;
            setProgress(Math.min((filesDownloaded / totalFiles) * 100, 100));
          }
        }
        setMarkdown(mdContent);

        // Download fonts referenced by katex.min.css
        const fontDir = `${dataDir}/fonts`;
        await ensureDirectoryExists(fontDir);
        const katexCssPath = `${dataDir}/katex.min.css`;
        const cssContent = await RNFS.readFile(katexCssPath, 'utf8');
        const fontUrls = new Set();
        const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
        let match;
        while ((match = urlRegex.exec(cssContent)) !== null) {
          const relativeUrl = match[1];
          if (relativeUrl.startsWith('fonts/')) {
            fontUrls.add(relativeUrl);
          }
        }
        const katexBaseUrl = DEPENDENCIES['katex.min.css'].replace('katex.min.css', '');
        for (const relativeUrl of fontUrls) {
          const filename = relativeUrl.split('/').pop();
          const absoluteUrl = `${katexBaseUrl}${relativeUrl}`;
          const localFontPath = `${fontDir}/${filename}`;
          await safeDownloadFile(absoluteUrl, localFontPath, (percent) => {
            setProgress(Math.min(((filesDownloaded + (percent / 100)) / totalFiles) * 100, 100));
          });
          filesDownloaded += 1;
          setProgress(Math.min((filesDownloaded / totalFiles) * 100, 100));
        }
        console.log(`Total fonts downloaded: ${fontUrls.size}`);

        // Write the HTML file with the markdown content injected (using JSON.stringify to ensure proper escaping)
        const jsonMarkdown = JSON.stringify(mdContent);
        const htmlContent = INDEX_HTML_CONTENT_TEMPLATE.replace(MARKDOWN_PLACEHOLDER, jsonMarkdown);
        await RNFS.writeFile(htmlPath, htmlContent, 'utf8');
        setLocalHtmlPath(`file://${htmlPath}`);
      } catch (error) {
        console.error('Error setting up files:', error);
        setError(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    setupFiles();
  }, [path]);

  // When saving, we use JSON.stringify so that the injected markdown is correctly escaped.
  const handleSave = async () => {
    setIsLoading(true);
    setLoadingMessage('Saving changes...');
    try {
      const dataDir = `${RNFS.DocumentDirectoryPath}/notes`;
      let mdFilePath = `${dataDir}/${path}`;
      if (!path.includes('.')) {
        mdFilePath = `${dataDir}/${path}/index.md`;
      }
      const mdFileDir = mdFilePath.substring(0, mdFilePath.lastIndexOf('/'));
      await ensureDirectoryExists(mdFileDir);
      await RNFS.writeFile(mdFilePath, markdown, 'utf8');
      const htmlPath = `${dataDir}/index.html`;
      const jsonMarkdown = JSON.stringify(markdown);
      const htmlContent = INDEX_HTML_CONTENT_TEMPLATE.replace(MARKDOWN_PLACEHOLDER, jsonMarkdown);
      await RNFS.writeFile(htmlPath, htmlContent, 'utf8');
      setIsEditing(false);
    } catch (error) {
      setError(`Save error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'log') {
        if (data.message === 'Markdown processed successfully') {
          setMarkdownLoaded(true)
        }else if(data.message ==='renderMathInElement is defined'){
          setMarkdownLoaded(false)
        }
        console.log('WebView Log:', data.message);
      } else if (data.type === 'error') {
        console.error('WebView Error:', data.message);
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-2">{Math.min(progress, 100).toFixed(0)}%</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-[#1E1E1E]">
        <Text className="text-[#FF5555] mb-5 text-center text-base">{error}</Text>
        <TouchableOpacity
          className="bg-[#2D5AF2] px-5 py-2.5 rounded"
          onPress={() => {
            setError(null);
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 100);
          }}
        >
          <Text className="text-white text-base">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View className="absolute top-12 right-0 flex-col items-center justify-end px-2.5 z-10">
        {isEditing ? (
          <>
            <TouchableOpacity className="p-2" onPress={handleSave}>
              <Ionicons name="sync" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2" onPress={() => setIsEditing(false)}>
              <Ionicons name="close" size={18} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity className="p-2" onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2" onPress={handleCloudAction}>
              <Ionicons name="cloud" size={18} color="white" />
            </TouchableOpacity>
          </>
        )}
      </View>
      {isEditing ? (
        <ScrollView className="flex-1 bg-black mt-10">
          <TextInput
            className="p-[30px] text-white text-sm"
            multiline
            value={markdown}
            onChangeText={setMarkdown}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            keyboardType="ascii-capable"
            textAlignVertical="top"
          />
        </ScrollView>
      ) : (
        <View style={{flex:1}}>
          <WebView
            className="mt-10"
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ uri: localHtmlPath }}
            baseUrl={`file://${RNFS.DocumentDirectoryPath}/notes/`}
            allowFileAccess={true}
            mixedContentMode="always"
            style={{ flex: 1, backgroundColor: '#000' }}
            onMessage={handleMessage}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
            domStorageEnabled={true}
            javaScriptEnabled={true}
          />
          

          {!markdownLoaded? (
            <View style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex:10
            }}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={{ color: '#fff', marginTop: 10 }}>Loading Markdown...</Text>
            </View>
          ) : (<></>)}
        </View>
      )}
    </SafeAreaView>
  );
};

export default NotesPage;
