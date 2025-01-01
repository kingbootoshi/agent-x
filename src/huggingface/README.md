Collecting workspace information

# Huggingface Server Documentation

## Overview

The Huggingface server is designed to interface with the Qwen model, providing endpoints for model initialization and text generation. This server allows the `localAgent` to interact with the Qwen model for various tasks.

## How It Works with localAgent.yaml

The `localAgent.yaml` configuration specifies the use of the Qwen model and provides the server URL for the Huggingface server. Here’s how it integrates:

1. **Model Client Initialization**:
   - The QwenClient class in `QwenClient.ts` is used to interact with the Huggingface server.
   - The `localAgent.yaml` specifies the model and server URL.

2. **Agent Initialization**:
   - The Agent class in `Agent.ts` initializes the `QwenClient` with the model name and server URL.
   - The initialize method of `QwenClient`sends a request to the `/initialize` endpoint of the Huggingface server.

3. **Text Generation**:
   - When the agent runs, it sends a request to the `/generate` endpoint of the Huggingface server with the necessary parameters.
   - The server processes the request using the Qwen model and returns the generated text.

## Example Workflow

1. **Set up Huggingface token**:
    Register a user at `https://www.huggingface.co` and generate a token. Then copy this token in your `.env` file under the name of `HF_TOKEN`.

2. **Start the Huggingface Server**:
   Go to  `src/huggingface` directory and enter the following command:
   ```sh
   sudo hypercorn server.server:app --bind localhost:5000
   ```

3. **Configure the Agent**:
   Ensure `localAgent_terminal.yaml` or `localAgent_tools.yaml` is set up with the correct model and server URL:
   ```yaml
   name: "QwenAgent"
   description: "An agent that can understand and execute terminal commands."
   client: "local"
   model: "Qwen/Qwen2.5-7B-Instruct"
   dynamic_variables:
      server_url: "http://localhost:5000"
   ```

4. **Run the Agent**:
   ```typescript
   import { Agent } from './src/agents/Agent';
   import { Logger } from './src/utils/logger';

   async function main() {
     const myAgent = new Agent({ agentConfigPath: './src/agents/localAgent_terminal.yaml' });
     await myAgent.initialize();
     const result = await myAgent.run("Gather the latest information about bitcoin.");
     Logger.debug(result);
   }

   Logger.enable();
   Logger.setLevel('debug');
   main().catch(console.error);
   ```

## Huggingface Directory File Structure

- `server.py`: Main server implementation using Quart (currently two endpoints defined).
- `qwen.py`: Model implementation for Qwen.
- `requirements.txt`: Dependencies required for the server.

## Server Implementation

### server.py

This file sets up a Quart server with two main endpoints:

1. **Initialize Endpoint** (`/initialize`):
   - Initializes the Qwen model.
   - Expects a JSON payload with the model name.
   - Loads the model and stores it in the server's configuration.

2. **Generate Endpoint** (`/generate`):
   - Generates text based on the provided prompt.
   - Expects a JSON payload with the system context and messages.
   - Uses the loaded model to generate a response.

### qwen.py

This file contains the `QwenModel` class, which handles loading and running the Qwen model.
