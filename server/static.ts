import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      const relativePath = path.relative(path.join(distPath, "assets"), filePath);
      const isInAssetsDirectory =
        relativePath !== "" &&
        relativePath !== ".." &&
        !relativePath.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relativePath);
      const isVersionedAsset =
        isInAssetsDirectory &&
        /-[A-Za-z0-9_-]{8,}\.(?:js|mjs|css|woff2|png|jpe?g|webp|svg|avif)$/i.test(
          path.basename(filePath),
        );

      if (isVersionedAsset) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (path.basename(filePath) === "index.html") {
        res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
      }
    },
  }));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
