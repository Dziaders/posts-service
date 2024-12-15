import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import * as crypto from 'crypto';
import { EventsService } from '../events/events.service';
import { isUUID } from 'class-validator';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly eventsService: EventsService,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const { title, content, state } = createPostDto;
    const post = this.postRepository.create({ title, content, state });
    post.hash = this.generateHash(title, content);

    try {
      const savedPost = await this.postRepository.save(post);

      await this.eventsService.emitEvent('post_created', {
        id: savedPost.id,
        title: savedPost.title,
      });

      return savedPost;
    } catch (error) {
      // Handle duplicate entry error
      if (error.code === '23505') {
        throw new BadRequestException(
          'A post with the same title already exists',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Post[]> {
    return this.postRepository.find();
  }

  async findOne(id: string): Promise<Post> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);

    if (updatePostDto.title !== undefined) {
      post.title = updatePostDto.title;
    }
    if (updatePostDto.content !== undefined) {
      post.content = updatePostDto.content;
    }
    if (updatePostDto.state !== undefined) {
      post.state = updatePostDto.state;
    }

    post.hash = this.generateHash(post.title, post.content);
    const updatedPost = await this.postRepository.save(post);

    await this.eventsService.emitEvent('post_updated', {
      id: updatedPost.id,
      title: updatedPost.title,
    });
    return updatedPost;
  }

  async remove(id: string): Promise<void> {
    const post = await this.findOne(id);
    await this.postRepository.remove(post);

    await this.eventsService.emitEvent('post_deleted', {
      id: post.id,
      title: post.title,
    });
  }

  private generateHash(title: string, content: string): string {
    return crypto
      .createHash('md5')
      .update(title + content)
      .digest('hex');
  }
}
