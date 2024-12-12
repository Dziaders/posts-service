import { IsString, Length, IsOptional, IsEnum } from 'class-validator';
import { PostState } from '../post.entity';

export class CreatePostDto {
  @IsString()
  @Length(3, 100)
  title: string;

  @IsString()
  @Length(3)
  content: string;

  @IsOptional()
  @IsEnum(PostState)
  state?: PostState;
}
