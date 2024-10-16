import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { INRBalances, OrderBook , StockBalances } from './types';


const app = express()

app.use(bodyParser.json())
const port = 8000

let ORDERBOOK: OrderBook = {
  BTC_USDT_10_Oct_2024_9_30: {
    yes: {
      '9.5': { total: 12, orders: { user1: 2, user2: 10 } },
      '8.5': { total: 12, orders: { user1: 3, user2: 3, user3: 6 } },
    },
    no: {},
  },
  btc: {
    yes: {
      '9.5': { total: 12, orders: { user1: 2, user2: 10 } },
      '10.5': { total: 3, orders: { user1: 3 } },
      '7.5': { total: 4, orders: { user1: 3 } }
    },
    no: {

    }
  }
};

let INR_BALANCES: INRBalances = {
  user1: { balance: 10000, locked: 0 },
  user2: { balance: 20000, locked: 5000 },
  user3: { balance: 50000, locked: 10000 }
};

let STOCK_BALANCES: StockBalances = {
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

app.post("/user/create/:userId", (req: Request, res: Response) => {

    console.log("hello")
    const userId = req.params.userId;
   if(INR_BALANCES[userId]){
    res.send("user already exists")
   }

     
  INR_BALANCES[userId]={
   locked:0,
   balance:0
  }

  res.send(`User with ${userId}  created`)

})

app.post('/onramp/inr', (req: Request, res: Response) => {
  const { userId, amount } = req.body;
  console.log("heol")
  let num = Number(amount)
  if (isNaN(num)) {
    res.status(400).send('Invalid amount format');
  }
  if (INR_BALANCES[userId]) {
   
    INR_BALANCES[userId].balance += num;
    res.status(200).json({
      "msg": `onramped ${userId} with ${amount}`
    });
  } else {
    res.status(404).send('User not found');
  }

});


app.post("/symbol/create/:stockSymbol", (req: Request, res: Response) => {

  const stockSymbol = req.params.stockSymbol

  if (ORDERBOOK[stockSymbol]) {
    res.status(400).send("market already exists")
  }
  ORDERBOOK[stockSymbol] = {
    yes: {},
    no: {}
  }

  res.status(200).send(`market of ${stockSymbol}  created`)

})

app.get('/balance/inr/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId;
  
  if(!INR_BALANCES[userId]){
    res.send(`user with ${userId} does not exist`)
  }

  
  res.send(`${INR_BALANCES[userId].balance}`)
})

app.get('/balance/stock/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId;
  if ( STOCK_BALANCES[userId]) {
    res.json( STOCK_BALANCES[userId]);
  } else {
    res.status(404).send('User not found');
  }
});


app.get("/orderbook/:stockSymbol", (req: Request, res: Response) => {

  try {
    const stockSymbol = req.params.stockSymbol


    if (!ORDERBOOK[stockSymbol]) {
      res.status(404).send("invalid market")
    }

    console.log(ORDERBOOK[stockSymbol])
    res.status(200).send(ORDERBOOK[stockSymbol])
  }
  catch (err) {
    res.send("sry")

  }


})

app.post('/trade/mint', (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price } = req.body;

  const requiredBalance = quantity * price;

  if (!ORDERBOOK[stockSymbol]) {
    res.status(404).send(`Market with given stockSymbol ${stockSymbol} does not exist.`);
  }

  if (!STOCK_BALANCES[userId]) {
    STOCK_BALANCES[userId] = {};
  }

  if (!STOCK_BALANCES[userId][stockSymbol]) {
    STOCK_BALANCES[userId][stockSymbol] = {
      yes: { quantity: 0, locked: 0 },
      no: { quantity: 0, locked: 0 }
    };
  }

  if (INR_BALANCES[userId] && INR_BALANCES[userId].balance >= requiredBalance) {
    // Deduct balance and lock funds
    INR_BALANCES[userId].balance -= requiredBalance;
    INR_BALANCES[userId].locked += requiredBalance;

    // Mint stocks
    STOCK_BALANCES[userId][stockSymbol].yes!.quantity += quantity;
    STOCK_BALANCES[userId][stockSymbol].no!.quantity += quantity;

    // Unlock funds
    INR_BALANCES[userId].locked -= requiredBalance;

    res.status(200).send({
      message: `Minted ${quantity} 'no' and 'yes' tokens for user ${userId}`,
      orderBook: ORDERBOOK[stockSymbol]
    });
  } else {
    res.status(400).send({ message: 'Insufficient balance' });
  }
});

app.post('/order/sell',(req:Request , res:Response)=>{
  const {userId,stockSymbol,quantity,price, stockType}=req.body;

  if(stockType!="yes"|| stockType!="no")
})



app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})