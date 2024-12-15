import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsService } from '../src/posts/posts.service';
import { Post, PostState } from '../src/posts/post.entity';
import { EventsService } from '../src/events/events.service';
import { BadRequestException } from '@nestjs/common';


describe('PostsService', () => {
  let service: PostsService;
  let repository: jest.Mocked<Repository<Post>>;
  let eventsService: EventsService;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<Repository<Post>>;

    const mockEventsService = {
      emitEvent: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: mockRepository },
        { provide: EventsService, useValue: mockEventsService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    repository = module.get(getRepositoryToken(Post)) as jest.Mocked<Repository<Post>>;
    eventsService = module.get<EventsService>(EventsService);
  });

  it('should create a post and emit an event', async () => {
    const dto = { title: 'Test Post', content: 'Test Content' };
    const createdPost = {
      ...dto,
      id: 'b3a1860c-1a5b-4ca6-b1a0-d18878d2ca02',
      hash: 'somehash',
      state: PostState.DRAFT,
      created_at: new Date(),
      updated_at: new Date(),
    };

    repository.create.mockReturnValue(createdPost);
    repository.save.mockResolvedValue(createdPost);

    const result = await service.create(dto as any);

    expect(result).toEqual(createdPost);
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(createdPost);
    expect(eventsService.emitEvent).toHaveBeenCalledWith('post_created', {
      id: 'b3a1860c-1a5b-4ca6-b1a0-d18878d2ca02',
      title: 'Test Post',
    });
  });

  it('should throw BadRequestException when trying to create a duplicate post', async () => {
    const dto = { title: 'Duplicate Post', content: 'Duplicate Content' };
    repository.create.mockReturnValue(dto as Post);
    repository.save.mockRejectedValue({ code: '23505' }); // Mock unique constraint violation

    await expect(service.create(dto as any)).rejects.toThrow(
      new BadRequestException('A post with the same title already exists'),
    );
  });

  it('should get all posts', async () => {
    const posts = [
      {
        id: 'b3a1860c-1a5b-4ca6-b1a0-d18878d2ca021',
        title: 'Test Post 1',
        content: 'Content 1',
        state: PostState.DRAFT,
        hash: 'hash1',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'b3a1860c-1a5b-4ca6-b1a0-d18878d2ca022',
        title: 'Test Post 2',
        content: 'Content 2',
        state: PostState.PUBLISHED,
        hash: 'hash2',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    repository.find.mockResolvedValue(posts);

    const result = await service.findAll();
    expect(result).toEqual(posts);
    expect(repository.find).toHaveBeenCalled();
  });

  it('should get a post by ID', async () => {
    const post = {
      id: 'b3a1860c-1a5b-4ca6-b1a0-d18878d2ca02',
      title: 'Test Post',
      content: 'Content',
      state: PostState.DRAFT,
      hash: 'hash',
      created_at: new Date(),
      updated_at: new Date(),
    };

    repository.findOne.mockResolvedValue(post);

    const result = await service.findOne('b3a1860c-1a5b-4ca6-b1a0-d18878d2ca02');
    expect(result).toEqual(post);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'b3a1860c-1a5b-4ca6-b1a0-d18878d2ca02' } });
  });

  it('should throw BadRequestException for invalid ID format', async () => {
    await expect(service.findOne('invalid-id')).rejects.toThrow(
      new BadRequestException('Invalid ID format'),
    );
  });

  it('should update a post and emit an event', async () => {
    const existingPost = {
      id: 'b3a1860c-1a5b-4ca6-b1a0-d18878d2ca02',
      title: 'Old Title',
      content: 'Old Content',
      state: PostState.DRAFT,
      hash: 'oldhash',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const updatedData = { title: 'New Title', content: 'New Content' };
    const updatedPost = {
      ...existingPost,
      ...updatedData,
      hash: 'newhash',
      updated_at: new Date(),
    };

    repository.findOne.mockResolvedValue(existingPost);
    repository.save.mockResolvedValue(updatedPost);

    const result = await service.update('b3a1860c-1a5b-4ca6-b1a0-d18878d2ca02', updatedData as any);

    expect(result).toEqual(updatedPost);
    expect(repository.save).toHaveBeenCalledWith({ ...existingPost, ...updatedData });
    expect(eventsService.emitEvent).toHaveBeenCalledWith('post_updated', {
      id: 'b3a1860c-1a5b-4ca6-b1a0-d18878d2ca02',
      title: 'New Title',
    });
  });

  it('should delete a post and emit an event', async () => {
    const post = {
      id: 'b3a1860c-1a5b-4ca6-b1a0-d18878d2ca02',
      title: 'Test Post',
      content: 'Content',
      state: PostState.DRAFT,
      hash: 'hash',
      created_at: new Date(),
      updated_at: new Date(),
    };

    repository.findOne.mockResolvedValue(post);
    repository.remove.mockResolvedValue(post);

    await service.remove('b3a1860c-1a5b-4ca6-b1a0-d18878d2ca02');

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'b3a1860c-1a5b-4ca6-b1a0-d18878d2ca02' } });
    expect(repository.remove).toHaveBeenCalledWith(post);
    expect(eventsService.emitEvent).toHaveBeenCalledWith('post_deleted', {
      id: 'b3a1860c-1a5b-4ca6-b1a0-d18878d2ca02',
      title: 'Test Post',
    });
  });
});
