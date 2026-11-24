let homepagePackArtworkData = null;

function randomizeHomepagePackArtwork() {
  if (!homepagePackArtworkData) return;
  const { packs, subpacks, generals } = homepagePackArtworkData;
  packs.forEach((pack) => {
    const card = document.querySelector(pack.id === "spr" ? ".collection-card.card-spr" : ".collection-card.card-zm");
    const packGenerals = generals.filter((general) => pack.subpacks.some((subpackId) => subpacks.find((subpack) => subpack.id === subpackId)?.generals?.includes(general.id)));
    const featured = packGenerals[Math.floor(Math.random() * packGenerals.length)];
    if (!card || !featured) return;
    const fileId = ({ spr__chenwudongxi: "spr__chendong", spr__wangtaowangyue: "spr__wangwang" })[featured.id] || featured.id;
    card.style.setProperty("--collection-art", `url("image/general/illustration/${fileId}.jpg")`);
  });
}

async function loadPackCounts() {
  try {
    const [packs, subpacks, generals, images] = await Promise.all(["packs", "subpacks", "generals", "images"].map(async (name) => {
      const response = await fetch(`data/${name}.json`);
      if (!response.ok) throw new Error(name);
      return response.json();
    }));
    homepagePackArtworkData = { packs, subpacks, generals };
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

  const savedGeneralId = sessionStorage.getItem("hero-featured-general-id");
  const savedIndex = generals.findIndex((general) => general.id === savedGeneralId);
  const defaultIndex = generals.findIndex((general) => general.id === "spr__machao");
  let currentIndex = savedIndex >= 0 ? savedIndex : Math.max(0, defaultIndex);
  const showGeneral = (index, direction = 0, effect = "slide") => {
    currentIndex = (index + generals.length) % generals.length;
    const general = generals[currentIndex];
    const artwork = images.find((item) => item.id === general.image);
    if (!artwork) return;
    sessionStorage.setItem("hero-featured-general-id", general.id);
    const subpack = subpacks.find((item) => item.generals?.includes(general.id));
    const pack = packs.find((item) => item.subpacks.includes(subpack?.id));
    image.src = artwork.path;
    image.alt = `${general.name}武将卡面`;
    image.fetchPriority = currentIndex === 0 ? "high" : "auto";
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
}
loadPackCounts();
window.addEventListener("pageshow", (event) => { if (event.persisted) randomizeHomepagePackArtwork(); });
