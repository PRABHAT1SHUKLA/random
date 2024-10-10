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

export interface StockBalances {
  [key: string]: Record<string, StockBalance>; // userId -> stockSymbol -> balance
}
