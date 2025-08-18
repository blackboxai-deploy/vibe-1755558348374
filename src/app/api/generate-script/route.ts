import { NextRequest, NextResponse } from 'next/server';
import { generateScript, parseAIResponse } from '@/lib/ai-client';
import { ScriptResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    if (prompt.length < 10) {
      return NextResponse.json(
        { error: 'Prompt must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: 'Prompt must be less than 1000 characters' },
        { status: 400 }
      );
    }

    console.log('Generating script for prompt:', prompt.substring(0, 100) + '...');

    // Generate script using Claude Sonnet 4
    const scriptResponse = await generateScript(prompt);
    
    // Parse the JSON response
    const parsedScript: ScriptResponse = parseAIResponse(scriptResponse);
    
    // Validate the response structure
    if (!parsedScript.scenes || !Array.isArray(parsedScript.scenes)) {
      throw new Error('Invalid script response structure: missing scenes array');
    }

    if (parsedScript.scenes.length !== 5) {
      throw new Error(`Expected 5 scenes, got ${parsedScript.scenes.length}`);
    }

    // Validate each scene has required fields
    for (const scene of parsedScript.scenes) {
      if (!scene.id || !scene.description || !scene.duration) {
        throw new Error('Invalid scene structure: missing required fields');
      }
    }

    console.log('Script generated successfully with', parsedScript.scenes.length, 'scenes');

    return NextResponse.json({
      success: true,
      script: parsedScript,
      message: 'Script generated successfully'
    });

  } catch (error) {
    console.error('Script generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to generate script',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Script generation endpoint. Use POST with prompt in body.' },
    { status: 200 }
  );
}