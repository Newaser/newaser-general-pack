const params = new URLSearchParams(location.search);
const id = params.get("id");
const content = document.getElementById("general-detail");
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function init() {
  const names = ["packs", "subpacks", "generals", "skills", "images", "cards", "rules"];
  const loaded = await Promise.all(names.map(async (name) => {
    const response = await fetch(`data/${name}.json`);
    if (!response.ok) throw new Error(name);
    return response.json();
  }));
  const [packs, subpacks, generals, skills, images, cards, rules] = loaded;
  const general = generals.find((item) => item.id === id);
  if (!general) {
    content.innerHTML = '<div class="empty-state">没有找到这位武将。<a href="catalog.html">返回武将图鉴</a></div>';
    return;
  }

  const subpack = subpacks.find((item) => item.generals?.includes(id));
  const pack = packs.find((item) => item.subpacks.includes(subpack?.id));
  const image = images.find((item) => item.id === general.image);
  const generalSkills = (general.skills || []).map((skillId) => skills.find((skill) => skill.id === skillId) || { id: skillId, name: skillId, description: "技能说明尚未整理。" });
  const portrait = image ? `<img class="detail-portrait" src="${esc(image.path)}" alt="${esc(general.name)}武将卡面">` : '<div class="detail-portrait-placeholder">暂无卡面</div>';
  const credits = [
    general.designer ? `设计：${Array.isArray(general.designer) ? general.designer.map(esc).join("、") : esc(general.designer)}` : "",
    image?.author ? `制图：${esc(image.author)}` : "",
    image?.illustrator ? `插画：${esc(image.illustrator)}` : ""
  ].filter(Boolean).join("　·　");

  const entitySets = { skills, cards, rules };
  const derivativeLabels = { skills: "衍生技能", cards: "衍生游戏牌", rules: "衍生机制" };
  const renderDerivativeGroups = (entity, ancestors, depth) => {
    if (depth >= 16) return '<p class="derivative-stop">衍生链路过深，已停止继续展开。</p>';
    return Object.entries(derivativeLabels).map(([kind, label]) => {
      const children = entity.derivatives?.[kind] || [];
      if (!children.length) return "";
      const rows = children.map((entityId) => {
        const child = entitySets[kind].find((item) => item.id === entityId) || { id: entityId, name: entityId, description: "该条目尚未收录。" };
        return renderDerivativeEntity(child, kind, ancestors, depth);
      }).join("");
      return `<section class="derivative-section derivative-${kind}"><h4>${label}</h4>${rows}</section>`;
    }).join("");
  };
  const renderDerivativeEntity = (entity, kind, ancestors, depth) => {
    const key = `${kind}:${entity.id}`;
    if (ancestors.has(key)) return '<p class="derivative-stop">检测到循环关联，已停止继续展开。</p>';
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(key);
    const tags = kind === "skills" && entity.tags?.length
      ? `<div class="derivative-skill-tags" aria-label="技能标签">${entity.tags.map((tag) => `<small>${esc(tag)}</small>`).join("")}</div>`
      : "";
    const cardType = kind === "cards" && entity.type
      ? `<div class="derivative-card-type">${esc(entity.type)}${entity.subtype ? ` · ${esc(entity.subtype)}` : ""}</div>`
      : "";
    const nested = renderDerivativeGroups(entity, nextAncestors, depth + 1);
    return `<article class="derivative-item"><div class="derivative-meta"><span class="derivative-name">${esc(entity.name)}</span>${tags}${cardType}</div><div class="derivative-body"><p>${entity.description || "说明尚未整理。"}</p>${nested}</div></article>`;
  };
  const renderDerivatives = (skill) => {
    const groups = renderDerivativeGroups(skill, new Set([`skills:${skill.id}`]), 0);
    return groups ? `<div class="skill-derivatives">${groups}</div>` : "";
  };

  document.title = `${general.name} · 将册`;
  content.innerHTML = `<div class="detail-back"><a href="catalog.html${pack ? `?pack=${encodeURIComponent(pack.id)}` : ""}">← 返回武将图鉴</a><span>${esc(pack?.name || "武将")}　/　${esc(subpack?.name || "")}</span></div><div class="detail-layout"><div class="detail-art"><div class="physical-card">${portrait}</div>${credits ? `<p class="image-credit">${credits}</p>` : ""}</div><div class="detail-copy"><div class="eyebrow"><span class="eyebrow-line"></span> 武将资料</div><p class="detail-code">${esc(general.code || pack?.name || "")}</p><h1>${esc(general.name)}</h1>${general.title ? `<p class="detail-title">「${esc(general.title)}」</p>` : ""}<div class="detail-stats"><div><small>势力</small><b>${esc(general.kingdom)}${general.subkingdom ? ` / ${esc(general.subkingdom)}` : ""}</b></div><div><small>性别</small><b>${esc(general.gender)}</b></div><div><small>体力</small><b>${esc(general.hp)} / ${esc(general.maxHp)}${general.shield ? `　护甲 ${esc(general.shield)}` : ""}</b></div></div><section class="detail-skills"><h2>技能</h2>${generalSkills.length ? generalSkills.map((skill) => `<article class="skill-entry"><h3>${esc(skill.name)}${(skill.tags || []).length ? `<small>${skill.tags.map(esc).join(" · ")}</small>` : ""}</h3><p>${skill.description || "技能说明尚未整理。"}</p>${renderDerivatives(skill)}</article>`).join("") : '<p>技能资料尚未整理。</p>'}</section></div></div>`;

  const galleryImages = [image, ...(general.derivativeImages || []).map((imageId) => images.find((item) => item.id === imageId))].filter(Boolean);
  if (galleryImages.length > 1) {
    const gallery = document.createElement("div");
    gallery.className = "derivative-image-gallery";
    gallery.setAttribute("aria-label", "武将图片");
    gallery.innerHTML = galleryImages.map((item, index) => `<button type="button" class="gallery-thumb${index === 0 ? " active" : ""}" data-gallery-image="${esc(item.id)}" aria-pressed="${index === 0}" aria-label="查看${esc(general.name)}${index === 0 ? "武将牌" : `衍生牌${index}`}" title="${index === 0 ? "武将牌" : `衍生牌${index}`}"><img src="${esc(item.path.replace(/#/g, "%23"))}" alt=""><span>${index === 0 ? "武将牌" : `衍生牌${index}`}</span></button>`).join("");
    content.querySelector(".physical-card").after(gallery);
    const portraitElement = content.querySelector(".detail-portrait");
    const creditsElement = content.querySelector(".image-credit");
    gallery.querySelectorAll("[data-gallery-image]").forEach((button) => button.addEventListener("click", () => {
      const selected = galleryImages.find((item) => item.id === button.dataset.galleryImage);
      portraitElement.src = selected.path.replace(/#/g, "%23");
      portraitElement.alt = `${general.name}${selected.id === general.image ? "武将牌" : "衍生图"}`;
      gallery.querySelectorAll("[data-gallery-image]").forEach((thumb) => {
        const active = thumb === button;
        thumb.classList.toggle("active", active);
        thumb.setAttribute("aria-pressed", String(active));
      });
      if (creditsElement) {
        creditsElement.innerHTML = [
          general.designer ? `设计：${Array.isArray(general.designer) ? general.designer.map(esc).join("、") : esc(general.designer)}` : "",
          selected.author ? `制图：${esc(selected.author)}` : "",
          selected.illustrator ? `插画：${esc(selected.illustrator)}` : ""
        ].filter(Boolean).join("　·　");
      }
    }));
  }
}

init().catch((error) => {
  console.error(error);
  content.innerHTML = '<div class="empty-state">详情数据加载失败，请通过本地服务器打开网站。</div>';
});
