import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SimpleTestPage() {
  const [result, setResult] = useState<string>("No test run yet");
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    setResult("Running test...");

    try {
      // Create test data
      const testPlaydate = {
        title: "Simple Test " + new Date().toLocaleTimeString(),
        description: "This is a simple test playdate",
        location: "Amsterdam",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        maxParticipants: 5
      };

      setResult(prev => prev + "\n\nSending test playdate: " + JSON.stringify(testPlaydate));

      // Simple fetch request
      const response = await fetch('/api/playdates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(testPlaydate),
      });

      const responseText = await response.text();
      
      if (response.ok) {
        setResult(prev => prev + "\n\nSuccess! Playdate created:\n" + responseText);
      } else {
        setResult(prev => prev + "\n\nRequest failed: " + response.status + "\n" + responseText);
      }
    } catch (error) {
      setResult(prev => prev + "\n\nError: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Simple Playdate Test</h1>
      
      <div className="mb-6">
        <Button 
          onClick={runTest} 
          disabled={isLoading}
          className="mb-4"
        >
          {isLoading ? "Running Test..." : "Create Test Playdate"}
        </Button>
        
        <div className="p-4 border rounded-md bg-slate-50">
          <h3 className="text-lg font-medium mb-2">Test Result:</h3>
          <pre className="whitespace-pre-wrap break-words bg-slate-100 p-3 rounded text-sm overflow-auto max-h-[400px]">
            {result}
          </pre>
        </div>
      </div>
    </div>
  );
}