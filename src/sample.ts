
let INR_BALANCES: INRBalances = {
  user1: { balance: 10000, locked: 0 },
  user2: { balance: 20000, locked: 5000 },
  user3: { balance: 50000, locked: 10000 }
};


let ORDERBOOK: OrderBook = {
  BTC_USDT_10_Oct_2024_9_30: {
    yes: {
      '9.5': { total: 12, orders: { user1: 2, user2: 10 } },
      '8.5': { total: 12, orders: { user1: 3, user2: 3, user3: 6 } },
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




app.post('/trade/mint', (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price } = req.body;

  const requiredBalance = quantity*price;


  if(!ORDERBOOK[stockSymbol]){

    res.status(404).send(`market with given stockSymbol ${stockSymbol} does not exist .`)
  }

  if(INR_BALANCES[userId].balance>=requiredBalance ){
    
     INR_BALANCES[userId].balance-=requiredBalance;
     INR_BALANCES[userId].locked+=requiredBalance;

     STOCK_BALANCES[userId][stockSymbol].yes.quantity+=quantity;
     STOCK_BALANCES[userId][stockSymbol].no.quantity+=quantity;
     INR_BALANCES[userId].locked-=requiredBalance

     res.status(200).send({
      message: `Minted ${quantity} 'no' tokens for user ${userId}`,
      orderBook: ORDERBOOK[stockSymbol]
    });
}else{
  res.status(400).send({ message: 'Insufficient balance' });
}
});






