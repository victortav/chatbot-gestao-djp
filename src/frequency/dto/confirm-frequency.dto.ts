import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ConfirmFrequencyDto {
  @IsString()
  extractionId: string;

  @IsBoolean()
  confirmed: boolean;

  @IsOptional()
  @IsString()
  sourceText?: string;
}
