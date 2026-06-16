// Guarded PWA registration. Follows the Lovable PWA skill rules:
// - never register in dev / iframe / Lovable preview / ?sw=off
// - if refused, unregister any stale /sw.js for safety.

const PREVIEW_HOST_PREFIXES = ["id-preview--", "preview--"];
const PREVIEW_HOST_SUFFIXES = [
  ".lovableproject.com",
  ".lovableproject-dev.com",
  ".beta.lovable.dev",
];
const PREVIEW_EXACT_HOSTS = new Set([
  "lovableproject.com",
  "lovableproject-dev.com",
  "beta.lovable.dev",
]);

function shouldRefuse(): boolean {
  if (typeof window === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true; // iframe
  const url = new URL(window.location.href);
  if (url.searchParams.get("sw") === "off") return true;
  const host = window.location.hostname;
  if (PREVIEW_EXACT_HOSTS.has(host)) return true;
  if (PREVIEW_HOST_PREFIXES.some((p) => host.startsWith(p))) return true;
  if (PREVIEW_HOST_SUFFIXES.some((s) => host.endsWith(s))) return true;
  return false;
}

async function unregisterStale() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => r.active?.scriptURL.endsWith("/sw.js"))
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}

export async function registerSW(): Promise<void> {
  if (shouldRefuse()) {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      await unregisterStale();
    }
    return;
  }
  try {
    const mod = (await import(/* @vite-ignore */ "virtual:pwa-register")) as {
      registerSW: (opts?: { immediate?: boolean }) => void;
    };
    mod.registerSW({ immediate: true });
  } catch {
    /* plugin not present in dev */
  }
}
