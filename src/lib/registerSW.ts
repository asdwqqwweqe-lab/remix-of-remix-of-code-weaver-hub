/**
 * Guarded service worker registration.
 * Never registers in dev, iframes, Lovable preview, or when `?sw=off`.
 * Follows Lovable PWA skill rules.
 */

const SW_PATH = "/sw.js";

function shouldRefuseRegistration(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;

  // Iframe check
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }

  const host = window.location.hostname;
  if (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  ) {
    return true;
  }

  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;

  return false;
}

async function unregisterExisting() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      if (reg.active?.scriptURL.endsWith(SW_PATH)) {
        await reg.unregister();
      }
    }
  } catch {
    // swallow
  }
}

export async function registerSW() {
  if (shouldRefuseRegistration()) {
    await unregisterExisting();
    return;
  }
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
  } catch (err) {
    console.warn("[PWA] SW registration failed:", err);
  }
}
