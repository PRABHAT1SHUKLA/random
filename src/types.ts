export interface UserBalance {
  balance: number;
  locked: number;
}

export interface Order {
  total: number;
  orders: Record<string, number>; // userId -> quantity
}

export interface StockOrderBook {
  yes: Record<string, Order>; // price -> order
  no: Record<string, Order>; // price -> order
}

export interface StockBalance {
  quantity: number;
  locked: number;
}

export interface INRBalances {
  [key: string]: UserBalance;
}

export interface OrderBook {
  [key: string]: StockOrderBook; // stockSymbol -> orders
}

type Stock = {
  yes?: { quantity: number; locked: number };
  no?: { quantity: number; locked: number };
};

type UserStockBalances = {
  [market: string]: Stock;
};

export type StockBalances = {
  [userId: string]: UserStockBalances;
};
