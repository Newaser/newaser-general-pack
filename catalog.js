const DATA_FILES = ["data/packs.json", "data/subpacks.json", "data/generals.json", "data/skills.json", "data/images.json"];
const state = { pack: "all", subpack: "all", kingdom: "all" };
const filters = document.getElementById("filters");
const grid = document.getElementById("general-grid");
const search = document.getElementById("search");
const subpackSelect = document.getElementById("subpack-filter");
const subpackFilterWrap = document.getElementById("subpack-filter-wrap");
const kingdomSelect = document.getElementById("kingdom-filter");
let packs, subpacks, generals, skills, images;

async function init() {
  [packs, subpacks, generals, skills, images] = await Promise.all(DATA_FILES.map(async (file) => {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`无法读取 ${file}`);
    return response.json();
  }));
  const params = new URLSearchParams(location.search);
  const initialPack = params.get("pack");
  const initialSubpack = params.get("subpack");
  const validPack = packs.find((pack) => pack.id === initialPack);
  if (validPack) state.pack = validPack.id;
  const selectedSubpack = subpacks.find((subpack) => subpack.id === initialSubpack);
  if (selectedSubpack) {
    const parentPack = packs.find((pack) => pack.subpacks.includes(selectedSubpack.id));
    if (!validPack || parentPack?.id === validPack.id) {
      state.pack = parentPack?.id || state.pack;
      state.subpack = selectedSubpack.id;
    }
  }
  fillSelects();
  filters.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("active", button.dataset.filter === state.pack));
  render();
}
function packOf(general) {
  return packs.find((pack) => pack.subpacks.some((sid) => subpacks.find((subpack) => subpack.id === sid)?.generals?.includes(general.id)));
}
function subpackOf(general) { return subpacks.find((subpack) => subpack.generals?.includes(general.id)); }
function esc(value) { return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function illustrationPath(general) {
  const fileId = ({ spr__chenwudongxi: "spr__chendong", spr__wangtaowangyue: "spr__wangwang" })[general.id] || general.id;
  return `image/general/illustration/${fileId}.jpg`;
}
function fillSubpackSelect() {
  const activePack = packs.find((pack) => pack.id === state.pack);
  subpackFilterWrap.hidden = !activePack;
  const available = subpacks.filter((item) => !activePack || activePack.subpacks.includes(item.id));
  subpackSelect.innerHTML = '<option value="all">全部</option>' + available.map((item) => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join("");
  subpackSelect.value = state.subpack;
}
function fillSelects() {
  fillSubpackSelect();
  const kingdomOrder = ["魏", "蜀", "吴", "群", "晋", "神", "魔"];
  const presentKingdoms = new Set(generals.flatMap((g) => [g.kingdom, g.subkingdom].filter(Boolean)));
  kingdomOrder.forEach((kingdom) => presentKingdoms.add(kingdom));
  const kingdoms = [...kingdomOrder, ...[...presentKingdoms].filter((kingdom) => !kingdomOrder.includes(kingdom)).sort((a,b) => a.localeCompare(b,"zh-CN"))];
  kingdomSelect.innerHTML = '<option value="all">全部势力</option>' + kingdoms.map((name) => `<option value="${esc(name)}">${esc(name)}</option>`).join("");
}
function render() {
  const q = search.value.trim().toLocaleLowerCase();
  const shown = generals.filter((g) => {
    const pack = packOf(g), subpack = subpackOf(g);
    const text = `${g.name} ${g.code || ""} ${g.title || ""} ${g.kingdom} ${g.subkingdom || ""}`.toLocaleLowerCase();
    return (state.pack === "all" || pack?.id === state.pack) && (state.subpack === "all" || subpack?.id === state.subpack) && (state.kingdom === "all" || g.kingdom === state.kingdom || g.subkingdom === state.kingdom) && text.includes(q);
  });
  document.getElementById("general-count").textContent = String(shown.length).padStart(2,"0");
  document.getElementById("catalog-total").textContent = String(shown.length);
  grid.innerHTML = shown.length ? shown.map((g) => {
    const pack = packOf(g);
    return `<a class="general-tile" href="general.html?id=${encodeURIComponent(g.id)}" title="${esc(g.name)}"><img src="${esc(illustrationPath(g))}" alt="${esc(g.name)} 插画" loading="lazy"><span class="tile-info"><small>${esc(g.code || pack?.name || "")} · ${esc(g.kingdom)}${g.subkingdom ? ` / ${esc(g.subkingdom)}` : ""}</small><b>${esc(g.name)}</b></span><span class="tile-arrow">↗</span></a>`;
  }).join("") : '<div class="empty-state">没有找到符合条件的武将</div>';
}
function setPack(pack) {
  state.pack = pack;
  if (pack === "all" || (state.subpack !== "all" && !packs.find((item) => item.id === pack)?.subpacks.includes(state.subpack))) {
    state.subpack = "all";
    subpackSelect.value = "all";
  }
  fillSubpackSelect();
  filters.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("active", button.dataset.filter === pack));
  render();
}
filters.addEventListener("click", (event) => { const button = event.target.closest("[data-filter]"); if (button) setPack(button.dataset.filter); });
subpackSelect.addEventListener("change", () => { state.subpack = subpackSelect.value; const parent = packs.find((pack) => pack.subpacks.includes(state.subpack)); if (parent) setPack(parent.id); else render(); });
kingdomSelect.addEventListener("change", () => { state.kingdom = kingdomSelect.value; render(); });
search.addEventListener("input", render);
init().catch((error) => { console.error(error); grid.innerHTML = '<div class="empty-state">图鉴数据加载失败，请通过本地服务器打开网站。</div>'; });
