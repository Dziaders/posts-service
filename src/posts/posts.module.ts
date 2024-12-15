import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { EventsService } from '../events/events.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  providers: [PostsService, EventsService],
  controllers: [PostsController],
  exports: [TypeOrmModule, PostsService],
})
export class PostsModule {}
