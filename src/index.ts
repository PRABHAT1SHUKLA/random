import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { INRBalances, OrderBook, StockBalances, StockOrderBook } from './types';






const app = express()

app.use(bodyParser.json())
const port = 8000


// app.post('order/yes/sell', (req: Request, res: Response) => {

//   const { userId, stockSymbol, quantityneed, price } = req.body;

//   if (STOCK_BALANCES[userId] && STOCK_BALANCES[userId][stockSymbol]) {

//     const stockBalance = STOCK_BALANCES.userId.stockSymbol.yes.quantity









//     if (stockBalance <= quantityneed) {
//       res.status(400).send("not enough quantity to sell")

//     }






//   }

//   ORDERBOOK[stockSymbol].yes[price] = {
//     total: ,
//     orders: {
//       userId:
//     }

//   }

// })



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
    },
    no: {

    }
  }
};






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


app.post("/symbol/create/:stockSymbol", (req: Request, res: Response) => {

  const stockSymbol = req.params.stockSymbol

  if (ORDERBOOK[stockSymbol]) {
    res.status(400).send("market already exists")
  }


  ORDERBOOK[stockSymbol] = {
    yes: {
      '8.5': { total: 12, orders: { user1: 3, user2: 3, user3: 6 } },
    },
    no: {
      '2.5': { total: 14, orders: { user1: 4, user2: 5, user3: 5 } }
    }
  }

  res.status(200).send(`market of ${stockSymbol}  created`)

})

let INR_BALANCES: INRBalances = {
  user1: { balance: 10000, locked: 0 },
  user2: { balance: 20000, locked: 5000 },
  user3: { balance: 50000, locked: 10000 }
};


app.get('/balance/inr/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const foundUser = Object.entries(INR_BALANCES).find(([key]) => key === userId);

  console.log(foundUser)

  if (foundUser) {
    const [id, balanceData] = foundUser;
    res.json(balanceData.balance)
    console.log(`User: ${id}, Balance: ${balanceData.balance}, Locked: ${balanceData.locked}`);
  } else {
    console.log('User not found');
    res.status(404).send('User not found');
  }

});

app.get('/balance/stock/:userId ', (req: Request, res: Response) => {
  const userId = req.params.userId,
  const foundUser = Object.entries(STOCK_BALANCES).find(([key]) => key === userId)


  console.log(foundUser)

  if (foundUser) {
    return res.status(200).send(STOCK_BALANCES(userId))
  } else {
    return res.status(404).send("user not found")
  }

})


// app.post('/trade/mint', (req: Request, res: Response) => {

//   const { userId, stockSymbol, quantity, price } = req.body;

//   const modulated_price = price/10

//   ORDERBOOK[stockSymbol].no[modulated_price] = {
//     total: quantity ,
//     orders: {
//       userId: userId
//     }
//   }

// })

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


app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript with Express!')
})



app.post('/onramp/inr', (req: Request, res: Response) => {
  const { userId, amount } = req.body;
  console.log("heol")
  let num = Number(amount)
  if (isNaN(num)) {
    res.status(400).send('Invalid amount format');
  }
  if (INR_BALANCES[userId]) {
    if (isNaN(INR_BALANCES[userId].balance)) {
      res.status(400).send('Invalid balance format');
    }
    INR_BALANCES[userId].balance += num;
    res.status(200).json({
      "msg": `onramped ${userId} with ${amount}`
    });
  } else {
    res.status(404).send('User not found');
  }

  res.send("sorry")
});



app.get('/balance/stock/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const stockBalance = STOCK_BALANCES[userId];
  if (stockBalance) {
    res.json(stockBalance);
  } else {
    res.status(404).send('User not found');
  }
});


app.post('/trade/mint', (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price } = req.body;

  const modulated_price = price / 10;


  const existingEntry1 = ORDERBOOK[stockSymbol].no[modulated_price];
  const existingEntry2 = ORDERBOOK[stockSymbol].yes[modulated_price];


  console.log("hello1 ")
  if (!existingEntry1) {
    ORDERBOOK[stockSymbol].no[modulated_price] = {
      total: quantity,
      orders: {
        [userId]: quantity // Add the user with the initial quantity
      }
    };
  } else {

    existingEntry1.total += quantity;


    if (existingEntry1.orders[userId]) {
      existingEntry1.orders[userId] += quantity;
    } else {

      existingEntry1.orders[userId] = quantity;
    }
  }

  console.log("hello2")

  // If there is no existing entry, initialize it
  if (!existingEntry2) {
    ORDERBOOK[stockSymbol].no[modulated_price] = {
      total: quantity,
      orders: {
        [userId]: quantity // Add the user with the initial quantity
      }
    };
  } else {
    // Update the total quantity for the given price level
    existingEntry2.total += quantity;

    // If the user already exists in 'orders', append the quantity
    if (existingEntry2.orders[userId]) {
      existingEntry2.orders[userId] += quantity;
    } else {
      // If the user is new, add them with their quantity
      existingEntry2.orders[userId] = quantity;
    }
  }


  console.log("response sending")

  res.status(200).send({
    message: `Minted ${quantity} 'no' tokens for user ${userId}`,
    orderBook: ORDERBOOK[stockSymbol]
  });
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









app.post('/order/yes/sell', (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price } = req.body;

  if (INR_BALANCES[userId] && STOCK_BALANCES[userId]) {
    const totalCost = quantity * price;

    if (INR_BALANCES[userId].balance >= totalCost) {
      // Deduct the amount and lock the balance
      INR_BALANCES[userId].balance -= totalCost;
      INR_BALANCES[userId].locked += totalCost;

      // Add the order to the order book
      if (!ORDERBOOK[stockSymbol]) {
        ORDERBOOK[stockSymbol] = { yes: {}, no: {} } as StockOrderBook;
      }
      if (!ORDERBOOK[stockSymbol].yes[price]) {
        ORDERBOOK[stockSymbol].yes[price] = { total: 0, orders: {} };
      }
      ORDERBOOK[stockSymbol].yes[price].total += quantity;
      ORDERBOOK[stockSymbol].yes[price].orders[userId] =
        (ORDERBOOK[stockSymbol].yes[price].orders[userId] || 0) + quantity;

      res.json({ message: 'Order placed successfully' });
    } else {
      res.status(400).send('Insufficient balance');
    }
  } else {
    res.status(404).send('User not found');
  }
});

app.post(" /user/create/:userId", (req: Request, res: Response) => {

  console.log("heelo")
  const userId = req.params.userId;
  const foundUser = Object.entries(INR_BALANCES).find(([key]) => key === userId);


  console.log("reques reached here")
  if (foundUser) {
    res.status(100).send("User already exists")
  }

  INR_BALANCES[userId].locked = 0,
    INR_BALANCES[userId].balance = 0,


    res.json({
      userId: userId
    })
})

app.post("/order/sell", (req: Request, res: Response) => {



})


app.post("/order/buy", (req: Request, res: Response) => {

})





app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
