import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createCrudRouter } from './crudRouter';
import supabase from './supabaseClient';
import usersRouter from './routes/users';
import matatusRouter from './routes/matatus';
import financeRouter from './routes/finance';
import reportsRouter from './routes/reports';
import adminRouter from './routes/admin';
import rolesRouter from './routes/roles';
import staffRouter from './routes/staff';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

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
               
