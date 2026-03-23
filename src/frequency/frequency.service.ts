import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { ConfirmFrequencyDto } from './dto/confirm-frequency.dto';
import { ExtractFrequencyDto } from './dto/extract-frequency.dto';
import { FrequencySubmission } from './entities/frequency-submission.entity';
import { OpenAiExtractionService } from './openai-extraction.service';

@Injectable()
export class FrequencyService {
  constructor(
    @InjectRepository(FrequencySubmission)
    private readonly frequencyRepository: Repository<FrequencySubmission>,
    private readonly openAiExtractionService: OpenAiExtractionService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async extract(dto: ExtractFrequencyDto) {
    const extraction = await this.openAiExtractionService.extractFrequency({
      message: dto.message,
      conversationContext: dto.conversationContext,
    });

    const submission = this.frequencyRepository.create({
      phoneNumber: dto.phoneNumber,
      sourceText: dto.message,
      date: extraction.date,
      churchName: extraction.churchName,
      attendanceTotal: extraction.attendanceTotal,
      gpsChildren: extraction.gpsChildren,
      vips: extraction.vips,
      parkingVehicles: extraction.parkingVehicles,
      observations: extraction.observations,
      confirmed: false,
      status: 'awaiting_confirmation',
    });

    const savedSubmission = await this.frequencyRepository.save(submission);

    return {
      extractionId: savedSubmission.id,
      confirmationMessage: this.buildConfirmationMessage(savedSubmission),
      data: extraction,
    };
  }

  async confirm(dto: ConfirmFrequencyDto) {
    const submission = await this.frequencyRepository.findOne({
      where: { id: dto.extractionId },
    });

    if (!submission) {
      throw new NotFoundException('Registro de extracao nao encontrado.');
    }

    if (!dto.confirmed) {
      submission.status = 'rejected_by_user';
      submission.confirmed = false;
      await this.frequencyRepository.save(submission);

      return {
        message: 'Registro marcado como rejeitado. Aguarde nova mensagem do usuario.',
      };
    }

    const frequencyApiUrl = this.configService.get<string>('FREQUENCY_API_URL');

    const payload = {
      date: submission.date,
      churchName: submission.churchName,
      attendanceTotal: submission.attendanceTotal,
      gpsChildren: submission.gpsChildren,
      vips: submission.vips,
      parkingVehicles: submission.parkingVehicles,
      observations: submission.observations,
      phoneNumber: submission.phoneNumber,
    };

    const headers: Record<string, string> = {};
    const token = this.configService.get<string>('FREQUENCY_API_TOKEN');

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (!frequencyApiUrl) {
      submission.confirmed = true;
      submission.status = 'mock_submitted';
      submission.externalResponse = {
        mocked: true,
        message: 'Envio externo simulado porque FREQUENCY_API_URL nao foi configurada.',
      };

      await this.frequencyRepository.save(submission);

      return {
        message: 'Frequencia confirmada em modo de simulacao.',
        payload,
        externalResponse: submission.externalResponse,
      };
    }

    const response = await firstValueFrom(
      this.httpService.post(frequencyApiUrl, payload, { headers }),
    );

    submission.confirmed = true;
    submission.status = 'submitted';
    submission.externalResponse = response.data as Record<string, unknown>;

    await this.frequencyRepository.save(submission);

    return {
      message: 'Frequencia confirmada e enviada com sucesso.',
      payload,
      externalResponse: response.data,
    };
  }

  async findAll() {
    return this.frequencyRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  private buildConfirmationMessage(submission: FrequencySubmission): string {
    return [
      `📅 Data: ${this.formatDate(submission.date)}`,
      `⛪ Igreja: ${submission.churchName}`,
      `👥 Frequência Total (com o GPS): ${submission.attendanceTotal}`,
      `👶 Crianças (GPS): ${submission.gpsChildren}`,
      `🙋‍♂️ VIPs: ${submission.vips}`,
      `🚗 Carros + Motos no estacionamento: ${submission.parkingVehicles}`,
      `🎯 Observações: ${submission.observations || 'Nenhuma'}`,
      '',
      'Posso submeter essa frequência?',
    ].join('\n');
  }

  private formatDate(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }
}
