export interface Scene {
  id: string;
  title: string;
  description: string;
  duration: number;
  visualElements: string[];
  rapperActions: string[];
  cameraMovement: string;
  setting: string;
}

export interface ScriptResponse {
  scenes: Scene[];
  overallTheme: string;
  musicStyle: string;
  totalDuration: number;
}

export interface VideoGenerationRequest {
  sceneId: string;
  prompt: string;
  duration: number;
}

export interface VideoGenerationResponse {
  sceneId: string;
  videoUrl: string;
  status: 'generating' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export interface GenerationStatus {
  scriptStatus: 'pending' | 'generating' | 'completed' | 'failed';
  videoStatus: {
    [sceneId: string]: {
      status: 'pending' | 'generating' | 'completed' | 'failed';
      progress: number;
      videoUrl?: string;
      error?: string;
    };
  };
  overallProgress: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CustomEndpointRequest {
  model: string;
  messages: AIMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface UserPrompt {
  originalPrompt: string;
  theme?: string;
  style?: string;
  duration?: number;
  numberOfScenes: number;
}