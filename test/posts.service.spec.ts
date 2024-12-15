import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostsService } from '../src/posts/posts.service';
import { Post } from '@nestjs/common';
import { EventsService } from '../src/events/events.service';

describe('PostsService', () => {
  let service: PostsService;
  // @ts-ignore
  let repository: Repository<Post>;
  let eventsService: EventsService;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

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
    repository = module.get(getRepositoryToken(Post));
    eventsService = module.get<EventsService>(EventsService);
  });

  it('should create a post and emit an event', async () => {
    const dto = { title: 'Test Post', content: 'Test Content' };
    const createdPost = { ...dto, id: 'uuid', hash: 'somehash', state: 'DRAFT' };

    repository.create.mockReturnValue(createdPost);
    repository.save.mockResolvedValue(createdPost);

    const result = await service.create(dto as any);
    expect(result).toEqual(createdPost);
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(createdPost);
    expect(eventsService.emitEvent).toHaveBeenCalledWith('post_created', { id: 'uuid', title: 'Test Post' });
  });

  it('should throw NotFoundException when post not found', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne('non-existing-id')).rejects.toThrow('Post not found');
  });
});
