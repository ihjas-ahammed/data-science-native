import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Modal, Switch, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, child, remove, query, orderByChild, equalTo, limitToFirst } from 'firebase/database';

// Markdown placeholder for template
const MARKDOWN_PLACEHOLDER = "%MARKDOWN_CONTENT%";

const firebaseConfig = {
  apiKey: "AIzaSyAnjWWep4dtxvn1YKtmdU7A002X2NAvlX0",
  authDomain: "data-science-ef878.firebaseapp.com",
  databaseURL: "https://data-science-ef878-default-rtdb.firebaseio.com",
  projectId: "data-science-ef878",
  storageBucket: "data-science-ef878.firebasestorage.app",
  messagingSenderId: "1010841233830",
  appId: "1:1010841233830:web:e7aa0b516ace71c1720767",
  measurementId: "G-FL7XZR6X7Q"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const sanitizePath = (path) => {
  return path
    .replace(/#/g, '%23')    // Replace # with %23
    .replace(/\./g, '%2E')    // Replace . with %2E
    .replace(/\$/g, '%24')    // Replace $ with %24
    .replace(/\[/g, '%5B')    // Replace [ with %5B
    .replace(/\]/g, '%5D')    // Replace ] with %5D
    .replace(/%/g, '%25');    // Replace % with %25 (to handle already encoded characters)
};

const INDEX_HTML_CONTENT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.5, user-scalable=yes">
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
    <link rel="stylesheet" href="github.min.css">
    <script src="highlight.min.js"></script>
    <style>
    body {
        background: #ffffff;
        padding: 30px;
        margin: 0;
        display: flex;
        width: 100vw;
        font-family:arial;
        color: #000000;
    }
    .markdown-body {
        font-size:14pt;
        max-width: 100%;
        padding-top:30px;
        background: #ffffff;
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
  'github.min.css': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css',
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

  const sanitizedPath = sanitizePath(path);
  const webViewRef = useRef(null);
  const [localHtmlPath, setLocalHtmlPath] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [markdown, setMarkdown] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [markdownLoaded, setMarkdownLoaded] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Preparing...");
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('default');
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      const storedUserId = await SecureStore.getItemAsync('userId');
      const storedPin = await SecureStore.getItemAsync('pin');
      if (storedUserId && storedPin) {
        setUserId(storedUserId);
        setPin(storedPin);
        await fetchChannels();
      }
    };
    loadCredentials();
  }, []);

  const ensureDirectoryExists = async (dirPath) => {
    const info = await FileSystem.getInfoAsync(dirPath);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
  };

  const safeDownloadFile = async (url, filePath, onProgress) => {
    try {
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists) {
        onProgress(100);
        return;
      }
      setLoadingMessage(`Downloading: ${url.split('/').pop()}`);
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
      await ensureDirectoryExists(dirPath);
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        filePath,
        {},
        (downloadProgress) => {
          const percent = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
          onProgress(percent);
        }
      );
      const { status } = await downloadResumable.downloadAsync();
      if (status < 200 || status >= 300) {
        throw new Error(`Download failed with status code: ${status}`);
      }
      console.log(`Successfully downloaded ${url} to ${filePath}`);
    } catch (err) {
      console.error(`Failed to download ${url} to ${filePath}:`, err);
      throw err;
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (!userId || !pin) {
      setError('Please log in to delete notes');
      setShowLoginModal(true);
      return;
    }

    try {
      const dbRef = ref(database, `notes/${sanitizedPath}/${channelId}`);
      const snapshot = await get(dbRef);

      if (!snapshot.exists()) {
        setError('Note not found');
        return;
      }

      const channelData = snapshot.val();

      if (channelData.name !== userId || channelData.pin !== pin) {
        setError('You can only delete your own notes');
        return;
      }

      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this note?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setIsLoading(true);
              try {
                await remove(dbRef);
                await fetchChannels();
                if (selectedChannel === channelId) {
                  setMarkdown('');
                  const dataDir = `${FileSystem.documentDirectory}notes`;
                  const htmlPath = `${dataDir}/index.html`;
                  const htmlContent = INDEX_HTML_CONTENT_TEMPLATE.replace(MARKDOWN_PLACEHOLDER, JSON.stringify(''));
                  await FileSystem.writeAsStringAsync(htmlPath, htmlContent, { encoding: FileSystem.EncodingType.UTF8 });
                  setLocalHtmlPath(htmlPath);
                  webViewRef.current?.reload();
                }
              } catch (err) {
                setError(`Failed to delete note: ${err.message}`);
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (err) {
      setError(`Error verifying note ownership: ${err.message}`);
    }
  };

  const fetchChannels = async () => {
    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `notes/${sanitizedPath}`));
      
      const storedUserId = await SecureStore.getItemAsync('userId');
      const storedPin = await SecureStore.getItemAsync('pin');

      if (snapshot.exists()) {
        const data = snapshot.val();
        const channelList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
          visible: value.type === 'public' || (userId && value.name === userId && value.pin === pin),
          canDelete: storedUserId && value.name === storedUserId && value.pin === storedPin
        })).filter(channel => channel.visible);
        setChannels(channelList);
      } else {
        setChannels([]);
      }
    } catch (err) {
      setError(`Failed to fetch channels: ${err.message}`);
    }
  };

  const handleLogin = async () => {
    if (!userId || !pin) {
      setError('Please enter both User ID and PIN');
      return;
    }
    setIsLoading(true);
    try {
      await SecureStore.setItemAsync('userId', userId);
      await SecureStore.setItemAsync('pin', pin);
      await fetchChannels();
      setShowLoginModal(false);
    } catch (err) {
      setError(`Login failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!userId || !pin) {
      setShowLoginModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const userNotesQuery = query(
        ref(database, `notes/${sanitizedPath}`),
        equalTo(userId),
        limitToFirst(1)
      );

      const snapshot = await get(userNotesQuery);
      let existingChannelId = null;

      if (snapshot.exists()) {
        const data = snapshot.val();
        existingChannelId = Object.keys(data)[0];
        const existingNote = Object.values(data)[0];
        if (existingNote.pin !== pin) {
          setError('PIN does not match existing note');
          setIsLoading(false);
          return;
        }
      }

      const channelId = existingChannelId || `${sanitizePath(userId)}`;
      const channelData = {
        name: userId,
        pin: pin,
        note: markdown,
        type: isPublic ? 'public' : 'private'
      };

      await set(ref(database, `notes/${sanitizedPath}/${channelId}`), channelData);
      await fetchChannels();
      setSelectedChannel(channelId);
      setShowUploadModal(false);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelSelect = async (channelId) => {
    setIsLoading(true);
    try {
      const mdUrl = `https://ihjas-ahammed.github.io/${path}`;
      const dataDir = `${FileSystem.documentDirectory}notes`;
      let mdFilePath = `${dataDir}/${path}`;
      if (!path.includes('.')) {
        mdFilePath = `${dataDir}/${path}/index.md`;
      }
      let mdc = '';
      if (channelId === 'default') {
        await FileSystem.deleteAsync(mdFilePath, { idempotent: true });
        await safeDownloadFile(mdUrl, mdFilePath, setProgress);
        mdc = await FileSystem.readAsStringAsync(mdFilePath, { encoding: FileSystem.EncodingType.UTF8 });
        setMarkdown(mdc);
      } else {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, `notes/${sanitizedPath}/${channelId}`));
        if (snapshot.exists()) {
          mdc = snapshot.val().note;
          setMarkdown(mdc);
        }
      }
      const htmlPath = `${dataDir}/index.html`;
      const htmlContent = INDEX_HTML_CONTENT_TEMPLATE.replace(MARKDOWN_PLACEHOLDER, JSON.stringify(mdc));
      await FileSystem.deleteAsync(htmlPath, { idempotent: true });
      await FileSystem.writeAsStringAsync(htmlPath, htmlContent, { encoding: FileSystem.EncodingType.UTF8 });
      await FileSystem.writeAsStringAsync(mdFilePath, mdc, { encoding: FileSystem.EncodingType.UTF8 });
      setLocalHtmlPath(htmlPath);
      setSelectedChannel(channelId);
      webViewRef.current?.reload();
    } catch (err) {
      setError(`Failed to load channel: ${err.message}`);
    } finally {
      setIsLoading(false);
      setShowChannelModal(false);
    }
  };

  useEffect(() => {
    const setupFiles = async () => {
      setIsLoading(true);
      setError(null);
      setProgress(0);
      try {
        const dataDir = `${FileSystem.documentDirectory}notes`;
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
        const totalFiles = Object.keys(DEPENDENCIES).length + 1 + fontCount;

        for (const [fileName, url] of Object.entries(DEPENDENCIES)) {
          const filePath = `${dataDir}/${fileName}`;
          await safeDownloadFile(url, filePath, (percent) => {
            setProgress(Math.min(((filesDownloaded + (percent / 100)) / totalFiles) * 100, 100));
          });
          filesDownloaded += 1;
          setProgress(Math.min((filesDownloaded / totalFiles) * 100, 100));
        }

        let mdContent = '';
        const mdFileInfo = await FileSystem.getInfoAsync(mdFilePath);
        if (mdFileInfo.exists) {
          mdContent = await FileSystem.readAsStringAsync(mdFilePath, { encoding: FileSystem.EncodingType.UTF8 });
          filesDownloaded += 1;
          setProgress(Math.min((filesDownloaded / totalFiles) * 100, 100));
        } else {
          try {
            await fetchChannels();
            const mdUrl = `https://ihjas-ahammed.github.io/${path}`;
            await safeDownloadFile(mdUrl, mdFilePath, (percent) => {
              setProgress(Math.min(((filesDownloaded + (percent / 100)) / totalFiles) * 100, 100));
            });
            mdContent = await FileSystem.readAsStringAsync(mdFilePath, { encoding: FileSystem.EncodingType.UTF8 });
            filesDownloaded += 1;
            setProgress(Math.min((filesDownloaded / totalFiles) * 100, 100));
          } catch (err) {
            mdContent = `# ${path.split('/').pop().replace('.md', '')}\n\nStart writing...\n\nInline: $E = mc^2$\n\nDisplay:\n$$\\int_0^1 x^2 dx = \\frac{1}{3}$$\n\n\`\`\`javascript\nconsole.log("Hello");\n\`\`\``;
            await FileSystem.writeAsStringAsync(mdFilePath, mdContent, { encoding: FileSystem.EncodingType.UTF8 });
            filesDownloaded += 1;
            setProgress(Math.min((filesDownloaded / totalFiles) * 100, 100));
          }
        }
        setMarkdown(mdContent);

        const fontDir = `${dataDir}/fonts`;
        await ensureDirectoryExists(fontDir);
        const katexCssPath = `${dataDir}/katex.min.css`;
        const cssContent = await FileSystem.readAsStringAsync(katexCssPath, { encoding: FileSystem.EncodingType.UTF8 });
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

        const jsonMarkdown = JSON.stringify(mdContent);
        const htmlContent = INDEX_HTML_CONTENT_TEMPLATE.replace(MARKDOWN_PLACEHOLDER, jsonMarkdown);
        await FileSystem.writeAsStringAsync(htmlPath, htmlContent, { encoding: FileSystem.EncodingType.UTF8 });
        setLocalHtmlPath(htmlPath);
      } catch (error) {
        console.error('Error setting up files:', error);
        setError(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
        await fetchChannels();
      }
    };
    setupFiles();
  }, [path]);

  const handleSave = async () => {
    setIsLoading(true);
    setLoadingMessage('Saving changes...');
    try {
      const dataDir = `${FileSystem.documentDirectory}notes`;
      let mdFilePath = `${dataDir}/${path}`;
      if (!path.includes('.')) {
        mdFilePath = `${dataDir}/${path}/index.md`;
      }
      const mdFileDir = mdFilePath.substring(0, mdFilePath.lastIndexOf('/'));
      await ensureDirectoryExists(mdFileDir);
      await FileSystem.writeAsStringAsync(mdFilePath, markdown, { encoding: FileSystem.EncodingType.UTF8 });
      const htmlPath = `${dataDir}/index.html`;
      const jsonMarkdown = JSON.stringify(markdown);
      const htmlContent = INDEX_HTML_CONTENT_TEMPLATE.replace(MARKDOWN_PLACEHOLDER, jsonMarkdown);
      await FileSystem.writeAsStringAsync(htmlPath, htmlContent, { encoding: FileSystem.EncodingType.UTF8 });
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
          setMarkdownLoaded(true);
        } else if (data.message === 'renderMathInElement is defined') {
          setMarkdownLoaded(false);
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
      <View className="absolute top-2 right-0 flex-col items-center justify-end px-2.5 z-10">
        {isEditing ? (
          <>
            <TouchableOpacity className="p-2" onPress={handleSave}>
              <Ionicons name="sync" size={18} color="black" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2" onPress={() => setIsEditing(false)}>
              <Ionicons name="close" size={18} color="black" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity className="p-2" onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={18} color="black" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2" onPress={() => setShowChannelModal(true)}>
              <Ionicons name="cloud" size={18} color="black" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2" onPress={() => setShowUploadModal(true)}>
              <Ionicons name="cloud-upload" size={18} color="black" />
            </TouchableOpacity>
            {userId && pin ? (
              <TouchableOpacity className="p-2" onPress={() => { setUserId(''); setPin(''); SecureStore.deleteItemAsync('userId'); SecureStore.deleteItemAsync('pin'); }}>
                <Ionicons name="log-out" size={18} color="black" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity className="p-2" onPress={() => setShowLoginModal(true)}>
                <Ionicons name="log-in" size={18} color="black" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
      {isEditing ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TextInput
            className="p-[30px] text-black bg-white text-normal min-h-[200px]"
            multiline
            value={markdown}
            onChangeText={setMarkdown}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            keyboardType="ascii-capable"
            textAlignVertical="top"
          />
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          <WebView
            className="mt-10"
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ uri: localHtmlPath }}
            baseUrl={`${FileSystem.documentDirectory}notes/`}
            allowFileAccess={true}
            mixedContentMode="always"
            style={{ flex: 1, backgroundColor: '#000' }}
            onMessage={handleMessage}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
            domStorageEnabled={true}
            javaScriptEnabled={true}
          />
          {!markdownLoaded ? (
            <View style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 10
            }}>
              <ActivityIndicator size="large" color="#000000" />
              <Text style={{ color: '#000', marginTop: 10 }}>Loading Markdown...</Text>
            </View>
          ) : null}
        </View>
      )}
      <Modal visible={showChannelModal} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-5 rounded-lg w-3/4">
            <Text className="text-lg font-bold mb-4">Select Channel</Text>
            <TouchableOpacity
              className="p-2 border-b"
              onPress={() => handleChannelSelect('default')}
            >
              <Text>Default</Text>
            </TouchableOpacity>
            {channels.map(channel => (
              <View key={channel.id} className="p-2 border-b flex-row justify-between items-center">
                <TouchableOpacity
                  onPress={() => handleChannelSelect(channel.id)}
                  className="flex-1"
                >
                  <Text>{channel.name} ({channel.type})</Text>
                </TouchableOpacity>
                {channel.canDelete && (
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => handleDeleteChannel(channel.id)}
                  >
                    <Ionicons name="trash" size={18} color="red" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              className="p-2 mt-4 bg-gray-200 rounded"
              onPress={() => setShowChannelModal(false)}
            >
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showUploadModal} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-5 rounded-lg w-3/4">
            <Text className="text-lg font-bold mb-4">Upload Note</Text>
            <Text className="mb-2">User: {userId}</Text>
            <View className="flex-row items-center mb-4">
              <Text className="mr-2">Public</Text>
              <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>
            <TouchableOpacity
              className="p-2 bg-blue-500 rounded"
              onPress={handleUpload}
            >
              <Text className="text-white text-center">Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="p-2 mt-2 bg-gray-200 rounded"
              onPress={() => setShowUploadModal(false)}
            >
              <Text className="text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showLoginModal} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-5 rounded-lg w-3/4">
            <Text className="text-lg font-bold mb-4">Login</Text>
            <TextInput
              className="border p-2 mb-2"
              placeholder="User ID"
              value={userId}
              onChangeText={setUserId}
            />
            <TextInput
              className="border p-2 mb-2"
              placeholder="PIN"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
            />
            <TouchableOpacity
              className="p-2 bg-blue-500 rounded"
              onPress={handleLogin}
            >
              <Text className="text-white text-center">Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="p-2 mt-2 bg-gray-200 rounded"
              onPress={() => setShowLoginModal(false)}
            >
              <Text className="text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default NotesPage;