import { Agent } from '../agents/Agent';
import { Logger } from '../utils/logger';
import { getCurrentTimestamp } from '../utils/formatTimestamps';
import { executeCommand } from './executeCommand';
import { EventEmitter } from 'events';
import { registerCommands, generateHelpText } from './commandRegistry';

interface Feature {
  loadFeatureCommands: () => Promise<any[]>;
}

interface TerminalCoreOptions {
  agentName?: string;
  modelType?: 'openai' | 'anthropic' | 'fireworks' | 'local';
  modelName?: string;
  maxActions?: number;
  actionCooldownMs?: number;
  features?: Feature[];
}

export interface TerminalCoreEvents {
  'loop:iteration': (messages: { userMessage?: { content?: string }, assistantMessage?: { content?: string } }) => Promise<void> | void;
  'loop:maxActions': (fullHistory: any[]) => Promise<void> | void;
}

export class TerminalCore extends EventEmitter {
  private agent!: Agent;
  private sessionId: string;
  private maxActions: number;
  private actionCooldownMs: number;
  private features: Feature[];
  private actionCount: number = 0;
  private dynamicVariables: { [key: string]: string } = {};

  constructor(
    private options: TerminalCoreOptions = {}
  ) {
    super();
    this.sessionId = Math.random().toString(36).slice(2);
    this.maxActions = options.maxActions ?? 20;
    this.actionCooldownMs = options.actionCooldownMs ?? 120_000;
    this.features = options.features ?? [];
  }

  public setDynamicVariables(vars: Record<string, string>) {
    this.dynamicVariables = {
      ...this.dynamicVariables,
      ...vars
    };
  }

  public async init() {
    for (const feature of this.features) {
      const cmds = await feature.loadFeatureCommands();
      registerCommands(cmds);
    }

    const agentName = this.options.agentName || "terminalAgent";
    this.agent = new Agent({ agentName });
    if (this.options.modelType === 'local') {
      await this.agent.initialize();
    }

    Logger.info('TerminalCore initialized with agent and features');
  }

  public async runLoop() {
    Logger.info('Starting TerminalCore run loop');

    while (true) {
      this.actionCount = 0;
      while (this.actionCount < this.maxActions) {
        const terminalCommandsHelp = generateHelpText();
        const filteredVariables = {
          ...this.dynamicVariables,
          current_timestamp: getCurrentTimestamp(),
          terminal_commands: terminalCommandsHelp
        };

        const agentResult = await this.agent.run(undefined, filteredVariables);

        if (agentResult.success) {
          // Agent provided structured output
          if (agentResult.output) {
            const { internal_thought, plan, terminal_commands } = agentResult.output;

            // Log the agent's thought process and plan
            Logger.debug('Agent Thought:', internal_thought);
            Logger.debug('Agent Plan:', plan);

            if (terminal_commands) {
              try {
                const commands = terminal_commands
                  .split(/[\n;]/)
                  .map((cmd: string) => cmd.trim())
                  .filter((cmd: string) => cmd.length > 0);

                for (const cmd of commands) {
                  const result = await executeCommand(cmd);

                  // Add the command output back as a user message
                  this.agent.addUserMessage(`${getCurrentTimestamp()} - [TERMINAL LOG]\n\n${result.output}`);
                }
              } catch (error) {
                Logger.error('Error executing terminal commands:', error);
                // Feed error back to the agent as user message
                this.agent.addUserMessage(`Error executing command: ${error}`);
              }
            }

            // Emit loop iteration event
            this.emit('loop:iteration', {
              assistantMessage: agentResult.output ? { content: JSON.stringify(agentResult.output) } : undefined
            });

          } else {
            // If no structured output, just emit what we have
            this.emit('loop:iteration', {
              assistantMessage: agentResult.output ? { content: agentResult.output } : undefined
            });
          }
        } else {
          Logger.error('Agent Failed:', agentResult.error);
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, this.actionCooldownMs));
        this.actionCount++;
      }

      const fullHistory: any[] = [];
      this.emit('loop:maxActions', fullHistory);

      const idleMinutes = Math.floor(Math.random() * (60 - 30 + 1)) + 30;
      Logger.info(`Entering idle mode for ${idleMinutes} minutes`);
      await new Promise((resolve) => setTimeout(resolve, idleMinutes * 60 * 1000));
      Logger.info('Resuming active mode');
    }
  }
}