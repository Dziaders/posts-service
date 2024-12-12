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
