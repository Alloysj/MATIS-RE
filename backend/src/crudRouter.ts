import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

type ModelName = keyof PrismaClient;

export function createCrudRouter(prisma: PrismaClient, modelName: ModelName) {
  const router = Router();
  // Access the model dynamically; delegate typed as any
  const model: any = (prisma as any)[modelName];

  router.get('/', async (_req: Request, res: Response) => {
    const items = await model.findMany();
    res.json(items);
  });

  router.get('/:id', async (req: Request, res: Response) => {
    const item = await model.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  });

  router.post('/', async (req: Request, res: Response) => {
    const item = await model.create({ data: req.body });
    res.status(201).json(item);
  });

  router.put('/:id', async (req: Request, res: Response) => {
    const item = await model.update({ where: { id: req.params.id }, data: req.body });
    res.json(item);
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    await model.delete({ where: { id: req.params.id } });
    res.status(204).end();
  });

  return router;
}
