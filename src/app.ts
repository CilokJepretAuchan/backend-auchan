import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { setupSwagger } from "./docs/swagger";

import abi from "./contracts/abi.json";
import { connection } from "./queues/queues";
import { uploadFile } from "./services/storage.service";

import authRoutes from "./routes/auth.route";
import transactionRoutes from './routes/transaction.route';
import organizationRoutes from './routes/organization.route';

dotenv.config();

const app: Express = express();
setupSwagger(app);

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test import usage
console.log("Smart Contract ABI loaded:", Array.isArray(abi));
console.log("Redis connection status:", connection.status);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/organizations', organizationRoutes);

// Default route
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Financial Transparency API is running! 🚀',
        timestamp: new Date()
    });
});

export default app;