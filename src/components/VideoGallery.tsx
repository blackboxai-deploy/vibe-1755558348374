"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scene, VideoGenerationResponse } from '@/types';
import SceneCard from './SceneCard';

interface VideoGalleryProps {
  scenes: Scene[];
  videos: VideoGenerationResponse[];
  onRegenerateVideo?: (sceneId: string) => void;
  onDownloadAll?: () => void;
}

export default function VideoGallery({ 
  scenes, 
  videos, 
  onRegenerateVideo, 
  onDownloadAll 
}: VideoGalleryProps) {
  const [selectedScene, setSelectedScene] = useState<string | null>(null);

  const completedVideos = videos.filter(v => v.status === 'completed');
  const failedVideos = videos.filter(v => v.status === 'failed');
  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

  const handleDownloadVideo = (videoUrl: string, sceneId: string) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `rap_video_${sceneId}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    completedVideos.forEach((video, index) => {
      setTimeout(() => {
        handleDownloadVideo(video.videoUrl, video.sceneId);
      }, index * 1000); // Stagger downloads by 1 second
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Generated Music Video Scenes</CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                {completedVideos.length} of {scenes.length} videos ready • Total duration: {totalDuration}s
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {completedVideos.length} Completed
              </Badge>
              {failedVideos.length > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {failedVideos.length} Failed
                </Badge>
              )}
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {totalDuration}s Total
              </Badge>
            </div>
          </div>
        </CardHeader>
        {completedVideos.length > 0 && (
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleDownloadAll}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              >
                Download All Videos ({completedVideos.length})
              </Button>
              {onDownloadAll && (
                <Button variant="outline" onClick={onDownloadAll}>
                  Download as ZIP
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Scene Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {scenes.map((scene, index) => {
          const video = videos.find(v => v.sceneId === scene.id);
          return (
            <SceneCard
              key={scene.id}
              scene={scene}
              video={video}
              sceneNumber={index + 1}
              isSelected={selectedScene === scene.id}
              onSelect={() => setSelectedScene(selectedScene === scene.id ? null : scene.id)}
              onDownload={video?.status === 'completed' ? () => handleDownloadVideo(video.videoUrl, scene.id) : undefined}
              onRegenerate={onRegenerateVideo ? () => onRegenerateVideo(scene.id) : undefined}
            />
          );
        })}
      </div>

      {/* Selected Scene Details */}
      {selectedScene && (
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-xl">
              Scene {scenes.findIndex(s => s.id === selectedScene) + 1} Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const scene = scenes.find(s => s.id === selectedScene);
              const video = videos.find(v => v.sceneId === selectedScene);
              
              if (!scene) return null;
              
              return (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Scene Description</h4>
                    <p className="text-gray-700 dark:text-gray-300">{scene.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Setting</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{scene.setting}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Camera Movement</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{scene.cameraMovement}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Visual Elements</h4>
                    <div className="flex flex-wrap gap-2">
                      {scene.visualElements?.map((element, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {element}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Rapper Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      {scene.rapperActions?.map((action, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {video?.status === 'completed' && (
                    <div className="pt-4 border-t">
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleDownloadVideo(video.videoUrl, scene.id)}
                          size="sm"
                        >
                          Download Video
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => window.open(video.videoUrl, '_blank')}
                          size="sm"
                        >
                          View Full Size
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {scenes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold mb-2">No scenes generated yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Enter a prompt above to generate your rap music video scenes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}