import { PrismaClient } from '@prisma/client'

let prisma

const DATABASE_URL =
  process.env.TIDB_USER &&
  process.env.TIDB_PASSWORD &&
  process.env.TIDB_HOST &&
  process.env.TIDB_PORT
    ? `mysql://${process.env.TIDB_USER}:${process.env.TIDB_PASSWORD}@${process.env.TIDB_HOST}:${process.env.TIDB_PORT}/bookshop?pool_timeout=60`
    : `${process.env.DATABASE_URL}?pool_timeout=60`;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
    });
  }
  prisma = global.prisma
}

export default prisma
