
const CACHE_NAME = "mushafi-shell-v3";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png",
  "./icon-192.png",
  "./icon-512.png",
  "./favicon-32.png"
];

// تثبيت التطبيق وحفظ الملفات الأساسية
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        for (const file of APP_SHELL) {
          try {
            await cache.add(file);
          } catch (error) {
            console.warn("Could not cache:", file, error);
          }
        }
      })
      .then(() => self.skipWaiting())
  );
});

// تفعيل النسخة الجديدة
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith("mushafi-shell-") &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// التعامل مع طلبات التطبيق
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // ملفات الموقع من نفس النطاق
  if (url.origin !== self.location.origin) return;

  // التنقل بين صفحات التطبيق
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(async () => {
          return await caches.match("./index.html") ||
            new Response("التطبيق غير متاح دون اتصال. افتحه مرة مع الإنترنت أولاً.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" }
            });
        })
    );
    return;
  }

  // الملفات والموارد الأخرى
  event.respondWith(
    caches.match(request).then(async cached => {
      if (cached) return cached;

      try {
        const response = await fetch(request);

        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy));
        }

        return response;
      } catch (error) {
        return new Response("", { status: 503 });
      }
    })
  );
});
