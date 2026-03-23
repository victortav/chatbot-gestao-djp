import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { FrequencyExtraction } from './interfaces/frequency-extraction.interface';

@Injectable()
export class OpenAiExtractionService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const useMockOpenAi =
      this.configService.get<string>('USE_MOCK_OPENAI', 'false') === 'true';

    if (useMockOpenAi) {
      this.client = null as unknown as OpenAI;
      this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-5-mini');
      return;
    }

    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY nao configurada.',
      );
    }

    this.client = new OpenAI({ apiKey });
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-5-mini');
  }

  async extractFrequency(input: {
    message: string;
    conversationContext?: string;
  }): Promise<FrequencyExtraction> {
    if (this.configService.get<string>('USE_MOCK_OPENAI', 'false') === 'true') {
      return this.extractWithFallback(input.message);
    }

    const response = await this.client.responses.create({
      model: this.model,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: [
                'Voce extrai dados de frequencia de culto a partir de mensagens livres em portugues do Brasil.',
                'Responda apenas com JSON valido.',
                'Se um campo estiver ausente, faca a melhor inferencia conservadora.',
                'Formato esperado:',
                '{',
                '  "date": "YYYY-MM-DD",',
                '  "churchName": "string",',
                '  "attendanceTotal": number,',
                '  "gpsChildren": number,',
                '  "vips": number,',
                '  "parkingVehicles": number,',
                '  "observations": "string",',
                '  "confidence": "low" | "medium" | "high"',
                '}',
              ].join('\n'),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: [
                `Mensagem principal:\n${input.message}`,
                input.conversationContext
                  ? `\nContexto adicional:\n${input.conversationContext}`
                  : '',
              ].join(''),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'frequency_extraction',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: [
              'date',
              'churchName',
              'attendanceTotal',
              'gpsChildren',
              'vips',
              'parkingVehicles',
              'observations',
              'confidence',
            ],
            properties: {
              date: { type: 'string' },
              churchName: { type: 'string' },
              attendanceTotal: { type: 'integer' },
              gpsChildren: { type: 'integer' },
              vips: { type: 'integer' },
              parkingVehicles: { type: 'integer' },
              observations: { type: 'string' },
              confidence: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
              },
            },
          },
        },
      },
    });

    const content = response.output_text;

    try {
      return JSON.parse(content) as FrequencyExtraction;
    } catch {
      return this.extractWithFallback(input.message);
    }
  }

  private extractWithFallback(message: string): FrequencyExtraction {
    const dateMatch =
      message.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/) ??
      message.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    const isoDate = dateMatch
      ? dateMatch[0].includes('/')
        ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
        : dateMatch[0]
      : new Date().toISOString().slice(0, 10);

    const totalMatch = message.match(/(?:total|pessoas?|frequ[êe]ncia)[^\d]*(\d+)/i);
    const childrenMatch = message.match(/(?:crian[çc]as?|gps)[^\d]*(\d+)/i);
    const vipMatch = message.match(/vip[s]?[^\d]*(\d+)/i);
    const parkingMatch = message.match(
      /(?:carros?|motos?|estacionamento)[^\d]*(\d+)/i,
    );
    const churchMatch = message.match(
      /(?:na|no|igreja)\s+(igreja\s+[a-z0-9à-ú\s]+?)(?:\s+tivemos|\s+teve|,|\.|$)/i,
    );

    return {
      date: isoDate,
      churchName: churchMatch?.[1]?.trim() ?? 'Igreja nao identificada',
      attendanceTotal: Number(totalMatch?.[1] ?? 0),
      gpsChildren: Number(childrenMatch?.[1] ?? 0),
      vips: Number(vipMatch?.[1] ?? 0),
      parkingVehicles: Number(parkingMatch?.[1] ?? 0),
      observations: /nenhuma observa/i.test(message)
        ? 'Nenhuma'
        : 'Extraido em modo fallback',
      confidence: 'medium',
    };
  }
}
