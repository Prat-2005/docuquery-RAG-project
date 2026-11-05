import React, { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (filename = '', fileType = '') => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf' || fileType.includes('pdf')) {
    return <FileText className="h-5 w-5 text-rose-500 shrink-0" />;
  }
  if (ext === 'docx' || ext === 'doc' || fileType.includes('word')) {
    return <FileText className="h-5 w-5 text-blue-500 shrink-0" />;
  }
  if (ext === 'txt') {
    return <FileCode className="h-5 w-5 text-emerald-500 shrink-0" />;
  }
  return <FileSpreadsheet className="h-5 w-5 text-indigo-500 shrink-0" />;
};

const DocumentWorkspace = ({
  conversationId,
  documents = [],
  summary = '',
  isLoadingSummary = false,
  isUploading = false,
  uploadError = '',
  onUpload,
  uploadProgress = 0,
  selectedDocumentId = null,
  onSelectDocument,
  onDeleteDocument,
  onRefreshSummary,
  onClose,
}) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      onUpload(files);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this document?')) return;
    setDeletingId(docId);
    try {
      await onDeleteDocument(docId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <aside className="flex h-full w-80 lg:w-96 flex-col border-l border-slate-200/80 bg-white transition-colors duration-200">
      {/* Workspace Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
            <FileText className="h-4 w-4" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Documents</h2>
          <span className="rounded-full bg-indigo-100/70 px-2 py-0.5 text-xs font-bold text-indigo-700">
            {documents.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onRefreshSummary && (
            <button
              type="button"
              onClick={onRefreshSummary}
              disabled={isLoadingSummary}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 transition"
              title="Refresh summary"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingSummary ? 'animate-spin' : ''}`} />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden transition"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-4 space-y-5">
        {/* Upload Dropzone */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".pdf,.docx,.txt"
            className="hidden"
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group theme-well flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
              isDragOver
                ? 'border-indigo-500 scale-[1.01]'
                : 'border-slate-300/80 hover:border-indigo-400'
            }`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200/80 text-indigo-600 transition-transform group-hover:scale-110">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </div>
            <p className="mt-3 text-xs font-bold text-slate-800">
              {isUploading ? 'Uploading & indexing...' : 'Upload documents'}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Drag & drop or click to browse (PDF, DOCX, TXT)
            </p>
            {isUploading && (
              <div className="mt-3.5 w-full">
                <div className="mb-1.5 flex justify-between text-[10px] font-bold text-indigo-600">
                  <span>Processing text & vectors...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Attached Documents List */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Attached Files
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="theme-well rounded-2xl p-6 text-center text-xs text-slate-400">
              No documents in this conversation yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument?.(doc.id)}
                  className={`group relative flex cursor-pointer items-center justify-between gap-3 rounded-xl p-3.5 transition-all duration-150 ${
                    selectedDocumentId === doc.id
                      ? 'theme-item-active'
                      : 'theme-item hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-100/80">
                      {getFileIcon(doc.filename, doc.file_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900" title={doc.filename}>
                        {doc.filename}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                        {doc.file_size ? <span>{formatFileSize(doc.file_size)}</span> : null}
                        <span>•</span>
                        {doc.status === 'processed' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> Ready
                          </span>
                        ) : doc.status === 'processing' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                            <Loader2 className="h-3 w-3 animate-spin" /> Processing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                            <AlertCircle className="h-3 w-3" /> Failed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {onDeleteDocument && (
                    <button
                      type="button"
                      disabled={deletingId === doc.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 opacity-60 transition hover:bg-red-50 hover:text-red-600 hover:opacity-100 disabled:opacity-30"
                      title="Remove document"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Summary Section */}
        <div className="pt-2 border-t border-slate-100">
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Context Summary
            </span>
          </div>

          <div className="theme-well p-4 rounded-2xl">
            {isLoadingSummary ? (
              <div className="flex items-center gap-2 py-2 text-xs text-indigo-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating workspace summary...</span>
              </div>
            ) : summary ? (
              <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-normal">
                {summary}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Upload documents to automatically generate a workspace summary.
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DocumentWorkspace;
