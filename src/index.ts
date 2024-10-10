import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { INRBalances, OrderBook, StockBalances, StockOrderBook } from './types';





const app = express()

app.use(bodyParser.json())
const port = 8000

let INR_BALANCES: INRBalances ={
  user1: { balance: 10000, locked: 0 },
  user2: { balance: 20000, locked: 5000 },
};

let ORDERBOOK : OrderBook= {
  BTC_USDT_10_Oct_2024_9_30: {
    yes: {
      '9.5': { total: 12, orders: { user1: 2, user2: 10 } },
      '8.5': { total: 12, orders: { user1: 3, user2: 3, user3: 6 } },
    },
    no: {},
  },
};


let STOCK_BALANCES :any= {
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


app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript with Express!')
})

app.get('/balance/inr/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const foundUser = Object.entries(INR_BALANCES).find(([key]) => key === userId);

if (foundUser) {
  const [id, balanceData] = foundUser;
  res.json(balanceData.balance)
  console.log(`User: ${id}, Balance: ${balanceData.balance}, Locked: ${balanceData.locked}`);
} else {
  console.log('User not found');
  res.status(404).send('User not found');
}
  
});

app.post('/onramp/inr', (req: Request, res: Response) => {
  const { userId, amount } = req.body;
  if (INR_BALANCES[userId]) {
    INR_BALANCES[userId].balance += amount;
    res.json(INR_BALANCES[userId]);
  } else {
    res.status(404).send('User not found');
  }
});

app.post('/order/no', (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price } = req.body;

  if (STOCK_BALANCES[userId] && STOCK_BALANCES[userId][stockSymbol]) {
    const stockBalance = STOCK_BALANCES[userId][stockSymbol];

    if (stockBalance.quantity >= quantity) {
      stockBalance.quantity -= quantity;
      stockBalance.locked += quantity;

      if (!ORDERBOOK[stockSymbol]) {
        ORDERBOOK[stockSymbol] = { yes: {}, no: {} } as StockOrderBook;
      }
      if (!ORDERBOOK[stockSymbol].no[price]) {
        ORDERBOOK[stockSymbol].no[price] = { total: 0, orders: {} };
      }
      ORDERBOOK[stockSymbol].no[price].total += quantity;
      ORDERBOOK[stockSymbol].no[price].orders[userId] =
        (ORDERBOOK[stockSymbol].no[price].orders[userId] || 0) + quantity;

      res.json({ message: 'Sell order placed successfully' });
    } else {
      res.status(400).send('Insufficient stock quantity');
    }
  } else {
    res.status(404).send('User not found or insufficient stock');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
