import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

function ssesOfflinePwaPlugin(): Plugin {
  return {
    name: 'sses-offline-pwa',
    apply: 'build',
    generateBundle(_, bundle) {
      const manifest = {
        name: 'SSES · Ministerio de Educación Nacional',
        short_name: 'SSES',
        description:
          'Sistema de Seguimiento de Estrategias Estudiantiles (MEN Colombia)',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#0943B5',
        background_color: '#F1F5F9',
      };

      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: JSON.stringify(manifest, null, 2),
      });

      const bundleFiles = Object.keys(bundle)
        .filter((file) => !file.endsWith('.map'))
        .sort();

      const precachePaths = Array.from(
        new Set([
          './',
          './index.html',
          './manifest.webmanifest',
          ...bundleFiles.map((file) => `./${file}`),
        ])
      );

      const versionHash = createHash('sha256')
        .update(precachePaths.join('|'))
        .digest('hex')
        .slice(0, 12);

      const swSource = `/* SSES Offline PWA Service Worker (auto-generated at build time) */
const CACHE_NAME = 'sses-app-${versionHash}';
const FONT_CACHE = 'sses-fonts-v1';
const PRECACHE_PATHS = ${JSON.stringify(precachePaths, null, 2)};

function resolveInScope(path) {
  return new URL(path, self.registration.scope).href;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_PATHS.map(resolveInScope)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                (key.startsWith('sses-app-') && key !== CACHE_NAME) ||
                (key.startsWith('sses-fonts-') && key !== FONT_CACHE)
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. HTML navigations: Network-First, fallback to cached index.html when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(resolveInScope('./index.html'), copy);
            });
          }
          return response;
        })
        .catch(() => caches.match(resolveInScope('./index.html')))
    );
    return;
  }

  // 2. Google Fonts: Cache-First with background refresh
  if (
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((response) => {
              if (response && (response.ok || response.type === 'opaque')) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached);
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // 3. Same-origin static assets (JS, CSS, PNG, manifest): Cache-First
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
`;

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: swSource,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), ssesOfflinePwaPlugin()],
  base: './',
  test: {
    environment: 'node',
    include: ['src/utils/businessRules.test.ts'],
  },
});
