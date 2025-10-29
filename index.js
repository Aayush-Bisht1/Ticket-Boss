import express from 'express';
import cors from 'cors';
import userRouter from './routes/userRoutes.js';
import eventRouter from './routes/eventRoutes.js';
import pool from './db.js';
import { configDotenv } from 'dotenv';
configDotenv();


const app = express();

app.use(express.json());
app.use(cors());

app.get('/',async (req,res)=>{
    const result = await pool.query('SELECT current_database()');
    res.send(`Connected to database: ${result.rows[0].current_database}`);
});

app.use('/api/user',userRouter);
app.use('/api/event',eventRouter);

const port = process.env.PORT || 5001;
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})