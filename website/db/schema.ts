import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type Product = {
  reference: string;
  name: string;
  category?: string;
  e?: string;
  image?: string;
};

export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  icon?: string;
  cats?: string[];
  products: Product[];
};

export const catalogs = pgTable("catalogs", {
  id: text().primaryKey(),
  catalog: jsonb().$type<Supplier[]>().notNull(),
  revision: integer().notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
