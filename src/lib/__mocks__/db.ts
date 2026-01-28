// src/lib/__mocks__/db.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'vitest-mock-extended';

// 1. Create a deep mock of the Prisma Client
const prismaMock = mockDeep<PrismaClient>();

// 2. Export it as default (mimicking the real db.ts)
export default prismaMock;