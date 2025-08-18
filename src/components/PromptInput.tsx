"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export default function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [charCount, setCharCount] = useState(0);

  const maxChars = 1000;
  const minChars = 10;

  const handlePromptChange = (value: string) => {
    if (value.length <= maxChars) {
      setPrompt(value);
      setCharCount(value.length);
    }
  };

  const handleSubmit = () => {
    if (prompt.length >= minChars && prompt.length <= maxChars && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  const isValid = prompt.length >= minChars && prompt.length <= maxChars;

  const examplePrompts = [
    "A rapper performing in an urban cityscape at sunset with neon lights and graffiti walls",
    "High-energy performance in a recording studio with professional lighting and equipment",
    "Street-style rap scene in an underground tunnel with dramatic shadows and smoke",
    "Rooftop performance overlooking a city skyline during golden hour"
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Rap Music Video Generator
        </CardTitle>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Describe your rap music video concept and we'll generate 5 cinematic scenes with AI-created videos
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-lg font-semibold">
            Describe Your Music Video Concept
          </Label>
          <Textarea
            id="prompt"
            placeholder="Example: Create a high-energy rap video featuring an artist performing in various urban locations including rooftops, street corners, and underground venues. The vibe should be confident and dynamic with dramatic lighting and smooth camera movements..."
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            className="min-h-[150px] text-lg resize-none"
            disabled={isLoading}
          />
          <div className="flex justify-between items-center text-sm">
            <span className={`${charCount < minChars ? 'text-red-500' : charCount > maxChars * 0.9 ? 'text-yellow-500' : 'text-green-500'}`}>
              {charCount}/{maxChars} characters
            </span>
            <span className="text-gray-500">
              Minimum {minChars} characters required
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Need inspiration? Try these examples:
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => handlePromptChange(example)}
                disabled={isLoading}
                className="text-left p-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            size="lg"
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 text-lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Script...
              </div>
            ) : (
              'Generate Music Video'
            )}
          </Button>
          
          {prompt && (
            <Button
              variant="outline"
              onClick={() => {
                setPrompt('');
                setCharCount(0);
              }}
              disabled={isLoading}
              size="lg"
              className="sm:w-auto"
            >
              Clear
            </Button>
          )}
        </div>

        {!isValid && prompt.length > 0 && (
          <div className="text-sm text-red-500 text-center">
            {prompt.length < minChars 
              ? `Please enter at least ${minChars - prompt.length} more characters` 
              : 'Prompt is too long'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}