(function () {
  const ACTS = ["actI", "actII", "actIII"];
  const COVER_WEB = {
    actI: "ui/cover-act1.webp",
    actII: "ui/cover-act2.webp",
    actIII: "ui/cover-act3.webp"
  };
  const CITY_SRC = {
    actI: "Background_Album1.jpg",
    actII: "Background_Album2.jpg",
    actIII: "Background_Album3.jpg"
  };
  const BOOT_LINES = [
    "WONDU // ORACLE",
    "> Wondu Presents",
    "> The Oracle Paradox — A Cyberpunk Trilogy",
    "> ACT I    The Oracle",
    "> ACT II   Analog",
    "> ACT III  Emergence",
    "> System Status: ORACLE_INIT → ORACLE_BECOME //HUMAN",
    "> Select an album to begin"
  ];

  const $ = (id) => document.getElementById(id);
  const reduce = document.documentElement.classList.contains("reduce") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const homeEl = $("home");
  const deckEl = $("deck");
  const audioEl = $("audioEl");
  const tracklistEl = $("tracklist");
  const lyricsPanel = $("lyricsPanel");
  const artworkPanel = $("artworkPanel");
  const nowplayingEl = $("nowplaying");
  const bootEl = $("boot");
  const bootLog = $("bootLog");
  const bootFill = $("bootFill");

  let currentAct = null;
  let playingAct = null;
  let playingIndex = -1;
  let viewAct = null;
  let viewIndex = -1;
  let isPlaying = false;
  let isSeeking = false;
  let routing = false;

  document.documentElement.classList.add("js");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  function encodePath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
  }
  function fmtTime(sec) {
    if (!isFinite(sec) || sec == null) return "0:00";
    sec = Math.max(0, Math.floor(sec));
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }
  function counts(actKey) {
    const songs = DATA[actKey].songs;
    const inst = songs.filter((s) => s.instrumental).length;
    const lyric = songs.length - inst;
    return lyric + " Tracks · " + inst + " System Log" + (inst === 1 ? "" : "s");
  }

  ACTS.forEach((key) => {
    const el = $("count-" + key);
    if (el) el.textContent = counts(key);
  });

  function dismissBoot() {
    if (!bootEl || bootEl.hidden) return;
    bootEl.hidden = true;
    document.body.classList.remove("booting");
    try { sessionStorage.setItem("wondu-booted", "1"); } catch (e) {}
  }
  function runBoot() {
    if (document.documentElement.classList.contains("no-boot") || location.hash) {
      bootEl.hidden = true;
      document.body.classList.remove("booting");
      return;
    }
    document.body.classList.add("booting");
    let i = 0;
    const step = () => {
      if (bootEl.hidden) return;
      if (i < BOOT_LINES.length) {
        bootLog.textContent += (i ? "\n" : "") + BOOT_LINES[i];
        i += 1;
        bootFill.style.width = Math.round((i / BOOT_LINES.length) * 100) + "%";
        setTimeout(step, reduce ? 0 : 220);
      } else {
        setTimeout(dismissBoot, reduce ? 0 : 900);
      }
    };
    step();
  }
  $("bootSkip").addEventListener("click", (e) => { e.stopPropagation(); dismissBoot(); });
  bootEl.addEventListener("click", dismissBoot);
  runBoot();

  const canvas = $("grid");
  const ctx = canvas.getContext("2d", { alpha: true });
  let raf = 0;
  let accent = [57, 243, 229];
  const GLYPHS = ["0", "1", "#", "/", "\\", "◆", "△", "○"];
  const drops = Array.from({ length: 22 }, () => spawnDrop(true));
  function spawnDrop(anyY) {
    return {
      x: Math.random(),
      y: anyY ? Math.random() : -0.05,
      v: 0.08 + Math.random() * 0.22,
      g: GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
    };
  }
  function setAccent(act) {
    accent = act === "actII" ? [255, 45, 85] : act === "actIII" ? [214, 255, 58] : [57, 243, 229];
  }
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 800 ? 1 : 1.35);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function drawGrid(t) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    const horizon = h * 0.42;
    const vanishX = w * 0.5;
    ctx.lineWidth = 1;
    for (let i = -16; i <= 16; i++) {
      ctx.strokeStyle = "rgba(" + accent[0] + "," + accent[1] + "," + accent[2] + ",0.13)";
      ctx.beginPath();
      ctx.moveTo(vanishX, horizon);
      ctx.lineTo(vanishX + i * (w / 12), h);
      ctx.stroke();
    }
    const shift = reduce ? 0.35 : ((t * 0.00004) % 1);
    for (let i = 0; i < 14; i++) {
      const z = (i / 14 + shift) % 1;
      const y = horizon + Math.pow(z, 1.7) * (h - horizon);
      ctx.strokeStyle = "rgba(" + accent[0] + "," + accent[1] + "," + accent[2] + "," + (0.04 + z * 0.22) + ")";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    if (!reduce) {
      ctx.font = "12px Share Tech Mono, monospace";
      drops.forEach((d) => {
        d.y += d.v * 0.008;
        if (d.y > 1.05) Object.assign(d, spawnDrop(false));
        ctx.fillStyle = "rgba(" + accent[0] + "," + accent[1] + "," + accent[2] + ",0.28)";
        ctx.fillText(d.g, d.x * w, d.y * h);
      });
    }
  }
  function loop(t) {
    drawGrid(t || 0);
    if (!reduce && !document.hidden) raf = requestAnimationFrame(loop);
  }
  resizeCanvas();
  loop(0);
  window.addEventListener("resize", () => { resizeCanvas(); if (reduce) drawGrid(0); });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !reduce) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }
  });

  const pointerRing = document.querySelector(".pointer-ring");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (pointerRing && finePointer && !reduce) {
    document.documentElement.classList.add("fine-pointer");
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX;
      my = e.clientY;
      document.documentElement.classList.add("pointer-on");
      const hot = e.target && e.target.closest && e.target.closest("a, button, .track, input, label");
      document.documentElement.classList.toggle("pointer-hot", !!hot);
    });
    document.documentElement.addEventListener("mouseleave", () => {
      document.documentElement.classList.remove("pointer-on");
    });
    (function follow() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      pointerRing.style.transform = "translate(" + rx + "px," + ry + "px)";
      requestAnimationFrame(follow);
    })();
  }

  const fullscreenBtn = $("fullscreenBtn");
  const fullscreenIcon = $("fullscreenIcon");
  const EXPAND = '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>';
  const COMPRESS = '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>';
  function updateFullscreenIcon() {
    fullscreenIcon.innerHTML = document.fullscreenElement ? COMPRESS : EXPAND;
  }
  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  });
  document.addEventListener("fullscreenchange", updateFullscreenIcon);

  const cityEl = document.getElementById("city");
  const cityImgs = cityEl ? cityEl.querySelectorAll("img") : [];
  function setCity(actKey) {
    if (!cityEl) return;
    if (!actKey) {
      cityEl.hidden = true;
      return;
    }
    const src = CITY_SRC[actKey];
    const first = cityImgs[0];
    if (first.getAttribute("src") !== src) {
      cityImgs.forEach((img) => { img.src = src; });
    }
    const show = () => { cityEl.hidden = false; };
    if (first.complete && first.naturalWidth) show();
    else first.addEventListener("load", show, { once: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (cityEl) cityEl.classList.toggle("paused", document.hidden);
  });

  function showHome() {
    currentAct = null;
    document.body.classList.remove("in-deck");
    setCity(null);
    homeEl.hidden = false;
    deckEl.hidden = true;
    setAccent(null);
    document.title = "WONDU — The Oracle Paradox";
  }

  function setFeedHidden(hidden) {
    contentArea.querySelectorAll(".feed").forEach((el) => {
      el.setAttribute("aria-hidden", hidden ? "true" : "false");
    });
  }
  function revealFeeds() {
    contentArea.classList.add("open");
    setFeedHidden(false);
    if (reduce) return;
    [artworkPanel, lyricsPanel].forEach((el) => {
      el.classList.remove("arrive");
      void el.offsetWidth;
      el.classList.add("arrive");
    });
  }
  function standby(panel, label, text) {
    panel.innerHTML = '<div class="standby"><span>' + esc(label) + "</span><p>" + esc(text) + "</p></div>";
  }

  function renderTrack(song, actKey) {
    const row = document.createElement("div");
    row.className = "track" + (song.instrumental ? " instrumental" : "");
    row.setAttribute("role", "listitem");
    row.dataset.act = actKey;
    row.dataset.index = String(song.trackNum - 1);
    const tag = song.instrumental ? '<span class="track-tag">' + esc(song.note || "Instrumental") + "</span>" : "";
    row.innerHTML =
      '<span class="tnum">' + String(song.trackNum).padStart(2, "0") + "</span>" +
      '<span class="track-title-wrap"><span class="track-title">' + esc(song.title) + "</span>" + tag + "</span>" +
      '<button type="button" class="track-play" title="Play / Pause" aria-label="Play or pause ' + esc(song.title) + '">' +
        '<svg class="playicon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
        '<svg class="pauseicon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>' +
        '<span class="eq" aria-hidden="true"><span></span><span></span><span></span></span>' +
      "</button>";
    row.querySelector(".track-play").addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = song.trackNum - 1;
      if (playingAct === actKey && playingIndex === idx) {
        if (audioEl.paused) audioEl.play(); else audioEl.pause();
      } else {
        playTrack(actKey, idx);
      }
    });
    row.addEventListener("click", () => {
      if (window.innerWidth <= 860) {
        playTrack(actKey, song.trackNum - 1);
        return;
      }
      viewTrack(actKey, song.trackNum - 1, true);
      setHash(actKey, song.trackNum - 1, true);
    });
    return row;
  }

  function renderLyricsPanel(song) {
    if (!song) { standby(lyricsPanel, "Lyric Data", "Select a track"); return; }
    if (song.instrumental) {
      lyricsPanel.innerHTML =
        '<div class="instrumental-placeholder">' +
          '<div class="ring-pulse"></div>' +
          '<div class="ip-title">' + esc(song.title) + "</div>" +
          '<div class="ip-note">' + esc(song.note || "Instrumental") + " · No Lyrics</div>" +
        "</div>";
      return;
    }
    const sectionsHtml = song.sections.map((s) =>
      '<div class="lyrics-section"><div class="sec-label">[' + esc(s.label) + "]</div>" +
      s.lines.map((l) => "<p>" + esc(l) + "</p>").join("") + "</div>"
    ).join("");
    const plain = song.sections.map((s) => "[" + s.label + "]\n" + s.lines.join("\n")).join("\n\n");
    lyricsPanel.innerHTML =
      '<div class="lyrics-panel-head"><div>' +
        '<div class="lyrics-panel-title">' + esc(song.title) + "</div>" +
        '<div class="lyrics-panel-tag">Lyrics</div></div>' +
        '<button type="button" class="copy-btn">Copy lyrics</button></div>' +
      '<div class="lyrics">' + sectionsHtml + "</div>";
    lyricsPanel.querySelector(".copy-btn").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      let ok = false;
      try {
        await navigator.clipboard.writeText(plain);
        ok = true;
      } catch (err) {
        const ta = document.createElement("textarea");
        ta.value = plain;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
        ta.remove();
      }
      if (!ok) return;
      const orig = btn.textContent;
      btn.textContent = "Copied ✓";
      btn.classList.add("copied");
      setTimeout(() => { btn.textContent = orig; btn.classList.remove("copied"); }, 1400);
    });
  }

  function renderArtworkPanel(song) {
    if (!song) { standby(artworkPanel, "Visual Feed", "Select a track"); return; }
    const artSrc = encodePath(song.art);
    artworkPanel.innerHTML =
      '<div class="artwork-frame" id="artworkFrame">' +
        '<img src="' + esc(artSrc) + '" alt="' + esc(song.title) + '" id="artworkImg" decoding="async">' +
        '<div class="scan-sweep"></div>' +
        '<span class="brackets"></span>' +
      "</div>" +
      '<div class="artwork-caption">' + esc(song.caption || "") + "</div>";
    const img = $("artworkImg");
    img.addEventListener("error", () => {
      const frame = $("artworkFrame");
      if (!frame) return;
      frame.innerHTML =
        '<div class="artwork-placeholder"><div class="ring-pulse-art"></div><div class="ap-text">Artwork Coming Soon</div></div>';
    }, { once: true });
  }

  function refreshNowPlayingHighlight() {
    document.querySelectorAll(".track").forEach((t) => {
      const isThis = t.dataset.act === playingAct && parseInt(t.dataset.index, 10) === playingIndex;
      const isViewed = t.dataset.act === viewAct && parseInt(t.dataset.index, 10) === viewIndex;
      t.classList.toggle("current", isThis);
      t.classList.toggle("now-playing", isThis && isPlaying);
      t.classList.toggle("viewing", isViewed);
    });
  }

  function viewTrack(actKey, index, scroll) {
    if (!DATA[actKey] || !DATA[actKey].songs[index]) return;
    viewAct = actKey;
    viewIndex = index;
    const song = DATA[actKey].songs[index];
    renderLyricsPanel(song);
    renderArtworkPanel(song);
    refreshNowPlayingHighlight();
    const row = tracklistEl.querySelector('.track[data-index="' + index + '"]');
    if (row) {
      const parent = row.parentElement;
      const top = row.offsetTop;
      const bottom = top + row.offsetHeight;
      if (top < parent.scrollTop) parent.scrollTop = top - 4;
      else if (bottom > parent.scrollTop + parent.clientHeight) parent.scrollTop = bottom - parent.clientHeight + 4;
    }
    document.title = song.title + " — " + DATA[actKey].title + " — WONDU";
    if (window.innerWidth > 860) revealFeeds();
    fillMobileStage();
  }

  function openAlbum(actKey, index) {
    if (!DATA[actKey]) { showHome(); return; }
    currentAct = actKey;
    const act = DATA[actKey];
    const cover = $("playerCover");
    cover.src = COVER_WEB[actKey];
    cover.alt = act.title;
    cover.onerror = () => { cover.onerror = null; cover.src = COVERS[actKey]; };
    $("albumTitle").textContent = act.title;
    $("albumSub").textContent = ALBUM_META[actKey].desc;
    $("albumMeta").textContent = counts(actKey);
    $("deckKicker").textContent = act.title.split("—")[0].trim();
    deckEl.dataset.act = actKey;
    document.body.classList.add("in-deck");
    setCity(actKey);
    setAccent(actKey);
    homeEl.hidden = true;
    deckEl.hidden = false;
    tracklistEl.innerHTML = "";
    act.songs.forEach((song) => tracklistEl.appendChild(renderTrack(song, actKey)));
    if (contentArea.dataset.act !== actKey) {
      contentArea.classList.remove("open");
      setFeedHidden(true);
      contentArea.dataset.act = actKey;
      void contentArea.offsetWidth;
    }
    if (index > -1 && act.songs[index]) viewTrack(actKey, index, false);
    else {
      viewAct = null;
      viewIndex = -1;
      contentArea.classList.remove("open");
      setFeedHidden(true);
      standby(lyricsPanel, "Lyric Data", "Select a track");
      standby(artworkPanel, "Visual Feed", "Select a track");
      document.title = act.title + " — WONDU";
    }
    refreshNowPlayingHighlight();
    window.scrollTo(0, 0);
  }

  function parseHash() {
    const h = (location.hash || "").replace(/^#/, "");
    const m = /^(actI|actII|actIII)(?:\/(\d+))?$/.exec(h);
    if (!m) return null;
    return { act: m[1], index: m[2] != null ? parseInt(m[2], 10) : -1 };
  }
  function setHash(act, index, replace) {
    const want = act ? (index > -1 ? "#" + act + "/" + index : "#" + act) : "#";
    const cur = location.hash || "#";
    if (cur === want || (want === "#" && cur === "")) return;
    const url = location.pathname + location.search + (want === "#" ? "" : want);
    if (replace) history.replaceState(null, "", url);
    else location.hash = want === "#" ? "" : want.slice(1);
  }
  function applyRoute() {
    const route = parseHash();
    routing = true;
    if (!route) showHome();
    else openAlbum(route.act, route.index);
    routing = false;
  }
  window.addEventListener("hashchange", () => { if (!routing) applyRoute(); });

  document.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.getAttribute("data-open");
      location.hash = act;
    });
  });
  $("backBtn").addEventListener("click", () => {
    if (location.hash) location.hash = "";
    else showHome();
  });
  $("playAlbumBtn").addEventListener("click", () => {
    if (currentAct) playTrack(currentAct, 0);
  });

  const npStatus = $("np-status");
  const npPlayIcon = $("np-play-icon");
  const npSeek = $("np-seek");
  const npTime = $("np-time");
  const npDuration = $("np-duration");

  function syncBarPadding() {
    if (!document.body.classList.contains("has-player")) {
      document.body.style.paddingBottom = "";
      document.documentElement.style.scrollPaddingBottom = "";
      return;
    }
    const h = nowplayingEl.offsetHeight + 64;
    document.body.style.paddingBottom = h + "px";
    document.documentElement.style.scrollPaddingBottom = h + "px";
  }
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860 && nowplayingEl.classList.contains("collapsed")) setCollapsed(false);
    if (window.innerWidth > 860) closeMobileStage();
    syncBarPadding();
  });

  function setCollapsed(collapsed) {
    nowplayingEl.classList.toggle("collapsed", collapsed);
    $("npToggle").setAttribute("aria-expanded", collapsed ? "false" : "true");
    syncBarPadding();
  }
  const npToggle = $("npToggle");
  let npDragStartY = null;
  npToggle.addEventListener("pointerdown", (e) => {
    npDragStartY = e.clientY;
    npToggle.setPointerCapture(e.pointerId);
  });
  npToggle.addEventListener("pointerup", (e) => {
    if (npDragStartY === null) return;
    const deltaY = e.clientY - npDragStartY;
    if (Math.abs(deltaY) > 12) setCollapsed(deltaY > 0);
    else setCollapsed(!nowplayingEl.classList.contains("collapsed"));
    npDragStartY = null;
  });

  function playTrack(actKey, index) {
    const act = DATA[actKey];
    const song = act && act.songs[index];
    if (!song) return;
    playingAct = actKey;
    playingIndex = index;
    document.body.dataset.playing = actKey;
    if (currentAct !== actKey) openAlbum(actKey, index);
    else viewTrack(actKey, index, false);
    setHash(actKey, index, true);

    const cover = $("np-cover");
    cover.src = COVER_WEB[actKey];
    cover.alt = act.title;
    cover.onerror = () => { cover.onerror = null; cover.src = COVERS[actKey]; };
    $("np-title").textContent = song.title;
    $("np-album").textContent = act.title;
    document.body.classList.add("has-player");
    npStatus.textContent = "Loading…";
    npStatus.classList.remove("err");
    requestAnimationFrame(syncBarPadding);

    audioEl.src = encodePath(song.file);
    audioEl.play().then(() => {
      isPlaying = true;
      updatePlayIcon();
    }).catch(() => {
      isPlaying = false;
      updatePlayIcon();
      npStatus.textContent = "Playback could not start. Press play.";
      npStatus.classList.add("err");
    });
    refreshNowPlayingHighlight();
  }

  audioEl.addEventListener("error", () => {
    if (playingIndex === -1) return;
    npStatus.textContent = "Audio file not found — add mp3s to match the tracklist filenames";
    npStatus.classList.add("err");
    isPlaying = false;
    updatePlayIcon();
  });
  audioEl.addEventListener("play", () => { isPlaying = true; updatePlayIcon(); });
  audioEl.addEventListener("playing", () => {
    if (!npStatus.classList.contains("err")) npStatus.textContent = "";
  });
  audioEl.addEventListener("waiting", () => {
    if (playingIndex === -1 || npStatus.classList.contains("err")) return;
    npStatus.textContent = "Buffering…";
  });
  audioEl.addEventListener("stalled", () => {
    if (playingIndex === -1 || npStatus.classList.contains("err")) return;
    npStatus.textContent = "Buffering…";
  });
  audioEl.addEventListener("pause", () => { isPlaying = false; updatePlayIcon(); });
  audioEl.addEventListener("ended", () => { nextTrack(); });
  audioEl.addEventListener("loadedmetadata", () => {
    npSeek.max = audioEl.duration || 0;
    npDuration.textContent = fmtTime(audioEl.duration);
    const msSeek = $("ms-seek");
    if (msSeek) {
      msSeek.max = audioEl.duration || 0;
      $("ms-dur").textContent = fmtTime(audioEl.duration);
    }
  });
  audioEl.addEventListener("timeupdate", () => {
    const ratio = audioEl.duration ? (audioEl.currentTime / audioEl.duration) * 100 : 0;
    const fill = $("np-line-fill");
    if (fill) fill.style.width = ratio + "%";
    if (!isSeeking) {
      npSeek.value = audioEl.currentTime;
      npTime.textContent = fmtTime(audioEl.currentTime);
      const msSeek = $("ms-seek");
      if (msSeek && !msSeeking) {
        msSeek.value = audioEl.currentTime;
        $("ms-time").textContent = fmtTime(audioEl.currentTime);
      }
    }
  });
  npSeek.addEventListener("input", () => { isSeeking = true; npTime.textContent = fmtTime(npSeek.value); });
  npSeek.addEventListener("change", () => { audioEl.currentTime = Number(npSeek.value); isSeeking = false; });

  const npMute = $("np-mute");
  const npVolIcon = $("np-vol-icon");
  const npVolSlider = $("np-vol-slider");
  let lastVolume = 1;
  function loadStoredVolume() {
    try {
      const stored = localStorage.getItem("wondu-volume");
      return stored !== null ? parseFloat(stored) : 1;
    } catch (e) { return 1; }
  }
  function storeVolume(v) {
    try { localStorage.setItem("wondu-volume", String(v)); } catch (e) {}
  }
  function updateVolumeIcon() {
    const v = audioEl.volume;
    let path;
    if (v === 0 || audioEl.muted) {
      path = '<path d="M16.5 12l3.5 3.5-1.5 1.5L15 13.5 11.5 17 10 15.5l3.5-3.5L10 8.5 11.5 7 15 10.5 18.5 7l1.5 1.5z"/><path d="M3 10v4h4l5 5V5L7 10H3z"/>';
    } else if (v < 0.5) {
      path = '<path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>';
    } else {
      path = '<path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
    }
    npVolIcon.innerHTML = path;
    npVolSlider.value = audioEl.muted ? 0 : v;
  }
  const initialVolume = loadStoredVolume();
  audioEl.volume = isFinite(initialVolume) ? initialVolume : 1;
  npVolSlider.value = audioEl.volume;
  lastVolume = audioEl.volume || 1;
  updateVolumeIcon();
  npVolSlider.addEventListener("input", () => {
    const v = parseFloat(npVolSlider.value);
    audioEl.muted = false;
    audioEl.volume = v;
    if (v > 0) lastVolume = v;
    storeVolume(v);
    updateVolumeIcon();
  });
  npMute.addEventListener("click", () => {
    if (audioEl.muted || audioEl.volume === 0) {
      audioEl.muted = false;
      audioEl.volume = lastVolume || 1;
      storeVolume(audioEl.volume);
    } else {
      lastVolume = audioEl.volume;
      audioEl.muted = true;
    }
    updateVolumeIcon();
  });

  function updatePlayIcon() {
    const icon = isPlaying
      ? '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>'
      : '<path d="M8 5v14l11-7z"/>';
    npPlayIcon.innerHTML = icon;
    const msIcon = $("ms-play-icon");
    if (msIcon) msIcon.innerHTML = icon;
    refreshNowPlayingHighlight();
  }
  $("np-play").addEventListener("click", () => {
    if (playingIndex === -1) return;
    if (audioEl.paused) audioEl.play(); else audioEl.pause();
  });
  function nextTrack() {
    if (!playingAct) return;
    const songs = DATA[playingAct].songs;
    if (playingIndex < songs.length - 1) playTrack(playingAct, playingIndex + 1);
    else { isPlaying = false; updatePlayIcon(); }
  }
  function prevTrack() {
    if (!playingAct) return;
    if (audioEl.currentTime > 3) { audioEl.currentTime = 0; return; }
    if (playingIndex > 0) playTrack(playingAct, playingIndex - 1);
  }
  $("np-next").addEventListener("click", nextTrack);
  $("np-prev").addEventListener("click", prevTrack);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!bootEl.hidden) { dismissBoot(); return; }
      if (!deckEl.hidden) $("backBtn").click();
    }
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      if (!bootEl.hidden) { dismissBoot(); return; }
      if (playingIndex === -1) return;
      if (audioEl.paused) audioEl.play(); else audioEl.pause();
    }
  });

  let msSeeking = false;
  function mobileLyrics(song) {
    if (song.instrumental) {
      return '<p class="sec-label">' + esc(song.note || "Instrumental") + "</p><p>No lyrics</p>";
    }
    return song.sections.map((s) =>
      '<div class="sec-label">' + esc(s.label) + "</div>" +
      s.lines.map((line) => "<p>" + esc(line) + "</p>").join("")
    ).join("");
  }
  function fillMobileStage() {
    const actKey = playingAct || viewAct;
    const index = playingIndex > -1 ? playingIndex : viewIndex;
    if (!actKey || index < 0 || !DATA[actKey] || !DATA[actKey].songs[index]) return;
    const song = DATA[actKey].songs[index];
    const art = encodePath(song.art);
    $("ms-bleed").src = art;
    $("ms-art").src = art;
    $("ms-art").alt = song.title;
    $("ms-caption").textContent = song.caption || "";
    $("mstage").dataset.act = actKey;
    $("msAct").textContent = DATA[actKey].title;
    $("msTitle").textContent = song.title;
    $("ms-lyrics").innerHTML = mobileLyrics(song);
  }
  function openMobileStage() {
    if (window.innerWidth > 860) return;
    fillMobileStage();
    $("mstage").classList.add("show");
    $("mstage").setAttribute("aria-hidden", "false");
    document.body.classList.add("mstage-open");
  }
  function closeMobileStage() {
    const stage = $("mstage");
    if (!stage) return;
    stage.classList.remove("show");
    stage.setAttribute("aria-hidden", "true");
    document.body.classList.remove("mstage-open");
  }
  nowplayingEl.addEventListener("click", (e) => {
    if (window.innerWidth > 860) return;
    if (e.target.closest("button, input")) return;
    openMobileStage();
  });
  $("msClose").addEventListener("click", closeMobileStage);
  $("ms-prev").addEventListener("click", prevTrack);
  $("ms-next").addEventListener("click", nextTrack);
  $("ms-play").addEventListener("click", () => {
    if (playingIndex === -1) return;
    if (audioEl.paused) audioEl.play(); else audioEl.pause();
  });
  const msSeek = $("ms-seek");
  msSeek.addEventListener("input", () => {
    msSeeking = true;
    $("ms-time").textContent = fmtTime(msSeek.value);
  });
  msSeek.addEventListener("change", () => {
    audioEl.currentTime = Number(msSeek.value);
    msSeeking = false;
  });
  function swipeClose(el, onlyAtTop) {
    let y0 = 0;
    let armed = false;
    el.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, input, a")) return;
      y0 = e.clientY;
      armed = true;
    });
    el.addEventListener("pointerup", (e) => {
      if (!armed) return;
      armed = false;
      if (e.clientY - y0 < 64) return;
      if (onlyAtTop && el.scrollTop > 0) return;
      closeMobileStage();
    });
  }
  swipeClose($("msTop"), false);
  swipeClose($("msGlass"), true);

  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 }) : null;
  document.querySelectorAll(".reveal").forEach((el) => {
    if (reduce || !io) el.classList.add("in");
    else io.observe(el);
  });

  applyRoute();
})();
