const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];

// Permettre l'ouverture du panneau latéral au clic sur l'icône de l'extension
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Intercepter les requêtes réseau
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId < 0) return;

    const url = details.url;
    let isImage = false;

    // 1. Vérification par le Content-Type HTTP
    if (details.responseHeaders) {
      const contentTypeHeader = details.responseHeaders.find(
        h => h.name.toLowerCase() === 'content-type'
      );
      if (contentTypeHeader && contentTypeHeader.value.toLowerCase().startsWith('image/')) {
        isImage = true;
      }
    }

    // 2. Vérification par le type de requête
    if (!isImage && details.type === 'image') {
      isImage = true;
    }

    // 3. Vérification de secours sur l'URL
    if (!isImage) {
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname.toLowerCase();
        isImage = imageExtensions.some(ext => pathname.endsWith(ext));
      } catch (e) {
        const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
        isImage = imageExtensions.some(ext => cleanUrl.endsWith(ext));
      }
    }

    if (isImage) {
      chrome.storage.local.get({ capturedImages: [] }, (data) => {
        let images = data.capturedImages;

        if (!images.includes(url)) {
          images.push(url);

          chrome.storage.local.set({ capturedImages: images }, () => {
            chrome.runtime.sendMessage({
              type: "NEW_IMAGE",
              url: url
            }).catch(() => {});
          });
        }
      });
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Gérer les communications
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_IMAGES") {
    chrome.storage.local.get({ capturedImages: [] }, (data) => {
      sendResponse({ images: data.capturedImages });
    });
    return true;
  }
  
  if (request.type === "CLEAR_IMAGES") {
    chrome.storage.local.set({ capturedImages: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});