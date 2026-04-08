
const userBadge = document.getElementById("userBadge");
const adminLink = document.getElementById("adminLink");

let demoTimerInterval = null;

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

    const popup = document.getElementById("diasRestantesPopup");
    const texto = document.getElementById("diasRestantesTexto");
    const demoTimer = document.getElementById("demoTimer");
    const cerrar = document.getElementById("cerrarPopup");
    const demoBadge = document.getElementById("demoBadge");

    if (demoTimer) {
      demoTimer.textContent = "";
    }

    if (data.user.expires_at && popup && texto && demoTimer && demoBadge) {
      const expires = new Date(data.user.expires_at);
      
      texto.textContent = "Tiempo restante del demo:";
      popup.hidden = false;
      demoBadge.hidden = false;
      
      if (demoTimerInterval) {
        clearInterval(demoTimerInterval);
      }
      
      const updateDemoTimer = () => {
        const now = new Date();
        const diff = expires - now;
        
      if (diff <= 0) {
        demoExpired = true;

        demoTimer.textContent = "Demo finalizado";
        demoBadge.textContent = "Demo finalizado";
        demoBadge.className = "demo-badge demo-danger";

        destroyCurrentHls();

        const video = document.getElementById("streamVideo");
        if (video) {
          video.pause();
          video.removeAttribute("src");
          video.load();
          video.controls = false;
        }

        document.querySelectorAll(".canales button").forEach((btn) => {
          btn.disabled = true;
        });

        texto.textContent = "❌ Tu demo ha finalizado. Contacta a tu vendedor.";
        popup.hidden = false;

        if (demoTimerInterval) {
          clearInterval(demoTimerInterval);
          demoTimerInterval = null;
        }

        return;
      }

    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    demoTimer.textContent = `${minutes}m ${seconds}s`;
    demoBadge.textContent = `Demo: ${minutes}m ${String(seconds).padStart(2, "0")}s`;

    if (minutes < 5) {
      demoBadge.className = "demo-badge demo-danger";
    } else if (minutes < 10) {
      demoBadge.className = "demo-badge demo-warning";
    } else {
      demoBadge.className = "demo-badge";
    }
  };

  updateDemoTimer();
  demoTimerInterval = setInterval(updateDemoTimer, 1000);
}

    if (data.user.end_date && popup && texto && !data.user.expires_at) {
      const hoy = new Date();
      const fin = new Date(data.user.end_date);
      const dias = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));

      if (dias === 1) {
        texto.textContent = "⚠️ Tu servicio vence mañana. Contacta a tu Vendedor.";
        popup.hidden = false;
      }

      if (dias <= 0) {
        serviceExpired = true;

        texto.textContent = "❌ Tu servicio está vencido. Contacta a tu Vendedor.";
        popup.hidden = false;

        destroyCurrentHls();

        const video = document.getElementById("streamVideo");
        if (video) {
          video.pause();
          video.removeAttribute("src");
          video.load();
          video.controls = false;
        }

        document.querySelectorAll(".canales button").forEach((btn) => {
          btn.disabled = true;
        });
      }
    }

    if (cerrar && popup) {
      cerrar.onclick = async () => {
        popup.hidden = true;

        if (demoExpired || serviceExpired) {
          try {
            await fetch("/logout", { method: "POST" });
          } catch (e) {}

          window.location.href = "/login.html";
        }
      };
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
  { name: " ESPN 1 " , category: " deportes espn " , url: " https://8c51.streameasthd.net/espn/tracks-v1a1/mono.m3u8?ip=186.113.151.136&token=f35b2caaf35c8cd69e87f8c624b92be0a1b1414f-68-1775693955-1775639955 " , type: " hls " }, 
  { name: " ESPN 2 " , category: " deportes espn " , url: " https://14c51.streameasthd.net/espn2/tracks-v1a1/mono.m3u8?ip=186.113.151.136&token=1f79ce145a0bd19c42cb3766e47b48d0c4460528-1e-1775695850-1775641850 " , type: " hls " }, 
  { name: " ESPN 3 " , category: " deportes espn " , url: " https://8c51.streameasthd.net/espn3/tracks-v1a1/mono.m3u8?ip=186.113.151.136&token=a4911c18922b00ae16547194afa6ec699527f9e5-7a-1775695898-1775641898 " , type: " hls " }, 
  { name: " ESPN 4 " , category: " deportes espn " , url: " https://8c51.streameasthd.net/espn4/tracks-v1a1/mono.m3u8?ip=186.113.151.136&token=21d892a5c0ec536ec3b8b83f48dbb0eb2cc656d2-f0-1775695939-1775641939 " , type: " hls " }, 
  { name: " ESPN 5 " , category: " deportes espn " , url: " https://8c51.streameasthd.net/espn5/tracks-v1a1/mono.m3u8?ip=186.113.151.136&token=02cbc0ad36ff72a6920d90922dfff454d4c737ba-a3-1775695979-1775641979 " , type: " hls " }, 
  { name: " ESPN 6 " , category: " deportes espn " , url: " https://98ca2.streameasthd.net/espn6/tracks-v1a1/mono.m3u8?ip=186.113.151.136&token=d1fece55bb61d9b5ff784808d7294f8a08e233b7-5c-1775696018-1775642018 " , type: " hls " }, 
  { name: " ESPN 7 " , category: " deportes espn " , url: " https://14c51.streameasthd.net/espn7/tracks-v1a1/mono.m3u8?ip=186.113.151.136&token=6b662db60c53ebf58a2de7968b04a2ab7b82e711-58-1775696061-1775642061 " , type: " hls " }, 
  { name: " Win Sports " , category: " Win Sport " , url: " https://aw1wcm92zq.fubohd.com/winsports/mono.m3u8?token=c913b7a027c9ddf99e879927997f154f8df5279c-68-1775668291-1775650291 " , type: " hls " }, 
  { name: " Win Sports + " , category: " Win Sport " , url: " https://51a1.streameasthd.net/winplus2/tracks-v1a1/mono.m3u8?ip=186.113.151.136&token=34f7e0e52eef298cedc4edf2a41ab689e7a4041a-8f-1775696270-1775642270 " , type: " hls " }, 
  { name: " Dsports " , category: " Dgo " , url: " https://14c51.streameasthd.net/dsports/tracks-v1a1/mono.m3u8?ip=186.113.151.136&token=12f7c0568157f79072088ca10e23d37892bce009-fb-1775696418-1775642418 " , type: " hls " }, 
  { name: " Dsports2 " , category: " Dgo " , url: " https://qzv4jmsc.fubohd.com/dsports2/mono.m3u8?token=3e9799ef99cb52d2b9e19ff388d8bfd5059cdd8b-bc-1775668587-1775650587 " , type: " hls " }, 
  { name: " Dsports+ " , category: " Dgo " , url: " https://8c51.streameasthd.net/dsportsplus/tracks-v1a1/mono.m3u8?ip=186.113.151.136&token=e267c55e4241b8cc31acf0e0a22af928be03d315-55-1775696587-1775642587 " , type: " hls " }, 
  { name: " Fox Sports 1 ARG " , category: " Fox Sports " , url: " https://98ca2.streameasthd.net/fox1ar/tracks-v1a1/mono.m3u8?ip=186.113.151.136&token=d37a9ca006b872292c7122eb636900727912e187-fc-1775696678-1775642678 " , type: " hls " }, 
  { name: " Fox Sports 2 ARG " , category: " Fox Sports " , url: " https://ag9wzq.fubohd.com/foxsports2/mono.m3u8?token=21aa11dc29bb51a72a9de2ab40ea1299ea89da25-13-1775668821-1775650821 " , type: " hls " }, 
  { name: " Fox Sports 3 ARG " , category: " Fox Sports " , url: " https://x4bnd7lq.fubohd.com/foxsports3/mono.m3u8?token=b00f4dde854d78bb99034b7ba5774b868f95266a-39-1775668875-1775650875 " , type: " hls " }, 
  { name: " Fox Sports " , category: " Fox Sports " , url: " https://bgfuzq.fubohd.com/foxdeportes/mono.m3u8?token=3fdabb12d2945c56bd1dee4936a1feb80d88884b-5-1775668940-1775650940 " , type: " hls " }, 
  { name: " Dazn 1 " , category: " Dazn " , url: " https://rm8zcvk3.fubohd.com/espn/mono.m3u8?token=03f28953fd83a685ab385da9a0f6115e5edd1cfd-b5-1775634276-1775616276 " , type: " hls " }, 
  { name: " TNT Sports Premium " , category: " TNT Sports " , url: " https://rm8zcvk3.fubohd.com/tntsports/mono.m3u8?token=7942a883de06b83519b82403be888c77aad6b0c0-d0-1775632030-1775614030 " , type: " hls " }, 
  { name: " TyC Sports " , category: " TyC Sports " , url: " https://x4bnd7lq.fubohd.com/tycsports/mono.m3u8?token=9e1648147f4917bc62c50e88986a8b24493c61af-74-1775632262-1775614262 " , type: " hls " }, 
  { name: " L1 Max " , category: " L1max " , url: " https://14c51.streameasthd.net/liga1max/tracks-v1a1/mono.m3u8?ip=186.113.151.136&token=a7e66be8894ae0ebb20dd261e59bc959b581f45c-78-1775660300-1775606300 " , type: " hls " }, 
  { name: " Caracol " , category: " Nacionales " , url: " https://wp9xqedt.fubohd.com/caracol/mono.m3u8?token=7b007581a6d7aebd1c86fe9fd131250b73be42db-a4-1775669313-1775651313 " , type: " hls " }, 
  { name: " RCN " , category: " Nacionales " , url: " https://hls.tdtcloud.xyz/hls/rcnhd/index.m3u8?token=lz5QjFrPfFb0gKftPHD2dw&expires=1775630989 " , type: " hls " }, 
];

const CHANNELS_PROXIED = CHANNELS.map((channel) => ({
  ...channel,
  url: proxifyChannelUrl(channel.url, channel.type)
}));

const CHANNEL_COLORS = [
  { match: "espn", color: "linear-gradient(135deg, #d90429, #ff4d6d)" },
  { match: "fox", color: "linear-gradient(135deg, #0038a8, #3a86ff)" },
  { match: "tnt", color: "linear-gradient(135deg, #6601b962, #f703ff)" },
  { match: "dazn", color: "linear-gradient(135deg, #807d7d, #111111)" },
  { match: "win", color: "linear-gradient(135deg, #ff6803, #386b72)" },
  { match: "tudn", color: "linear-gradient(135deg, #008f5a, #00c46a)" },
  { match: "sky", color: "linear-gradient(135deg, #0057b8, #00a8ff)" },
  { match: "bein", color: "linear-gradient(135deg, #5a189a, #9d4edd)" },
  { match: "dsports", color: "linear-gradient(135deg, #1b4fd6, #4ea8ff)" },
  { match: "directv", color: "linear-gradient(135deg, #1b4fd6, #4ea8ff)" },
  { match: "ecdf", color: "linear-gradient(135deg, #d90429, #ff4d6d)" },
  { match: "ftv", color: "linear-gradient(135deg, #d90429, #ff4d6d)" },
  { match: "l1", color: "linear-gradient(135deg, #d90429, #ff4d6e57)" },
  { match: "movistar", color: "linear-gradient(135deg, #84c5fa, #00a8ff)" },
  { match: "caracol", color: "linear-gradient(135deg, #585be9, #234a5e)" },
  { match: "tigo", color: "linear-gradient(135deg, #1b1ee7, #e7eb13)" },
  { match: "tyc", color: "linear-gradient(135deg, #010497, #fafaf8)" }
];

const CHANNEL_LOGOS = [
  { match: "espn", file: "img/espn.png", alt: "ESPN" },
  { match: "fox sports", file: "img/fox-sports.png", alt: "FOX Sports" },
  { match: "tnt sports", file: "img/tnt.png", alt: "TNT Sports" },
  { match: "dazn", file: "img/dazn.png", alt: "DAZN" },
  { match: "win", file: "img/win-sports.png", alt: "Win Sports" },
  { match: "tudn", file: "img/tudn.png", alt: "TUDN" },
  { match: "directv", file: "img/directv-sports.png", alt: "DirecTV Sports" },
  { match: "dsports", file: "img/directv-sports.png", alt: "DirecTV Sports" },
  { match: "bein", file: "img/bein-sports.png", alt: "beIN Sports" },
  { match: "sky", file: "img/sky.png", alt: "Sky Sports" },
  { match: "ecdf", file: "img/ecdf.jpg", alt: "ecdf" },
  { match: "ftv", file: "img/ftv.png", alt: "ftv" },
  { match: "l1 max", file: "img/l1max.png", alt: "L1 MAX" },
  { match: "movistar", file: "img/movistartv.png", alt: "Movistar" },
  { match: "caracol", file: "img/caracol.png", alt: "Caracol" },
  { match: "rcn", file: "img/rcn.png", alt: "rcn" },
  { match: "tigo", file: "img/tigo.png", alt: "tigo" },
  { match: "tyc", file: "img/tyc.png", alt: "tyc" }
];

let currentHls = null;
let userInteracted = false;
let infoTimeout = null;
let searchTimeout = null;
let iptvBarTimer = null;
let activeChannel = null;
let stalledRefreshTimer = null;
let demoExpired = false;
let serviceExpired = false;

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
const refreshBtn = document.getElementById("refreshBtn");

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
  if (demoExpired || serviceExpired) return;

  activeChannel = channel;

if (stalledRefreshTimer) {
  clearTimeout(stalledRefreshTimer);
  stalledRefreshTimer = null;
}

  showLoadingIndicator();
  destroyCurrentHls();

  video.pause();
  video.muted = !userInteracted;

  setPlayerMeta(channel);
  updateChannelInfo(channel.name, channel.category);

  if (window.innerWidth <= 768) {
  setTimeout(async () => {
    try {
      if (video.requestFullscreen) {
        await video.requestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    } catch (error) {}
  }, 500);
}

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

    if (activeChannel) {
      setTimeout(() => {
        destroyCurrentHls();
        video.pause();
        video.removeAttribute("src");
        video.load();
        loadStream(activeChannel);
      }, 2000);
    }
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
    header.textContent = "⚽ " + capitalize(category);
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
    if (demoExpired || serviceExpired) return;

    userInteracted = true;
    video.muted = false;
    video.volume = 1;
    video.play().catch(() => {});
  });
}

if (refreshBtn && video) {
  refreshBtn.addEventListener("click", () => {
    if (!activeChannel) return;

    destroyCurrentHls();
    video.pause();
    video.removeAttribute("src");
    video.load();

    loadStream(activeChannel);
  });
}

function handleFirstInteraction() {
  if (demoExpired || serviceExpired || userInteracted || !video) return;
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
