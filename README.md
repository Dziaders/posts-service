# Posts Service

This is a NestJS-based microservice for managing posts. It supports basic CRUD operations and is intended to be part of a larger platform. This project is currently in development.

## Features (Planned)
- Create, Read, Update, Delete operations on `Post` entities.
- Automatic validation of inputs.
- Hash generation (MD5) based on the post's title and content.
- Event emission on each CRUD action.
- Comprehensive error handling with defined JSON error responses.
- Integration with a database and Docker-based deployment.
- Unit and E2E tests.

## Getting Started

### Prerequisites
- Node.js (16+)
- npm (or yarn)
- Docker and Docker Compose

### Running Locally
```bash
npm install
npm run start:dev
```

## Database and Migrations

This service uses PostgreSQL and TypeORM for the database.

### Running with Docker
```bash
docker compose up --build
```

## Entity: Post

The `Post` entity has the following fields:
- `id` (UUID): Primary key, generated by the database.
- `title` (string, 3-100 chars, unique): Required.
- `content` (string, min. 3 chars): Required.
- `state` (enum: DRAFT|PUBLISHED): Optional, defaults to DRAFT.
- `hash` (string, 32 chars): Generated by the application based on title+content.
- `created_at`/`updated_at` (datetime): Managed by the application/database.

Migrations have been set up so that the `posts` table is created automatically.
