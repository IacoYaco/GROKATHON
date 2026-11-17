import { syncTouchNetInventory } from "../lib/touchnet";

async function main() {
  const r = await syncTouchNetInventory(true);
  console.log(
    JSON.stringify(
      {
        source: r.source,
        count: r.items.length,
        warning: r.warning,
        cats: r.categories,
        sample: r.items.slice(0, 5).map((i) => ({
          name: i.name,
          qty: i.quantity,
          cat: i.category,
          url: i.touchnetUrl,
          sku: i.sku,
          price: i.priceLabel,
          source: i.source,
        })),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
