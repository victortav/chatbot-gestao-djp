import { IsOptional, IsString } from 'class-validator';

export class ExtractFrequencyDto {
  @IsString()
  phoneNumber!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  conversationContext?: string;
}
