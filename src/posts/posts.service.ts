import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import * as crypto from 'crypto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const { title, content } = createPostDto;
    const post = this.postRepository.create(createPostDto);
    post.hash = this.generateHash(title, content);
    return this.postRepository.save(post);
  }

  async findAll(): Promise<Post[]> {
    return this.postRepository.find();
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);

    // Update fields
    if (updatePostDto.title !== undefined) post.title = updatePostDto.title;
    if (updatePostDto.content !== undefined)
      post.content = updatePostDto.content;
    if (updatePostDto.state !== undefined) post.state = updatePostDto.state;

    // Regenerate hash if title or content changed
    post.hash = this.generateHash(post.title, post.content);

    return this.postRepository.save(post);
  }

  async remove(id: string): Promise<void> {
    const post = await this.findOne(id);
    await this.postRepository.remove(post);
  }

  private generateHash(title: string, content: string): string {
    return crypto
      .createHash('md5')
      .update(title + content)
      .digest('hex');
  }
}
