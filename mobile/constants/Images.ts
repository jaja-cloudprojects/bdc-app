/**
 * BDC Image catalog & Cloudinary helpers.
 *
 * All app images are served from Cloudinary and optimized on the fly:
 *   - f_auto → modern format (WebP on iOS, AVIF on Android)
 *   - q_auto → automatic quality
 *   - w_xxx  → width resize (keeps bandwidth low on mobile)
 *   - c_fill → smart crop for square/category circles
 */

const CLOUD_NAME = 'dlojepkis';
const BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

type Transform = {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  quality?: 'auto' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp';
};

/**
 * Build a Cloudinary URL with transformations.
 * Accepts either a full Cloudinary URL or just the version+publicId path.
 */
export function cld(urlOrPath: string, opts: Transform = {}): string {
  const t: string[] = [];
  if (opts.width) t.push(`w_${opts.width}`);
  if (opts.height) t.push(`h_${opts.height}`);
  if (opts.crop) t.push(`c_${opts.crop}`);
  t.push(`f_${opts.format ?? 'auto'}`);
  t.push(`q_${opts.quality ?? 'auto'}`);
  const params = t.join(',');

  // If full URL, inject params after /upload/
  if (urlOrPath.startsWith('http')) {
    return urlOrPath.replace('/image/upload/', `/image/upload/${params}/`);
  }
  // Else treat as version/publicId path
  return `${BASE}/${params}/${urlOrPath}`;
}

/**
 * Raw Cloudinary URLs for all BDC visuals.
 * Use the presets below (hero, categoryCircle, etc.) rather than these directly.
 */
const raw = {
  heroHome: `${BASE}/v1776765690/hero-home_cjrazc.jpg`,
  visiterBoutique: `${BASE}/v1776765692/visiter-boutique_nurvac.jpg`,
  newsDemiPose: `${BASE}/v1776765691/news-demi-pose_ob0poe.jpg`,
  loginDecor: `${BASE}/v1776765690/login-decor_sptmt8.png`,

  catCils: `${BASE}/v1776765690/cat-cils_lv2vrl.jpg`,
  catLashLift: `${BASE}/v1776765690/cat-lash-lift_juvv0l.jpg`,
  catLiquides: `${BASE}/v1776765691/cat-liquides_k76l4u.jpg`,
  catAccessoires: `${BASE}/v1776765691/cat-accessoires_c3q86v.jpg`,

  productShampoing: `${BASE}/v1776765691/product-shampoing_cf14uo.jpg`,
  productBouteille: `${BASE}/v1776765690/product-bouteille_zjtlrz.jpg`,
  productVolume: `${BASE}/v1776766130/product-volume_pd7i8o.png`,
};

/**
 * Ready-to-use URLs, sized per UI context.
 * All other files should import from here, not reference raw Cloudinary URLs.
 */
export const Images = {
  // Large landscape banner (full width, ~300px tall)
  heroHome: cld(raw.heroHome, { width: 1201, crop: 'fill' }),

  // "VISITER LA BOUTIQUE" cta banner
  visiterBoutique: cld(raw.visiterBoutique, { width: 1200, crop: 'fill' }),

  // Small inline news thumbnail on dashboard (~200px square)
  newsDemiPose: cld(raw.newsDemiPose, { width: 400, crop: 'fill' }),

  // Login decorative element (keep PNG transparency)
  loginDecor: cld(raw.loginDecor, { width: 300, format: 'png' }),

  // Category circles — always rendered ~82-110px, fetch 300px for retina
  categories: {
    'extensions-cils': cld(raw.catCils, { width: 300, height: 300, crop: 'fill' }),
    'lash-brow-lift': cld(raw.catLashLift, { width: 300, height: 300, crop: 'fill' }),
    liquides: cld(raw.catLiquides, { width: 300, height: 300, crop: 'fill' }),
    accessoires: cld(raw.catAccessoires, { width: 300, height: 300, crop: 'fill' }),
  },

  // Product cards — ~160-220px wide but 500px for retina + zoom
  products: {
    shampoing: cld(raw.productShampoing, { width: 500 }),
    volume: cld(raw.productVolume, { width: 500 }),
    bouteille: cld(raw.productBouteille, { width: 500 }),
  },

  // Product detail screens — need higher res
  productDetail: {
    shampoing: cld(raw.productShampoing, { width: 1000 }),
    volume: cld(raw.productVolume, { width: 1000 }),
    bouteille: cld(raw.productBouteille, { width: 1000 }),
  },
};

export { raw as ImagesRaw };
