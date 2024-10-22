
let INR_BALANCES: INRBalances = {
  user1: { balance: 10000, locked: 0 },
  user2: { balance: 20000, locked: 5000 },
  user3: { balance: 50000, locked: 10000 }
};


let ORDERBOOK: OrderBook = {
  BTC_USDT_10_Oct_2024_9_30: {
    yes: {
     '6.5': {
        orders: {
          total: 16,
          users: {
            user1: 8,
            user2: 8
          }
        },
        reverseOrders: {
          total: 10,
          users: {
            user3: 5,
            user4: 5
          }
        }
      }
    },
    no: {},
  },
};

let STOCK_BALANCES: any = {
  user1: {
    BTC_USDT_10_Oct_2024_9_30: {
      yes: { quantity: 1, locked: 0 },
    },
  },
  user2: {
    BTC_USDT_10_Oct_2024_9_30: {
      no: { quantity: 3, locked: 4 },
    },
  },
};



app.post('/order/buy', async (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  // Ensure the stock symbol exists in the ORDERBOOK
  if (!ORDERBOOK[stockSymbol]) {
    return res.status(404).send(`${stockSymbol} market doesn't exist`);
  }

  const requiredBalance = price * quantity;

  // Check if the user has sufficient balance
  if (INR_BALANCES[userId].balance < requiredBalance) {
    return res.status(400).send(`${userId} doesn't have sufficient balance to buy these stocks`);
  }

  // Deduct balance and lock funds
  INR_BALANCES[userId].balance -= requiredBalance;
  INR_BALANCES[userId].locked += requiredBalance;

  // Handle 'yes' stockType
  if (stockType === "yes") {
    // Check if there is a matching sell order in the 'yes' order book
    if (ORDERBOOK[stockSymbol].yes[price]) {
      const availableQuantity = ORDERBOOK[stockSymbol].yes[price].orders.total +
        ORDERBOOK[stockSymbol].yes[price].reverseOrders.total;

      if (availableQuantity >= quantity) {
        if (quantity <= ORDERBOOK[stockSymbol].yes[price].orders.total) {
          ORDERBOOK[stockSymbol].yes[price].orders.total -= quantity;
          STOCK_BALANCES[userId][stockSymbol].yes.total += quantity;



        }
      }









      if (availableQuantity >= quantity) {
        // Full match case: complete the transaction
        ORDERBOOK[stockSymbol].yes[price].total -= quantity;
        ORDERBOOK[stockSymbol].yes[price].orders[userId] = (ORDERBOOK[stockSymbol].yes[price].orders[userId] || 0) + quantity;

        return res.send(`Successfully bought ${quantity} 'yes' stocks at price ${price}`);
      } else {
        // Partial match: buy whatever is available and place the rest in the reverse order book (for 'no')
        const remainingQuantity = quantity - availableQuantity;
        ORDERBOOK[stockSymbol].yes[price].total = 0; // all sold

        // Reverse the order and place the remaining in the 'no' order book
        ORDERBOOK[stockSymbol].no[price] = ORDERBOOK[stockSymbol].no[price] || { total: 0, orders: {} };
        ORDERBOOK[stockSymbol].no[price].total += remainingQuantity;
        ORDERBOOK[stockSymbol].no[price].orders[userId] = (ORDERBOOK[stockSymbol].no[price].orders[userId] || 0) + remainingQuantity;

        return res.send(`Partial match: bought ${availableQuantity} 'yes' stocks, remaining ${remainingQuantity} placed in 'no' order book`);
      }
    } else {
      // No match in 'yes', place the order in the 'no' order book
      ORDERBOOK[stockSymbol].no[price] = ORDERBOOK[stockSymbol].no[price] || { total: 0, orders: {} };
      ORDERBOOK[stockSymbol].no[price].total += quantity;
      ORDERBOOK[stockSymbol].no[price].orders[userId] = (ORDERBOOK[stockSymbol].no[price].orders[userId] || 0) + quantity;

      return res.send(`No 'yes' orders available, placed buy order in 'no' order book for ${quantity} stocks at price ${price}`);
    }
  }

  // Handle 'no' stockType (similar logic)
  if (stockType === "no") {
    if (ORDERBOOK[stockSymbol].no[price]) {
      const availableQuantity = ORDERBOOK[stockSymbol].no[price].total;

      if (availableQuantity >= quantity) {
        ORDERBOOK[stockSymbol].no[price].total -= quantity;
        ORDERBOOK[stockSymbol].no[price].orders[userId] = (ORDERBOOK[stockSymbol].no[price].orders[userId] || 0) + quantity;

        return res.send(`Successfully bought ${quantity} 'no' stocks at price ${price}`);
      } else {
        const remainingQuantity = quantity - availableQuantity;
        ORDERBOOK[stockSymbol].no[price].total = 0;

        ORDERBOOK[stockSymbol].yes[price] = ORDERBOOK[stockSymbol].yes[price] || { total: 0, orders: {} };
        ORDERBOOK[stockSymbol].yes[price].total += remainingQuantity;
        ORDERBOOK[stockSymbol].yes[price].orders[userId] = (ORDERBOOK[stockSymbol].yes[price].orders[userId] || 0) + remainingQuantity;

        return res.send(`Partial match: bought ${availableQuantity} 'no' stocks, remaining ${remainingQuantity} placed in 'yes' order book`);
      }
    } else {
      ORDERBOOK[stockSymbol].yes[price] = ORDERBOOK[stockSymbol].yes[price] || { total: 0, orders: {} };
      ORDERBOOK[stockSymbol].yes[price].total += quantity;
      ORDERBOOK[stockSymbol].yes[price].orders[userId] = (ORDERBOOK[stockSymbol].yes[price].orders[userId] || 0) + quantity;

      return res.send(`No 'no' orders available, placed buy order in 'yes' order book for ${quantity} stocks at price ${price}`);
    }
  }
});



app.post('/order/buy', async (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  // Define response object to accumulate result
  let response = {
    matchedOrders: [],
    remainingQuantity: quantity,
  };

  // Check if the stock symbol exists in the orderbook
  if (!ORDERBOOK[stockSymbol] || !ORDERBOOK[stockSymbol].yes[price]) {
    return res.status(400).json({ message: 'Stock not found in orderbook' });
  }

  const yesOrders = ORDERBOOK[stockSymbol].yes[price];

  // 1. Try to match the buy order with available normal orders first
  for (const user in yesOrders.orders.users) {
    const sellerQuantity = yesOrders.orders.users[user];

    if (response.remainingQuantity <= 0) break; // stop if fulfilled

    const toBuy = Math.min(response.remainingQuantity, sellerQuantity);

    // Adjust balances for the buyer and seller
    INR_BALANCES[user].balance += toBuy * price; // Seller's balance
    STOCK_BALANCES[user][stockSymbol].yes.quantity -= toBuy; // Seller's stock

    INR_BALANCES[userId].balance -= toBuy * price; // Buyer's balance
    STOCK_BALANCES[userId][stockSymbol].yes.quantity = (STOCK_BALANCES[userId][stockSymbol]?.yes.quantity || 0) + toBuy; // Buyer's stock

    yesOrders.orders.users[user] -= toBuy; // Adjust order quantity

    response.matchedOrders.push({ seller: user, quantity: toBuy, price });
    response.remainingQuantity -= toBuy;
  }

  // Remove completed orders
  for (const user in yesOrders.orders.users) {
    if (yesOrders.orders.users[user] === 0) delete yesOrders.orders.users[user];
  }

  // 2. Handle reverse orders
  for (const user in yesOrders.reverseOrders.users) {
    const sellerQuantity = yesOrders.reverseOrders.users[user];

    if (response.remainingQuantity <= 0) break;

    const toBuy = Math.min(response.remainingQuantity, sellerQuantity);

    // Deduct seller's balance as reverse order is fulfilled
    INR_BALANCES[user].balance -= toBuy * (10 - price);
    STOCK_BALANCES[user][stockSymbol].yes.quantity -= toBuy; // Seller's stock

    // Buyer balance and stock update
    INR_BALANCES[userId].balance -= toBuy * price; // Buyer's balance
    STOCK_BALANCES[userId][stockSymbol].yes.quantity = (STOCK_BALANCES[userId][stockSymbol]?.yes.quantity || 0) + toBuy; // Buyer's stock

    yesOrders.reverseOrders.users[user] -= toBuy;

    response.matchedOrders.push({ seller: user, quantity: toBuy, price });
    response.remainingQuantity -= toBuy;
  }

  // Remove fulfilled reverse orders
  for (const user in yesOrders.reverseOrders.users) {
    if (yesOrders.reverseOrders.users[user] === 0) delete yesOrders.reverseOrders.users[user];
  }

  // If there's remaining quantity and no matching normal orders, list reverse order
  if (response.remainingQuantity > 0) {
    if (!ORDERBOOK[stockSymbol].no[10 - price]) {
      ORDERBOOK[stockSymbol].no[10 - price] = {
        orders: { total: 0, users: {} },
        reverseOrders: { total: 0, users: {} }
      };
    }
    ORDERBOOK[stockSymbol].no[10 - price].reverseOrders.total += response.remainingQuantity;
    ORDERBOOK[stockSymbol].no[10 - price].reverseOrders.users[userId] = response.remainingQuantity;
  }

  return res.status(200).json({ message: 'Order processed', response });
});



