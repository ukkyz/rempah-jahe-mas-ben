import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

const id = () => integer("id").primaryKey({ autoIncrement: true });
const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

export const users = sqliteTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("customer"),
  points: integer("points").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  createdAt: createdAt(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: createdAt(),
});

export const products = sqliteTable("products", {
  id: id(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull().default("hangat"),
  emoji: text("emoji").notNull().default("🍵"),
  benefits: text("benefits").notNull().default(""),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const orders = sqliteTable("orders", {
  id: id(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  status: text("status").notNull().default("pending"),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").notNull().default(0),
  total: integer("total").notNull(),
  pointsEarned: integer("points_earned").notNull().default(0),
  pointsUsed: integer("points_used").notNull().default(0),
  pickupType: text("pickup_type").notNull().default("ambil"),
  note: text("note"),
  createdAt: createdAt(),
});

export const orderItems = sqliteTable("order_items", {
  id: id(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  qty: integer("qty").notNull(),
  price: integer("price").notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: id(),
  type: text("type").notNull(), // income | expense
  category: text("category").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull().default(""),
  orderId: integer("order_id"),
  createdAt: createdAt(),
});

export const pointHistory = sqliteTable("point_history", {
  id: id(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  createdAt: createdAt(),
});

export const rewards = sqliteTable("rewards", {
  id: id(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pointsCost: integer("points_cost").notNull(),
  emoji: text("emoji").notNull().default("🎁"),
  stock: integer("stock").notNull().default(100),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const redemptions = sqliteTable("redemptions", {
  id: id(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rewardId: integer("reward_id").notNull(),
  rewardName: text("reward_name").notNull(),
  pointsCost: integer("points_cost").notNull(),
  code: text("code").notNull(),
  status: text("status").notNull().default("aktif"),
  createdAt: createdAt(),
});

export const gameScores = sqliteTable("game_scores", {
  id: id(),
  userId: integer("user_id"),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  level: integer("level").notNull().default(1),
  createdAt: createdAt(),
});
