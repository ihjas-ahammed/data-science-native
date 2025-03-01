// NotesPage.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';

// URLs for KaTeX files
const KATEX_JS_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js';
const KATEX_CSS_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css';

// Custom index.html content
const INDEX_HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="katex.min.css">
    <script src="katex.min.js"></script>
    <style>
        body { margin: 0; padding: 10px; }
    </style>
</head>
<body>
    <div id="math"></div>
    <script>
        window.addEventListener('message', event => {
            const latex = event.data;
            document.getElementById('math').innerHTML = katex.renderToString(latex, {
                throwOnError: false,
                displayMode: latex.includes('$$'),
            });
        });
    </script>
</body>
</html>
`;

const NotesPage = () => {
  const webViewRef = useRef(null);
  const [localHtmlPath, setLocalHtmlPath] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupFiles = async () => {
      // Define paths in the internal data folder
      const dataDir = RNFS.DocumentDirectoryPath + '/katex_files';
      const jsPath = dataDir + '/katex.min.js';
      const cssPath = dataDir + '/katex.min.css';
      const htmlPath = dataDir + '/index.html';

      try {
        // Create the directory if it doesn’t exist
        await RNFS.mkdir(dataDir);

        // Download katex.min.js if it doesn’t exist (first run only)
        if (!(await RNFS.exists(jsPath))) {
          const jsDownload = await RNFS.downloadFile({
            fromUrl: KATEX_JS_URL,
            toFile: jsPath,
          }).promise;
          if (jsDownload.statusCode !== 200) throw new Error('Failed to download katex.min.js');
        }

        // Download katex.min.css if it doesn’t exist (first run only)
        if (!(await RNFS.exists(cssPath))) {
          const cssDownload = await RNFS.downloadFile({
            fromUrl: KATEX_CSS_URL,
            toFile: cssPath,
          }).promise;
          if (cssDownload.statusCode !== 200) throw new Error('Failed to download katex.min.css');
        }

        // Write index.html to the internal data folder (overwrite or create)
        await RNFS.writeFile(htmlPath, INDEX_HTML_CONTENT, 'utf8');

        // Set the local HTML path for WebView
        setLocalHtmlPath(`file://${htmlPath}`);
      } catch (error) {
        console.error('Error setting up KaTeX files:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setupFiles();
  }, []);

  // Function to send LaTeX to WebView for rendering
  const renderMath = (latex) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(latex);
    }
  };

  if (isLoading) {
    return <Text>Loading KaTeX files...</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ uri: localHtmlPath }}
        style={{ flex: 1 }}
        onLoad={() => renderMath('$$E = mc^2$$')} // Example LaTeX rendering
      />
    </View>
  );
};

export default NotesPage;