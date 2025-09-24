import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (_req, res) => {
  const matatus = await prisma.vehicle.findMany({ include: { owner: true, driver: true } });
  res.json(matatus);
});

router.get('/drivers', async (_req, res) => {
  const drivers = await prisma.user.findMany({
    where: { role: { name: { equals: 'driver', mode: 'insensitive' } } }
  });
  res.json(drivers);
});

// Drivers by occupation = "Driver" (case-insensitive)
router.get('/availableDrivers', async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { occupation: { equals: 'Driver', mode: 'insensitive' } },
    select: { id: true, firstName: true, lastName: true, phone: true }
  });
  const result = users.map((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim(),
    phone: u.phone || '',
  }));
  res.json(result);
});

router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  const owner = await prisma.user.findUnique({ where: { id: req.user!.id } });
  res.json(owner);
});

router.get('/userMatatus', authenticate, async (req: AuthRequest, res) => {
  const vehicles = await prisma.vehicle.findMany({ where: { ownerId: req.user!.id } });
  res.json(vehicles);
});

router.get('/dashboard-info', authenticate, async (req: AuthRequest, res) => {
  const owner = await prisma.user.findUnique({ where: { id: req.user!.id } });
  const vehicles = await prisma.vehicle.findMany({ where: { ownerId: req.user!.id } });
  res.json({ owner, vehicles });
});

// Lightweight vehicle summaries for the logged-in owner
router.get('/userVehicles/summary', authenticate, async (req: AuthRequest, res) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: req.user!.id },
    select: { id: true, plateNumber: true }
  });

  const summaries = await Promise.all(
    vehicles.map(async (v) => {
      const savingsAgg = await prisma.savingsAccount.aggregate({
        _sum: { balance: true },
        where: { vehicleId: v.id }
      });
      return {
        id: v.id,
        plate: v.plateNumber,
        savings: Number(savingsAgg._sum.balance || 0)
      };
    })
  );

  res.json(summaries);
});

// Aggregated vehicle cards data for dashboard
router.get('/dashboard-cards', authenticate, async (req: AuthRequest, res) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: req.user!.id },
    select: {
      id: true,
      plateNumber: true,
      model: true,
      yearOfManufacture: true,
      insuranceStatus: true,
      route: { select: { name: true } },
      driver: { select: { firstName: true, lastName: true } }
    }
  });

  const results = await Promise.all(
    vehicles.map(async (v) => {
      const savingsAgg = await prisma.savingsAccount.aggregate({
        _sum: { balance: true },
        where: { vehicleId: v.id }
      });
      const loanAgg = await prisma.loan.aggregate({
        _sum: { amount: true },
        where: { vehicleId: v.id, status: { not: 'REPAID' } }
      });
      const latestPayment = await prisma.payment.findFirst({
        where: { vehicleId: v.id },
        orderBy: { paymentDate: 'desc' },
        select: { paymentDate: true, totalAmount: true }
      });

      const driverName = [v.driver?.firstName, v.driver?.lastName].filter(Boolean).join(' ').trim();
      return {
        id: v.id,
        plate: v.plateNumber,
        route: v.route?.name || '',
        driver: driverName || '',
        savings: Number(savingsAgg._sum.balance || 0),
        loan: Number(loanAgg._sum.amount || 0),
        insurance: v.insuranceStatus,
        lastPayment: latestPayment?.paymentDate || null,
        paymentAmount: latestPayment?.totalAmount ? Number(latestPayment.totalAmount) : 0,
        model: v.model || '',
        year: v.yearOfManufacture || null
      };
    })
  );

  res.json(results);
});

router.get('/userMatatus/:userId', async (req, res) => {
  const vehicles = await prisma.vehicle.findMany({ where: { ownerId: req.params.userId } });
  res.json(vehicles);
});

router.get('/allPendingLoans', async (_req, res) => {
  const loans = await prisma.loan.findMany({ where: { status: 'PENDING' }, include: { vehicle: true } });
  res.json(loans);
});

router.post('/addRoute', async (req, res) => {
  const route = await prisma.route.create({ data: req.body });
  res.status(201).json(route);
});

router.get('/routes', async (_req, res) => {
  const routes = await prisma.route.findMany({
    select: {
      id: true,
      name: true,
      startPoint: true,
      endPoint: true,
      distanceKm: true,
      fare: true,
      status: true
    }
  });
  res.json(routes);
});

router.get('/export', async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany();
  res.json(vehicles);
});

router.put('/profile/update', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: req.body });
  res.json(user);
});

router.post('/register', authenticate, async (req: AuthRequest, res) => {
  const vehicle = await prisma.vehicle.create({ data: { ...req.body, ownerId: req.user!.id } });
  res.status(201).json(vehicle);
});

router.delete('/deleteRoute/:routeId', async (req, res) => {
  await prisma.route.delete({ where: { id: req.params.routeId } });
  res.status(204).end();
});

router.get('/:id', async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) return res.status(404).json({ message: 'Not found' });
  res.json(vehicle);
});

router.post('/:id/update', async (req, res) => {
  const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body });
  res.json(vehicle);
});

router.delete('/:id', async (req, res) => {
  await prisma.vehicle.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

router.post('/:id/approve', async (req, res) => {
  const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });
  res.json(vehicle);
});

router.post('/:id/resetStatus', async (req, res) => {
  const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: { status: 'INACTIVE' } });
  res.json(vehicle);
});

router.post('/:id/assignDriver', async (req, res) => {
  const { driverId } = req.body as { driverId?: string };
  const vehicleId = req.params.id;

  if (!driverId) {
    return res.status(400).json({ message: 'driverId is required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Validate driver exists
      const driver = await tx.user.findUnique({ where: { id: driverId } });
      if (!driver) {
        throw new Error('Driver not found');
      }

      // Update vehicle current driver
      const vehicle = await tx.vehicle.update({
        where: { id: vehicleId },
        data: { driverId }
      });

      // Create a new assignment record
      const assignment = await tx.vehicleDriverAssignment.create({
        data: { vehicleId, driverId }
      });

      return { vehicle, assignment };
    });

    res.status(201).json(result);
  } catch (err: any) {
    if (String(err?.message).includes('Driver not found')) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.status(500).json({ message: 'Failed to assign driver', error: err?.message || String(err) });
  }
});

export default router;
