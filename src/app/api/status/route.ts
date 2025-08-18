import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId parameter is required' },
      { status: 400 }
    );
  }

  try {
    // In a real implementation, this would query a database or Redis
    // For now, we'll return a mock status
    const mockStatus = {
      sessionId,
      scriptStatus: 'completed',
      videoStatus: {
        scene_1: { status: 'completed', progress: 100, videoUrl: 'https://placehold.co/800x600?text=Scene+1+Video' },
        scene_2: { status: 'generating', progress: 75 },
        scene_3: { status: 'generating', progress: 25 },
        scene_4: { status: 'pending', progress: 0 },
        scene_5: { status: 'pending', progress: 0 }
      },
      overallProgress: 40
    };

    return NextResponse.json({
      success: true,
      status: mockStatus
    });

  } catch (error) {
    console.error('Status check error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { message: 'Status endpoint is read-only. Use GET with sessionId parameter.' },
    { status: 405 }
  );
}