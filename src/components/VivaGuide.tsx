import React, { useState } from 'react';
import { BookOpen, Code2, Terminal, HelpCircle, CheckCircle, Copy, Check, Calculator, Sparkles, FolderTree } from 'lucide-react';

export const VivaGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'commands' | 'structure' | 'haversine' | 'code' | 'questions'>('commands');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const vivaQuestions = [
    {
      q: 'Why did you choose Node.js and Express for the backend of Lifeline?',
      a: 'Node.js offers an asynchronous, event-driven, non-blocking I/O model based on Google Chrome\'s V8 engine, which is ideal for real-time dispatch systems handling simultaneous emergency calls. Express.js is a lightweight, minimalist web framework that simplifies RESTful API routing, middleware execution, and JSON payload handling without unnecessary overhead.'
    },
    {
      q: 'What is CORS and why is it necessary in this project?',
      a: 'CORS stands for Cross-Origin Resource Sharing. By default, web browsers enforce the Same-Origin Policy (SOP) to prevent a web application at domain A (e.g., frontend running on port 3000) from requesting resources from domain B (e.g., backend server on port 5000). The cors middleware attaches appropriate HTTP headers (Access-Control-Allow-Origin: *) to allow secure frontend-backend communication.'
    },
    {
      q: 'Explain the Haversine Formula and why you didn\'t simply use Euclidean Distance (Pythagorean Theorem)?',
      a: 'The Earth is an oblate spheroid, not a flat plane. Euclidean distance (√(Δx² + Δy²)) assumes flat geometry and causes massive inaccuracies over geographical coordinates because lines of longitude converge toward the poles. The Haversine formula calculates the great-circle distance between two latitude/longitude pairs on a spherical surface with Earth radius R = 6371 km, providing accurate real-world distances.'
    },
    {
      q: 'What is the role of Middleware in Express.js?',
      a: 'Middleware functions have access to the request object (req), response object (res), and the next middleware function in the cycle. In our server.js, we use: 1) cors() to handle cross-origin access, 2) express.json() to parse incoming JSON request bodies, and 3) custom logging middleware to record timestamps and incoming routes for auditability.'
    },
    {
      q: 'How does the dispatch algorithm decide which ambulance to send?',
      a: 'The algorithm in ambulanceController.js executes 4 steps: 1) Filters the fleet for ambulances with status === "available", 2) Optionally filters by emergency medical equipment (ALS for cardiac/trauma), 3) Computes the spherical Haversine distance from each available unit to the patient\'s GPS coordinates, and 4) Sorts distances in ascending order to pick the minimum distance unit with the fastest ETA.'
    },
    {
      q: 'What is the significance of package.json and node_modules?',
      a: 'package.json is the project manifest file containing project metadata (name, version, author), execution scripts (npm start, npm run dev), and a list of dependencies and devDependencies with semantic versioning. node_modules is the directory where npm downloads and stores the actual compiled code for those dependencies.'
    },
    {
      q: 'What is nodemon and why is it installed as a devDependency?',
      a: 'nodemon is a developer utility tool that monitors source code changes in the project directory and automatically restarts the Node.js server. It is saved under devDependencies (--save-dev) because it is only needed during development; in production, process managers like PM2 or Docker are preferred.'
    },
    {
      q: 'What HTTP methods and status codes did you implement?',
      a: 'We implemented: GET for fetching ambulances (200 OK, 404 Not Found), POST for triggering the dispatch calculation (200 OK, 400 Bad Request if coordinates missing), and PATCH for partially updating ambulance status (available/busy). 500 is reserved for internal server exceptions.'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-[#0D253F] to-[#1E3A8A] text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h3 className="font-extrabold text-base md:text-lg tracking-tight">
              TE-IT Project Viva & Technical Defense Guide
            </h3>
          </div>
          <p className="text-xs text-sky-200 mt-1">
            Prepared for Yadav Nitesh Horilal • Shree L. R. Tiwari College of Engineering, Mira Road
          </p>
        </div>

        <div className="text-right text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
          <span className="font-semibold block">Class: TE-IT (Div C)</span>
          <span className="text-sky-300">Roll No: 66 • Academic Year 2024-25</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSection('commands')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            activeSection === 'commands' ? 'bg-white text-blue-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>1. Terminal Commands</span>
        </button>

        <button
          onClick={() => setActiveSection('structure')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            activeSection === 'structure' ? 'bg-white text-blue-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>2. Folder Structure</span>
        </button>

        <button
          onClick={() => setActiveSection('haversine')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            activeSection === 'haversine' ? 'bg-white text-blue-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>3. Haversine Math</span>
        </button>

        <button
          onClick={() => setActiveSection('code')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            activeSection === 'code' ? 'bg-white text-blue-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>4. Code Walkthrough</span>
        </button>

        <button
          onClick={() => setActiveSection('questions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            activeSection === 'questions' ? 'bg-white text-blue-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>5. Viva Q&A Bank (8 Questions)</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* SECTION 1: TERMINAL COMMANDS */}
        {activeSection === 'commands' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600" />
                Step-by-Step Terminal Commands to Build from Scratch
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Run these commands in your terminal or Command Prompt to initialize and run the Lifeline backend:
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs relative">
                <button
                  onClick={() => handleCopy(`mkdir lifeline-backend\ncd lifeline-backend\nnpm init -y`, 1)}
                  className="absolute top-3 right-3 p-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300 flex items-center gap-1"
                >
                  {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
                <p className="text-slate-400 font-sans text-[11px] mb-2 font-bold"># Step 1: Create project directory and initialize package.json</p>
                <p className="text-emerald-400">mkdir lifeline-backend</p>
                <p className="text-emerald-400">cd lifeline-backend</p>
                <p className="text-emerald-400">npm init -y</p>
              </div>

              <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs relative">
                <button
                  onClick={() => handleCopy(`npm install express cors dotenv\nnpm install -D nodemon`, 2)}
                  className="absolute top-3 right-3 p-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300 flex items-center gap-1"
                >
                  {copiedIndex === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
                <p className="text-slate-400 font-sans text-[11px] mb-2 font-bold"># Step 2: Install required production & development packages</p>
                <p className="text-emerald-400">npm install express cors dotenv</p>
                <p className="text-amber-400 mt-2"># Install nodemon as a developer dependency (for auto-restart on file save):</p>
                <p className="text-emerald-400">npm install -D nodemon</p>
              </div>

              <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs relative">
                <button
                  onClick={() => handleCopy(`npm run dev\n# or\nnode server.js`, 3)}
                  className="absolute top-3 right-3 p-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300 flex items-center gap-1"
                >
                  {copiedIndex === 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
                <p className="text-slate-400 font-sans text-[11px] mb-2 font-bold"># Step 3: Run the server</p>
                <p className="text-emerald-400">node server.js</p>
                <p className="text-slate-400 mt-2">
                  # Or with nodemon (configured in package.json scripts with dev: &quot;nodemon server.js&quot;):
                </p>
                <p className="text-sky-300">npm run dev</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Examiner Viva Tip:
              </p>
              <p>
                If asked: <em>"Why do you use -D for nodemon?"</em> Answer: The <code>-D</code> (or <code>--save-dev</code>) flag saves it under <code>devDependencies</code> in <code>package.json</code>. Nodemon is only an auxiliary tool for developers to restart the server during code editing, so we keep production build packages minimal.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 2: FOLDER STRUCTURE */}
        {activeSection === 'structure' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-blue-600" />
                Recommended Enterprise MVC Folder Structure
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Adheres strictly to separation of concerns so your code is scalable and professional for academic evaluation.
              </p>
            </div>

            <div className="bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-xs leading-relaxed">
              <pre>{`lifeline-dispatch-system/
├── controllers/
│   └── ambulanceController.js   # Contains business logic, Haversine dispatch, & status updates
├── data/
│   ├── ambulances.json          # Mock database of 6 ambulances stationed around Mira Road
│   └── hospitals.json           # Mira Road hospitals (Bhaktivedanta, Wockhardt, Thunga, etc.)
├── routes/
│   └── ambulanceRoutes.js       # Express Router mapping HTTP verbs to controller methods
├── utils/
│   └── haversine.js             # Mathematical calculation of spherical distance & ETA
├── public/                      # Static client assets (logos, images, favicon)
│   └── logo.png
├── .env                         # Environment variables (PORT=5000)
├── .env.example                 # Example configuration template without secrets
├── package.json                 # Project dependencies & npm run scripts
└── server.js                    # Main server entry point (Express, CORS, middleware, routes)`}</pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <h5 className="font-bold text-slate-800 mb-1 text-sm">controllers/</h5>
                <p className="text-slate-600 leading-normal">
                  Houses all algorithmic logic. When a POST request comes to <code>/api/ambulances/dispatch</code>, the controller calculates coordinates, evaluates ambulance availability, and chooses the optimal unit.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <h5 className="font-bold text-slate-800 mb-1 text-sm">routes/</h5>
                <p className="text-slate-600 leading-normal">
                  Keeps the API modular. Instead of cluttering <code>server.js</code> with dozens of route declarations, we use <code>express.Router()</code> to mount clean endpoint groups.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: HAVERSINE MATH */}
        {activeSection === 'haversine' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                The Haversine Great-Circle Distance Equation
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                How Lifeline calculates exact geographical distances across the Earth's curved surface:
              </p>
            </div>

            <div className="bg-slate-900 text-slate-200 rounded-xl p-5 text-center font-mono space-y-3">
              <div className="text-emerald-400 text-sm md:text-base font-bold">
                a = sin²(Δφ / 2) + cos(φ₁) · cos(φ₂) · sin²(Δλ / 2)
              </div>
              <div className="text-sky-300 text-sm md:text-base font-bold">
                c = 2 · atan2( √a, √(1 − a) )
              </div>
              <div className="text-amber-400 text-base md:text-lg font-bold">
                d = R · c
              </div>
              <div className="text-[11px] text-slate-400 mt-2 font-sans">
                Where <strong>R = 6371 km</strong> (Mean Earth Radius), <strong>φ</strong> is Latitude in Radians, and <strong>λ</strong> is Longitude in Radians.
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
              <h5 className="font-bold text-slate-800">How to explain this to the viva examiner:</h5>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-700">
                <li>
                  <strong>Why not Pythagorean theorem?</strong> Flat plane distance (Euclidean) fails because the lines of longitude meet at the poles and distance per degree of longitude changes based on latitude.
                </li>
                <li>
                  <strong>Degree to Radian Conversion:</strong> JavaScript's <code>Math.sin</code> and <code>Math.cos</code> functions require radian inputs. We multiply degrees by <code>(π / 180)</code>.
                </li>
                <li>
                  <strong>Accuracy:</strong> For urban dispatch across Mira Road (which spans approx 5 km), Haversine provides &gt;99.5% accuracy compared to expensive GIS API queries.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* SECTION 4: CODE WALKTHROUGH */}
        {activeSection === 'code' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                Line-by-Line Viva Defense of server.js
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Memorize these core concepts for explaining the code to the professor:
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <code className="font-mono font-bold text-blue-800">const express = require('express');</code>
                <p className="text-slate-600 mt-1">
                  Imports the Express module using CommonJS (<code>require</code>). CommonJS is the standard module system in Node.js.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <code className="font-mono font-bold text-blue-800">app.use(cors());</code>
                <p className="text-slate-600 mt-1">
                  Enables Cross-Origin Resource Sharing. Allows frontend apps running on different domains/ports (like port 3000) to communicate with this Express backend without browser security blocks.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <code className="font-mono font-bold text-blue-800">app.use(express.json());</code>
                <p className="text-slate-600 mt-1">
                  Built-in Express body-parser middleware. It intercepts incoming HTTP requests with <code>Content-Type: application/json</code> and parses the raw JSON string into a ready-to-use JavaScript object in <code>req.body</code>.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <code className="font-mono font-bold text-blue-800">app.use('/api/ambulances', ambulanceRoutes);</code>
                <p className="text-slate-600 mt-1">
                  Mounts the ambulance router as middleware at the prefix <code>/api/ambulances</code>. This means any route defined inside <code>ambulanceRoutes.js</code> as <code>/dispatch</code> is accessed externally as <code>/api/ambulances/dispatch</code>.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <code className="font-mono font-bold text-blue-800">app.listen(PORT, callback);</code>
                <p className="text-slate-600 mt-1">
                  Binds and listens for incoming connections on the specified network port (e.g. 5000). The callback function fires as soon as the server is ready to accept connections.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: VIVA QUESTIONS */}
        {activeSection === 'questions' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Frequently Asked Viva Questions & Answers
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Click any question to view the model answer to deliver in front of the project examiner:
              </p>
            </div>

            <div className="space-y-3">
              {vivaQuestions.map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-white transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      Q{idx + 1}
                    </span>
                    <div className="space-y-2 flex-1">
                      <h5 className="font-bold text-slate-900 text-xs md:text-sm">
                        {item.q}
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200/80 p-3 rounded-lg">
                        <strong className="text-blue-900">Model Answer: </strong>
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
