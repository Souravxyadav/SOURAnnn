function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Converts date from YYYY-MM-DD to DD-MM-YYYY format
function formatDOB(dateStr) {
  if (!dateStr) return "—";
  const parts = String(dateStr).trim().split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }
  return dateStr;
}

// Converts DD-MM-YYYY or ISO date to standard YYYY-MM-DD for form inputs and database
function parseDOBToISO(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parts = s.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      // DD-MM-YYYY -> YYYY-MM-DD
      const dd = parts[0].padStart(2, "0");
      const mm = parts[1].padStart(2, "0");
      return `${parts[2]}-${mm}-${dd}`;
    }
  }
  return s;
}

function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function friendlyError(error) {
  if (!error) return "Something went wrong. Please try again.";
  const msg = error.message || "";
  if (error.code === "23505" || msg.includes("duplicate key")) {
    return "A record with these details already exists.";
  }
  if (error.code === "23503") {
    return "This record is linked to other data and can't be changed that way.";
  }
  if (msg.toLowerCase().includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (msg.toLowerCase().includes("failed to fetch")) {
    return "Network Error (" + error.message + "). Check your internet connection or ad blocker.";
  }
  return msg || "Something went wrong. Please try again.";
}

function obfuscate(text) {
  if (!text) return "";
  return btoa(unescape(encodeURIComponent(text)));
}

function deobfuscate(text) {
  if (!text) return "";
  try {
    return decodeURIComponent(escape(atob(text)));
  } catch {
    return "";
  }
}

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
