import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfirmFrequencyDto } from './dto/confirm-frequency.dto';
import { ExtractFrequencyDto } from './dto/extract-frequency.dto';
import { FrequencyService } from './frequency.service';

@Controller('frequency')
export class FrequencyController {
  constructor(private readonly frequencyService: FrequencyService) {}

  @Post('extract')
  extract(@Body() dto: ExtractFrequencyDto) {
    return this.frequencyService.extract(dto);
  }

  @Post('confirm')
  confirm(@Body() dto: ConfirmFrequencyDto) {
    return this.frequencyService.confirm(dto);
  }

  @Get('submissions')
  findAll() {
    return this.frequencyService.findAll();
  }
}
