import { z } from 'zod';

export interface Message {
  role: 'system' | 'assistant' | 'user' | 'function';
  content?: string;
  name?: string;
  image?: {
    name: string;
    mime: string;
    data: Buffer | string;
  };
  runData?: any;
}

export interface AgentConfig {
  name: string;
  description: string;
  systemPromptTemplate: string;
  dynamicVariables?: { [key: string]: string };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    strict?: boolean;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export type ModelType = 'openai' | 'fireworks' | 'anthropic' | 'google';

export interface ModelClient {
  modelType: ModelType;
  modelName: string;
  chatCompletion(params: any): Promise<any>;
}

export interface FunctionCall {
  functionName: string;
  functionArgs: Record<string, any>;
}

export interface ProcessedResponse {
  aiMessage?: {
    role: string;
    content: string;
  };
  functionCalls: FunctionCall[];
}

// Base interface for all tool outputs
export type BaseToolOutput = Record<string, unknown>;

// Type to extract Zod schema type
export type ZodSchemaType<T extends z.ZodTypeAny> = z.infer<T>;

// Type to get tool output type from schema
export type ToolOutputFromSchema<T extends z.ZodTypeAny> = z.infer<T>;

// Generic type for agent run results
export interface AgentRunResult<T extends z.ZodTypeAny | null = null> {
  success: boolean;
  output: T extends z.ZodTypeAny ? ToolOutputFromSchema<T> : string;
  error?: string;
}