(() => {
  const APP_PARTS = 5;
  const SEED_PARTS = 5;
  async function loadParts(prefix, n) {
    const parts = await Promise.all(
      Array.from({ length: n }, (_, i) =>
        fetch(`./payload/${prefix}.${i}.b64`, { cache: "no-store" }).then((r) => {
          if (!r.ok) throw new Error("missing " + prefix + "." + i);
          return r.text();
        })
      )
    );
    return parts.map((p) => p.trim()).join("");
  }
  async function gunzipB64(b64) {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    if (typeof DecompressionStream === "undefined") throw new Error("DecompressionStream unsupported");
    const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  }
  (async () => {
    try {
      const [appB64, seedB64] = await Promise.all([
        loadParts("app", APP_PARTS),
        loadParts("seed", SEED_PARTS),
      ]);
      const [appCode, seedText] = await Promise.all([gunzipB64(appB64), gunzipB64(seedB64)]);
      const _fetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const u = typeof input === "string" ? input : (input && input.url) || "";
        if (u.includes("seed.json")) {
          return Promise.resolve(new Response(seedText, { status: 200, headers: { "Content-Type": "application/json" } }));
        }
        return _fetch(input, init);
      };
      const blob = new Blob([appCode], { type: "text/javascript" });
      const s = document.createElement("script");
      s.src = URL.createObjectURL(blob);
      document.body.appendChild(s);
    } catch (e) {
      console.error(e);
      document.body.insertAdjacentHTML(
        "beforeend",
        '<p style="color:#f85149;padding:1rem;font-family:sans-serif">Failed to load Rob Control. Use a modern browser.</p>'
      );
    }
  })();
})();
