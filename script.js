let homepagePackArtworkData = null;

function randomizeHomepagePackArtwork() {
  if (!homepagePackArtworkData) return;
  const { packs, subpacks, generals, images } = homepagePackArtworkData;
  packs.forEach((pack) => {
    const card = document.querySelector(pack.id === "spr" ? ".collection-card.card-spr" : ".collection-card.card-zm");
    const packGenerals = generals.filter((general) => pack.subpacks.some((subpackId) => subpacks.find((subpack) => subpack.id === subpackId)?.generals?.includes(general.id)));
    const featured = packGenerals[Math.floor(Math.random() * packGenerals.length)];
    if (!card || !featured) return;
    const illustration = images.find((image) => image.id === featured.images?.illustration);
    if (illustration) card.style.setProperty("--collection-art", `url("${illustration.path}")`);
  });
}

async function loadPackCounts() {
  try {
    const [packs, subpacks, generals, images] = await Promise.all(["packs", "subpacks", "generals", "images"].map(async (name) => {
      const response = await fetch(`data/${name}.json`);
      if (!response.ok) throw new Error(name);
      return response.json();
    }));
    homepagePackArtworkData = { packs, subpacks, generals, images };
    packs.forEach((pack) => {
      const count = generals.filter((general) => pack.subpacks.some((subpackId) => subpacks.find((subpack) => subpack.id === subpackId)?.generals?.includes(general.id))).length;
      const countNode = document.querySelector(`[data-pack-count="${pack.id}"]`);
      if (countNode) countNode.textContent = String(count);
    });
    randomizeHomepagePackArtwork();
    setupGeneralCarousel(packs, subpacks, generals, images);
  } catch (error) { console.info("无法载入扩展包统计信息。", error); }
}

function setupGeneralCarousel(packs, subpacks, generals, images) {
  const art = document.querySelector(".hero-art");
  const image = document.getElementById("hero-card-image");
  const link = document.getElementById("hero-card-link");
  const packLabel = document.getElementById("hero-current-pack");
  const randomButton = document.getElementById("random-general");
  if (!art || !image || !link || !packLabel || !generals.length) return;

  const mobileViewport = window.matchMedia("(max-width: 760px)");
  const fitMobileCardFrame = () => {
    if (!mobileViewport.matches) {
      link.style.removeProperty("width");
      link.style.removeProperty("height");
      return;
    }
    if (!image.naturalWidth || !image.naturalHeight) return;

    const frameStyle = getComputedStyle(link);
    const windowStyle = getComputedStyle(link.querySelector(".hero-card-window"));
    const horizontalPadding = parseFloat(windowStyle.left) + parseFloat(windowStyle.right);
    const verticalPadding = parseFloat(windowStyle.top) + parseFloat(windowStyle.bottom);
    const ratio = image.naturalWidth / image.naturalHeight;
    const maxWidth = Math.min(260, art.clientWidth * 0.68);
    const top = parseFloat(frameStyle.top) || 58;
    const maxHeight = Math.max(180, art.clientHeight - top - 28);
    const width = Math.min(maxWidth, ratio * (maxHeight - verticalPadding) + horizontalPadding);
    const height = (width - horizontalPadding) / ratio + verticalPadding;

    link.style.width = `${width}px`;
    link.style.height = `${height}px`;
  };
  image.addEventListener("load", fitMobileCardFrame);
  window.addEventListener("resize", fitMobileCardFrame);
  mobileViewport.addEventListener?.("change", fitMobileCardFrame);

  const savedGeneralId = sessionStorage.getItem("hero-featured-general-id");
  const savedIndex = generals.findIndex((general) => general.id === savedGeneralId);
  const defaultIndex = generals.findIndex((general) => general.id === "spr__machao");
  let currentIndex = savedIndex >= 0 ? savedIndex : Math.max(0, defaultIndex);
  const requestedArtwork = new Map();
  const artworkForGeneral = (index) => {
    const general = generals[(index + generals.length) % generals.length];
    return images.find((item) => item.id === general?.images?.main);
  };
  const artworkUrl = (path) => new URL(path, document.baseURI).href;
  const preloadArtwork = (index) => {
    const artwork = artworkForGeneral(index);
    if (!artwork) return;
    const url = artworkUrl(artwork.path);
    const activeUrls = [image.currentSrc, image.src]
      .filter(Boolean)
      .map(artworkUrl);
    if (activeUrls.includes(url) || requestedArtwork.has(url)) return;

    const preloader = new Image();
    preloader.decoding = "async";
    if ("fetchPriority" in preloader) preloader.fetchPriority = "low";
    preloader.src = artwork.path;
    requestedArtwork.set(url, preloader);
  };
  const preloadAdjacentArtwork = () => {
    if (generals.length < 2) return;
    preloadArtwork(currentIndex - 1);
    preloadArtwork(currentIndex + 1);
  };
  let backgroundPreloadStarted = false;
  const startBackgroundPreload = () => {
    if (backgroundPreloadStarted) return;
    backgroundPreloadStarted = true;
    const queue = [];
    for (let distance = 2; distance < generals.length; distance += 1) {
      queue.push(currentIndex + distance);
    }

    const preloadNextWhenIdle = () => {
      if (!queue.length) return;
      if (document.visibilityState === "hidden") {
        document.addEventListener("visibilitychange", preloadNextWhenIdle, { once: true });
        return;
      }
      const loadOne = () => {
        if (!queue.length) return;
        preloadArtwork(queue.shift());
        preloadNextWhenIdle();
      };
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadOne, { timeout: 1800 });
      } else {
        window.setTimeout(loadOne, 350);
      }
    };
    preloadNextWhenIdle();
  };
  image.addEventListener("load", startBackgroundPreload);
  const showGeneral = (index, direction = 0, effect = "slide") => {
    currentIndex = (index + generals.length) % generals.length;
    const general = generals[currentIndex];
    const artwork = images.find((item) => item.id === general.images?.main);
    if (!artwork) return;
    sessionStorage.setItem("hero-featured-general-id", general.id);
    const subpack = subpacks.find((item) => item.generals?.includes(general.id));
    const pack = packs.find((item) => item.subpacks.includes(subpack?.id));
    image.src = artwork.path;
    requestAnimationFrame(fitMobileCardFrame);
    image.alt = `${general.name}武将卡面`;
    image.fetchPriority = "high";
    image.classList.remove("slide-in-from-left", "slide-in-from-right", "random-reveal");
    image.onanimationend = () => image.classList.remove("slide-in-from-left", "slide-in-from-right", "random-reveal");
    if (effect === "random") {
      void image.offsetWidth;
      image.classList.add("random-reveal");
    } else if (direction) {
      void image.offsetWidth;
      image.classList.add(direction > 0 ? "slide-in-from-right" : "slide-in-from-left");
    }
    link.href = `general.html?id=${encodeURIComponent(general.id)}`;
    link.setAttribute("aria-label", `查看${general.name}详情`);
    packLabel.textContent = pack && subpack ? `${pack.name}·${subpack.name}` : pack?.name || "";
    packLabel.href = pack && subpack
      ? `catalog.html?pack=${encodeURIComponent(pack.id)}&subpack=${encodeURIComponent(subpack.id)}`
      : "catalog.html";
    preloadAdjacentArtwork();
  };

  art.querySelectorAll("[data-carousel]").forEach((button) => button.addEventListener("click", () => {
    const direction = button.dataset.carousel === "next" ? 1 : -1;
    showGeneral(currentIndex + direction, direction);
  }));
  randomButton?.addEventListener("click", () => {
    if (generals.length < 2) return;
    const offset = 1 + Math.floor(Math.random() * (generals.length - 1));
    const randomIndex = (currentIndex + offset) % generals.length;
    showGeneral(randomIndex, 0, "random");
    randomButton.classList.remove("rolling");
    void randomButton.offsetWidth;
    randomButton.classList.add("rolling");
    randomButton.querySelector("svg").onanimationend = () => randomButton.classList.remove("rolling");
  });
  art.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); showGeneral(currentIndex - 1, -1); }
    if (event.key === "ArrowRight") { event.preventDefault(); showGeneral(currentIndex + 1, 1); }
  });
  let touchStartX = null;
  art.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  art.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 45) {
      const direction = delta < 0 ? 1 : -1;
      showGeneral(currentIndex + direction, direction);
    }
    touchStartX = null;
  }, { passive: true });
  showGeneral(currentIndex);
  if (image.complete && image.naturalWidth) startBackgroundPreload();
}
loadPackCounts();
window.addEventListener("pageshow", (event) => { if (event.persisted) randomizeHomepagePackArtwork(); });
