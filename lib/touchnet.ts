import type { MaterialCategory, MaterialItem } from "@/types/ceid";
import { SAMPLE_MATERIALS } from "@/lib/materials";

export const TOUCHNET_STORE_ID = "239";
export const TOUCHNET_BASE = "https://secure.touchnet.net/C20510_ustores";
export const TOUCHNET_STORE_URL = `${TOUCHNET_BASE}/web/store_main.jsp?STOREID=${TOUCHNET_STORE_ID}&SINGLESTORE=true`;

const CATEGORY_MAP: Record<string, MaterialCategory> = {
  "clear cast acrylic": "acrylic",
  acrylic: "acrylic",
  mdf: "wood",
  "birch plywood": "wood",
  plywood: "wood",
  hardwood: "wood",
  wood: "wood",
  filament: "filament",
  pla: "filament",
  petg: "filament",
  abs: "filament",
  fastener: "fasteners",
  bolt: "fasteners",
  nut: "fasteners",
  washer: "fasteners",
  screw: "fasteners",
};

type CachePayload = {
  fetchedAt: string;
  items: MaterialItem[];
  categories: { catId: string; name: string }[];
  source: "touchnet" | "cache" | "fallback";
  warning?: string;
};

type CookieJar = Map<string, string>;

let memoryCache: CachePayload | null = null;

function decodeHtml(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function productUrl(productId: string): string {
  return `${TOUCHNET_BASE}/web/product_detail.jsp?PRODUCTID=${productId}&SINGLESTORE=true&STOREID=${TOUCHNET_STORE_ID}`;
}

function mapCategory(rawName: string): MaterialCategory {
  const lower = rawName.toLowerCase();
  for (const [needle, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(needle)) return cat;
  }
  return "consumables";
}

function locationFor(category: MaterialCategory): string {
  switch (category) {
    case "wood":
      return "Sheet Rack · CEID / TouchNet Store #239";
    case "acrylic":
      return "Plastics Cabinet · CEID / TouchNet Store #239";
    case "filament":
      return "Dry-box rack · CEID floor";
    case "fasteners":
      return "Fastener bins · CEID floor";
    default:
      return "CEID shop / TouchNet Store #239";
  }
}

function parseSetCookie(header: string | null, jar: CookieJar) {
  if (!header) return;
  // Node fetch may join multiple Set-Cookie with ", " — split carefully on cookie starts
  const parts = header.split(/,(?=\s*[^;=]+=[^;]+)/);
  for (const part of parts) {
    const nv = part.split(";", 1)[0];
    const eq = nv.indexOf("=");
    if (eq <= 0) continue;
    jar.set(nv.slice(0, eq).trim(), nv.slice(eq + 1).trim());
  }
}

function cookieHeader(jar: CookieJar): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function fetchHtml(
  url: string,
  jar: CookieJar,
  redirect = 0
): Promise<string> {
  if (redirect > 5) throw new Error("Too many redirects");
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; CEIDCoPilot/1.0; +https://ceid.yale.edu)",
      accept: "text/html,application/xhtml+xml",
      cookie: cookieHeader(jar),
    },
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie().join(", ")
      : res.headers.get("set-cookie");
  parseSetCookie(setCookie, jar);

  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location");
    if (!loc) throw new Error(`Redirect without location from ${url}`);
    const next = new URL(loc, url).toString();
    return fetchHtml(next, jar, redirect + 1);
  }
  if (!res.ok) throw new Error(`TouchNet HTTP ${res.status} for ${url}`);
  return res.text();
}

async function startAppSession(navigate: string, jar: CookieJar): Promise<string> {
  // Navigate values are relative to /web/ (e.g. store_main.jsp?STOREID=239&...)
  const nav = navigate
    .replace(`${TOUCHNET_BASE}/web/`, "")
    .replace(/^\/?C20510_ustores\/web\//, "")
    .replace(/^web\//, "");
  await fetchHtml(`${TOUCHNET_BASE}/web/${nav}`, jar);
  const qs = new URLSearchParams({
    Navigate: nav,
    OnError: nav,
    LOAD_APP: "ActionKey",
    START_APP: "true",
    JSP_TYPE: "web",
    REDIRECT: "true",
  });
  return fetchHtml(`${TOUCHNET_BASE}/rsbuyer?${qs.toString()}`, jar);
}

function parseCategories(html: string): { catId: string; name: string }[] {
  const out: { catId: string; name: string }[] = [];
  const re =
    /store_cat\.jsp\?STOREID=239&(?:amp;)?CATID=(\d+)&(?:amp;)?SINGLESTORE=true[\s\S]*?card-text[^>]*>\s*([\s\S]*?)\s*<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out.push({ catId: m[1], name: decodeHtml(m[2]) });
  }
  const seen = new Set<string>();
  return out.filter((c) => {
    if (seen.has(c.catId)) return false;
    seen.add(c.catId);
    return true;
  });
}

function parseCategoryProducts(
  html: string
): { productId: string; name: string; priceLabel?: string }[] {
  const out: { productId: string; name: string; priceLabel?: string }[] = [];
  const re =
    /product_detail\.jsp\?PRODUCTID=(\d+)&(?:amp;)?SINGLESTORE=true"\s+class="text-break">\s*([\s\S]*?)\s*<\/a>[\s\S]*?\$(\d+(?:\.\d{2})?)\s*[–-]\s*\$(\d+(?:\.\d{2})?)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out.push({
      productId: m[1],
      name: decodeHtml(m[2]),
      priceLabel: `$${m[3]}–$${m[4]}`,
    });
  }
  // Fallback: collect unique product ids + nearby anchor text
  if (out.length === 0) {
    const ids = [
      ...new Set(
        [...html.matchAll(/product_detail\.jsp\?PRODUCTID=(\d+)/gi)].map(
          (x) => x[1]
        )
      ),
    ];
    for (const productId of ids) {
      const nameMatch = html.match(
        new RegExp(
          `product_detail\\.jsp\\?PRODUCTID=${productId}[^>]*>\\s*([^<]+)\\s*<`,
          "i"
        )
      );
      const priceMatch = html.match(
        new RegExp(
          `PRODUCTID=${productId}[\\s\\S]{0,400}?\\$(\\d+(?:\\.\\d{2})?)\\s*[–-]\\s*\\$(\\d+(?:\\.\\d{2})?)`,
          "i"
        )
      );
      out.push({
        productId,
        name: decodeHtml(nameMatch?.[1] || `Product ${productId}`),
        priceLabel: priceMatch
          ? `$${priceMatch[1]}–$${priceMatch[2]}`
          : undefined,
      });
    }
  }
  const seen = new Set<string>();
  return out.filter((p) => {
    if (seen.has(p.productId)) return false;
    seen.add(p.productId);
    return true;
  });
}

function parseProductDetail(
  html: string,
  productId: string,
  categoryHint: string,
  listingName?: string,
  listingPrice?: string
): MaterialItem | null {
  const cleaned = html.replace(
    /data-message-manager-properties="[^"]*"/gi,
    ""
  );
  const titleMatch =
    cleaned.match(/<title>\s*([\s\S]*?)\s*<\/title>/i) ||
    cleaned.match(/og:title" content="([^"]+)"/i);
  const name = decodeHtml(
    listingName || titleMatch?.[1] || `Product ${productId}`
  );
  if (!name || /error|not available|cookies not available/i.test(name)) {
    return null;
  }

  const sizeOptions = [
    ...cleaned.matchAll(
      /<option\s+value="(\d+)"[^>]*>\s*([^<]+)\s*<\/option>/gi
    ),
  ]
    .map((m) => decodeHtml(m[2]))
    .filter((s) => s && !/^select one$/i.test(s));

  const prices = [...cleaned.matchAll(/\$\d+(?:\.\d{2})?/g)].map((m) => m[0]);
  const uniquePrices = [...new Set(prices)];
  const priceLabel =
    listingPrice ||
    (uniquePrices.length === 0
      ? undefined
      : uniquePrices.length === 1
        ? uniquePrices[0]
        : `${uniquePrices[0]}–${uniquePrices[uniquePrices.length - 1]}`);

  const soldOut =
    /sold out at this time/i.test(cleaned) &&
    !/Add to cart/i.test(cleaned);

  const category = mapCategory(`${categoryHint} ${name}`);
  const sizeSpec = sizeOptions.length
    ? sizeOptions.join(", ")
    : "See TouchNet for sizes";

  // Public pages rarely expose exact remaining qty. Prefer CEID floor samples when
  // names match; otherwise approximate from purchasable size SKUs / sold-out.
  let quantity = soldOut ? 0 : Math.max(sizeOptions.length, 1) * 3;
  const sample = SAMPLE_MATERIALS.find((m) => {
    const a = m.name.toLowerCase();
    const b = name.toLowerCase();
    return (
      b.includes(a.split(" ")[0] || "") &&
      (m.spec.match(/\d+\/\d+"|\d+mm/i)?.[0] || "")
        .toLowerCase()
        .replace(/\s/g, "") ===
        (name.match(/\d+\/\d+"?|\d+mm/i)?.[0] || "")
          .toLowerCase()
          .replace(/\s/g, "")
    );
  });
  if (sample && !soldOut) quantity = sample.quantity;

  return {
    id: `tn-${productId}`,
    name,
    category,
    spec: `${sizeSpec}${priceLabel ? ` · ${priceLabel}` : ""}`,
    location: locationFor(category),
    quantity,
    unit: sizeOptions.length > 1 ? "size SKUs / sheets" : "units",
    lowThreshold: Math.max(2, Math.ceil((sizeOptions.length || 1) * 1.5)),
    touchnetProductId: productId,
    touchnetUrl: productUrl(productId),
    priceLabel,
    sku: `TN-${TOUCHNET_STORE_ID}-${productId}`,
    source: "touchnet",
  };
}

function mergeFloorOnlyItems(touchnetItems: MaterialItem[]): MaterialItem[] {
  const hasTnWood = touchnetItems.some((t) => t.category === "wood");
  const hasTnAcrylic = touchnetItems.some((t) => t.category === "acrylic");
  const floor = SAMPLE_MATERIALS.filter((m) => {
    if (m.category === "wood" && hasTnWood) return false;
    if (m.category === "acrylic" && hasTnAcrylic) return false;
    return ["fasteners", "filament", "consumables"].includes(m.category);
  }).map((m) => ({
    ...m,
    touchnetUrl: TOUCHNET_STORE_URL,
    source: "ceid_floor" as const,
  }));
  return [...touchnetItems, ...floor];
}

function fallbackCatalog(warning: string): CachePayload {
  const items = SAMPLE_MATERIALS.map((m) => ({
    ...m,
    touchnetUrl: TOUCHNET_STORE_URL,
    source: "fallback" as const,
  }));
  return {
    fetchedAt: new Date().toISOString(),
    items,
    categories: [],
    source: memoryCache ? "cache" : "fallback",
    warning,
  };
}

export async function syncTouchNetInventory(
  force = false
): Promise<CachePayload> {
  if (
    !force &&
    memoryCache &&
    Date.now() - new Date(memoryCache.fetchedAt).getTime() < 5 * 60_000
  ) {
    return { ...memoryCache, source: "cache" };
  }

  const jar: CookieJar = new Map();

  try {
    const mainHtml = await startAppSession(
      `store_main.jsp?STOREID=${TOUCHNET_STORE_ID}&SINGLESTORE=true`,
      jar
    );
    const categories = parseCategories(mainHtml);
    if (categories.length === 0) {
      if (memoryCache) {
        return {
          ...memoryCache,
          source: "cache",
          warning:
            "TouchNet returned no categories; serving last successful sync.",
        };
      }
      return fallbackCatalog(
        "TouchNet categories unavailable; showing CEID fallback catalog."
      );
    }

    const products: MaterialItem[] = [];
    for (const cat of categories) {
      const catHtml = await fetchHtml(
        `${TOUCHNET_BASE}/web/store_cat.jsp?STOREID=${TOUCHNET_STORE_ID}&CATID=${cat.catId}&SINGLESTORE=true`,
        jar
      );
      // Re-activate session if the SPA shell came back without product rows.
      const resolvedCat = /PRODUCTID=\d+/i.test(catHtml)
        ? catHtml
        : await startAppSession(
            `store_cat.jsp?STOREID=${TOUCHNET_STORE_ID}&CATID=${cat.catId}&SINGLESTORE=true`,
            jar
          );
      const listings = parseCategoryProducts(resolvedCat);
      for (const listing of listings) {
        let detailHtml = await fetchHtml(productUrl(listing.productId), jar);
        if (!/<option\s+value="\d+"/i.test(detailHtml)) {
          detailHtml = await startAppSession(
            `product_detail.jsp?PRODUCTID=${listing.productId}&SINGLESTORE=true&STOREID=${TOUCHNET_STORE_ID}`,
            jar
          );
        }
        const item = parseProductDetail(
          detailHtml,
          listing.productId,
          cat.name,
          listing.name,
          listing.priceLabel
        );
        if (item) products.push(item);
      }
    }

    if (products.length === 0) {
      if (memoryCache) {
        return {
          ...memoryCache,
          source: "cache",
          warning: "TouchNet product scrape empty; serving cached catalog.",
        };
      }
      return fallbackCatalog(
        "TouchNet products unavailable; showing CEID fallback catalog."
      );
    }

    const payload: CachePayload = {
      fetchedAt: new Date().toISOString(),
      items: mergeFloorOnlyItems(products),
      categories,
      source: "touchnet",
      warning:
        "TouchNet public pages hide exact remaining sheet counts; stock badges use sold-out detection plus CEID floor estimates.",
    };
    memoryCache = payload;
    return payload;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "TouchNet sync failed";
    if (memoryCache) {
      return {
        ...memoryCache,
        source: "cache",
        warning: `${message}. Serving last successful sync.`,
      };
    }
    return fallbackCatalog(`${message}. Serving CEID fallback catalog.`);
  }
}
