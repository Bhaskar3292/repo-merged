import React, { useEffect, useState } from 'react';
import { PermitHistory } from '../../types/permit';
import { permitApiService } from '../../services/permitApi';

interface FileItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  uploadedAt: string;
  source: 'main' | 'history';
}

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  permitId: number | null;
  permitName: string;
  mainDocumentUrl: string | null;
}

export function FileViewerModal({
  isOpen,
  onClose,
  permitId,
  permitName,
  mainDocumentUrl
}: FileViewerModalProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && permitId) {
      loadFiles();
    }
  }, [isOpen, permitId]);

  // Add ESC key support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (previewUrl) {
          setPreviewUrl(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, previewUrl]);

  const loadFiles = async () => {
    if (!permitId) return;

    setIsLoading(true);
    setError(null);

    try {
      const filesList: FileItem[] = [];
      const seenUrls = new Set<string>();

      // Add main document if exists
      if (mainDocumentUrl) {
        const fileName = mainDocumentUrl.split('/').pop() || 'permit-document';
        const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
        const normalizedUrl = mainDocumentUrl.toLowerCase();

        filesList.push({
          id: 'main-doc',
          name: fileName,
          url: mainDocumentUrl,
          type: fileExt,
          source: 'main',
          uploadedAt: new Date().toISOString()
        });
        seenUrls.add(normalizedUrl);
      }

      // Fetch history to get additional documents
      const history = await permitApiService.fetchPermitHistory(permitId);

      history.forEach((item, index) => {
        if (item.documentUrl) {
          const normalizedUrl = item.documentUrl.toLowerCase();

          // Skip if we've already added this URL (deduplication)
          if (seenUrls.has(normalizedUrl)) {
            console.log('[FileViewer] Skipping duplicate document:', item.documentUrl);
            return;
          }

          const fileName = item.documentUrl.split('/').pop() || `history-document-${index}`;
          const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

          filesList.push({
            id: `history-${item.id}`,
            name: fileName,
            url: item.documentUrl,
            type: fileExt,
            source: 'history',
            uploadedAt: item.createdAt
          });
          seenUrls.add(normalizedUrl);
        }
      });

      console.log('[FileViewer] Loaded files (after deduplication):', filesList.length);
      setFiles(filesList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
      console.error('[FileViewer] Error loading files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (type: string): string => {
    const iconMap: { [key: string]: string } = {
      pdf: 'fa-file-pdf text-red-600',
      doc: 'fa-file-word text-blue-600',
      docx: 'fa-file-word text-blue-600',
      jpg: 'fa-file-image text-purple-600',
      jpeg: 'fa-file-image text-purple-600',
      png: 'fa-file-image text-purple-600',
      gif: 'fa-file-image text-purple-600',
      xlsx: 'fa-file-excel text-green-600',
      xls: 'fa-file-excel text-green-600'
    };

    return iconMap[type] || 'fa-file text-gray-600';
  };

  const canPreview = (type: string): boolean => {
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(type);
  };

  const handleView = (file: FileItem) => {
    console.log('[FileViewer] Opening file:', file.name);
    console.log('[FileViewer] File URL:', file.url);
    console.log('[FileViewer] File type:', file.type);
    console.log('[FileViewer] Can preview:', canPreview(file.type));

    if (canPreview(file.type)) {
      // For PDFs, ensure URL is complete and add toolbar parameter
      let viewUrl = file.url;
      if (file.type === 'pdf' && !viewUrl.includes('#toolbar')) {
        viewUrl = viewUrl + '#toolbar=1&navpanes=1&scrollbar=1';
      }
      setPreviewUrl(viewUrl);
      console.log('[FileViewer] Preview URL set to:', viewUrl);
    } else {
      console.log('[FileViewer] File type not previewable, downloading instead');
      handleDownload(file);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      console.log('[FileViewer] Starting download:', file.name);

      // Fetch the file as a blob to ensure proper binary handling
      const response = await fetch(file.url);

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('[FileViewer] Downloaded blob size:', blob.size, 'bytes');
      console.log('[FileViewer] Downloaded blob type:', blob.type);

      // Create a blob URL for download
      const blobUrl = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      console.log('[FileViewer] Download completed:', file.name);
    } catch (err) {
      console.error('[FileViewer] Download failed:', err);
      alert(`Failed to download ${file.name}. Please try again or contact support.`);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (previewUrl) {
        setPreviewUrl(null);
      } else {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  // Preview mode
  if (previewUrl) {
    // Extract file type from URL (before query params)
    const urlWithoutParams = previewUrl.split('#')[0].split('?')[0];
    const fileType = urlWithoutParams.split('.').pop()?.toLowerCase() || '';
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileType);

    console.log('[FileViewer] Preview mode - URL:', previewUrl);
    console.log('[FileViewer] Preview mode - File type:', fileType);
    console.log('[FileViewer] Preview mode - Is image:', isImage);

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={() => setPreviewUrl(null)}
          className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-3 transition-colors z-10"
          aria-label="Close preview"
          title="Close (ESC)"
        >
          <span className="text-2xl">×</span>
        </button>

        <div className="max-w-6xl max-h-screen w-full h-full p-8">
          {isImage ? (
            <img
              src={previewUrl}
              alt="Document preview"
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('[FileViewer] Image failed to load:', previewUrl);
                alert('Failed to load image. The file may not be accessible.');
              }}
            />
          ) : (
            <iframe
              src={previewUrl}
              className="w-full h-full bg-white rounded-lg"
              title="Document preview"
              onError={(e) => {
                console.error('[FileViewer] PDF failed to load:', previewUrl);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // File list mode
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="file-modal-title" className="text-xl font-bold text-gray-800">
                Permit Documents
              </h2>
              <p className="text-sm text-gray-600 mt-1">{permitName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all p-2 rounded-full w-10 h-10 flex items-center justify-center font-bold text-2xl leading-none"
              aria-label="Close modal"
              title="Close (ESC)"
            >
              <span className="block" style={{ lineHeight: '1' }}>×</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-3xl text-gray-400 mb-3"></i>
              <p className="text-gray-500">Loading files...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <i className="fas fa-exclamation-circle text-3xl text-red-400 mb-3"></i>
              <p className="text-red-600">{error}</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-folder-open text-3xl text-gray-300 mb-3"></i>
              <p className="text-gray-500">No documents available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <i className={`fas ${getFileIcon(file.type)} text-3xl`}></i>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">
                        {file.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="uppercase">{file.type}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploadedAt)}</span>
                        {file.source === 'main' && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">Primary Document</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {canPreview(file.type) && (
                        <button
                          onClick={() => handleView(file)}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                          title="Preview file"
                        >
                          <i className="fas fa-eye mr-2"></i>
                          View
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(file)}
                        className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
                        title="Download file"
                      >
                        <i className="fas fa-download mr-2"></i>
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
