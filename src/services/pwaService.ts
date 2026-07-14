export const registerPwaServiceWorker = () => {
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    const base = import.meta.env.BASE_URL || "/";
    const swUrl = `${base.replace(/\/$/, "")}/sw.js`;
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.warn("PWA service worker registration failed", error);
    });
  });
};
