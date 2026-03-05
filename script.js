(() => {
  const WHEEL_ORIGIN = "https://wheelofnames.com";
  const LS_KEY = "wheel_embed_last_link_v1";

  const wheelLink = document.getElementById("wheelLink");
  const loadBtn = document.getElementById("loadBtn");
  const openTabBtn = document.getElementById("openTabBtn");
  const fsBtn = document.getElementById("fsBtn");
  const presentToggle = document.getElementById("presentToggle");
  const statusPill = document.getElementById("statusPill");

  const frame = document.getElementById("wheelFrame");
  const frameBox = document.getElementById("frameBox");

  const entriesEl = document.getElementById("entries");
  const spinBtn = document.getElementById("spinBtn");
  const setEntriesBtn = document.getElementById("setEntriesBtn");
  const closeWinnerDialogBtn = document.getElementById("closeWinnerDialogBtn");
  const removeWinnerBtn = document.getElementById("removeWinnerBtn");
  const removeWinnerAllBtn = document.getElementById("removeWinnerAllBtn");
  const lockAfterSpin = document.getElementById("lockAfterSpin");

  const backdrop = document.getElementById("backdrop");
  const winnerText = document.getElementById("winnerText");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalRemoveBtn = document.getElementById("modalRemoveBtn");
  const modalRemoveAllBtn = document.getElementById("modalRemoveAllBtn");

  function setStatus(t){ statusPill.textContent = t; }

  function parseEntries(){
    return entriesEl.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }

  function normalizeWheelUrl(input){
    let v = (input || "").trim();
    if (!v) return "";

    // Allow user to paste just "abc-123"
    if (/^[a-z0-9]{3}-[a-z0-9]{3}$/i.test(v)) {
      v = `${WHEEL_ORIGIN}/${v}`;
    }

    // If they paste without scheme
    if (!/^https?:\/\//i.test(v)) v = "https://" + v;

    const u = new URL(v);
    if (u.hostname !== "wheelofnames.com") {
      throw new Error("Please use a wheelofnames.com share link.");
    }
    u.protocol = "https:";
    return u.toString();
  }

  function loadWheel(url){
    frame.style.pointerEvents = "auto";
    frame.src = url;
    localStorage.setItem(LS_KEY, url);
    setStatus("Loaded");
  }

  function send(msg){
    if (!frame.contentWindow) return;
    frame.contentWindow.postMessage(msg, WHEEL_ORIGIN);
  }

  function showWinner(name){
    winnerText.textContent = name;
    backdrop.style.display = "flex";
  }
  function closeWinner(){
    backdrop.style.display = "none";
  }

  // --- UI events
  loadBtn.addEventListener("click", () => {
    try{
      const url = normalizeWheelUrl(wheelLink.value);
      if (!url) return setStatus("Paste a share link first");
      loadWheel(url);
    }catch(e){
      alert(e.message || "Invalid link");
    }
  });

  openTabBtn.addEventListener("click", () => {
    try{
      const url = normalizeWheelUrl(wheelLink.value || frame.src);
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    }catch{}
  });

  presentToggle.addEventListener("change", () => {
    document.body.classList.toggle("present", presentToggle.checked);
  });

  // Fullscreen
  fsBtn.addEventListener("click", async () => {
    try{
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (frameBox.requestFullscreen) {
        await frameBox.requestFullscreen();
      } else {
        frameBox.classList.toggle("pseudoFS");
      }
    }catch{
      frameBox.classList.toggle("pseudoFS");
    }
  });

  document.addEventListener("fullscreenchange", () => {
    fsBtn.textContent = document.fullscreenElement ? "Exit fullscreen" : "Fullscreen";
  });

  // Control buttons
  spinBtn.addEventListener("click", () => { setStatus("Spinning…"); send({ name: "spin" }); });
  setEntriesBtn.addEventListener("click", () => {
    const entries = parseEntries();
    send({ name: "setEntries", entries });
    setStatus(`Sent ${entries.length} entries`);
  });
  closeWinnerDialogBtn.addEventListener("click", () => send({ name: "closeWinnerDialog" }));
  removeWinnerBtn.addEventListener("click", () => send({ name: "removeWinner" }));
  removeWinnerAllBtn.addEventListener("click", () => send({ name: "removeWinnerAll" }));

  // Modal buttons
  modalCloseBtn.addEventListener("click", () => closeWinner());
  modalRemoveBtn.addEventListener("click", () => send({ name: "removeWinner" }));
  modalRemoveAllBtn.addEventListener("click", () => send({ name: "removeWinnerAll" }));
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeWinner(); });

  // ESC closes modal
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeWinner(); });

  // Listen for winner result
  window.addEventListener("message", (event) => {
    if (event.origin !== WHEEL_ORIGIN) return;

    const winner = event?.data?.spinResult?.text;
    if (!winner) return;

    setStatus("Done");
    showWinner(winner);

    // Option: lock spins after first winner
    if (lockAfterSpin.checked) {
      frame.style.pointerEvents = "none";
      setStatus("Done (locked)");
    }
  });

  // --- Init: load from URL param (?wheel=abc-123 or ?wheel=https%3A%2F%2Fwheelofnames.com%2Fabc-123)
  const params = new URLSearchParams(location.search);
  const fromParam = params.get("wheel");
  const fromStorage = localStorage.getItem(LS_KEY);

  const initial = fromParam || fromStorage || `${WHEEL_ORIGIN}/view?entries=Alice,Bob,Charlie,Dara`;
  wheelLink.value = initial;

  try{
    loadWheel(normalizeWheelUrl(initial));
  }catch{
    loadWheel(`${WHEEL_ORIGIN}/view?entries=Alice,Bob,Charlie,Dara`);
  }

  setStatus("Ready");
})();
