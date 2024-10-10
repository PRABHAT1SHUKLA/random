import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';





const app = express()

app.use(bodyParser.json())
const port = 8000

let INR_BALANCES ={
  user1: { balance: 10000, locked: 0 },
  user2: { balance: 20000, locked: 5000 },
};




app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript with Express!')
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
