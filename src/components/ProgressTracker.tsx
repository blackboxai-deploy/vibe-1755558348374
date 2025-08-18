"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GenerationStatus } from '@/types';

interface ProgressTrackerProps {
  sessionId?: string;
  scriptStatus: 'pending' | 'generating' | 'completed' | 'failed';
  videoStatuses: {
    [sceneId: string]: {
      status: 'pending' | 'generating' | 'completed' | 'failed';
      progress: number;
      videoUrl?: string;
      error?: string;
    };
  };
  overallProgress: number;
}

export default function ProgressTracker({ 
  sessionId, 
  scriptStatus, 
  videoStatuses, 
  overallProgress 
}: ProgressTrackerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'generating':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'generating':
        return 'Generating...';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const totalVideos = Object.keys(videoStatuses).length;
  const completedVideos = Object.values(videoStatuses).filter(s => s.status === 'completed').length;
  const failedVideos = Object.values(videoStatuses).filter(s => s.status === 'failed').length;
  const generatingVideos = Object.values(videoStatuses).filter(s => s.status === 'generating').length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Generation Progress</CardTitle>
          <div className="text-sm text-gray-500">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
        {sessionId && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Session ID: {sessionId}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Overall Progress</span>
            <span className="text-lg font-bold">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Script Generation Status */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Script Generation</h3>
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusColor(scriptStatus)} text-white`}>
              {getStatusText(scriptStatus)}
            </Badge>
            {scriptStatus === 'generating' && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Creating 5 cinematic scenes...</span>
              </div>
            )}
            {scriptStatus === 'completed' && (
              <span className="text-sm text-green-600">✓ Script ready with 5 scenes</span>
            )}
            {scriptStatus === 'failed' && (
              <span className="text-sm text-red-600">✗ Script generation failed</span>
            )}
          </div>
        </div>

        {/* Video Generation Status */}
        {totalVideos > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Video Generation</h3>
              <div className="text-sm text-gray-600">
                {completedVideos}/{totalVideos} completed
                {failedVideos > 0 && (
                  <span className="text-red-600 ml-2">({failedVideos} failed)</span>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{totalVideos}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{completedVideos}</div>
                <div className="text-sm text-green-500">Completed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{generatingVideos}</div>
                <div className="text-sm text-blue-500">Generating</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{failedVideos}</div>
                <div className="text-sm text-red-500">Failed</div>
              </div>
            </div>

            {/* Individual Scene Progress */}
            <div className="space-y-3">
              {Object.entries(videoStatuses).map(([sceneId, status]) => (
                <div key={sceneId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        Scene {sceneId.replace('scene_', '')}
                      </span>
                      <Badge className={`${getStatusColor(status.status)} text-white`}>
                        {getStatusText(status.status)}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{status.progress}%</span>
                  </div>
                  <Progress value={status.progress} className="h-2" />
                  {status.error && (
                    <p className="text-sm text-red-600">Error: {status.error}</p>
                  )}
                  {status.status === 'generating' && (
                    <p className="text-sm text-gray-600">
                      Generating high-quality video content...
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Time */}
        {generatingVideos > 0 && (
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ⏱️ Estimated time remaining: {generatingVideos * 2 - 5} minutes
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              High-quality video generation takes time. Please keep this tab open.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}