document.addEventListener("DOMContentLoaded", async () => {
    const gallery = document.getElementById("gallery");
    const countBadge = document.getElementById("count");
    const clearBtn = document.getElementById("clear-btn");
    let count = 0;
  
    function updateCount(val) {
      count = val;
      countBadge.textContent = count;
    }
  
    // Charger toutes les images enregistrées en arrière-plan
    chrome.runtime.sendMessage({ type: "GET_IMAGES" }, (response) => {
      if (response && response.images) {
        response.images.forEach(url => addImage(url, false));
        updateCount(response.images.length);
      }
    });
  
    // Écouter les nouvelles images en direct
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "NEW_IMAGE") {
        addImage(message.url, true);
      }
    });
  
    // Gérer le clic sur le bouton Purger
    clearBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "CLEAR_IMAGES" }, (response) => {
        if (response && response.success) {
          gallery.innerHTML = "";
          updateCount(0);
        }
      });
    });
  
    function addImage(url, increment = false) {
      if (document.querySelector(`img[src="${CSS.escape(url)}"]`)) return;
  
      const card = document.createElement("div");
      card.className = "image-card";
  
      // Ouvrir l'image dans un nouvel onglet de la même fenêtre
      card.addEventListener("click", () => {
        chrome.tabs.create({ url: url });
      });
  
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Image";
  
      const label = document.createElement("div");
      label.className = "image-url";
      label.textContent = url.split('/').pop().split('?')[0] || "image";
      label.title = url;
  
      card.appendChild(img);
      card.appendChild(label);
      gallery.appendChild(card);
  
      if (increment) {
        updateCount(count + 1);
      }
    }
  });