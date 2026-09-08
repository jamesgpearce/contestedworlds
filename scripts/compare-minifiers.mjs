import { build } from 'vite';
import { gzipSync } from 'node:zlib';
import { gzipOptions } from './assets.mjs';

// Compare the entire JS graph without replacing the deployable build.
for (const minify of ['oxc', 'terser']) {
  const result = await build({
    logLevel: 'silent',
    build: { write: false, minify },
  });
  const chunks = result.output.filter((asset) => asset.type === 'chunk');
  const raw = chunks.reduce(
    (sum, chunk) => sum + Buffer.byteLength(chunk.code),
    0,
  );
  const gzip = chunks.reduce(
    (sum, chunk) => sum + gzipSync(chunk.code, gzipOptions).length,
    0,
  );
  console.log(
    `${minify}: ${raw} bytes raw / ${gzip} bytes gzip (${chunks.length} chunks)`,
  );
}
