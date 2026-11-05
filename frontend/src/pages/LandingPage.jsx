import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Cpu,
  Database,
  Search,
  MessageSquare,
  Zap,
  Github,
  ArrowRight,
  CheckCircle2,
  Layers,
  BrainCircuit,
  Lock,
  Upload
} from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    if (!user) {
      navigate('/login', { state: { message: 'Please log in to upload documents and start querying.' } });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      navigate('/app', { state: { initialFiles: Array.from(files) } });
    }
  };
  const features = [
    {
      title: "Multi-format Uploads",
      description: "Seamlessly upload PDFs, Word docs, and text files. We handle the extraction for you.",
      icon: <FileText className="w-6 h-6 text-indigo-600" />,
    },
    {
      title: "Intelligent Chunking",
      description: "Documents are split into semantic chunks, ensuring no context is lost during retrieval.",
      icon: <Layers className="w-6 h-6 text-indigo-600" />,
    },
    {
      title: "Vector Embeddings",
      description: "Powered by high-dimensional embeddings for precise semantic search and retrieval.",
      icon: <Database className="w-6 h-6 text-indigo-600" />,
    },
    {
      title: "Semantic Retrieval",
      description: "Find the exact section of your document that answers your question, not just keyword matches.",
      icon: <Search className="w-6 h-6 text-indigo-600" />,
    },
    {
      title: "Context-Aware AI",
      description: "LLM responses are grounded in your provided documents, minimizing hallucinations.",
      icon: <BrainCircuit className="w-6 h-6 text-indigo-600" />,
    },
    {
      title: "Persistent History",
      description: "Your conversations and uploaded documents are saved securely for future reference.",
      icon: <MessageSquare className="w-6 h-6 text-indigo-600" />,
    },
  ];

  const workflow = [
    { step: "01", label: "Upload", detail: "Add your documents" },
    { step: "02", label: "Extract", detail: "Text processing" },
    { step: "03", label: "Chunk", detail: "Semantic splitting" },
    { step: "04", label: "Embed", detail: "Vectorization" },
    { step: "05", label: "Retrieve", detail: "Context search" },
    { step: "06", label: "Generate", detail: "AI-powered answer" },
  ];

  const techStack = [
    { name: "FastAPI", category: "Backend" },
    { name: "PostgreSQL", category: "Database" },
    { name: "pgvector", category: "Vector Store" },
    { name: "React", category: "Frontend" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "Sentence Transformers", category: "Embeddings" },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-6 border border-indigo-100 shadow-2xs">
              <Zap className="w-4 h-4" />
              <span>Next-Gen RAG Experience</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
              Talk to your documents with <span className="text-indigo-600">DocuQuery AI</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Upload your professional documents and get instant, accurate answers powered by
              Retrieval-Augmented Generation. Stop scrolling and start querying.
            </p>
            <div className="flex flex-col items-center justify-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept=".pdf,.docx,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={handleUploadClick}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer text-base active:scale-[0.98]"
              >
                <Upload className="w-5 h-5" />
                <span>Upload Documents to Query</span>
              </button>
              <p className="text-xs text-slate-500">
                Supports PDF, DOCX, and TXT files {!user && "• Log in to get started"}
              </p>
            </div>
          </div>

          {/* Mockup Preview */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="theme-card relative overflow-hidden aspect-video flex flex-col rounded-3xl border border-slate-200">
              <div className="bg-slate-100/70 border-b border-slate-200 px-5 py-3.5 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400 shadow-2xs" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-2xs" />
                  <div className="w-3 h-3 rounded-full bg-green-400 shadow-2xs" />
                </div>
                <div className="mx-auto bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-1 text-xs text-slate-400 w-1/3 text-center font-mono">
                  app.docuquery.ai/chat
                </div>
              </div>
              <div className="p-6 flex-1 min-h-0 flex gap-6">
                <div className="w-1/4 theme-well p-4 hidden md:block rounded-2xl">
                  <div className="h-4 w-3/4 bg-slate-300/40 rounded-lg mb-4" />
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-3 w-full bg-slate-300/30 rounded-lg" />
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex justify-end">
                    <div className="chat-bubble-user p-3.5 max-w-xs text-sm">
                      What are the main takeaways from the Q3 report?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="chat-bubble-assistant p-4 max-w-md text-sm">
                      Based on the provided documents, the Q3 report highlights three key points: <br/>
                      1. Revenue grew by 15% YoY. <br/>
                      2. Operational costs decreased by 5%. <br/>
                      3. Expansion into APAC is ahead of schedule.
                    </div>
                  </div>
                  <div className="mt-auto w-full h-12 theme-well rounded-2xl px-4 flex items-center justify-between">
                    <div className="text-slate-400 text-sm">Ask a question...</div>
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xs">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative background elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none -z-10" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Engineered for Precision</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We combine state-of-the-art embedding models with a robust retrieval pipeline to ensure you get the right answer every time.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="theme-card p-8 rounded-3xl transition-all duration-200 group hover:scale-[1.02]">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 shadow-xs group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">The RAG Workflow</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Here is how DocuQuery AI transforms your static files into an interactive knowledge base.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {workflow.map((item, i) => (
              <div key={i} className="theme-card relative p-6 rounded-2xl text-center group transition-all duration-200 hover:scale-[1.03]">
                <div className="text-3xl font-black text-indigo-400/40 mb-2 group-hover:text-indigo-500/70 transition-colors">
                  {item.step}
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{item.label}</h4>
                <p className="text-xs text-slate-500">{item.detail}</p>
                {i < workflow.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Development Journey */}
      <section className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">Built with Purpose</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                DocuQuery AI evolved through a rigorous development process, focusing on data integrity
                and retrieval accuracy.
              </p>
              <div className="space-y-3.5">
                {[
                  "Document ingestion & processing",
                  "Secure authentication & DB schema",
                  "Persistent conversation state",
                  "Multi-document association",
                  "pgvector semantic retrieval",
                  "LLM-powered RAG synthesis",
                  "Professional UX/UI implementation"
                ].map((step, i) => (
                  <div key={i} className="theme-card flex items-center gap-3 p-3.5 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-slate-800 font-semibold text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-6">
               <div className="p-7 rounded-3xl bg-indigo-600 text-white shadow-xl flex flex-col justify-between">
                  <div className="text-4xl font-extrabold mb-2">100%</div>
                  <div className="text-indigo-100 text-sm font-semibold">Open Source Core</div>
               </div>
               <div className="p-7 rounded-3xl theme-card text-slate-900 flex flex-col justify-between">
                  <div className="text-4xl font-extrabold mb-2">384d</div>
                  <div className="text-slate-500 text-sm font-semibold">Vector Dimension</div>
               </div>
               <div className="p-7 rounded-3xl theme-card text-slate-900 flex flex-col justify-between">
                  <div className="text-4xl font-extrabold mb-2">Fast</div>
                  <div className="text-slate-500 text-sm font-semibold">Asynchronous API</div>
               </div>
               <div className="p-7 rounded-3xl theme-card text-slate-900 flex flex-col justify-between">
                  <div className="text-4xl font-extrabold mb-2">Secure</div>
                  <div className="text-slate-500 text-sm font-semibold">JWT Authentication</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-16 tracking-tight">The Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {techStack.map((tech, i) => (
              <div key={i} className="theme-card p-6 rounded-2xl transition-all group hover:scale-105">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tech.category}</div>
                <div className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{tech.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA & Source Code */}
      <section className="py-24 bg-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="theme-card p-12 rounded-3xl border border-indigo-200/50">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-6 tracking-tight">Ready to query your data?</h2>
            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
              Join the efficiency revolution. Experience how RAG can change the way you interact with information.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={user ? '/app' : '/login'}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                Start Chat <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://github.com/Prat-2005/docuquery-RAG-project"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 theme-card text-slate-800 font-bold rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Github className="w-5 h-5" />
                View Source Code
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-2xl mb-4">
                <FileText className="w-6 h-6" />
                <span>DocuQuery AI</span>
              </Link>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                An advanced RAG-based document questioning system designed for students,
                researchers, and professionals.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li><Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link></li>
                <li><a href="#features" className="hover:text-indigo-600 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a></li>
                <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
                <li><a href="https://github.com/Prat-2005/docuquery-RAG-project" className="hover:text-indigo-600 transition-colors">GitHub Repo</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs">
              © {new Date().getFullYear()} DocuQuery AI. Built with React, FastAPI, and PostgreSQL.
            </p>
            <div className="flex items-center gap-4">
              <Lock className="w-4 h-4 text-slate-300" />
              <span className="text-slate-400 text-xs">Secure & Private</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
