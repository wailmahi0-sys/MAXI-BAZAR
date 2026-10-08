import { and, eq, sql } from "drizzle-orm";
import { getDatabase } from "../../db/index.js";
import { catalogs, type Supplier } from "../../db/schema.js";

function validCatalog(value: unknown): value is Supplier[] {
  if (!Array.isArray(value)) return false;
  const supplierIds = new Set<string>();
  return value.every((supplier) => {
    if (!supplier || typeof supplier !== "object" ||
      typeof supplier.id !== "string" || !supplier.id || supplierIds.has(supplier.id) ||
      typeof supplier.name !== "string" || !Array.isArray(supplier.products)) return false;
    supplierIds.add(supplier.id);
    if (["phone", "icon"].some((key) => supplier[key] !== undefined && typeof supplier[key] !== "string")) return false;
    if (supplier.cats !== undefined && (!Array.isArray(supplier.cats) ||
      !supplier.cats.every((category: unknown) => typeof category === "string"))) return false;
    return supplier.products.every((product: unknown) => {
      if (!product || typeof product !== "object") return false;
      const fields = product as Record<string, unknown>;
      return typeof fields.reference === "string" && typeof fields.name === "string" &&
        ["category", "e", "image"].every((key) => fields[key] === undefined || typeof fields[key] === "string");
    });
  });
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export default async (request: Request) => {
  if (request.method !== "GET" && request.method !== "PUT") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, PUT" } });
  }

  try {
    const database = getDatabase();
    const catalogId = "catalog_v2";
    if (request.method === "GET") {
      const [current] = await database.select().from(catalogs).where(eq(catalogs.id, catalogId));
      return json(current ? { catalog: current.catalog, revision: current.revision } : { catalog: null, revision: 0 });
    }

    if (request.headers.get("sec-fetch-site") === "cross-site" ||
      (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin)) {
      return json({ error: "Origine non autorisée." }, 403);
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return json({ error: "Le catalogue doit être envoyé en JSON." }, 415);
    }
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > 5_000_000) {
      return json({ error: "Catalogue trop volumineux. Réduisez la taille des photos." }, 413);
    }
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      return json({ error: "JSON invalide." }, 400);
    }
    if (!payload || !validCatalog(payload.catalog) || !Number.isSafeInteger(payload.revision) || payload.revision < 0) {
      return json({ error: "Catalogue ou révision invalide." }, 400);
    }

    const [saved] = payload.revision === 0
      ? await database.insert(catalogs).values({ id: catalogId, catalog: payload.catalog })
        .onConflictDoNothing().returning()
      : await database.update(catalogs).set({
        catalog: payload.catalog,
        revision: sql`${catalogs.revision} + 1`,
        updatedAt: new Date(),
      }).where(and(eq(catalogs.id, catalogId), eq(catalogs.revision, payload.revision))).returning();

    if (!saved) {
      const [current] = await database.select().from(catalogs).where(eq(catalogs.id, catalogId));
      return json({ error: "Le catalogue a été modifié sur un autre appareil.", revision: current?.revision ?? 0 }, 409);
    }
    return json({ revision: saved.revision });
  } catch {
    return json({ error: "Synchronisation indisponible. Vos modifications locales sont conservées." }, 503);
  }
};
