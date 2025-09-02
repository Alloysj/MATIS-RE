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
  const routes = await prisma.route.findMany();
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
  const { driverId } = req.body;
  const assignment = await prisma.vehicleDriverAssignment.create({ data: { vehicleId: req.params.id, driverId } });
  res.status(201).json(assignment);
});

export default router;
