import { GoogleGenerativeAI } from "@google/generative-ai";
import { ModelClient, ModelType } from '../../types/agentSystem';
import { Logger } from "../../utils/logger";

export class AiStudioClient implements ModelClient {
  private googleAI: GoogleGenerativeAI;
  private _modelName: string;
  private defaultParams: any;
  modelType: ModelType = 'google';
  private _model: any;

  constructor(apiKey: string, modelName: string, params: any = {}) {
    this.googleAI = new GoogleGenerativeAI(apiKey);
    this._modelName = modelName;
    this.defaultParams = {
      temperature: 1,
      max_tokens: 1000,
      ...params,
    };
  }

  get modelName(): string {
    return this._modelName;
  }

  async chatCompletion(params: any): Promise<any> {
    try {
      const request = typeof params.messages === 'string' ? params.messages : JSON.stringify(params.messages);
      if (params.tools) {
        this._model = this.googleAI.getGenerativeModel({ model: this._modelName, tools: params.tools });
      } else {
        this._model = this.googleAI.getGenerativeModel({ model: this._modelName });
      }
      const response = await this._model.generateContent(request);
      return response;
    } catch (error) {
      throw error;
    }
  }
}