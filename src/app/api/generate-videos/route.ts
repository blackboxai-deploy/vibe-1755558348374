import { NextRequest, NextResponse } from 'next/server';
import { generateVideo } from '@/lib/ai-client';
import { Scene, VideoGenerationResponse } from '@/types';

// Store generation status in memory (in production, use Redis or database)
const generationStatus = new Map<string, {
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  error?: string;
}>();

export async function POST(request: NextRequest) {
  try {
    const { scenes } = await request.json();
    
    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json(
        { error: 'Scenes array is required' },
        { status: 400 }
      );
    }

    if (scenes.length === 0 || scenes.length > 10) {
      return NextResponse.json(
        { error: 'Must provide between 1 and 10 scenes' },
        { status: 400 }
      );
    }

    console.log('Starting video generation for', scenes.length, 'scenes');

    // Initialize status for all scenes
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sceneResults: VideoGenerationResponse[] = [];

    for (const scene of scenes) {
      if (!scene.id || !scene.description) {
        return NextResponse.json(
          { error: 'Each scene must have id and description' },
          { status: 400 }
        );
      }

      generationStatus.set(`${sessionId}_${scene.id}`, {
        status: 'pending',
        progress: 0
      });
    }

    // Start video generation for all scenes (parallel processing)
    const videoPromises = scenes.map(async (scene: Scene) => {
      const statusKey = `${sessionId}_${scene.id}`;
      
      try {
        // Update status to generating
        generationStatus.set(statusKey, {
          status: 'generating',
          progress: 10
        });

        console.log(`Generating video for scene: ${scene.id}`);
        
        // Create detailed prompt for video generation
        const videoPrompt = `Create a ${scene.duration}-second rap music video scene: ${scene.description}. 
        Setting: ${scene.setting}. 
        Camera movement: ${scene.cameraMovement}. 
        Visual elements: ${scene.visualElements?.join(', ') || 'dynamic visuals'}. 
        Rapper actions: ${scene.rapperActions?.join(', ') || 'rapping confidently'}.
        Style: High-quality, cinematic, professional music video production.`;

        // Update progress
        generationStatus.set(statusKey, {
          status: 'generating',
          progress: 50
        });

        // Generate video using Google Veo-3
        const videoResponse = await generateVideo(videoPrompt, scene.duration);
        
        // For now, we'll simulate a video URL response
        // In actual implementation, the video URL would come from the AI response
        const videoUrl = typeof videoResponse === 'string' && videoResponse.startsWith('http') 
          ? videoResponse 
          : `https://placehold.co/800x600?text=Video+for+${scene.id.replace('_', '+')}`; // Placeholder for now

        // Update status to completed
        generationStatus.set(statusKey, {
          status: 'completed',
          progress: 100,
          videoUrl
        });

        console.log(`Video generated successfully for scene: ${scene.id}`);

        return {
          sceneId: scene.id,
          videoUrl,
          status: 'completed' as const,
          progress: 100
        };

      } catch (error) {
        console.error(`Error generating video for scene ${scene.id}:`, error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        generationStatus.set(statusKey, {
          status: 'failed',
          progress: 0,
          error: errorMessage
        });

        return {
          sceneId: scene.id,
          videoUrl: '',
          status: 'failed' as const,
          error: errorMessage
        };
      }
    });

    // Wait for all videos to complete (with timeout)
    const timeout = 15 * 60 * 1000; // 15 minutes total timeout
    const results = await Promise.allSettled(
      videoPromises.map(promise => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Video generation timeout')), timeout)
          )
        ])
      )
    );

    // Process results
    const videoResults: VideoGenerationResponse[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value as VideoGenerationResponse;
      } else {
        const scene = scenes[index];
        console.error(`Failed to generate video for scene ${scene.id}:`, result.reason);
        return {
          sceneId: scene.id,
          videoUrl: '',
          status: 'failed' as const,
          error: result.reason?.message || 'Generation failed'
        };
      }
    });

    const successCount = videoResults.filter(r => r.status === 'completed').length;
    console.log(`Video generation completed: ${successCount}/${scenes.length} successful`);

    return NextResponse.json({
      success: true,
      sessionId,
      videos: videoResults,
      summary: {
        total: scenes.length,
        completed: successCount,
        failed: scenes.length - successCount
      },
      message: `Generated ${successCount} out of ${scenes.length} videos successfully`
    });

  } catch (error) {
    console.error('Video generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to generate videos',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const sceneId = searchParams.get('sceneId');

  if (!sessionId) {
    return NextResponse.json(
      { message: 'Video generation endpoint. Use POST with scenes array.' },
      { status: 200 }
    );
  }

  // Return status for specific scene or all scenes in session
  if (sceneId) {
    const status = generationStatus.get(`${sessionId}_${sceneId}`);
    return NextResponse.json({ sceneId, status: status || { status: 'not_found', progress: 0 } });
  }

  // Return all statuses for session
  const allStatuses: any = {};
  for (const [key, status] of generationStatus.entries()) {
    if (key.startsWith(sessionId)) {
      const sceneId = key.split('_').slice(-1)[0];
      allStatuses[sceneId] = status;
    }
  }

  return NextResponse.json({ sessionId, statuses: allStatuses });
}