"use client";

import { useState, useEffect } from 'react';
import PromptInput from '@/components/PromptInput';
import ProgressTracker from '@/components/ProgressTracker';
import VideoGallery from '@/components/VideoGallery';
import { Scene, VideoGenerationResponse, ScriptResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'script' | 'videos' | 'completed'>('input');
  const [script, setScript] = useState<ScriptResponse | null>(null);
  const [videos, setVideos] = useState<VideoGenerationResponse[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Progress tracking state
  const [scriptStatus, setScriptStatus] = useState<'pending' | 'generating' | 'completed' | 'failed'>('pending');
  const [videoStatuses, setVideoStatuses] = useState<{
    [sceneId: string]: {
      status: 'pending' | 'generating' | 'completed' | 'failed';
      progress: number;
      videoUrl?: string;
      error?: string;
    };
  }>({});
  const [overallProgress, setOverallProgress] = useState(0);

  // Calculate overall progress
  useEffect(() => {
    let progress = 0;
    
    // Script progress (20% of total)
    if (scriptStatus === 'completed') {
      progress += 20;
    } else if (scriptStatus === 'generating') {
      progress += 10;
    }
    
    // Video progress (80% of total)
    const videoCount = Object.keys(videoStatuses).length;
    if (videoCount > 0) {
      const totalVideoProgress = Object.values(videoStatuses).reduce((sum, status) => sum + status.progress, 0);
      const averageVideoProgress = totalVideoProgress / videoCount;
      progress += (averageVideoProgress / 100) * 80;
    }
    
    setOverallProgress(progress);
  }, [scriptStatus, videoStatuses]);

  const handlePromptSubmit = async (prompt: string) => {
    setIsGenerating(true);
    setCurrentStep('script');
    setScriptStatus('generating');
    setError('');
    
    try {
      // Generate script
      console.log('Generating script for prompt:', prompt);
      const scriptResponse = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!scriptResponse.ok) {
        const errorData = await scriptResponse.json();
        throw new Error(errorData.details || errorData.error || 'Failed to generate script');
      }

      const scriptData = await scriptResponse.json();
      
      if (!scriptData.success) {
        throw new Error(scriptData.error || 'Script generation failed');
      }

      console.log('Script generated successfully:', scriptData.script);
      setScript(scriptData.script);
      setScriptStatus('completed');
      setCurrentStep('videos');

      // Initialize video statuses
      const initialVideoStatuses: typeof videoStatuses = {};
      scriptData.script.scenes.forEach((scene: Scene) => {
        initialVideoStatuses[scene.id] = {
          status: 'pending',
          progress: 0
        };
      });
      setVideoStatuses(initialVideoStatuses);

      // Generate videos
      await generateVideos(scriptData.script.scenes);

    } catch (error) {
      console.error('Error in prompt submission:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setScriptStatus('failed');
      setIsGenerating(false);
    }
  };

  const generateVideos = async (scenes: Scene[]) => {
    try {
      console.log('Starting video generation for', scenes.length, 'scenes');
      
      // Update all scenes to generating
      const updatedStatuses = { ...videoStatuses };
      scenes.forEach(scene => {
        updatedStatuses[scene.id] = {
          status: 'generating',
          progress: 5
        };
      });
      setVideoStatuses(updatedStatuses);

      const videoResponse = await fetch('/api/generate-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenes }),
      });

      if (!videoResponse.ok) {
        const errorData = await videoResponse.json();
        throw new Error(errorData.details || errorData.error || 'Failed to generate videos');
      }

      const videoData = await videoResponse.json();
      
      if (!videoData.success) {
        throw new Error(videoData.error || 'Video generation failed');
      }

      console.log('Videos generated:', videoData.summary);
      setSessionId(videoData.sessionId);
      setVideos(videoData.videos);

      // Update video statuses with final results
      const finalStatuses = { ...videoStatuses };
      videoData.videos.forEach((video: VideoGenerationResponse) => {
        finalStatuses[video.sceneId] = {
          status: video.status,
          progress: video.status === 'completed' ? 100 : 0,
          videoUrl: video.videoUrl,
          error: video.error
        };
      });
      setVideoStatuses(finalStatuses);

      setCurrentStep('completed');
      setIsGenerating(false);

    } catch (error) {
      console.error('Error generating videos:', error);
      setError(error instanceof Error ? error.message : 'Video generation failed');
      
      // Mark all pending videos as failed
      const failedStatuses = { ...videoStatuses };
      Object.keys(failedStatuses).forEach(sceneId => {
        if (failedStatuses[sceneId].status === 'generating' || failedStatuses[sceneId].status === 'pending') {
          failedStatuses[sceneId] = {
            status: 'failed',
            progress: 0,
            error: error instanceof Error ? error.message : 'Generation failed'
          };
        }
      });
      setVideoStatuses(failedStatuses);
      setIsGenerating(false);
    }
  };

  const handleRegenerateVideo = async (sceneId: string) => {
    if (!script) return;
    
    const scene = script.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    // Update status to generating
    setVideoStatuses(prev => ({
      ...prev,
      [sceneId]: {
        status: 'generating',
        progress: 5
      }
    }));

    try {
      await generateVideos([scene]);
    } catch (error) {
      console.error('Error regenerating video:', error);
      setVideoStatuses(prev => ({
        ...prev,
        [sceneId]: {
          status: 'failed',
          progress: 0,
          error: error instanceof Error ? error.message : 'Regeneration failed'
        }
      }));
    }
  };

  const handleStartOver = () => {
    setIsGenerating(false);
    setCurrentStep('input');
    setScript(null);
    setVideos([]);
    setSessionId('');
    setError('');
    setScriptStatus('pending');
    setVideoStatuses({});
    setOverallProgress(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            AI Rap Video Studio
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your creative vision into cinematic rap music videos with AI-powered scene generation
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="text-red-500 text-xl">⚠️</div>
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200">Generation Error</h3>
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleStartOver}
                className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
              >
                Start Over
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {currentStep === 'input' && (
          <PromptInput onSubmit={handlePromptSubmit} isLoading={isGenerating} />
        )}

        {(currentStep === 'script' || currentStep === 'videos' || currentStep === 'completed') && (
          <div className="space-y-8">
            <ProgressTracker
              sessionId={sessionId}
              scriptStatus={scriptStatus}
              videoStatuses={videoStatuses}
              overallProgress={overallProgress}
            />

            {script && (
              <VideoGallery
                scenes={script.scenes}
                videos={videos}
                onRegenerateVideo={handleRegenerateVideo}
              />
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={handleStartOver}
                size="lg"
              >
                Create New Video
              </Button>
              
              {currentStep === 'completed' && videos.some(v => v.status === 'completed') && (
                <Button 
                  onClick={() => {
                    // Download all completed videos
                    videos.filter(v => v.status === 'completed').forEach((video, index) => {
                      setTimeout(() => {
                        const link = document.createElement('a');
                        link.href = video.videoUrl;
                        link.download = `rap_video_${video.sceneId}.mp4`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }, index * 1000);
                    });
                  }}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                >
                  Download All Videos
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-12 pb-8">
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <p>Powered by Claude Sonnet 4 for script generation and Google Veo-3 for video creation</p>
            <p>Built with Next.js, React, and Tailwind CSS</p>
          </div>
        </div>
      </div>
    </main>
  );
}