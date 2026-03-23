import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FrequencyController } from './frequency.controller';
import { FrequencySubmission } from './entities/frequency-submission.entity';
import { FrequencyService } from './frequency.service';
import { OpenAiExtractionService } from './openai-extraction.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([FrequencySubmission]),
  ],
  controllers: [FrequencyController],
  providers: [FrequencyService, OpenAiExtractionService],
})
export class FrequencyModule {}
