import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createCrudRouter } from './crudRouter';
import supabase from './supabaseClient';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// List of models to expose via generic CRUD routes
const resources = [
  'role', 'permission', 'rolePermission', 'user',
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
               
