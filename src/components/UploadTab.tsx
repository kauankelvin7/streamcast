import { useState, useRef } from 'react';
import { IconUpload, IconVideo, IconX, IconPlayerPlay, IconFile } from '@tabler/icons-react';
import type { VideoSource } from '../types';

type UploadTabProps = {
  onUploadComplete: (video: VideoSource) => void; // adiciona ao armazenamento de uploads
  onAddToPlaylist: (video: VideoSource) => void; // adiciona à playlist
  uploads: VideoSource[];
  onRemoveUpload: (id: string) => void;
};

export default function UploadTab({ onUploadComplete, onAddToPlaylist, uploads, onRemoveUpload }: UploadTabProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é um arquivo de vídeo
    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecione um arquivo de vídeo válido!');
      return;
    }

    // Verificar tamanho (máximo 100MB para evitar problemas de memória)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert('Arquivo muito grande! Tamanho máximo: 100MB\n\nPara vídeos maiores, use um serviço de hospedagem de vídeos.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Criar URL temporária APENAS para extrair metadados
      const tempUrl = URL.createObjectURL(file);

      // Criar elemento de vídeo para extrair metadados
      const video = document.createElement('video');
      video.preload = 'metadata';

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          resolve();
        };
        video.onerror = () => {
          reject(new Error('Erro ao carregar metadados do vídeo'));
        };
        video.src = tempUrl;
      });

      // Gerar thumbnail
      video.currentTime = Math.min(5, video.duration / 2);
      await new Promise(resolve => {
        video.onseeked = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = (300 * video.videoHeight) / video.videoWidth;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

      // Liberar URL temporária
      URL.revokeObjectURL(tempUrl);

      // Converter arquivo para Base64 (para persistência)
      setUploadProgress(20);
      const reader = new FileReader();
      
      const videoBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result);
        };
        reader.onerror = () => {
          reject(new Error('Erro ao ler o arquivo'));
        };
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = 20 + Math.round((e.loaded / e.total) * 80);
            setUploadProgress(progress);
          }
        };
        reader.readAsDataURL(file);
      });

      setUploadProgress(100);

      // Criar objeto de vídeo com Base64
      const newVideo: VideoSource = {
        id: `upload-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extensão
        url: videoBase64, // Base64 Data URL
        type: 'upload',
        fileName: file.name,
        fileSize: file.size,
        duration: video.duration,
        thumbnail,
        addedAt: new Date().toISOString()
      };

      onUploadComplete(newVideo);
      
      // Resetar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao processar o vídeo. Tente novamente.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-slate-900/40 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center">
            <IconUpload className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Enviar Vídeos</h3>
            <p className="text-slate-400 text-xs">Adicione seus próprios arquivos de vídeo</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
          id="video-upload"
          disabled={uploading}
        />

        <label
          htmlFor="video-upload"
          className={`block border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
            uploading
              ? 'border-blue-500/50 bg-blue-500/5 cursor-not-allowed'
              : 'border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/30'
          }`}
        >
          <IconVideo className={`w-16 h-16 mx-auto mb-4 ${uploading ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
          
          {uploading ? (
            <div className="space-y-3">
              <p className="text-white font-semibold text-lg">Processando vídeo...</p>
              <div className="max-w-xs mx-auto">
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-slate-400 text-sm mt-2">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-white font-bold text-lg mb-2">Clique para selecionar um vídeo</p>
              <p className="text-slate-400 text-sm">Ou arraste e solte aqui</p>
              <p className="text-slate-500 text-xs mt-3">Formatos suportados: MP4, WebM, OGG, MOV</p>
            </>
          )}
        </label>

        <div className="mt-4 space-y-3">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-300 text-xs">
              ℹ️ <strong>Como funciona:</strong> Os vídeos são convertidos para Base64 e armazenados no navegador (localStorage).
              Isso permite que funcionem em qualquer lugar, incluindo embeds em outros sites!
            </p>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-yellow-300 text-xs">
              ⚠️ <strong>Limitações:</strong> Tamanho máximo de 100MB por vídeo. Para vídeos maiores ou melhor performance,
              recomendamos hospedar em um servidor ou usar serviços como YouTube, Vimeo, etc.
            </p>
          </div>
        </div>
      </div>

      {/* Uploads List */}
      <div className="bg-slate-900/40 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Vídeos Enviados</h3>
          <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-semibold rounded-lg">
            {uploads.length} {uploads.length === 1 ? 'Vídeo' : 'Vídeos'}
          </span>
        </div>

        {uploads.length === 0 ? (
          <div className="border-2 border-dashed border-purple-500/20 bg-slate-800/20 rounded-xl p-12 text-center">
            <IconFile className="w-16 h-16 text-purple-400/30 mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-2">Nenhum vídeo enviado</p>
            <p className="text-slate-400 text-sm">Faça upload de seus vídeos acima</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploads.map((video) => (
              <div
                key={video.id}
                className="group bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 rounded-xl p-4 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-20 h-14 object-cover rounded-lg border border-slate-600"
                    />
                  ) : (
                    <div className="w-20 h-14 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center">
                      <IconVideo className="w-6 h-6 text-slate-500" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate mb-1">{video.title}</p>
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded text-xs font-medium">
                        UPLOAD
                      </span>
                      {video.duration && (
                        <span className="text-cyan-400 font-mono">
                          ⏱️ {formatDuration(video.duration)}
                        </span>
                      )}
                      {video.fileSize && (
                        <span className="text-slate-500">
                          📦 {formatFileSize(video.fileSize)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // Cria uma cópia para adicionar à playlist
                        const playlistVideo = { ...video, id: `playlist-${Date.now()}` };
                        onAddToPlaylist(playlistVideo);
                      }}
                      className="p-2 bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20 rounded-lg transition-all duration-200"
                      title="Adicionar à Playlist"
                    >
                      <IconPlayerPlay className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onRemoveUpload(video.id)}
                      className="p-2 bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                      title="Remover"
                    >
                      <IconX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
