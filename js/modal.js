// Classes that put the sheet in its "hidden/off" state, on both mobile
// (translate-y-full) and desktop (md:opacity-0 / md:scale-95). Both the bare
// and the md:-prefixed versions must be added/removed together — Tailwind
// treats "opacity-0" and "md:opacity-0" as two unrelated class names, so
// removing only one of them leaves the modal invisible on the other size.
const SHEET_HIDDEN_CLASSES = ["translate-y-full", "opacity-0", "scale-95", "md:opacity-0", "md:scale-95"];

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("hidden");
  requestAnimationFrame(() => {
    el.querySelector("[data-sheet]")?.classList.remove(...SHEET_HIDDEN_CLASSES);
  });
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const sheet = el.querySelector("[data-sheet]");
  sheet?.classList.add(...SHEET_HIDDEN_CLASSES);
  setTimeout(() => {
    el.classList.add("hidden");
    document.body.style.overflow = "";
  }, 200);
}

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-close-modal]")) {
    const id = e.target.closest("[data-close-modal]").dataset.closeModal;
    closeModal(id);
  }
  if (e.target.matches("[data-modal-backdrop]")) {
    closeModal(e.target.closest(".modal-root").id);
  }
});

function setLoading(button, isLoading, loadingText = "Saving...") {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.dataset.originalText || button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.classList.add("opacity-70", "cursor-not-allowed");
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove("opacity-70", "cursor-not-allowed");
  }
}

async function confirmDelete(title, message) {
  return new Promise((resolve) => {
    const root = document.getElementById("confirm-modal");
    qs("#confirm-title", root).textContent = title;
    qs("#confirm-message", root).textContent = message;
    openModal("confirm-modal");
    const yes = qs("#confirm-yes", root);
    const no = qs("#confirm-no", root);
    const cleanup = (result) => {
      yes.removeEventListener("click", onYes);
      no.removeEventListener("click", onNo);
      closeModal("confirm-modal");
      resolve(result);
    };
    const onYes = () => cleanup(true);
    const onNo = () => cleanup(false);
    yes.addEventListener("click", onYes);
    no.addEventListener("click", onNo);
  });
}
