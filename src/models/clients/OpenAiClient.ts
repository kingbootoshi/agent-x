// models/OpenAIClient.ts

import OpenAI from 'openai';
import { ModelClient, ModelType } from '../../types/agentSystem';

export class OpenAIClient implements ModelClient {
  private openai: OpenAI;
  private modelName: string;
  private defaultParams: any;
  modelType: ModelType = 'openai';

  constructor(
    apiKey: string,
    modelName: string,
    params: any = {}
  ) {
    this.openai = new OpenAI({ apiKey });

    this.modelName = modelName;
    this.defaultParams = {
      temperature: 0.8,
      max_tokens: 1000,
      ...params,
    };
  }

  async chatCompletion(params: any): Promise<any> {
    try {
      const requestParams = {
        model: this.modelName,
        ...this.defaultParams,
        ...params,
      };
      const response = await this.openai.chat.completions.create(requestParams);
      return response;
    } catch (error) {
      throw error;
    }
  }
}