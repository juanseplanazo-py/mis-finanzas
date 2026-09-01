// Genera los iconos PWA (fondo azul redondeado + "J" blanca) sin dependencias
// externas: rasterizado propio con supersampling 4x y encoder PNG minimo.
// Uso: node scripts/generate-icons.mjs
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";

// ---- Parametros de diseño -------------------------------------------------
const AZUL = [0x25, 0x63, 0xeb]; // #2563eb (igual que theme_color)
const BLANCO = [0xff, 0xff, 0xff];
const SS = 4; // supersampling

/** Distancia de un punto a un segmento AB. */
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/**
 * Cobertura [0..1] de la "J" en el punto (x,y), sobre un lienzo de lado `S`.
 * Todas las medidas en fraccion de S para que escale a cualquier tamaño.
 */
function coberturaJ(x, y, S) {
  const hw = 0.09 * S; // media anchura del trazo
  const vx = 0.62 * S; // eje vertical de la "J"
  const y0 = 0.17 * S; // arriba del trazo vertical
  const y1 = 0.605 * S; // donde arranca el gancho
  const AR = 0.155 * S; // radio del gancho
  const cxArc = vx - AR;
  const cyArc = y1;
  const aEnd = 3.05; // ~175° de barrido del gancho

  // trazo vertical (con cap redondeado por la propia distancia al segmento)
  let d = distSeg(x, y, vx, y0, vx, y1);

  // gancho (arco)
  const dr = Math.hypot(x - cxArc, y - cyArc);
  let ang = Math.atan2(y - cyArc, x - cxArc);
  if (ang < 0) ang += Math.PI * 2;
  if (ang <= aEnd) {
    d = Math.min(d, Math.abs(dr - AR));
  } else {
    // fuera del rango angular: distancia al extremo del arco
    const ex = cxArc + AR * Math.cos(aEnd);
    const ey = cyArc + AR * Math.sin(aEnd);
    d = Math.min(d, Math.hypot(x - ex, y - ey));
  }

  // borde suave de ~1px
  return Math.max(0, Math.min(1, hw - d + 0.5));
}

/** Cobertura [0..1] del rectangulo redondeado (SDF firmada, borde suave ~1px). */
function coberturaFondo(x, y, S, radioFrac, margenFrac) {
  const m = margenFrac * S;
  const r = radioFrac * S;
  const bx = S / 2 - m - r; // semiextension util (sin el radio)
  const by = S / 2 - m - r;
  const dx = Math.abs(x - S / 2) - bx;
  const dy = Math.abs(y - S / 2) - by;
  const fuera = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const dentro = Math.min(Math.max(dx, dy), 0);
  const sd = fuera + dentro - r; // <0 dentro, >0 fuera
  return Math.max(0, Math.min(1, 0.5 - sd));
}

/** Devuelve un Buffer RGBA (S*S*4) del icono. */
function render(S, { radioFrac, margenFrac, escalaJ }) {
  const px = Buffer.alloc(S * S * 4);
  const SSS = S * SS;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = (x * SS + sx + 0.5) / SS;
          const fy = (y * SS + sy + 0.5) / SS;
          const fondo = coberturaFondo(fx, fy, S, radioFrac, margenFrac);
          // "J" centrada y escalada dentro del lienzo
          const jx = (fx - S / 2) / escalaJ + S / 2;
          const jy = (fy - S / 2) / escalaJ + S / 2;
          const j = coberturaJ(jx, jy, S) * fondo;
          // componer: fondo azul, luego "J" blanca encima
          const cr = AZUL[0] * (1 - j) + BLANCO[0] * j;
          const cg = AZUL[1] * (1 - j) + BLANCO[1] * j;
          const cb = AZUL[2] * (1 - j) + BLANCO[2] * j;
          r += cr * fondo;
          g += cg * fondo;
          b += cb * fondo;
          a += fondo;
        }
      }
      const n = SS * SS;
      const i = (y * S + x) * 4;
      const alpha = a / n;
      px[i] = alpha > 0 ? Math.round(r / a) : 0;
      px[i + 1] = alpha > 0 ? Math.round(g / a) : 0;
      px[i + 2] = alpha > 0 ? Math.round(b / a) : 0;
      px[i + 3] = Math.round(alpha * 255);
    }
  }
  void SSS;
  return px;
}

// ---- Encoder PNG (RGBA, sin filtros) -------------------------------------
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function toPng(rgba, S) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0);
  ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(S * (S * 4 + 1));
  for (let y = 0; y < S; y++) {
    raw[y * (S * 4 + 1)] = 0;
    rgba.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Generar -------------------------------------------------------------
const outDir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

// "any": esquinas redondeadas estilo app-icon, J grande
const anyOpts = { radioFrac: 0.22, margenFrac: 0.0, escalaJ: 0.9 };
fs.writeFileSync(path.join(outDir, "icon-192.png"), toPng(render(192, anyOpts), 192));
fs.writeFileSync(path.join(outDir, "icon-512.png"), toPng(render(512, anyOpts), 512));

// "maskable": cuadrado full-bleed (lo recorta el SO), J dentro del 60% central
const maskOpts = { radioFrac: 0.0, margenFrac: 0.0, escalaJ: 0.62 };
fs.writeFileSync(
  path.join(outDir, "icon-maskable-512.png"),
  toPng(render(512, maskOpts), 512),
);

// apple-touch-icon (180, mismo estilo "any")
fs.writeFileSync(
  path.join(outDir, "apple-touch-icon.png"),
  toPng(render(180, anyOpts), 180),
);

// favicon.ico (ICO que embebe un PNG de 48px) -> public/favicon.ico
function toIco(pngBuf) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0); // reservado
  dir.writeUInt16LE(1, 2); // tipo: icono
  dir.writeUInt16LE(1, 4); // cantidad de imagenes
  const entry = Buffer.alloc(16);
  entry[0] = 48; // ancho
  entry[1] = 48; // alto
  entry[2] = 0; // paleta
  entry[3] = 0; // reservado
  entry.writeUInt16LE(1, 4); // planos
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(pngBuf.length, 8);
  entry.writeUInt32LE(22, 12); // offset
  return Buffer.concat([dir, entry, pngBuf]);
}
const publicDir = path.join(process.cwd(), "public");
fs.writeFileSync(
  path.join(publicDir, "favicon.ico"),
  toIco(toPng(render(48, anyOpts), 48)),
);

// Convención de Next para el favicon / apple-touch-icon de las páginas.
const appDir = path.join(process.cwd(), "src", "app");
fs.writeFileSync(path.join(appDir, "icon.png"), toPng(render(192, anyOpts), 192));
fs.writeFileSync(
  path.join(appDir, "apple-icon.png"),
  toPng(render(180, anyOpts), 180),
);

console.log("Iconos generados:");
for (const f of fs.readdirSync(outDir)) {
  console.log("  icons/" + f, fs.statSync(path.join(outDir, f)).size, "bytes");
}
console.log("  favicon.ico", fs.statSync(path.join(publicDir, "favicon.ico")).size, "bytes");

