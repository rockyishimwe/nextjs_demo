# ADR-002: Mongoose over Prisma for Database ORM

## Status

Accepted

## Context

DevEvent needs a MongoDB database for storing events and bookings. We needed an ORM/ODM to:
- Define schemas with validation
- Perform CRUD operations
- Handle relationships (Event → Bookings)
- Support queries with filtering, pagination, sorting

We evaluated:
- **Mongoose** — MongoDB ODM (Object Document Mapper)
- **Prisma** — modern ORM with type-safe queries
- **MongoDB Native Driver** — raw driver without ORM

## Decision

We chose **Mongoose** for the following reasons:

### Pros of Mongoose
- **Native MongoDB fit** — designed specifically for MongoDB
- **Schema hooks** — pre-save middleware for slug generation, date normalization
- **Lean queries** — `.lean()` returns plain objects for better performance
- **Mature ecosystem** — 15+ years of production use
- **Flexible schemas** — no strict type enforcement (good for rapid prototyping)
- **Atomic operations** — direct access to MongoDB operators (`$inc`, `$expr`)

### Pros of Prisma
- Type-safe queries (but requires code generation)
- Better for relational databases (PostgreSQL, MySQL)
- Modern DX with Prisma Studio
- Strong TypeScript integration

### Why Mongoose Won
- **MongoDB-native** — Prisma supports MongoDB but is designed for relational DBs
- **Schema hooks** — Prisma middleware is more limited
- **Simpler setup** — no `prisma generate` or migration steps
- **Direct operator access** — `$inc`, `$expr`, `$push` work directly
- **Team familiarity** — existing knowledge with MongoDB + Mongoose

## Consequences

### Positive
- Schema hooks handle slug generation and date normalization automatically
- Atomic operations prevent race conditions in booking flow
- `.lean()` queries return plain objects (faster, less memory)
- No code generation step — schemas are the source of truth

### Negative
- **Less type safety** — Mongoose types can be verbose, requiring manual casting
- **No migrations** — schema changes require manual data migration
- **No Prisma Studio** — no visual database browser (must use MongoDB Compass)
- **Looser validation** — Mongoose validation is optional, not enforced at the type level

### Mitigations
- We use TypeScript interfaces alongside Mongoose schemas for type safety
- `.lean()` with manual type casting: `as unknown as Promise<IEvent[]>`
- MongoDB Compass is used for database inspection
- Schema validation rules are defined in Mongoose schemas

## References

- [Mongoose Docs](https://mongoosejs.com/docs/)
- [Prisma MongoDB Guide](https://www.prisma.io/docs/orm/more/comparisons/prisma-and-mongodb)
