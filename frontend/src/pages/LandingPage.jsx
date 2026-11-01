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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6 border border-indigo-100">
              <Zap className="w-4 h-4" />
              <span>Next-Gen RAG Experience</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Talk to your documents with <span className="text-indigo-600">DocuQuery</span>
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
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 cursor-pointer text-base hover:shadow-indigo-300"
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
            <div className="relative rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden aspect-video">
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto bg-white border border-slate-200 rounded-md px-3 py-1 text-xs text-slate-400 w-1/3 text-center">
                  app.docuquery.ai/chat
                </div>
              </div>
              <div className="p-6 flex h-full gap-6">
                <div className="w-1/4 bg-slate-50 rounded-lg border border-slate-200 p-4 hidden md:block">
                  <div className="h-4 w-3/4 bg-slate-200 rounded mb-4" />
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-3 w-full bg-slate-200 rounded" />
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none max-w-xs text-sm shadow-sm">
                      What are the main takeaways from the Q3 report?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-800 p-3 rounded-2xl rounded-tl-none max-w-md text-sm border border-slate-200 shadow-sm">
                      Based on the provided documents, the Q3 report highlights three key points: <br/>
                      1. Revenue grew by 15% YoY. <br/>
                      2. Operational costs decreased by 5%. <br/>
                      3. Expansion into APAC is ahead of schedule.
                    </div>
                  </div>
                  <div className="mt-auto w-full h-12 bg-white border border-slate-300 rounded-full px-4 flex items-center justify-between shadow-inner">
                    <div className="text-slate-400 text-sm">Ask a question...</div>
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative background elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50 -z-10" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Engineered for Precision</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We combine state-of-the-art embedding models with a robust retrieval pipeline to ensure you get the right answer every time.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">The RAG Workflow</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Here is how DocuQuery transforms your static files into an interactive knowledge base.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {workflow.map((item, i) => (
              <div key={i} className="relative p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center group hover:border-indigo-300 transition-colors">
                <div className="text-3xl font-black text-slate-200 mb-2 group-hover:text-indigo-100 transition-colors">
                  {item.step}
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{item.label}</h4>
                <p className="text-xs text-slate-500">{item.detail}</p>
                {i < workflow.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Development Journey */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Built with Purpose</h2>
              <p className="text-lg text-slate-600 mb-8">
                DocuQuery evolved through a rigorous development process, focusing on data integrity
                and retrieval accuracy.
              </p>
              <div className="space-y-4">
                {[
                  "Document ingestion & processing",
                  "Secure authentication & DB schema",
                  "Persistent conversation state",
                  "Multi-document association",
                  "pgvector semantic retrieval",
                  "LLM-powered RAG synthesis",
                  "Professional UX/UI implementation"
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700 font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-6">
               <div className="p-6 rounded-2xl bg-indigo-600 text-white shadow-xl">
                  <div className="text-4xl font-bold mb-2">100%</div>
                  <div className="text-indigo-100 text-sm">Open Source Core</div>
               </div>
               <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-xl">
                  <div className="text-4xl font-bold mb-2">384d</div>
                  <div className="text-slate-400 text-sm">Vector Dimension</div>
               </div>
               <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-4xl font-bold mb-2 text-slate-900">Fast</div>
                  <div className="text-slate-500 text-sm">Asynchronous API</div>
               </div>
               <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-4xl font-bold mb-2 text-slate-900">Secure</div>
                  <div className="text-slate-500 text-sm">JWT Authentication</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">The Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {techStack.map((tech, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-800 border border-slate-700 hover:border-indigo-500 transition-all group">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{tech.category}</div>
                <div className="text-lg font-semibold group-hover:text-indigo-400 transition-colors">{tech.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA & Source Code */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-12 rounded-3xl bg-indigo-50 border border-indigo-100">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Ready to query your data?</h2>
            <p className="text-lg text-slate-600 mb-10">
              Join the efficiency revolution. Experience how RAG can change the way you interact with information.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                Create Free Account <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://github.com/Prat-2005/docuquery-RAG-project"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
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
                <span>DocuQuery</span>
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
              © {new Date().getFullYear()} DocuQuery. Built with React, FastAPI, and PostgreSQL.
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
