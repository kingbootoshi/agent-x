import axios from 'axios';
import { ModelClient, ModelType, Message } from '../../types/agentSystem';

export class QwenClient implements ModelClient {
  modelType: ModelType = 'local';
  private _serverUrl: string;
  private _modelName: string;
  private defaultParams: any;

  constructor(modelName: string, serverUrl: string, params: any = {}) {
    this._modelName = modelName;
    this._serverUrl = serverUrl;
    this.defaultParams = {
      temperature: 0.8,
      max_tokens: 1000,
      ...params,
    };
  }

  get modelName(): string {
    return this._modelName;
  }

  public async initialize(): Promise<any> {
    try {
      const response = await axios.post(`${this._serverUrl}/initialize`, {model_name: this._modelName});
      return response.data;
    } catch (error) {
      throw new Error(`Error during chat completion: ${(error as Error).message}`);
    }
  }

  async chatCompletion(params: any): Promise<any> {
    try {
      const messages = params.messages?.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

      const requestParams = {
        model: this._modelName,
        ...this.defaultParams,
        ...params,
        messages: messages || params.messages,
      };
      const response = await axios.post(`${this._serverUrl}/generate`, requestParams);
      return response.data;
    } catch (error) {
      throw new Error(`Error during chat completion: ${(error as Error).message}`);
    }
  }
}