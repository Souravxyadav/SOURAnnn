function ensureToastRoot() {
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center w-full px-4 pointer-events-none";
    document.body.appendChild(root);
  }
  return root;
}

function toast(message, type = "success") {
  const root = ensureToastRoot();
  const styles = {
    success: "bg-emerald-600",
    error: "bg-red-600",
    info: "bg-slate-800",
  };
  const el = document.createElement("div");
  el.className = `pointer-events-auto max-w-sm w-full sm:w-auto text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg ${styles[type] || styles.info} transition-all duration-300 opacity-0 translate-y-2`;
  el.textContent = message;
  root.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.remove("opacity-0", "translate-y-2");
  });
  setTimeout(() => {
    el.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => el.remove(), 300);
  }, 3200);
}
