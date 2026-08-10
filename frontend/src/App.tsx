import { useState, useRef, useEffect } from 'react';
import './App.css';

type Status = 'Idle' | 'Thinking' | 'Working' | 'Error';

interface LogEntry {
  time: string;
  message: string;
}

function App() {
  const [status, setStatus] = useState<Status>('Idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputTask, setInputTask] = useState('');
  const [response, setResponse] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { time, message }]);
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTask.trim() || status === 'Thinking' || status === 'Working') return;

    const task = inputTask;
    setInputTask('');
    setResponse('');
    
    addLog(`User created a task: "${task}"`);
    setStatus('Thinking');
    addLog(`Agent is thinking...`);

    try {
      // Simulate thinking delay so user can see animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatus('Working');
      addLog(`Agent is working...`);

      const res = await fetch('http://127.0.0.1:8000/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });

      if (!res.ok) throw new Error('Failed to connect to backend');
      
      const data = await res.json();
      setResponse(data.response);
      addLog(`Agent completed the task.`);
      setStatus('Idle');
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
      setStatus('Error');
      setResponse('An error occurred while connecting to the backend or Ollama.');
      // Reset to idle after a few seconds
      setTimeout(() => setStatus('Idle'), 4000);
    }
  };

  const getStatusColor = () => {
    switch(status) {
      case 'Idle': return 'text-green-500';
      case 'Thinking': return 'text-yellow-400';
      case 'Working': return 'text-blue-500';
      case 'Error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getCharacterAnimClass = () => {
    switch(status) {
      case 'Idle': return 'anim-idle';
      case 'Thinking': return 'anim-thinking';
      case 'Working': return 'anim-working';
      case 'Error': return 'anim-error';
      default: return 'anim-idle';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200">
      {/* Top Bar Status */}
      <header className="p-4 bg-gray-800 flex justify-between items-center shadow-md z-10">
        <h1 className="text-xl font-bold">2D AI Workspace</h1>
        <div className="flex items-center space-x-2 font-semibold">
          <span className="text-gray-400">Agent Status:</span>
          <span className={`flex items-center space-x-2 ${getStatusColor()}`}>
            <span>
              {status === 'Idle' && '🟢'}
              {status === 'Thinking' && '🟡'}
              {status === 'Working' && '🔵'}
              {status === 'Error' && '🔴'}
            </span>
            <span>{status}</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left: 2D Workspace */}
        <div className="flex-1 p-6 flex flex-col">
          <h2 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Workspace View</h2>
          <div className="workspace-bg flex-1 rounded-xl relative shadow-2xl overflow-hidden border border-gray-700">
            {/* The 2D World */}
            <div className="desk shadow-lg"></div>
            <div className="computer"></div>
            <div className={`character ${getCharacterAnimClass()}`}>
              🤖
            </div>
            {/* Thinking / Working Bubble */}
            {status !== 'Idle' && status !== 'Error' && (
              <div className="absolute bottom-[40%] left-[30%] bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                {status === 'Thinking' ? '🤔 Hmm...' : '💻 Typing...'}
              </div>
            )}
          </div>
        </div>

        {/* Right: Task Panel */}
        <div className="w-1/3 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-bold">Task Control</h2>
          </div>
          
          <div className="p-4 flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Response Area */}
            <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto border border-gray-700 shadow-inner">
              <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Agent Output</h3>
              {response ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{response}</div>
              ) : (
                <div className="text-gray-600 text-sm italic">Submit a task to see the agent's output here...</div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mt-2">
              <textarea
                className="w-full bg-gray-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner"
                rows={3}
                placeholder="Type a task here... e.g. 'Create a landing page for a coffee shop.'"
                value={inputTask}
                onChange={(e) => setInputTask(e.target.value)}
                disabled={status === 'Thinking' || status === 'Working'}
              ></textarea>
              <button
                type="submit"
                disabled={!inputTask.trim() || status === 'Thinking' || status === 'Working'}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors shadow-md"
              >
                {status === 'Thinking' || status === 'Working' ? 'Agent is busy...' : 'Submit Task'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom: Activity Log */}
      <div className="h-48 bg-black border-t border-gray-800 p-4 font-mono text-sm overflow-hidden flex flex-col">
        <h3 className="text-gray-500 mb-2 uppercase text-xs tracking-wider font-bold">Activity Log</h3>
        <div className="flex-1 overflow-y-auto pr-2">
          {logs.map((log, idx) => (
            <div key={idx} className="mb-1 text-gray-300">
              <span className="text-green-500">[{log.time}]</span> {log.message}
            </div>
          ))}
          {logs.length === 0 && <div className="text-gray-600">No activity yet.</div>}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}

export default App;
