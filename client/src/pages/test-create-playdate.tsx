import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestCreatePage() {
  const [result, setResult] = useState<string>("No test run yet");
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    setResult("Running test...");

    const testPlaydate = {
      title: "Test Playdate " + new Date().toLocaleTimeString(),
      description: "This is a test playdate",
      location: "Amsterdam",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      maxParticipants: 5
    };

    try {
      // Test with XMLHttpRequest
      setResult(prev => prev + "\n\nTrying XMLHttpRequest...");
      
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/playdates", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.withCredentials = true;
      
      const xhrPromise = new Promise<string>((resolve, reject) => {
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(`XHR Success: ${xhr.status} - ${xhr.responseText}`);
            } else {
              reject(`XHR Failed: ${xhr.status} - ${xhr.responseText}`);
            }
          }
        };
        
        xhr.onerror = (e) => {
          reject(`XHR Error event: ${e}`);
        };
      });
      
      xhr.send(JSON.stringify(testPlaydate));
      
      try {
        const xhrResult = await xhrPromise;
        setResult(prev => prev + "\n" + xhrResult);
      } catch (xhrError) {
        setResult(prev => prev + "\n" + xhrError);
        
        // If XHR fails, try fetch
        setResult(prev => prev + "\n\nTrying fetch method...");
        
        try {
          const response = await fetch('/api/playdates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(testPlaydate),
          });
          
          const responseText = await response.text();
          
          if (response.ok) {
            setResult(prev => prev + `\nFetch Success: ${response.status} - ${responseText}`);
          } else {
            setResult(prev => prev + `\nFetch Failed: ${response.status} - ${responseText}`);
          }
        } catch (fetchError) {
          if (fetchError instanceof Error) {
            setResult(prev => prev + `\nFetch Error: ${fetchError.message}`);
          } else {
            setResult(prev => prev + `\nUnknown fetch error: ${String(fetchError)}`);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setResult(prev => prev + `\nTest Error: ${error.message}`);
      } else {
        setResult(prev => prev + `\nUnknown test error: ${String(error)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Create Playdate</h1>
      
      <div className="mb-6">
        <Button 
          onClick={runTest} 
          disabled={isLoading}
          className="mb-4"
        >
          {isLoading ? "Running Test..." : "Run Test: Create Playdate"}
        </Button>
        
        <div className="p-4 border rounded-md bg-slate-50">
          <h3 className="text-lg font-medium mb-2">Test Result:</h3>
          <pre className="whitespace-pre-wrap break-words bg-slate-100 p-3 rounded text-sm overflow-auto max-h-[400px]">
            {result}
          </pre>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">What this test does:</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Creates a test playdate with the current time</li>
          <li>Tries to send it to the server using XMLHttpRequest</li>
          <li>If that fails, tries again using the fetch API</li>
          <li>Displays detailed results with status codes and response text</li>
        </ul>
      </div>
    </div>
  );
}