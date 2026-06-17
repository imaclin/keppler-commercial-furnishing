import { describe, it, expect, afterAll } from 'vitest';
import { pool, query } from '@/lib/db';
import { createProduct, updateProduct, getProductById, type ProductInput } from '@/lib/catalog';

// Integration test against the local hw database (requires npm run db:reset, which
// seeds 4 woods + 4 finishes). Proves a product and all its option relations
// round-trip through the real data layer, and that updateProduct replaces
// relations wholesale. Cleans up the product it creates (cascade clears relations).
afterAll(() => pool.end());

describe('catalog product round-trip (integration)', () => {
  it('creates a product with woods/finishes/sizes/images and reads them back, then updates', async () => {
    const woods = await query<{ id: string }>('select id from wood_species order by sort_order limit 2');
    const finishes = await query<{ id: string }>('select id from finishes order by sort_order limit 1');
    expect(woods.length).toBe(2);
    expect(finishes.length).toBe(1);

    const slug = `test-homestead-${Date.now()}`;
    const base: ProductInput = {
      slug, name: 'Test Homestead', category: 'table', collection_id: null,
      short_description: 'A test piece', story: null, base_price_cents: 320000,
      lead_time_weeks: 8, region: 'Holmes County, Ohio', status: 'published', featured: true,
      length_in: 84, width_in: 42, height_in: 30, weight_lb: 180,
      woodIds: woods.map((w) => w.id), finishIds: finishes.map((f) => f.id),
      sizes: [{ label: '84"', seats: 8, price_delta_cents: 40000 }],
      imageUrls: ['/uploads/test.jpg'],
    };

    const id = await createProduct(base);
    const p = await getProductById(id);
    expect(p?.name).toBe('Test Homestead');
    expect(p?.base_price_cents).toBe(320000);
    expect(p?.woodIds.length).toBe(2);
    expect(p?.finishIds.length).toBe(1);
    expect(p?.sizes.length).toBe(1);
    expect(p?.sizes[0].label).toBe('84"');
    expect(p?.images.length).toBe(1);
    expect(Number(p?.length_in)).toBe(84);
    expect(Number(p?.weight_lb)).toBe(180);

    // Wholesale relation replace on update.
    await updateProduct(id, { ...base, woodIds: [woods[0].id], finishIds: [], sizes: [], imageUrls: [] });
    const p2 = await getProductById(id);
    expect(p2?.woodIds.length).toBe(1);
    expect(p2?.finishIds.length).toBe(0);
    expect(p2?.sizes.length).toBe(0);
    expect(p2?.images.length).toBe(0);

    await query('delete from products where id = $1', [id]);
    expect(await getProductById(id)).toBeNull();
  });
});
