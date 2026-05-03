// gift.js
(function () {
  const GIFT_REQUIRED_TIME = 7 * 60;
  const GIFT_STORAGE_KEY = "giftTimerProgress";
  const GIFT_CLAIMED_KEY = "giftClaimed";

  // Special Gift PDF
  const GIFT_FILE_URL = "https://m2zstudios.github.io/Special-PDF/Special-Handpicked-300-AI-Tools.pdf";

  let giftProgress = parseInt(localStorage.getItem(GIFT_STORAGE_KEY)) || 0;
  let giftClaimed = localStorage.getItem(GIFT_CLAIMED_KEY) === "true";
  let giftActive = !document.hidden;

  const giftScriptSrc = document.currentScript.src;
  const giftScriptDir = giftScriptSrc.substring(0, giftScriptSrc.lastIndexOf("/") + 1);

  // Widget
  const giftWidget = document.createElement("div");
  giftWidget.id = "gift-widget-container";
  giftWidget.innerHTML = `
    <div id="gift-widget-circle">
      <img id="gift-widget-image" src="${giftScriptDir}box.gif" alt="Gift Box">
      <div id="gift-widget-timer">07:00</div>
    </div>
  `;

  // Popup
  const giftPopup = document.createElement("div");
  giftPopup.id = "gift-popup-overlay";
  giftPopup.innerHTML = `
    <div id="gift-popup-shell">
      <button id="gift-popup-close-x">×</button>

      <div id="gift-popup-icon-wrap">
        <img id="gift-popup-icon" src="${giftScriptDir}box.gif" alt="Gift Box">
      </div>

      <h2 id="gift-popup-title">Special Gift 🎁</h2>

      <p id="gift-popup-description">
        Wait 7 minutes and unlock a special gift just for you!
      </p>

      <div id="gift-popup-timer-pill">
        <span id="gift-popup-clock">🕒</span>
        <span id="gift-popup-live-timer">07:00</span>
      </div>

      <a 
        id="gift-popup-link" 
        href="${GIFT_FILE_URL}" 
        target="_blank" 
        download="Special-Handpicked-300-AI-Tools.pdf"
      >
        Claim Your Gift
      </a>
    </div>
  `;

  document.body.appendChild(giftWidget);
  document.body.appendChild(giftPopup);

  // Styles
  const giftStyle = document.createElement("style");
  giftStyle.innerHTML = `
    /* Widget */
    #gift-widget-container {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 999999;
      cursor: pointer;
      font-family: Arial, sans-serif;
    }

    #gift-widget-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(10,10,10,0.92);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border: 2px solid rgba(255,255,255,0.08);
      box-shadow: 0 6px 18px rgba(0,0,0,0.32);
      transition: transform 0.25s ease;
    }

    #gift-widget-circle:hover {
      transform: scale(1.06);
    }

    #gift-widget-image {
      width: 30px;
      height: 30px;
      object-fit: contain;
      margin-bottom: 3px;
    }

    #gift-widget-timer {
      color: white;
      font-size: 13px;
      font-weight: bold;
      line-height: 1;
    }

    /* Popup Overlay */
    #gift-popup-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.78);
      z-index: 1000000;
      justify-content: center;
      align-items: center;
      font-family: Arial, sans-serif;
      padding: 16px;
    }

    /* Perfect Circular Popup */
    #gift-popup-shell {
      position: relative;
      width: 260px;
      height: 260px;
      border-radius: 50%;
      background: radial-gradient(circle at center, #131320 45%, #0b0b14 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 26px;
      color: white;
      border: 2px solid transparent;
      background-image:
        radial-gradient(circle at center, #131320 45%, #0b0b14 100%),
        linear-gradient(135deg, #ff4ecd, #7b61ff, #ff9f43);
      background-origin: border-box;
      background-clip: padding-box, border-box;
      box-shadow: 0 0 28px rgba(149, 76, 233, 0.32);
      box-sizing: border-box;
    }

    /* Close Button */
    #gift-popup-close-x {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.08);
      color: white;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Gift Icon */
    #gift-popup-icon {
      width: 52px;
      height: 52px;
      object-fit: contain;
      margin-bottom: 8px;
    }

    /* Title */
    #gift-popup-title {
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 8px;
      color: #ffb38a;
    }

    /* Description */
    #gift-popup-description {
      font-size: 11px;
      line-height: 1.45;
      color: rgba(255,255,255,0.88);
      max-width: 170px;
      margin: 0 0 12px;
    }

    /* Timer Pill */
    #gift-popup-timer-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 2px solid rgba(255,120,200,0.55);
      background: rgba(0,0,0,0.28);
      font-size: 18px;
      font-weight: bold;
    }

    #gift-popup-clock {
      font-size: 14px;
    }

    /* Claim Button */
    #gift-popup-link {
      display: none;
      margin-top: 14px;
      padding: 10px 16px;
      border-radius: 999px;
      background: linear-gradient(90deg, #7b61ff, #ff4ecd);
      color: white;
      text-decoration: none;
      font-size: 13px;
      font-weight: bold;
      box-shadow: 0 6px 16px rgba(123,97,255,0.3);
    }

    @media (max-width: 480px) {
      #gift-popup-shell {
        width: 230px;
        height: 230px;
      }

      #gift-popup-title {
        font-size: 15px;
      }

      #gift-popup-description {
        font-size: 10px;
        max-width: 155px;
      }

      #gift-popup-timer-pill {
        font-size: 16px;
      }
    }
  `;
  document.head.appendChild(giftStyle);

  const giftWidgetTimer = document.getElementById("gift-widget-timer");
  const giftPopupOverlay = document.getElementById("gift-popup-overlay");
  const giftPopupTitle = document.getElementById("gift-popup-title");
  const giftPopupDescription = document.getElementById("gift-popup-description");
  const giftPopupLiveTimer = document.getElementById("gift-popup-live-timer");
  const giftPopupLink = document.getElementById("gift-popup-link");

  function giftFormatTime(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function giftUpdateAllTimers() {
    if (giftClaimed) {
      giftWidgetTimer.textContent = "🎁";
      giftPopupLiveTimer.textContent = "Unlocked!";
      return;
    }

    const remaining = Math.max(GIFT_REQUIRED_TIME - giftProgress, 0);
    const formattedTime = giftFormatTime(remaining);

    giftWidgetTimer.textContent = formattedTime;
    giftPopupLiveTimer.textContent = formattedTime;

    if (giftProgress >= GIFT_REQUIRED_TIME) {
      giftUnlockReward();
    }
  }

  function giftUnlockReward() {
    giftClaimed = true;
    localStorage.setItem(GIFT_CLAIMED_KEY, "true");

    giftWidgetTimer.textContent = "🎁";
    giftPopupTitle.textContent = "Gift Unlocked! 🎉";
    giftPopupDescription.textContent = "Your handpicked special PDF is ready.";
    giftPopupLiveTimer.textContent = "Unlocked!";
    giftPopupLink.style.display = "inline-block";
  }

  // Widget click
  giftWidget.addEventListener("click", () => {
    if (giftClaimed) {
      giftPopupTitle.textContent = "Gift Unlocked! 🎉";
      giftPopupDescription.textContent = "Your handpicked special PDF is ready.";
      giftPopupLink.style.display = "inline-block";
    } else {
      giftPopupTitle.textContent = "Special Gift 🎁";
      giftPopupDescription.textContent = "Wait 7 minutes and unlock a special gift just for you!";
      giftPopupLink.style.display = "none";
    }

    giftUpdateAllTimers();
    giftPopupOverlay.style.display = "flex";
  });

  // Close popup
  document.getElementById("gift-popup-close-x").addEventListener("click", () => {
    giftPopupOverlay.style.display = "none";
  });

  // Visibility tracking
  document.addEventListener("visibilitychange", () => {
    giftActive = !document.hidden;
  });

  // Timer loop
  setInterval(() => {
    if (!giftClaimed && giftActive && giftProgress < GIFT_REQUIRED_TIME) {
      giftProgress++;
      localStorage.setItem(GIFT_STORAGE_KEY, giftProgress);
      giftUpdateAllTimers();
    }
  }, 1000);

  giftUpdateAllTimers();
})();