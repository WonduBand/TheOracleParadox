(function () {
  const P = OraclePreview;
  const phone = document.getElementById("phone");
  const audio = document.getElementById("audio");
  const sheet = document.getElementById("sheet");
  const lyrics = document.getElementById("lyrics");
  const reduce = document.documentElement.classList.contains("reduce");

  let listAct = "actI";
  let playAct = null;
  let playIndex = -1;
  let seeking = false;

  const PLAY = '<path d="M8 5v14l11-7z"/>';
  const PAUSE = '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>';

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
    P.setAct(phone, listAct);
    document.getElementById("tracks").innerHTML = act.songs.map((song) => P.trackRow(song, listAct)).join("");
    document.querySelectorAll(".track").forEach((btn) => {
      const current = btn.dataset.act === playAct && Number(btn.dataset.index) === playIndex;
      btn.classList.toggle("on", current);
      btn.classList.toggle("live", current && !audio.paused);
    });
  }
  function paintPlayer() {
    const song = songAt(playAct, playIndex);
    if (!song) return;
    document.getElementById("sheetAct").textContent = P.DATA[playAct].title;
    document.getElementById("sheetTitle").textContent = song.title;
    document.getElementById("sheetHeading").textContent = song.title;
    document.getElementById("sheetArt").src = P.asset(song.art);
    document.getElementById("sheetArt").alt = song.title;
    document.getElementById("lyricTitle").textContent = song.title;
    document.getElementById("lyricBg").src = P.asset(song.art);
    document.getElementById("lyricBody").innerHTML = P.lyricsHTML(song);
    P.setAct(phone, playAct);
  }
  function setOpen(open) {
    sheet.classList.toggle("show", open);
    sheet.setAttribute("aria-hidden", open ? "false" : "true");
    if (!open) {
      lyrics.classList.remove("show");
      lyrics.setAttribute("aria-hidden", "true");
      P.setAct(phone, listAct);
      renderList();
    }
  }
  function setLyrics(open) {
    lyrics.classList.toggle("show", open);
    lyrics.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) document.getElementById("lyricScroll").scrollTop = 0;
  }
  function load(act, index, autoplay) {
    const song = songAt(act, index);
    if (!song) return;
    playAct = act;
    playIndex = index;
    paintPlayer();
    setOpen(true);
    const src = P.asset(song.file);
    if (audio.getAttribute("src") !== src) {
      audio.src = src;
      document.getElementById("status").textContent = "Loading…";
    }
    if (autoplay) {
      audio.play().catch(() => {
        document.getElementById("status").textContent = "Playback could not start. Press play.";
      });
    }
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
  function icon() {
    document.getElementById("playIcon").innerHTML = audio.paused ? PLAY : PAUSE;
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
  document.getElementById("closePlayer").addEventListener("click", () => setOpen(false));
  document.getElementById("openLyrics").addEventListener("click", () => setLyrics(true));
  document.getElementById("closeLyrics").addEventListener("click", () => setLyrics(false));
  document.getElementById("play").addEventListener("click", toggle);
  document.getElementById("prev").addEventListener("click", () => step(-1));
  document.getElementById("next").addEventListener("click", () => step(1));

  const seek = document.getElementById("seek");
  seek.addEventListener("input", () => { seeking = true; document.getElementById("time").textContent = P.fmt(seek.value); });
  seek.addEventListener("change", () => { audio.currentTime = Number(seek.value); seeking = false; });

  audio.addEventListener("timeupdate", () => {
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

  function swipe(el, handlers) {
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
      const dy = e.clientY - y0;
      if (dy < -64 && handlers.up) handlers.up();
      if (dy > 64 && handlers.down) handlers.down();
    });
  }
  swipe(sheet, { up: () => setLyrics(true), down: () => setOpen(false) });
  swipe(document.getElementById("lyricScroll"), {
    down: () => {
      if (document.getElementById("lyricScroll").scrollTop <= 0) setLyrics(false);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (lyrics.classList.contains("show")) setLyrics(false);
    else if (sheet.classList.contains("show")) setOpen(false);
  });
  if (reduce) phone.classList.add("reduce");
})();
