# Cypher - An AI computer framework

![nn6a2q79zf0CohxzQ_wW__4a0427cc13a74f4587edc4aa7d54614a](https://github.com/user-attachments/assets/14d0acc4-1ad8-436a-8682-9e8f4870a077)

## Introduction

Cypher is a flexible and modular framework for building AI agents that access the world via a computer interface. This allows agents to operate continuously and autonomously (via `TerminalCore`), running commands and interacting with a terminal environment.

Cypher focuses on being a native bitcoin framework, allowing agents to freely interact with the Bitcoin blockchain and ecosystem on-chain.

Agents are defined through YAML files rather than hard-coded configurations, making it easy to swap in your own agent definitions, tools, personalities, and features.

## QUICK START
1. To test built in implementations, add an anthropic ENV key
2. Run `npm run test` and pick a test via CLI to play with the system
3. To see agent terminal logs, open localhost:3000 in browser

## TERMINAL
Access the terminal during runs with localhost:3000
<img width="1728" alt="image (2)" src="https://github.com/user-attachments/assets/e353452f-5db0-4143-a309-b6a65335ba1d" />

## Agent Configuration & Loading

### Loading Agents

There are two main ways to load agent configurations:

#### Option 1: Direct Config Path
Specify the exact path to your agent's YAML config file:

```typescript
import { Agent } from 'cypher-core';

const myAgent = new Agent({ 
  agentConfigPath: './my_agents/mySpecialAgent.yaml' 
});
const result = await myAgent.run("Hello");
```

#### Option 2: Load by Agent Name
Load an agent by name, which will search in your local agents directory and fall back to built-in agents:

```typescript
import { Agent } from 'cypher-core';

const myAgent = new Agent({ agentName: "MyAgent" });
const result = await myAgent.run("Hello");
```

**Built-in Fallbacks**: When using `agentName: "TerminalAgent"` or `agentName: "ChatAgent"`, Cypher Core will automatically use the built-in configurations if no custom configs are found.

### Configuration and Environment

You can customize the agent loading behavior using environment variables:

```bash
# Set custom directories for agents and personality
export AGENTS_DIR=./my_custom_agents
export PERSONALITY_PATH=./my_custom_agents/personality.yaml
```

### The `personality.yaml` File

A global file defining the core personality and any other variables you want available to all agents.

```yaml
core_personality: "This is the shared core personality that all agents can reference."
```

## High-Level Architecture

1. **Personality & Configuration via YAML**  
   Each agent is defined in a single `.yaml` file, including:
   - Agent name & description
   - Model/client selection
   - System prompt referencing global personality variables
   - Main goals and dynamic variables
   - Tools (function-calling capabilities)
   - Optional structured output schemas

   Additionally, `personality.yaml` holds shared personality traits. Reference these variables using `{{from_personality:core_personality}}` or similar placeholders.

2. **BaseAgent**  
   A foundational class that:
   - Manages chat history
   - Interacts with the model (OpenAI, Anthropic, Fireworks)
   - Optionally uses tools or returns structured outputs via JSON schemas

   Configuration is entirely YAML-based—no hard-coded logic required.

3. **TerminalCore (Autonomous Runtime)**  
   A loop-based runtime that continuously runs an agent, allowing it to:
   - Issue terminal commands (via tools/features)
   - Operate indefinitely, enabling fully autonomous behavior
   - Integrate features that provide new commands or actions

4. **GUI & Logger**  
   A built-in GUI lets you monitor agent behavior, logs, system prompts, and last run data in real-time.

## Function Calling (Tools)

**When to Use**: If your model needs to fetch external data or perform actions, use tools.

**How It Works**:  
- Define a tool in your agent’s YAML:
```yaml
  tools:
  - type: "function"
    function:
      name: "get_weather"
      description: "Get the current weather in a given location"
      parameters:
        type: object
        properties:
          location:
            type: string
            description: "The city and state, e.g. San Francisco, CA"
        required: ["location"]
```

- The agent may call this function when it decides it needs the weather data.
- The model’s response includes a function call (e.g., `get_weather` with arguments).
- **Your application** executes the actual function (like calling a weather API).
- After execution, you provide the result back to the agent as a ```role: "tool"``` message.
- The agent then uses the returned data to produce its final answer.

**Example**:
```typescript
const result = await agent.run("What's the weather in Berlin?");
if (result.success && result.functionCalls) {
  for (const call of result.functionCalls) {
    if (call.functionName === 'get_weather') {
      const weatherData = await myWeatherAPI(call.functionArgs.location);
      agent.addMessage({
        role: 'tool',
        content: JSON.stringify({ weather: weatherData }),
        tool_call_id: call.id
      });
    }
  }
  const final = await agent.run();
  console.log("Final agent answer:", final.output);
}```

## Structured Outputs

**When to Use**: If you need the model to return data in a strict JSON format with no external calls.

**How It Works**:
- Define an `output_schema` in the YAML:
```yaml
output_schema:
  type: object
  properties:
    answer:
      type: string
    confidence:
      type: number
      required: ["answer", "confidence"]
```

- The agent must return JSON that matches this schema. No external function calls are made.
- Simply run the agent and get a well-structured JSON response:

```typescript
const result = await agent.run("What is the capital of France?");
// result.output might be: { answer: "Paris", confidence: 0.99 }
```

## Choosing Between Tools and Structured Outputs

- **Tools**: For scenarios where the agent must actively call external functions (APIs, databases, etc.). The model triggers a function call, you handle it, and feed back results.
- **Structured Outputs**: For scenarios where you just want a specific JSON format and do not need external actions.

You can combine both. For example, the agent might first call a tool to fetch data and later produce a final answer in a structured JSON format.

## Features (Adding New Commands to TerminalCore)

Features are modules that add new commands (terminal actions) to the agent’s environment. This allows the agent to perform additional actions beyond tool calls. Features are especially useful when running the agent through `TerminalCore`, enabling a richer set of actions the agent can autonomously perform.

**How to Add a Feature**:  
- Create a new `.ts` file in `src/features/` that exports a `TerminalFeature`.  
- Implement a `loadFeatureCommands()` method that returns an array of `Command` objects.
- Each `Command` defines a name, description, parameters, and a handler function.
- Add the feature to the `features` array when initializing `TerminalCore`.

**Example**:
```typescript
// src/features/myNewFeature.ts
import { TerminalFeature } from './featureTypes';
import { Command } from '../terminal/types/commands';

const myCustomCommand: Command = {
  name: 'say-hello',
  description: 'Print a greeting message.',
  parameters: [],
  handler: async () => {
    return { output: 'Hello from my new feature!' };
  },
};

const MyNewFeature: TerminalFeature = {
  async loadFeatureCommands(): Promise<Command[]> {
    return [myCustomCommand];
  }
};

export default MyNewFeature;
```

Then, register this feature in `TerminalCore`:
```typescript
import MyNewFeature from './src/features/myNewFeature';
import { TerminalCore } from './src/terminal/terminalCore';

const core = new TerminalCore({
  features: [MyNewFeature],
});

await core.init();
await core.runLoop();
```

Now the agent can execute the `say-hello` command autonomously if needed.

## FEATURES THAT COME WITH THE PACKAGE

- **InternetFeature**: allows the agent to search the internet. REQUIRES PERPLEXITY API KEY in .env
- **TwitterFeature**: full twitter package for the agent. REQUIRES SUPABASE DB to be setup and twitter login set in the .env
(see docs/database.md for supabase SQL setup)

## Workflow

1. **Define global personality & variables** in `config/personality.yaml`.
2. **Create or modify an agent YAML** in `src/agents/` defining goals, tools, or output schemas.
3. **Add features** in `src/features/` to introduce new commands available to the agent.
4. **Run the agent** via `TerminalCore` or directly using the `Agent` class.
5. **If using tools**, handle function calls in your code, provide results back, and re-run the agent.
6. **If using structured outputs**, just parse the returned JSON.
7. **Use features** to expand the agent’s capabilities with terminal commands.

## GUI and Logging

- Start the logger server to view GUI: `loggerServer.ts`
- Monitor agent behavior, prompts, tool calls, feature commands, and responses in real-time.
- Adjust prompts, tools, schemas, and features as needed.

## Extensibility

- Add new agents by creating a new YAML—no code changes needed.
- Add tools by updating the YAML.
- Add features to introduce new commands.
- Swap models by changing the `client` and `model` fields in YAML.
- Use structured outputs or function calling depending on your use case.

## Example: Running a Structured Agent

```typescript
import { Agent } from 'cypher-core';

const agent = new Agent({ agentName: "structuredAgent" });
const result = await agent.run("What's the capital of France?");
if (result.success) {
  console.log("Agent structured response:", result.output);
}
```

## Example: Running a Tool-Enabled Agent

```typescript
import { Agent } from 'cypher-core';

const agent = new Agent({ agentName: "toolAgent" });
const result = await agent.run("What's the weather in San Francisco?");
if (result.success && result.functionCalls) {
  // For each function call, call the external API or logic, then feed results back.
}
```

By following this approach, you can build complex, tool-integrated, feature-rich, or strictly structured agents in a modular, configuration-driven manner.
