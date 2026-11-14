(function (global) {
  const ACTS = [
    { key: "actI", short: "I", rgb: "57, 243, 229", color: "#39f3e5" },
    { key: "actII", short: "II", rgb: "255, 45, 85", color: "#ff2d55" },
    { key: "actIII", short: "III", rgb: "214, 255, 58", color: "#d6ff3a" }
  ];
  const CITY = {
    actI: "../Background_Album1.webp",
    actII: "../Background_Album2.webp",
    actIII: "../Background_Album3.webp"
  };

  function coverSrc(actKey) {
    const web = {
      actI: "../Cover_Album1.webp",
      actII: "../Cover_Album2.webp",
      actIII: "../Cover_Album3.webp"
    };
    return web[actKey] || asset(COVERS[actKey]);
  }
  function asset(path) {
    return "../" + String(path).split("/").map(encodeURIComponent).join("/");
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  function fmt(sec) {
    if (!isFinite(sec) || sec == null) return "0:00";
    sec = Math.max(0, Math.floor(sec));
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }
  function lyricsHTML(song) {
    if (!song) return "";
    if (song.instrumental) {
      return '<p class="inst">' + esc(song.note || "Instrumental") + "</p><p class=\"inst\">No lyrics</p>";
    }
    return song.sections.map((section) =>
      "<h3>" + esc(section.label) + "</h3>" +
      section.lines.map((line) => "<p>" + esc(line) + "</p>").join("")
    ).join("");
  }
  function setAct(phone, actKey) {
    const act = ACTS.find((item) => item.key === actKey) || ACTS[0];
    phone.dataset.act = act.key;
    phone.style.setProperty("--accent", act.color);
    phone.style.setProperty("--accent-rgb", act.rgb);
    const src = CITY[act.key];
    phone.querySelectorAll(".city-track img").forEach((img) => {
      if (img.getAttribute("src") !== src) img.src = src;
    });
  }
  function trackRow(song, actKey) {
    const tag = song.instrumental ? '<span class="sub">' + esc(song.note || "Instrumental") + "</span>" : "";
    return '<button type="button" class="track" data-act="' + actKey + '" data-index="' + (song.trackNum - 1) + '">' +
      '<span class="num">' + String(song.trackNum).padStart(2, "0") + "</span>" +
      '<span><span class="name">' + esc(song.title) + "</span>" + tag + "</span>" +
      '<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>' +
    "</button>";
  }

  global.OraclePreview = { ACTS, asset, coverSrc, esc, fmt, lyricsHTML, setAct, trackRow, DATA, ALBUM_META };
})(window);
