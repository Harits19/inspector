import { InspectorConfig } from "./configurationTypes";

// OAuth-related session storage keys
export const SESSION_KEYS = {
  CODE_VERIFIER: "mcp_code_verifier",
  SERVER_URL: "mcp_server_url",
  TOKENS: "mcp_tokens",
  CLIENT_INFORMATION: "mcp_client_information",
  SERVER_METADATA: "mcp_server_metadata",
} as const;

// Generate server-specific session storage keys
export const getServerSpecificKey = (
  baseKey: string,
  serverUrl?: string,
): string => {
  if (!serverUrl) return baseKey;
  return `[${serverUrl}] ${baseKey}`;
};

export type ConnectionStatus =
  | "disconnected"
  | "connected"
  | "error"
  | "error-connecting-to-proxy";

export const DEFAULT_MCP_PROXY_LISTEN_PORT = "6277";

/**
 * Default configuration for the MCP Inspector, Currently persisted in local_storage in the Browser.
 * Future plans: Provide json config file + Browser local_storage to override default values
 **/
export const DEFAULT_INSPECTOR_CONFIG: InspectorConfig = {
  MCP_SERVER_REQUEST_TIMEOUT: {
    label: "Request Timeout",
    description: "Timeout for requests to the MCP server (ms)",
    value: 10000,
  },
  MCP_REQUEST_TIMEOUT_RESET_ON_PROGRESS: {
    label: "Reset Timeout on Progress",
    description: "Reset timeout on progress notifications",
    value: true,
  },
  MCP_REQUEST_MAX_TOTAL_TIMEOUT: {
    label: "Maximum Total Timeout",
    description:
      "Maximum total timeout for requests sent to the MCP server (ms) (Use with progress notifications)",
    value: 60000,
  },
  MCP_PROXY_FULL_ADDRESS: {
    label: "Inspector Proxy Address",
    description:
      "Set this if you are running the MCP Inspector Proxy on a non-default address. Example: http://10.1.1.22:5577",
    value: "",
  },
} as const;

interface ClaudeModel {
  id: string;
  name: string;
  description: string;
}

interface OpenAIModel {
  id: string;
  name: string;
  description: string;
}

interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  provider: "anthropic" | "openai" | "deepseek";
}

export const CLAUDE_MODELS: ClaudeModel[] = [
  {
    id: "claude-opus-4-0",
    name: "Claude Opus 4",
    description: "Latest and most powerful model for complex reasoning",
  },
  {
    id: "claude-sonnet-4-0",
    name: "Claude Sonnet 4",
    description: "Next generation balanced model with enhanced capabilities",
  },
  {
    id: "claude-3-7-sonnet-latest",
    name: "Claude Sonnet 3.7",
    description: "Most intelligent model with extended thinking",
  },
  {
    id: "claude-3-5-sonnet-latest",
    name: "Claude Sonnet 3.5",
    description: "High level of intelligence and capability",
  },
  {
    id: "claude-3-5-haiku-latest",
    name: "Claude Haiku 3.5",
    description: "Fastest model - intelligence at blazing speeds",
  },
  {
    id: "claude-3-opus-latest",
    name: "Claude Opus 3",
    description: "Top-level intelligence, fluency, and understanding",
  },
];

export const OPENAI_MODELS: OpenAIModel[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Most advanced GPT-4 model with multimodal capabilities",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    description: "Faster and more affordable GPT-4o model",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Latest GPT-4 model with improved instruction following",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "Large multimodal model with broad general knowledge",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and cost-effective model for simpler tasks",
  },
  {
    id: "o1-preview",
    name: "o1-preview",
    description: "Advanced reasoning model for complex problem solving",
  },
  {
    id: "o1-mini",
    name: "o1-mini",
    description: "Faster reasoning model for coding and math",
  },
];

export const ALL_MODELS: ModelDefinition[] = [
  // Anthropic models
  ...CLAUDE_MODELS.map(model => ({ ...model, provider: "anthropic" as const })),
  // OpenAI models
  ...OPENAI_MODELS.map(model => ({ ...model, provider: "openai" as const })),
];

export const getModelsByProvider = (provider: "anthropic" | "openai" | "deepseek") => {
  return ALL_MODELS.filter(model => model.provider === provider);
};
