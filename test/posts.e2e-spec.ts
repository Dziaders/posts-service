import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

describe('Posts (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdPostId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get DataSource and run migrations
    dataSource = moduleFixture.get(DataSource);
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    await dataSource.dropDatabase(); // Drop all tables
    await dataSource.runMigrations(); // Re-run migrations to reset schema
    await app.close();
  });

  it('/posts (POST) - should create a post', async () => {
    const postData = { title: 'E2E Test Post', content: 'E2E Content' };

    const { body } = await request(app.getHttpServer())
      .post('/posts')
      .send(postData)
      .expect(201);

    createdPostId = body.id; // Store created post ID for other tests
    expect(body).toMatchObject({
      title: postData.title,
      content: postData.content,
      state: 'DRAFT',
      hash: expect.any(String),
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
  });

  it('/posts (GET) - should get all posts', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/posts')
      .expect(200);

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0]).toMatchObject({
      id: createdPostId,
      title: 'E2E Test Post',
      content: 'E2E Content',
    });
  });

  it('/posts/:id (GET) - should get a specific post', async () => {
    const { body } = await request(app.getHttpServer())
      .get(`/posts/${createdPostId}`)
      .expect(200);

    expect(body).toMatchObject({
      id: createdPostId,
      title: 'E2E Test Post',
      content: 'E2E Content',
      state: 'DRAFT',
      hash: expect.any(String),
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
  });

  it('/posts/:id (GET) - should return 404 for non-existent post', async () => {
    const nonExistentId = 'a2fc46c0-8f75-4a2c-bf2a-123456789012';
    const { body } = await request(app.getHttpServer())
      .get(`/posts/${nonExistentId}`)
      .expect(404);

    expect(body).toEqual({
      message: 'Post not found',
      status: 404,
      service: 'posts',
    });
  });

  it('/posts/:id (PUT) - should update a specific post', async () => {
    const updatedData = { title: 'Updated Test Post', content: 'Updated Content' };

    const { body } = await request(app.getHttpServer())
      .put(`/posts/${createdPostId}`)
      .send(updatedData)
      .expect(200);

    expect(body).toMatchObject({
      id: createdPostId,
      title: updatedData.title,
      content: updatedData.content,
      state: 'DRAFT', // Should remain unchanged
      hash: expect.any(String),
      created_at: expect.any(String),
      updated_at: expect.any(String), // Should update
    });
    expect(new Date(body.updated_at).getTime()).toBeGreaterThan(new Date(body.created_at).getTime());
  });

  it('/posts/:id (DELETE) - should delete a specific post', async () => {
    const { body } = await request(app.getHttpServer())
      .delete(`/posts/${createdPostId}`)
      .expect(200);

    expect(body).toEqual({
      message: `Post with id ${createdPostId} deleted successfully`,
    });
  });

  it('/posts/:id (GET) - should return 404 for a deleted post', async () => {
    const { body } = await request(app.getHttpServer())
      .get(`/posts/${createdPostId}`)
      .expect(404);

    expect(body).toEqual({
      message: 'Post not found',
      status: 404,
      service: 'posts',
    });
  });
});
