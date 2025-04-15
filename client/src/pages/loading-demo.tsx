import React, { useState } from 'react';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoadingDemo() {
  const [character, setCharacter] = useState<'blocks' | 'ball' | 'kite' | 'robot'>('blocks');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [text, setText] = useState('Loading...');
  const [showCode, setShowCode] = useState(false);

  const generateCode = () => {
    return `<AnimatedLoader 
  character="${character}" 
  size="${size}"${text ? `\n  text="${text}"` : ''}
/>`;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Playful Loading Animations</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Animation Preview</CardTitle>
            <CardDescription>See how your loader looks</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[300px] bg-slate-50 rounded-b-lg">
            <AnimatedLoader 
              character={character} 
              size={size} 
              text={text} 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Customize</CardTitle>
            <CardDescription>Configure your loader animation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="character" className="block mb-2">Character</Label>
              <Select 
                value={character} 
                onValueChange={(value) => setCharacter(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select character" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocks">Building Blocks</SelectItem>
                  <SelectItem value="ball">Bouncing Ball</SelectItem>
                  <SelectItem value="kite">Flying Kite</SelectItem>
                  <SelectItem value="robot">Playful Robot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="block mb-2">Size</Label>
              <RadioGroup 
                value={size} 
                onValueChange={(value) => setSize(value as any)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sm" id="sm" />
                  <Label htmlFor="sm">Small</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="md" id="md" />
                  <Label htmlFor="md">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lg" id="lg" />
                  <Label htmlFor="lg">Large</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="text" className="block mb-2">Loading Text (optional)</Label>
              <Input 
                id="text"
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                placeholder="Enter loading text..." 
              />
            </div>
            
            <Button 
              onClick={() => setShowCode(!showCode)}
              variant="outline"
              className="w-full"
            >
              {showCode ? 'Hide Code' : 'Show Code'}
            </Button>
            
            {showCode && (
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-md">
                <pre className="whitespace-pre-wrap break-words text-sm">
                  {generateCode()}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">How to Use</h2>
        <div className="prose prose-slate max-w-none dark:prose-invert">
          <p>
            The <code>AnimatedLoader</code> component provides kid-friendly loading animations 
            to make your application more engaging. Here's how to use it:
          </p>
          
          <ol>
            <li>Import the component: <code>import {'{'} AnimatedLoader {'}'} from '@/components/ui/animated-loader';</code></li>
            <li>Add it to your loading states: <code>{'<AnimatedLoader character="robot" size="md" text="Loading..." />'}</code></li>
          </ol>
          
          <h3>Props</h3>
          <ul>
            <li><strong>character</strong>: The animation type ('blocks', 'ball', 'kite', 'robot')</li>
            <li><strong>size</strong>: The size of the animation ('sm', 'md', 'lg')</li>
            <li><strong>text</strong>: Optional loading text to display below the animation</li>
            <li><strong>className</strong>: Optional additional CSS classes</li>
          </ul>
          
          <h3>Examples</h3>
          <p>Use in loading states:</p>
          <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-md">
{`{isLoading ? (
  <AnimatedLoader character="robot" size="md" text="Getting things ready..." />
) : (
  <YourContent />
)}`}
          </pre>
        </div>
      </div>
    </div>
  );
}