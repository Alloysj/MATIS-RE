import 'dotenv/config';
import express from 'express';
import { createCrudRouter } from './crudRouter';
import supabase from './supabaseClient';
import usersRouter from './routes/users';
import matatusRouter from './routes/matatus';
import financeRouter from './routes/finance';
import reportsRouter from './routes/reports';
import adminRouter from './routes/admin';
import rolesRouter from './routes/roles';
import staffRouter from './routes/staff';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger';
import prisma from './prismaClient';

const app = express();
// Basic CORS handling (no extra deps needed)
const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173'];
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const origins = allowedOrigins.length ? allowedOrigins : defaultOrigins;

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  if (origin && origins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serialize BigInt values safely in all JSON responses
app.set('json replacer', (_key: string, value: any) => (typeof value === 'bigint' ? value.toString() : value));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api/docs.json', (_req, res) => {
  res.json(swaggerDocument);
});

// List of models to expose via generic CRUD routes
const resources = [
  'role', 'permission', 'rolePermission',
  'route', 'vehicle', 'vehicleDriverAssignment',
  'loan', 'loanGuarantor', 'savingsAccount',
  'payment', 'paymentAllocation', 'transaction', 'insurancePolicy',
  'staffSalary', 'salaryAdvance', 'expense',
  'capitalPayment', 'exitRequest', 'contactMessage'
] as const;

resources.forEach((name) => {
  // create URL path: plural by adding 's'
  app.use(`/api/${name}s`, createCrudRouter(prisma, name));
});

// Custom optimized routers
app.use('/api/users', usersRouter);
app.use('/api/matatus', matatusRouter);
app.use('/api/finance', financeRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/staff', staffRouter);

const port = process.env.PORT || 3000;

app.get('/api/health', async (_req, res) => {
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
               
