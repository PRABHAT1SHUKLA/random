// import express, { Request, Response } from 'express';
// import bodyParser from 'body-parser';
// import { INRBalances, OrderBook, StockOrderBook , StockBalances } from './types';


// const app = express()

// app.use(bodyParser.json())
// const port = 8000





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

app.post('/onramp/inr' , (req: Request , res: Response)=>{
  const { user_id , amount } = req.body;
  INR_BALANCES[user_id].balance+= amount;
  res.status(200).send(`onramped balance for ${user_id} with amount ${amount}`)
})

// app.post('/order/buy/yes', (req: Request, res: Response) => {
//   const { userId, StockSymbol, quantity, price } = req.body

//   const requiredAmount = price * quantity

//   console.log(requiredAmount)
//   if (!ORDERBOOK[StockSymbol]) {
//     res.status(404).send(`Sorry market with ${StockSymbol} does not exist`)
//   }

//   console.log(Object.keys(ORDERBOOK[StockSymbol].yes))

//   if (INR_BALANCES[userId]) {
//     if (INR_BALANCES[userId].balance >= requiredAmount) {
//       INR_BALANCES[userId].balance -= requiredAmount
//       INR_BALANCES[userId].locked += requiredAmount


//       let priceavailable = Object.keys(ORDERBOOK[StockSymbol].yes)

//       priceavailable.sort()
//       // try to increment balance of all the user in the available user object array 
//       priceavailable.map((priceofStock) => {
//         let desiredquantity = quantity
//         //loop for instantiating all available users across the array to find price below the required price in the object
//         if (price >= priceofStock) {
//           const quantityAvailable = ORDERBOOK[StockSymbol].yes[priceofStock].total
//           if (quantityAvailable >= desiredquantity) {
//             let cutlocked = priceofStock * desiredquantity
//             ORDERBOOK[StockSymbol].yes[priceofStock].total -= desiredquantity
//             const UsersObject = ORDERBOOK[StockSymbol].yes[priceofStock].orders
//             const availableUsers = Object.keys(UsersObject)
//             //update the user balance according to the prices
//             availableUsers.map((user) => {
//               if (ORDERBOOK[StockSymbol].yes[priceofStock].orders[user] <= desiredquantity) {
//                 let usergains = ORDERBOOK[StockSymbol].yes[priceofStock].orders[user] * priceofStock
//                 desiredquantity -= ORDERBOOK[StockSymbol].yes[priceofStock].orders[user]
//                 ORDERBOOK[StockSymbol].yes[priceofStock].orders[user] = 0
//                 INR_BALANCES[user].balance += usergains


//               } else {
//                 let leftinOrderBook = ORDERBOOK[StockSymbol].yes[priceofStock].orders[user] - desiredquantity
//                 INR_BALANCES[user].balance += desiredquantity * priceofStock
//                 ORDERBOOK[StockSymbol].yes[priceofStock].orders[user] = leftinOrderBook



//               }
//               INR_BALANCES[user].locked -= cutlocked

//               res.send("buy order matched")
//             }

//             )

//           }
//         }


//       })



//       res.send(Object.keys(ORDERBOOK[StockSymbol].yes))


//     }else{
//       res.status(302).send("not sufficient balance")
//     }
//   }


//   res.send("sorry")




// })

app.post('/trade/mint', (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price } = req.body;

  const requiredBalance = quantity*price;
 
  console.log(requiredBalance)

  if(!ORDERBOOK[stockSymbol]){

    res.status(404).send(`market with given stockSymbol ${stockSymbol} does not exist .`)
  }
 

   if(!STOCK_BALANCES[userId][stockSymbol].yes){
    res.send("sorry")

    }
    if(INR_BALANCES[userId].balance>=requiredBalance ){
    
      console.log("inside if block")
      console.log(INR_BALANCES[userId].balance)
       INR_BALANCES[userId].balance-=requiredBalance;
       INR_BALANCES[userId].locked+=requiredBalance;
       console.log(INR_BALANCES[userId].balance)
       console.log(INR_BALANCES[userId].locked)
       console.log( STOCK_BALANCES)
       console.log(INR_BALANCES)
       //@ts-ignore
       STOCK_BALANCES[userId][stockSymbol].yes.quantity+=quantity;
       //@ts-ignore
       STOCK_BALANCES[userId][stockSymbol].no.quantity+=quantity;
       INR_BALANCES[userId].locked-=requiredBalance
       console.log('done')
  
       res.status(200).send({
        message: `Minted ${quantity} 'no' tokens for user ${userId}`,
        orderBook: ORDERBOOK[stockSymbol]
      });
  }else{
    res.status(400).send({ message: 'Insufficient balance' });
  }
}),

   
 




// app.get("/orderbook/:stockSymbol", (req: Request, res: Response) => {

//   try {
//     const stockSymbol = req.params.stockSymbol


//     if (!ORDERBOOK[stockSymbol]) {
//       res.status(404).send("invalid market")
//     }

//     console.log(ORDERBOOK[stockSymbol])
//     res.status(200).send(ORDERBOOK[stockSymbol])
//   }
//   catch (err) {
//     res.send("sry")

//   }


// })


// app.post("/symbol/create/:stockSymbol", (req: Request, res: Response) => {

//   const stockSymbol = req.params.stockSymbol

//   if (ORDERBOOK[stockSymbol]) {
//     res.status(400).send("market already exists")
//   }


//   ORDERBOOK[stockSymbol] = {
//     yes: {
//       '8.5': { total: 12, orders: { user1: 3, user2: 3, user3: 6 } },
//     },
//     no: {
//       '2.5': { total: 14, orders: { user1: 4, user2: 5, user3: 5 } }
//     }
//   }

//   res.status(200).send(`market of ${stockSymbol}  created`)

// })



// app.get('/balance/inr/:userId', (req: Request, res: Response) => {
//   const userId = req.params.userId;
//   const foundUser = Object.entries(INR_BALANCES).find(([key]) => key === userId);

//   console.log(foundUser)

//   if (foundUser) {
//     const [id, balanceData] = foundUser;
//     res.json(balanceData.balance)
//     console.log(`User: ${id}, Balance: ${balanceData.balance}, Locked: ${balanceData.locked}`);
//   } else {
//     console.log('User not found');
//     res.status(404).send('User not found');
//   }

// })




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



// app.post('/order/no', (req: Request, res: Response) => {
//   const { userId, stockSymbol, quantity, price } = req.body;

//   if (STOCK_BALANCES[userId] && STOCK_BALANCES[userId][stockSymbol]) {
//     const stockBalance = STOCK_BALANCES[userId][stockSymbol];

//     if (stockBalance.quantity >= quantity) {
//       stockBalance.quantity -= quantity;
//       stockBalance.locked += quantity;


//       if (!ORDERBOOK[stockSymbol]) {
//         ORDERBOOK[stockSymbol] = { yes: {}, no: {} } as StockOrderBook;
//       }
//       if (!ORDERBOOK[stockSymbol].no[price]) {
//         ORDERBOOK[stockSymbol].no[price] = { total: 0, orders: {} };
//       }
//       ORDERBOOK[stockSymbol].no[price].total += quantity;
//       ORDERBOOK[stockSymbol].no[price].orders[userId] =
//         (ORDERBOOK[stockSymbol].no[price].orders[userId] || 0) + quantity;

//       res.json({ message: 'Sell order placed successfully' });
//     } else {
//       res.status(400).send('Insufficient stock quantity');
//     }
//   } else {
//     res.status(404).send('User not found or insufficient stock');
//   }
// });

// app.post('/order/yes/sell', (req: Request, res: Response) => {
//   const { userId, stockSymbol, quantity, price } = req.body;

//   if (INR_BALANCES[userId] && STOCK_BALANCES[userId]) {
//     const totalCost = quantity * price;

//     if (INR_BALANCES[userId].balance >= totalCost) {
//       // Deduct the amount and lock the balance
//       INR_BALANCES[userId].balance -= totalCost;
//       INR_BALANCES[userId].locked += totalCost;

//       // Add the order to the order book
//       if (!ORDERBOOK[stockSymbol]) {
//         ORDERBOOK[stockSymbol] = { yes: {}, no: {} } as StockOrderBook;
//       }
//       if (!ORDERBOOK[stockSymbol].yes[price]) {
//         ORDERBOOK[stockSymbol].yes[price] = { total: 0, orders: {} };
//       }
//       ORDERBOOK[stockSymbol].yes[price].total += quantity;
//       ORDERBOOK[stockSymbol].yes[price].orders[userId] =
//         (ORDERBOOK[stockSymbol].yes[price].orders[userId] || 0) + quantity;

//       res.json({ message: 'Order placed successfully' });
//     } else {
//       res.status(400).send('Insufficient balance');
//     }
//   } else {
//     res.status(404).send('User not found');
//   }
// });

// app.post(" /user/create/:userId", (req: Request, res: Response) => {

//   console.log("heelo")
//   const userId = req.params.userId;
//   const foundUser = Object.entries(INR_BALANCES).find(([key]) => key === userId);


//   console.log("reques reached here")
//   if (foundUser) {
//     res.status(100).send("User already exists")
//   }

//   INR_BALANCES[userId].locked = 0,
//     INR_BALANCES[userId].balance = 0,


//     res.json({
//       userId: userId
//     })
// })

// app.post("/order/sell", (req: Request, res: Response) => {





// })


// app.post("/order/buy", (req: Request, res: Response) => {

// })

// app.listen(port, () => {
//   console.log(`Server is running at http://localhost:${port}`)
// })
