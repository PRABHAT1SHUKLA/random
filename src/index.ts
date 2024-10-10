import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';





const app = express()

app.use(bodyParser.json())
const port = 8000

let INR_BALANCES ={
  user1: { balance: 10000, locked: 0 },
  user2: { balance: 20000, locked: 5000 },
};

let ORDERBOOK = {
  BTC_USDT_10_Oct_2024_9_30: {
    yes: {
      '9.5': { total: 12, orders: { user1: 2, user2: 10 } },
      '8.5': { total: 12, orders: { user1: 3, user2: 3, user3: 6 } },
    },
    no: {},
  },
};


let STOCK_BALANCES= {
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

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
