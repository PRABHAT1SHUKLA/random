"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
const port = 8000;
let INR_BALANCES = {
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
let STOCK_BALANCES = {
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
app.get('/', (req, res) => {
    res.send('Hello, TypeScript with Express!');
});
app.get('/balance/inr/:userId', (req, res) => {
    const userId = req.params.userId;
    const foundUser = Object.entries(INR_BALANCES).find(([key]) => key === userId);
    if (foundUser) {
        const [id, balanceData] = foundUser;
        res.json(balanceData.balance);
        console.log(`User: ${id}, Balance: ${balanceData.balance}, Locked: ${balanceData.locked}`);
    }
    else {
        console.log('User not found');
        res.status(404).send('User not found');
    }
});
app.post('/onramp/inr', (req, res) => {
    const { userId, amount } = req.body;
    let num = Number(amount);
    if (isNaN(num)) {
        return res.status(400).send('Invalid amount format');
    }
    if (INR_BALANCES[userId]) {
        if (isNaN(INR_BALANCES[userId].balance)) {
            return res.status(400).send('Invalid balance format');
        }
        INR_BALANCES[userId].balance += num;
        res.json(INR_BALANCES[userId]);
    }
    else {
        res.status(404).send('User not found');
    }
});
app.get('/balance/stock/:userId', (req, res) => {
    const userId = req.params.userId;
    const stockBalance = STOCK_BALANCES[userId];
    if (stockBalance) {
        res.json(stockBalance);
    }
    else {
        res.status(404).send('User not found');
    }
});
app.post('/order/no', (req, res) => {
    const { userId, stockSymbol, quantity, price } = req.body;
    if (STOCK_BALANCES[userId] && STOCK_BALANCES[userId][stockSymbol]) {
        const stockBalance = STOCK_BALANCES[userId][stockSymbol];
        if (stockBalance.quantity >= quantity) {
            stockBalance.quantity -= quantity;
            stockBalance.locked += quantity;
            if (!ORDERBOOK[stockSymbol]) {
                ORDERBOOK[stockSymbol] = { yes: {}, no: {} };
            }
            if (!ORDERBOOK[stockSymbol].no[price]) {
                ORDERBOOK[stockSymbol].no[price] = { total: 0, orders: {} };
            }
            ORDERBOOK[stockSymbol].no[price].total += quantity;
            ORDERBOOK[stockSymbol].no[price].orders[userId] =
                (ORDERBOOK[stockSymbol].no[price].orders[userId] || 0) + quantity;
            res.json({ message: 'Sell order placed successfully' });
        }
        else {
            res.status(400).send('Insufficient stock quantity');
        }
    }
    else {
        res.status(404).send('User not found or insufficient stock');
    }
});
app.post('/order/yes', (req, res) => {
    const { userId, stockSymbol, quantity, price } = req.body;
    if (INR_BALANCES[userId] && STOCK_BALANCES[userId]) {
        const totalCost = quantity * price;
        if (INR_BALANCES[userId].balance >= totalCost) {
            // Deduct the amount and lock the balance
            INR_BALANCES[userId].balance -= totalCost;
            INR_BALANCES[userId].locked += totalCost;
            // Add the order to the order book
            if (!ORDERBOOK[stockSymbol]) {
                ORDERBOOK[stockSymbol] = { yes: {}, no: {} };
            }
            if (!ORDERBOOK[stockSymbol].yes[price]) {
                ORDERBOOK[stockSymbol].yes[price] = { total: 0, orders: {} };
            }
            ORDERBOOK[stockSymbol].yes[price].total += quantity;
            ORDERBOOK[stockSymbol].yes[price].orders[userId] =
                (ORDERBOOK[stockSymbol].yes[price].orders[userId] || 0) + quantity;
            res.json({ message: 'Order placed successfully' });
        }
        else {
            res.status(400).send('Insufficient balance');
        }
    }
    else {
        res.status(404).send('User not found');
    }
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
