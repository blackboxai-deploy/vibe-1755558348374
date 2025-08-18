"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Scene, VideoGenerationResponse } from '@/types';

interface SceneCardProps {
  scene: Scene;
  video?: VideoGenerationResponse;
  sceneNumber: number;
  isSelected: boolean;
  onSelect: () => void;
  onDownload?: () => void;
  onRegenerate?: () => void;
}

export default function SceneCard({
  scene,
  video,
  sceneNumber,
  isSelected,
  onSelect,
  onDownload,
  onRegenerate
}: SceneCardProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'generating':
        return 'bg-blue-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Ready';
      case 'generating':
        return 'Generating...';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  // Create a representative image for the scene
  const sceneImageUrl = `https://placehold.co/400x300?text=Scene+${sceneNumber}+${scene.title?.replace(/\s+/g, '+') || 'Rap+Video+Scene'}`;

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-purple-500 shadow-lg' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">
            Scene {sceneNumber}
            {scene.title && (
              <span className="block text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
                {scene.title}
              </span>
            )}
          </CardTitle>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(video?.status)}>
              {getStatusText(video?.status)}
            </Badge>
            <span className="text-xs text-gray-500">{scene.duration}s</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Video/Image Preview */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {video?.status === 'completed' && video.videoUrl && !videoError ? (
            <video
              className="w-full h-full object-cover"
              poster={sceneImageUrl}
              controls
              preload="metadata"
              onError={() => setVideoError(true)}
            >
              <source src={video.videoUrl} type="video/mp4" />
              <img 
                src={sceneImageUrl}
                alt={`Scene ${sceneNumber} preview`}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </video>
          ) : (
            <div className="relative w-full h-full">
              {!imageError ? (
                <img 
                  src={sceneImageUrl}
                  alt={`Scene ${sceneNumber} preview`}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎬</div>
                    <div className="text-sm font-medium">Scene {sceneNumber}</div>
                  </div>
                </div>
              )}
              
              {/* Overlay for non-completed videos */}
              {video?.status !== 'completed' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    {video?.status === 'generating' ? (
                      <div className="space-y-2">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                        <div className="text-sm">Generating...</div>
                        {video.progress !== undefined && (
                          <div className="w-32 mx-auto">
                            <Progress value={video.progress} className="h-1" />
                          </div>
                        )}
                      </div>
                    ) : video?.status === 'failed' ? (
                      <div className="space-y-2">
                        <div className="text-2xl">⚠️</div>
                        <div className="text-sm">Generation Failed</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-2xl">⏳</div>
                        <div className="text-sm">Waiting to Generate</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scene Description */}
        <div className="space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
            {scene.description}
          </p>
          
          {/* Quick Info */}
          <div className="flex flex-wrap gap-1">
            {scene.setting && (
              <Badge variant="outline" className="text-xs">
                {scene.setting.split(' ').slice(0, 3).join(' ')}
                {scene.setting.split(' ').length > 3 ? '...' : ''}
              </Badge>
            )}
            {scene.visualElements?.slice(0, 2).map((element, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {element}
              </Badge>
            ))}
            {scene.visualElements && scene.visualElements.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{scene.visualElements.length - 2} more
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {video?.status === 'completed' && onDownload && (
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="flex-1"
            >
              Download
            </Button>
          )}
          
          {video?.status === 'failed' && onRegenerate && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onRegenerate();
              }}
              className="flex-1"
            >
              Retry
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="px-3"
          >
            {isSelected ? 'Less' : 'Details'}
          </Button>
        </div>

        {/* Error Message */}
        {video?.error && (
          <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {video.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}