import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createCrudRouter } from './crudRouter';

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
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
