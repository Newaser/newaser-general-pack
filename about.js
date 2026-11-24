const copyToClipboard = async (value) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Clipboard copy failed");
};

document.querySelectorAll("[data-copy-qq]").forEach((button) => {
  let suppressHoverUntilPointerMoves = false;

  button.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") suppressHoverUntilPointerMoves = true;
  });
  button.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse") suppressHoverUntilPointerMoves = false;
  });

  button.addEventListener("click", async () => {
    const status = button.querySelector(".copy-status");
    try {
      await copyToClipboard(button.dataset.copyQq);
      status.textContent = `QQ群号 ${button.dataset.copyQq} 已复制到剪贴板`;
      button.dataset.tooltip = "已复制";
      button.setAttribute("aria-label", `QQ群号 ${button.dataset.copyQq} 已复制`);
      button.classList.add("copied");
    } catch {
      status.textContent = `QQ群号 ${button.dataset.copyQq} 复制失败，请手动复制`;
      button.dataset.tooltip = "复制失败";
      button.setAttribute("aria-label", `QQ群号 ${button.dataset.copyQq} 复制失败，请手动复制`);
      button.classList.remove("copied");
    }
    if (button.copyTooltipTimer) window.clearTimeout(button.copyTooltipTimer);
    button.classList.add("copy-feedback");
    button.classList.toggle("suppress-copy-hover", suppressHoverUntilPointerMoves);
    button.copyTooltipTimer = window.setTimeout(() => {
      status.textContent = "";
      button.dataset.tooltip = "点击复制";
      button.setAttribute("aria-label", `复制QQ群号 ${button.dataset.copyQq}`);
      button.classList.remove("copied");
      button.classList.remove("copy-feedback");
      button.copyTooltipTimer = null;
    }, 2200);
  });
});
