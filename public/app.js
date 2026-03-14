
const userBadge = document.getElementById("userBadge");
const adminLink = document.getElementById("adminLink");

async function checkSession() {
  try {
    const response = await fetch("/api/session");

    if (!response.ok) {
      window.location.href = "/login.html";
      return;
    }

    const data = await response.json();

    if (!data.loggedIn) {
      window.location.href = "/login.html";
      return;
    }

    if (userBadge) {
      userBadge.textContent = "Usuario: " + data.user.username;
    }

    if (adminLink) {
      adminLink.hidden = !(data.user && data.user.role === "admin");
    }
  } catch (error) {
    window.location.href = "/login.html";
  }
}

checkSession();

function proxifyChannelUrl(url, type) {
  if (!url || typeof url !== "string") return url;

  const isHttp = url.startsWith("http://");
  const isHls = type === "hls" || url.toLowerCase().includes(".m3u8");

  if (isHttp && isHls) {
    return "/proxy/hls?url=" + encodeURIComponent(url);
  }

  if (isHttp) {
    return "/proxy/file?url=" + encodeURIComponent(url);
  }

  return url;
}

const CHANNELS = [
  { name: "ESPN 1", category: "deportes espn", url: "http://167.17.67.240:8888/Espn1/tracks-v1a1/mono.m3u8", type: "hls" },
  { name: "ESPN 2", category: "deportes espn", url: "http://167.17.67.240:8888/Espn2/tracks-v1a1/mono.m3u8", type: "hls" },
  { name: "ESPN 3", category: "deportes espn", url: "http://167.17.67.240:8888/Espn3/tracks-v1a1/mono.m3u8", type: "hls" },
  { name: "ESPN 4", category: "deportes espn", url: "http://167.17.67.240:8888/Espn4/tracks-v1a1/mono.m3u8", type: "hls" },
  { name: "ESPN 5", category: "deportes espn", url: "http://167.17.67.240:8888/Espn5/tracks-v1a1/mono.m3u8", type: "hls" },
  { name: "ESPN 6", category: "deportes espn", url: "http://167.17.67.240:8888/Espn6/tracks-v1a1/mono.m3u8", type: "hls" },
  { name: "ESPN 7", category: "deportes espn", url: "http://167.17.67.240:8888/Espn7/tracks-v1a1/mono.m3u8", type: "hls" },
  { name: "Win Sports", category: "Win Sport", url: "http://167.17.67.240:8888/WINSPORTSHDECUA/tracks-v1a1/mono.m3u8", type: "hls" },
  { name: "Win Sports +", category: "Win Sport", url: "http://167.17.67.240:8888/WINMASHDECUADOR/tracks-v1a1/mono.m3u8", type: "hls" },
  { name: "Dsports", category: "Dgo", url: "http://167.17.67.240:8888/Dsportsmas/tracks-v1a1/mono.m3u8", type: "hls" },
  { name: "Dsports+", category: "Dgo", url: "http://167.17.67.240:8888/DSPORTS/tracks-v1a1/mono.m3u8", type: "hls" },
  { name: "Dsports2", category: "Dgo", url: "http://167.17.67.240:8888/dsport2colombia/tracks-v1a1/mono.m3u8", type: "hls" }
];

const CHANNELS_PROXIED = CHANNELS.map((channel) => ({
  ...channel,
  url: proxifyChannelUrl(channel.url, channel.type)
}));

const CHANNEL_COLORS = [
  { match: "espn", color: "linear-gradient(135deg, #d90429, #ff4d6d)" },
  { match: "fox", color: "linear-gradient(135deg, #0038a8, #3a86ff)" },
  { match: "tnt", color: "linear-gradient(135deg, #ff7b00, #ffb703)" },
  { match: "dazn", color: "linear-gradient(135deg, #111111, #333333)" },
  { match: "win", color: "linear-gradient(135deg, #00a651, #25d366)" },
  { match: "tudn", color: "linear-gradient(135deg, #008f5a, #00c46a)" },
  { match: "sky", color: "linear-gradient(135deg, #0057b8, #00a8ff)" },
  { match: "bein", color: "linear-gradient(135deg, #5a189a, #9d4edd)" },
  { match: "dsports", color: "linear-gradient(135deg, #1b4fd6, #4ea8ff)" },
  { match: "directv", color: "linear-gradient(135deg, #1b4fd6, #4ea8ff)" }
];

const CHANNEL_LOGOS = [
  { match: "espn", file: "img/espn.png", alt: "ESPN" },
  { match: "fox sports", file: "img/fox-sports.png", alt: "FOX Sports" },
  { match: "tnt sports", file: "img/tnt-sports.png", alt: "TNT Sports" },
  { match: "dazn", file: "img/dazn.png", alt: "DAZN" },
  { match: "win", file: "img/win-sports.png", alt: "Win Sports" },
  { match: "tudn", file: "img/tudn.png", alt: "TUDN" },
  { match: "directv", file: "img/directv-sports.png", alt: "DirecTV Sports" },
  { match: "dsports", file: "img/directv-sports.png", alt: "DirecTV Sports" },
  { match: "bein", file: "img/bein-sports.png", alt: "beIN Sports" },
  { match: "sky", file: "img/sky-sports.png", alt: "Sky Sports" }
];

let currentHls = null;
let userInteracted = false;
let infoTimeout = null;
let searchTimeout = null;
let iptvBarTimer = null;

const video = document.getElementById("streamVideo");
const leftContainer = document.getElementById("categoriaContainer");
const rightContainer = document.getElementById("categoriaContainerDerecha");
const searchInput = document.getElementById("searchInput");
const channelInfo = document.getElementById("channelInfo");
const currentChannelName = document.getElementById("currentChannelName");
const currentChannelCategory = document.getElementById("currentChannelCategory");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const iptvBottomBar = document.getElementById("iptvBottomBar");
const iptvChannelName = document.getElementById("iptvChannelName");
const iptvChannelCategory = document.getElementById("iptvChannelCategory");
const iptvStatus = document.getElementById("iptvStatus");
const iptvClock = document.getElementById("iptvClock");
const volverBtn = document.getElementById("volverBtn");
const soundBtn = document.getElementById("soundBtn");

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function getChannelColor(name) {
  const lower = name.toLowerCase();

  for (const c of CHANNEL_COLORS) {
    if (lower.includes(c.match)) {
      return c.color;
    }
  }

  return "linear-gradient(135deg, #00c2ff, #355cff)";
}

function getChannelLogo(channelName) {
  const name = channelName.toLowerCase();

  for (const logo of CHANNEL_LOGOS) {
    if (name.includes(logo.match)) {
      return logo;
    }
  }

  return null;
}

function showIptvBar() {
  if (!iptvBottomBar) return;

  iptvBottomBar.classList.remove("iptv-hidden");

  clearTimeout(iptvBarTimer);

  if (document.body.classList.contains("fullscreen-active")) {
    iptvBarTimer = setTimeout(() => {
      hideIptvBar();
    }, 3000);
  }
}

function hideIptvBar() {
  if (!iptvBottomBar) return;
  iptvBottomBar.classList.add("iptv-hidden");
}

function handleIptvBarInteraction() {
  showIptvBar();
}

function setIptvStatus(text, className = "") {
  if (!iptvStatus) return;

  iptvStatus.textContent = text;
  iptvStatus.className = "iptv-badge";

  if (className) {
    iptvStatus.classList.add(className);
  }
}

function updateIptvInfo(name, category) {
  if (iptvChannelName) {
    iptvChannelName.textContent = name || "Sin canal seleccionado";
  }

  if (iptvChannelCategory) {
    iptvChannelCategory.textContent = category || "Categoría";
  }
}

function updateChannelInfo(name, category) {
  if (currentChannelName) {
    currentChannelName.textContent = name;
  }

  if (currentChannelCategory) {
    currentChannelCategory.textContent = capitalize(category);
  }

  if (channelInfo) {
    channelInfo.style.display = "block";
  }

  updateIptvInfo(name, capitalize(category));
  setIptvStatus("EN VIVO", "iptv-status-live");

  clearTimeout(infoTimeout);
  infoTimeout = setTimeout(() => {
    if (channelInfo) {
      channelInfo.style.display = "none";
    }
  }, 4000);
}

function showLoadingIndicator() {
  hideLoadingIndicator();

  const streamContainer = document.getElementById("streamContainer");
  if (!streamContainer) return;

  const loader = document.createElement("div");
  loader.className = "loading-indicator";
  loader.innerHTML = '<div class="spinner"></div><p>Cargando transmisión...</p>';

  streamContainer.appendChild(loader);
}

function hideLoadingIndicator() {
  const loader = document.querySelector(".loading-indicator");
  if (loader) loader.remove();
}

function destroyCurrentHls() {
  if (currentHls) {
    currentHls.destroy();
    currentHls = null;
  }
}

function setPlayerMeta(channel) {
  updateIptvInfo(channel.name, capitalize(channel.category));
  setIptvStatus("CARGANDO", "iptv-status-buffer");
}

function setActiveChannel(button) {
  document.querySelectorAll(".canales button").forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");
  button.focus();
}

function attachNativeVideo(channel) {
  video.src = channel.url;
  video.load();

  const onCanPlay = () => {
    video.removeEventListener("canplay", onCanPlay);
    hideLoadingIndicator();

    video.play().catch(() => {});
  };

  video.addEventListener("canplay", onCanPlay);
}

function loadStream(channel) {
  if (!video) return;

  showLoadingIndicator();
  destroyCurrentHls();

  video.pause();
  video.muted = !userInteracted;

  setPlayerMeta(channel);
  updateChannelInfo(channel.name, channel.category);

  const isHls = channel.type === "hls" || channel.url.toLowerCase().includes(".m3u8");

  if (isHls) {
    if (window.Hls && Hls.isSupported()) {
      currentHls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        liveSyncDurationCount: 4,
        liveMaxLatencyDurationCount: 8,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 15000,
        levelLoadingTimeOut: 15000,
        fragLoadingRetryDelay: 1000,
        manifestLoadingRetryDelay: 1000,
        levelLoadingRetryDelay: 1000
      });

      currentHls.loadSource(channel.url);
      currentHls.attachMedia(video);

      currentHls.on(Hls.Events.MANIFEST_PARSED, () => {
        hideLoadingIndicator();
        video.play().catch(() => {});
      });

      currentHls.on(Hls.Events.ERROR, (event, data) => {
        if (!data.fatal) return;

        hideLoadingIndicator();
        setIptvStatus("ERROR", "iptv-status-error");

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            currentHls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            currentHls.recoverMediaError();
            break;
          default:
            destroyCurrentHls();
            alert("No se pudo cargar el stream HLS. Revisa la URL del canal.");
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      attachNativeVideo(channel);
    } else {
      hideLoadingIndicator();
      alert("Este navegador no soporta HLS.");
    }
  } else {
    attachNativeVideo(channel);
  }
}

if (video) {
  video.addEventListener("waiting", () => {
    setIptvStatus("BUFFER", "iptv-status-buffer");
    showLoadingIndicator();
  });

  video.addEventListener("playing", () => {
    setIptvStatus("EN VIVO", "iptv-status-live");
    hideLoadingIndicator();
  });

  video.addEventListener("pause", () => {
    if (!video.ended && video.currentTime > 0) {
      setIptvStatus("PAUSA", "iptv-status-pause");
    }
  });

  video.addEventListener("ended", () => {
    setIptvStatus("FIN", "iptv-status-pause");
  });

  video.addEventListener("error", () => {
    setIptvStatus("ERROR", "iptv-status-error");
    hideLoadingIndicator();
  });
}

function groupChannels(channels) {
  return channels.reduce((acc, channel) => {
    const category = (channel.category || "otros").toLowerCase();

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(channel);
    return acc;
  }, {});
}

function renderGroupedChannels(channels) {
  if (!leftContainer || !rightContainer) return;

  leftContainer.innerHTML = "";
  rightContainer.innerHTML = "";

  const grouped = groupChannels(channels);
  const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  if (!categories.length) {
    leftContainer.innerHTML = '<div class="empty-state">No se encontraron canales.</div>';
    rightContainer.innerHTML = "";
    return;
  }

  categories.forEach((category) => {
    const section = document.createElement("div");
    section.className = "categoria";

    const header = document.createElement("h3");
    header.textContent = "🎬 " + capitalize(category);
    header.tabIndex = 0;
    header.setAttribute("role", "button");
    header.setAttribute("aria-expanded", "false");

    const content = document.createElement("div");
    content.className = "canales";

    const toggle = () => {
      const allContents = document.querySelectorAll(".canales");
      const allHeaders = document.querySelectorAll(".categoria h3");
      const willOpen = !content.classList.contains("show");

      allContents.forEach((item) => item.classList.remove("show"));
      allHeaders.forEach((item) => item.setAttribute("aria-expanded", "false"));

      if (willOpen) {
        content.classList.add("show");
        header.setAttribute("aria-expanded", "true");
      }
    };

    header.addEventListener("click", toggle);
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });

    grouped[category].forEach((channel) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.channel = channel.name;
      button.tabIndex = 0;
      button.style.background = getChannelColor(channel.name);

      const logo = getChannelLogo(channel.name);

      if (logo) {
        button.innerHTML = `
          <span class="channel-btn-content">
            <img src="${logo.file}" alt="${logo.alt}" class="channel-logo">
            <span class="channel-label">${channel.type === "video" ? "⚽" : ""}${channel.name}</span>
          </span>
        `;
      } else {
        button.innerHTML = `
          <span class="channel-btn-content">
            <span class="channel-label">${channel.type === "video" ? "⚽" : ""}${channel.name}</span>
          </span>
        `;
      }

      button.addEventListener("click", () => {
        setActiveChannel(button);
        loadStream(channel);
      });

      content.appendChild(button);
    });

    section.appendChild(header);
    section.appendChild(content);
    leftContainer.appendChild(section);
  });

  rightContainer.innerHTML = "";
}

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      const term = event.target.value.trim().toLowerCase();

      if (!term) {
        renderGroupedChannels(CHANNELS_PROXIED);
        return;
      }

      const filtered = CHANNELS_PROXIED.filter((channel) => {
        return (
          channel.name.toLowerCase().includes(term) ||
          channel.category.toLowerCase().includes(term)
        );
      });

      renderGroupedChannels(filtered);
    }, 180);
  });
}

async function toggleFullscreen() {
  if (!fullscreenBtn) return;

  if (!document.fullscreenElement) {
    document.body.classList.add("fullscreen-active");
    fullscreenBtn.textContent = "Salir de completa";

    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.warn("No se pudo activar pantalla completa:", error);
    }

    showIptvBar();
  } else {
    document.body.classList.remove("fullscreen-active");
    fullscreenBtn.textContent = "Pantalla completa";

    try {
      await document.exitFullscreen();
    } catch (error) {
      console.warn("No se pudo salir de pantalla completa:", error);
    }

    clearTimeout(iptvBarTimer);
    if (iptvBottomBar) {
      iptvBottomBar.classList.remove("iptv-hidden");
    }
  }
}

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", toggleFullscreen);
}

document.addEventListener("fullscreenchange", () => {
  if (!fullscreenBtn) return;

  if (!document.fullscreenElement) {
    document.body.classList.remove("fullscreen-active");
    fullscreenBtn.textContent = "Pantalla completa";
    clearTimeout(iptvBarTimer);
    if (iptvBottomBar) {
      iptvBottomBar.classList.remove("iptv-hidden");
    }
  } else {
    showIptvBar();
  }
});

if (volverBtn) {
  volverBtn.addEventListener("click", () => {
    if (history.length > 1) {
      history.back();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

if (soundBtn && video) {
  soundBtn.addEventListener("click", () => {
    userInteracted = true;
    video.muted = false;
    video.volume = 1;
    video.play().catch(() => {});
  });
}

function handleFirstInteraction() {
  if (userInteracted || !video) return;
  userInteracted = true;
  video.muted = false;
  video.play().catch(() => {});
}

document.body.addEventListener("click", handleFirstInteraction, { once: true });
document.body.addEventListener("touchend", handleFirstInteraction, { once: true });

function getFocusableElements() {
  return Array.from(
    document.querySelectorAll(
      "#volverBtn, #fullscreenBtn, #infoBtn, #soundBtn, #searchInput, .categoria h3, .canales.show button"
    )
  ).filter((el) => !el.disabled && el.offsetParent !== null);
}

function moveFocus(direction) {
  const items = getFocusableElements();
  const currentIndex = items.indexOf(document.activeElement);

  if (currentIndex === -1) {
    if (items.length) items[0].focus();
    return;
  }

  if (direction === "next") {
    const next = items[currentIndex + 1] || items[0];
    next.focus();
  }

  if (direction === "prev") {
    const prev = items[currentIndex - 1] || items[items.length - 1];
    prev.focus();
  }
}

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowDown":
    case "ArrowRight":
      event.preventDefault();
      moveFocus("next");
      break;

    case "ArrowUp":
    case "ArrowLeft":
      event.preventDefault();
      moveFocus("prev");
      break;

    case "Enter":
      if (document.activeElement && typeof document.activeElement.click === "function") {
        document.activeElement.click();
      }
      break;
  }
});

window.addEventListener("load", () => {
  if (volverBtn) {
    volverBtn.focus();
  }
});

function startClock() {
  if (!iptvClock) return;

  const update = () => {
    const now = new Date();
    const time = now.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit"
    });
    iptvClock.textContent = time;
  };

  update();
  setInterval(update, 1000);
}

startClock();

document.addEventListener("mousemove", handleIptvBarInteraction);
document.addEventListener("keydown", handleIptvBarInteraction);
document.addEventListener("touchstart", handleIptvBarInteraction);
document.addEventListener("click", handleIptvBarInteraction);

renderGroupedChannels(CHANNELS_PROXIED);