import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../prismaClient';
const router = Router();

router.get('/matatuDetails', authenticate, async (req: AuthRequest, res) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: req.user!.id },
    include: { driver: true, savingsAccounts: true, loans: true, insurancePolicies: true }
  });
  res.json(vehicles);
});

router.get('/financialDetails', authenticate, async (req: AuthRequest, res) => {
  const loans = await prisma.loan.findMany({ where: { applicantId: req.user!.id }, include: { vehicle: true } });
  const savings = await prisma.savingsAccount.findMany({ where: { userId: req.user!.id } });
  const insurance = await prisma.insurancePolicy.findMany({ where: { vehicle: { ownerId: req.user!.id } } });
  res.json({ loans, savings, insurance });
});

export default router;
