# Database Schema and Migrations

This directory contains Prisma database schema and migration files.

## Files

- `schema.prisma` - Main database schema definition
- `migrations/` - Database migration files
- `seed.ts` - Database seeding script

## Commands

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma migrate deploy` - Apply migrations in production
- `npx prisma db seed` - Run database seeding
- `npx prisma studio` - Open Prisma Studio

## Getting Started

1. Define your data models in `schema.prisma`
2. Run `npx prisma migrate dev` to create migrations
3. Use `npx prisma generate` to update the client
4. Import and use the generated client in your application
