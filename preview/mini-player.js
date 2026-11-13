(function () {
  const P = OraclePreview;
  const phone = document.getElementById("phone");
  const audio = document.getElementById("audio");
  const mini = document.getElementById("mini");
  const full = document.getElementById("full");
  const PLAY = '<path d="M8 5v14l11-7z"/>';
  const PAUSE = '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>';

  let listAct = "actI";
  let playAct = null;
  let playIndex = -1;
  let seeking = false;

  function songAt(act, index) {
    return P.DATA[act] && P.DATA[act].songs[index];
  }
  function renderActs() {
    document.getElementById("acts").innerHTML = P.ACTS.map((act) =>
      '<button type="button" data-act="' + act.key + '"' + (act.key === listAct ? ' class="on"' : "") + ">" + act.short + "</button>"
    ).join("");
  }
  function renderList() {
    const act = P.DATA[listAct];
    document.getElementById("actTitle").textContent = act.title;
    document.getElementById("actBlurb").textContent = P.ALBUM_META[listAct].desc;
    if (!full.classList.contains("show")) P.setAct(phone, listAct);
    document.getElementById("tracks").innerHTML = act.songs.map((song) => P.trackRow(song, listAct)).join("");
    document.querySelectorAll(".track").forEach((btn) => {
      const current = btn.dataset.act === playAct && Number(btn.dataset.index) === playIndex;
      btn.classList.toggle("on", current);
      btn.classList.toggle("live", current && !audio.paused);
    });
  }
  function icon() {
    const html = audio.paused ? PLAY : PAUSE;
    document.getElementById("playIcon").innerHTML = html;
    document.getElementById("miniIcon").innerHTML = html;
  }
  function paint() {
    const song = songAt(playAct, playIndex);
    if (!song) return;
    const art = P.asset(song.art);
    document.getElementById("miniArt").src = art;
    document.getElementById("miniArt").alt = song.title;
    document.getElementById("miniTitle").textContent = song.title;
    document.getElementById("miniAlbum").textContent = P.DATA[playAct].title;
    document.getElementById("fullArt").src = art;
    document.getElementById("fullAct").textContent = P.DATA[playAct].title;
    document.getElementById("fullTitle").textContent = song.title;
    document.getElementById("lyricBody").innerHTML = P.lyricsHTML(song);
    mini.hidden = false;
    mini.classList.add("show");
  }
  function load(act, index, autoplay) {
    const song = songAt(act, index);
    if (!song) return;
    playAct = act;
    playIndex = index;
    paint();
    const src = P.asset(song.file);
    if (audio.getAttribute("src") !== src) {
      audio.src = src;
      document.getElementById("status").textContent = "Loading…";
    }
    if (autoplay) audio.play().catch(() => {
      document.getElementById("status").textContent = "Playback could not start. Press play.";
    });
    renderList();
  }
  function toggle() {
    if (playIndex < 0) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }
  function step(dir) {
    if (!playAct) return;
    const songs = P.DATA[playAct].songs;
    if (dir < 0 && audio.currentTime > 3) { audio.currentTime = 0; return; }
    const next = playIndex + dir;
    if (next >= 0 && next < songs.length) load(playAct, next, true);
  }
  function setExpanded(open) {
    full.classList.toggle("show", open);
    full.setAttribute("aria-hidden", open ? "false" : "true");
    phone.classList.toggle("expanded", open);
    if (open) {
      P.setAct(phone, playAct || listAct);
      document.getElementById("glass").scrollTop = 0;
    } else {
      P.setAct(phone, listAct);
    }
  }

  renderActs();
  renderList();
  document.getElementById("acts").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    listAct = btn.dataset.act;
    renderActs();
    renderList();
  });
  document.getElementById("tracks").addEventListener("click", (e) => {
    const btn = e.target.closest(".track");
    if (!btn) return;
    load(btn.dataset.act, Number(btn.dataset.index), true);
  });
  document.getElementById("mini").addEventListener("click", (e) => {
    if (e.target.closest("#miniPlay")) return;
    setExpanded(true);
  });
  document.getElementById("miniPlay").addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
  document.getElementById("collapse").addEventListener("click", () => setExpanded(false));
  document.getElementById("play").addEventListener("click", toggle);
  document.getElementById("prev").addEventListener("click", () => step(-1));
  document.getElementById("next").addEventListener("click", () => step(1));

  const seek = document.getElementById("seek");
  seek.addEventListener("input", () => { seeking = true; document.getElementById("time").textContent = P.fmt(seek.value); });
  seek.addEventListener("change", () => { audio.currentTime = Number(seek.value); seeking = false; });
  audio.addEventListener("timeupdate", () => {
    const ratio = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    document.getElementById("miniFill").style.width = ratio + "%";
    if (seeking) return;
    seek.value = audio.currentTime || 0;
    document.getElementById("time").textContent = P.fmt(audio.currentTime);
  });
  audio.addEventListener("loadedmetadata", () => {
    seek.max = audio.duration || 0;
    document.getElementById("dur").textContent = P.fmt(audio.duration);
  });
  audio.addEventListener("playing", () => { document.getElementById("status").textContent = ""; icon(); renderList(); });
  audio.addEventListener("waiting", () => { document.getElementById("status").textContent = "Buffering…"; });
  audio.addEventListener("pause", () => { icon(); renderList(); });
  audio.addEventListener("ended", () => step(1));
  audio.addEventListener("error", () => {
    document.getElementById("status").textContent = "Audio file not found — add mp3s to match the tracklist filenames";
  });

  function swipeDown(el, fn, onlyAtTop) {
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
      fn();
    });
  }
  swipeDown(document.getElementById("fullTop"), () => setExpanded(false), false);
  swipeDown(document.getElementById("glass"), () => setExpanded(false), true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && full.classList.contains("show")) setExpanded(false);
  });
})();
