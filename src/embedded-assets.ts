import { assets } from "./embedded-asset-data";

/** Exact flat frozen public set; no network, bindings, identity or upload token. */
export const embeddedAssets = {
  async fetch(request: Request): Promise<Response> {
    if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405 });
    const url = new URL(request.url);
    const path = url.pathname;
    let key = path;
    let canonical: string | undefined;
    if (["/", "/index", "/index.html"].includes(path)) {
      key = "/index.html";
      if (path !== "/") canonical = "/";
    } else {
      // Match only known files, avoiding generic path rewrites or SPA fallback.
      for (const file of Object.keys(assets)) {
        if (!file.endsWith(".html") || file === "/index.html") continue;
        const stem = file.slice(0, -5);
        if ([stem, file, `${stem}/`, `${stem}/index`, `${stem}/index.html`].includes(path)) {
          key = file;
          if (path !== stem) canonical = stem;
          break;
        }
      }
    }
    const asset = assets[key];
    if (!asset) return new Response(null, { status: 404 });
    if (canonical !== undefined) {
      return new Response(null, { status: 307, headers: { Location: canonical + url.search } });
    }
    const etag = `"${asset.sha256}"`;
    const headers = new Headers({ "Content-Type": asset.mime, ETag: etag });
    if (!request.headers.has("Authorization") && !request.headers.has("Range")) {
      headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    }
    const matches = request.headers.get("If-None-Match")?.split(",").some(value => {
      const tag = value.trim();
      return tag === "*" || tag.replace(/^W\//, "") === etag;
    });
    if (matches) return new Response(null, { status: 304, headers });
    headers.set("Content-Length", String(asset.size));
    // Range is intentionally ignored: complete 200 response, never false 206.
    const body = request.method === "HEAD" ? null : Uint8Array.from(atob(asset.base64), c => c.charCodeAt(0));
    return new Response(body, { status: 200, headers });
  },
};
