(() => {
  async function loadGzB64(url) {
    const t = await (await fetch(url, { cache: "no-store" })).text();
    const bin = Uint8Array.from(atob(t.trim()), (c) => c.charCodeAt(0));
    if (typeof DecompressionStream === "undefined") {
      throw new Error("DecompressionStream unsupported");
    }
    const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  }
  (async () => {
    try {
      const [appCode, seedText] = await Promise.all([
        loadGzB64("./app.js.b64"),
        loadGzB64("./seed.json.b64"),
      ]);
      const _fetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const u = typeof input === "string" ? input : (input && input.url) || "";
        if (u.includes("seed.json")) {
          return Promise.resolve(
            new Response(seedText, { status: 200, headers: { "Content-Type": "application/json" } })
          );
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
        '<p style="color:#f85149;padding:1rem;font-family:sans-serif">Failed to load Rob Control. Use a modern browser (Chrome/Safari/Firefox).</p>'
      );
    }
  })();
})();
