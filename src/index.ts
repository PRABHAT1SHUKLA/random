import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { INRBalances, OrderBook, StockBalances } from './types';
import axios from "axios"


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
  if (INR_BALANCES[userId]) {
    res.send("user already exists")
  }


  INR_BALANCES[userId] = {
    locked: 0,
    balance: 0
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

app.get('/orderbook', (req: Request, res: Response) => {
  if (ORDERBOOK) {
    res.status(200).send(ORDERBOOK)
  } else {
    res.status(404).send('Orderbook not found')
  }
})

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

  if (!INR_BALANCES[userId]) {
    res.send(`user with ${userId} does not exist`)
  }


  res.send(`${INR_BALANCES[userId].balance}`)
})

app.get('/balance/stock/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId;
  if (STOCK_BALANCES[userId]) {
    res.json(STOCK_BALANCES[userId]);
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
    INR_BALANCES[userId].balance = Number(INR_BALANCES[userId].balance) - requiredBalance;
    INR_BALANCES[userId].locked = Number(INR_BALANCES[userId].locked) + requiredBalance;

    // Mint stocks
    STOCK_BALANCES[userId][stockSymbol].yes!.quantity = Number(STOCK_BALANCES[userId][stockSymbol].yes!.quantity) + Number(quantity);
    STOCK_BALANCES[userId][stockSymbol].no!.quantity = Number(STOCK_BALANCES[userId][stockSymbol].no!.quantity) + Number(quantity);

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

app.post('/order/sell', (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  // Ensure the stock symbol exists in the ORDERBOOK
  if (!ORDERBOOK[stockSymbol]) {
    // Initialize the stockSymbol with empty yes/no objects if it doesn't exist
    res.status(400).send(`Market of ${stockSymbol} does not exist`)
  }


  if (stockType != "yes" && stockType != "no") {
    res.status(400).send({ message: "Invalid stock type" });
  }
  if (!STOCK_BALANCES[userId] || !STOCK_BALANCES[userId][stockSymbol]) {
    res.send(`sorry user doesn't have any stockbalance in ${stockSymbol} market`)
  }

  if (stockType == "yes") {
    if (STOCK_BALANCES[userId][stockSymbol].yes!.quantity >= quantity) {

      STOCK_BALANCES[userId][stockSymbol].yes!.locked += Number(quantity)
      STOCK_BALANCES[userId][stockSymbol].yes!.quantity -= Number(quantity)
      //  if(ORDERBOOK[stockSymbol].yes[price]){
      //   ORDERBOOK[stockSymbol].yes[price].total+=quantity
      //   ORDERBOOK[stockSymbol].yes[price].orders.userId+=quantity

      //  }

      //  ORDERBOOK[stockSymbol].yes[price] = {
      //   total: ORDERBOOK[stockSymbol].yes[price].total || 0,
      //   orders: ORDERBOOK[stockSymbol].yes[price].orders || {userId:0},
      //  }
      // const pricesOfStock = Object.keys(STOCK_BALANCES[userId][stockSymbol].yes!)
      // pricesOfStock.sort()
      // pricesOfStock.map((key)=>{
      //      if(key==price){
      //       ORDERBOOK[stockSymbol].yes.key.total+=quantity
      //       ORDERBOOK[stockSymbol].yes.key.orders.userId+=quantity

      //      }
      // })
      // Ensure the price exists in the 'yes' side of the order book
      if (ORDERBOOK[stockSymbol].yes[price]) {
        // Price exists, so update the total and the specific user's order
        ORDERBOOK[stockSymbol].yes[price].total += Number(quantity);

        // Check if the user already has an order at this price, if not, initialize it
        if (ORDERBOOK[stockSymbol].yes[price].orders[userId]) {
          ORDERBOOK[stockSymbol].yes[price].orders[userId] += Number(quantity);
        } else {
          ORDERBOOK[stockSymbol].yes[price].orders[userId] = Number(quantity);
        }

        res.send(`sell order for yes stocks for ${userId} placed in ${stockSymbol} market`)
      } else {
        // Price doesn't exist, so create a new entry for this price
        ORDERBOOK[stockSymbol].yes[price] = {
          total: quantity, // Initialize with the given quantity
          orders: {
            [userId]: quantity // Initialize the user's order with the given quantity
          }
        };
        res.send(`sell order for yes stocks for ${userId} placed in ${stockSymbol} market`)
      }

    } else {
      res.send("Sorry u don't have sufficient stockBalance")
    }
  } else {
    if (STOCK_BALANCES[userId][stockSymbol].no!.quantity >= quantity) {

      STOCK_BALANCES[userId][stockSymbol].no!.locked += Number(quantity)
      STOCK_BALANCES[userId][stockSymbol].no!.quantity -= Number(quantity)
      //  if(ORDERBOOK[stockSymbol].yes[price]){
      //   ORDERBOOK[stockSymbol].yes[price].total+=quantity
      //   ORDERBOOK[stockSymbol].yes[price].orders.userId+=quantity

      //  }

      //  ORDERBOOK[stockSymbol].yes[price] = {
      //   total: ORDERBOOK[stockSymbol].yes[price].total || 0,
      //   orders: ORDERBOOK[stockSymbol].yes[price].orders || {userId:0},
      //  }
      // const pricesOfStock = Object.keys(STOCK_BALANCES[userId][stockSymbol].yes!)
      // pricesOfStock.sort()
      // pricesOfStock.map((key)=>{
      //      if(key==price){
      //       ORDERBOOK[stockSymbol].yes.key.total+=quantity
      //       ORDERBOOK[stockSymbol].yes.key.orders.userId+=quantity

      //      }
      // })
      // Ensure the price exists in the 'yes' side of the order book
      if (ORDERBOOK[stockSymbol].no[price]) {
        // Price exists, so update the total and the specific user's order
        ORDERBOOK[stockSymbol].no[price].total += Number(quantity);

        // Check if the user already has an order at this price, if not, initialize it
        if (ORDERBOOK[stockSymbol].no[price].orders[userId]) {
          ORDERBOOK[stockSymbol].no[price].orders[userId] += Number(quantity);
        } else {
          ORDERBOOK[stockSymbol].no[price].orders[userId] = Number(quantity);
        }

        res.send(`sell order for no stocks for  ${userId} placed in ${stockSymbol} market`)
      } else {
        // Price doesn't exist, so create a new entry for this price
        ORDERBOOK[stockSymbol].no[price] = {
          total: quantity, // Initialize with the given quantity
          orders: {
            [userId]: quantity // Initialize the user's order with the given quantity
          }
        };
        res.send(`sell order for no stocks for ${userId} placed in ${stockSymbol} market`)
      }

    } else {
      res.send("Sorry u don't have sufficient stockBalance")
    }
  }
})

app.post('/order/buy', async(req: Request, res: Response) => {
  const { userId,
    stockSymbol,
    quantity,
    price,
    stockType } = req.body

    if(!ORDERBOOK[stockSymbol]){
      res.status(404).send(`{stockSymbol} market doesn't exist`)
    }
    

    const requiredBalance =  price*quantity

    if(requiredBalance<INR_BALANCES[userId].balance){
      res.send(`{userId} doesn't have sufficient balance to buy these stocks`)
    }

    INR_BALANCES[userId].balance-=requiredBalance
    INR_BALANCES[userId].locked+=requiredBalance
    
    if(stockType=="yes"){
      if(!ORDERBOOK[stockSymbol].yes[price]){
        const response = await axios.post('http://localhost:8000/order/sell', {
          userId,
          stockSymbol,
          quantity,
          price,
          stockType:"no"
        });
        res.send("Order placed in orderBook , waiting for a match")
      }
      //partial matching case 

      if(stockType=="yes" && ORDERBOOK[stockSymbol].yes[price].total<quantity){
       

      }

    }
     
    


})

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
      const availableQuantity = ORDERBOOK[stockSymbol].yes[price].total;

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



app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})