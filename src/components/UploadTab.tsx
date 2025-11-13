import { useState, useRef } from 'react';
import { IconUpload, IconVideo, IconX, IconPlayerPlay, IconFile, IconDatabase } from '@tabler/icons-react';
import type { VideoSource } from '../types';
import { saveVideoBlob, hasEnoughSpace, getStorageUsage } from '../utils/indexedDB';

type UploadTabProps = {
  onUploadComplete: (video: VideoSource) => void; // adiciona ao armazenamento de uploads
  onAddToPlaylist: (video: VideoSource) => void; // adiciona à playlist
  uploads: VideoSource[];
  onRemoveUpload: (id: string) => void;
};

export default function UploadTab({ onUploadComplete, onAddToPlaylist, uploads, onRemoveUpload }: UploadTabProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atualiza info de armazenamento ao montar
  useState(() => {
    getStorageUsage().then(setStorageInfo);
  });

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

    // Verificar espaço disponível
    const hasSpace = await hasEnoughSpace(file.size);
    if (!hasSpace) {
      const { used, total } = await getStorageUsage();
      const usedGB = (used / 1024 / 1024 / 1024).toFixed(2);
      const totalGB = (total / 1024 / 1024 / 1024).toFixed(2);
      alert(`❌ Espaço insuficiente!\n\nUsado: ${usedGB} GB / ${totalGB} GB\n\nLibere espaço removendo vídeos antigos.`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('Verificando arquivo...');

    try {
      const videoId = `upload-${Date.now()}`;
      
      // Criar URL temporária APENAS para extrair metadados
      setUploadStatus('Lendo metadados do vídeo...');
      const tempUrl = URL.createObjectURL(file);
      setUploadProgress(10);

      // Criar elemento de vídeo para extrair metadados
      const video = document.createElement('video');
      video.preload = 'metadata';

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Erro ao carregar metadados do vídeo'));
        video.src = tempUrl;
      });

      setUploadProgress(30);
      setUploadStatus('Gerando thumbnail...');

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

      setUploadProgress(40);
      setUploadStatus(`Salvando ${(file.size / 1024 / 1024).toFixed(1)} MB no armazenamento...`);

      // Salvar arquivo no IndexedDB (suporta GB!)
      // Progress: 40% -> 95%
      const saved = await saveVideoBlob(videoId, file, (progress) => {
        // Mapeia 0-100 do IndexedDB para 40-95 da UI
        const uiProgress = 40 + (progress * 0.55);
        setUploadProgress(Math.round(uiProgress));
        
        if (progress > 0) {
          setUploadStatus(`Salvando no IndexedDB... ${progress}%`);
        }
      });
      
      if (!saved) {
        throw new Error('Falha ao salvar vídeo no armazenamento');
      }

      setUploadProgress(100);
      setUploadStatus('Concluído!');

      // Criar objeto de vídeo (URL será gerada ao reproduzir)
      const newVideo: VideoSource = {
        id: videoId,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extensão
        url: `indexeddb://${videoId}`, // Marcador especial para IndexedDB
        type: 'upload',
        fileName: file.name,
        fileSize: file.size,
        duration: video.duration,
        thumbnail,
        addedAt: new Date().toISOString()
      };

      setUploadProgress(100);
      onUploadComplete(newVideo);
      
      // Atualizar info de armazenamento
      getStorageUsage().then(setStorageInfo);
      
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
      setUploadStatus('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-gray-800/20 rounded-xl p-6 border border-gray-600/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-700/10 border border-gray-600/30 rounded-lg flex items-center justify-center">
            <IconUpload className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Enviar Vídeos</h3>
            <p className="text-text-secondary text-xs">Adicione seus próprios arquivos de vídeo</p>
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
              ? 'border-gray-600/50 bg-gray-600/5 cursor-not-allowed'
              : 'border-gray-600/20 hover:border-gray-500/50 hover:bg-gray-800/30'
          }`}
        >
          <IconVideo className={`w-16 h-16 mx-auto mb-4 ${uploading ? 'text-gray-400' : 'text-text-secondary/50'}`} />
          
          {uploading ? (
            <div className="space-y-3">
              <p className="text-white font-semibold text-lg">Processando vídeo...</p>
              <p className="text-gray-300 text-sm">{uploadStatus}</p>
              <div className="max-w-xs mx-auto">
                <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-text-secondary text-sm mt-2">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-white font-bold text-lg mb-2">Clique para selecionar um vídeo</p>
              <p className="text-text-secondary text-sm">Ou arraste e solte aqui</p>
              <p className="text-text-secondary/50 text-xs mt-3">Formatos suportados: MP4, WebM, OGG, MOV</p>
            </>
          )}
        </label>

        <div className="mt-4 space-y-3">
          {/* Info de armazenamento */}
          {storageInfo.total > 0 && (
            <div className="bg-gray-800/30 border border-gray-600/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <IconDatabase className="w-4 h-4 text-gray-400" />
                  <span className="text-text-secondary text-xs font-semibold">Armazenamento IndexedDB</span>
                </div>
                <span className="text-text-secondary/70 text-xs">
                  {(storageInfo.used / 1024 / 1024 / 1024).toFixed(2)} GB / {(storageInfo.total / 1024 / 1024 / 1024).toFixed(2)} GB
                </span>
              </div>
              <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-600 transition-all duration-300"
                  style={{ width: `${(storageInfo.used / storageInfo.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3">
            <p className="text-gray-300 text-xs">
              IndexedDB ativado! Suporta vídeos de vários GB (filmes completos).
              Os arquivos ficam armazenados no navegador e funcionam offline!
            </p>
          </div>
          
          <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3">
            <p className="text-gray-300 text-xs">
              Os vídeos são armazenados localmente no seu dispositivo.
              Para compartilhar em outros dispositivos/sites, os arquivos precisam estar no IndexedDB de cada navegador.
            </p>
          </div>
        </div>
      </div>

      {/* Uploads List */}
      <div className="bg-gray-800/20 rounded-xl p-6 border border-gray-600/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Vídeos Enviados</h3>
          <span className="px-3 py-1.5 bg-gray-700/10 border border-gray-600/30 text-gray-300 text-sm font-semibold rounded-lg">
            {uploads.length} {uploads.length === 1 ? 'Vídeo' : 'Vídeos'}
          </span>
        </div>

        {uploads.length === 0 ? (
          <div className="border-2 border-dashed border-gray-600/20 bg-gray-800/20 rounded-xl p-12 text-center">
            <IconFile className="w-16 h-16 text-gray-600/30 mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-2">Nenhum vídeo enviado</p>
            <p className="text-text-secondary text-sm">Faça upload de seus vídeos acima</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploads.map((video) => (
              <div
                key={video.id}
                className="group bg-gray-800/30 hover:bg-gray-800/50 border border-gray-600/10 hover:border-gray-500/50 rounded-xl p-4 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-20 h-14 object-cover rounded-lg border border-gray-600/20"
                    />
                  ) : (
                    <div className="w-20 h-14 bg-gray-800/50 border border-gray-600/20 rounded-lg flex items-center justify-center">
                      <IconVideo className="w-6 h-6 text-text-secondary/50" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate mb-1">{video.title}</p>
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="px-2 py-0.5 bg-gray-700/10 border border-gray-600/30 text-gray-300 rounded text-xs font-medium">
                        UPLOAD
                      </span>
                      {video.duration && (
                        <span className="text-gray-400 font-mono">
                          {formatDuration(video.duration)}
                        </span>
                      )}
                      {video.fileSize && (
                        <span className="text-text-secondary/70">
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
                      className="p-2 bg-gray-500/10 border border-gray-500/30 text-gray-300 hover:bg-gray-500/20 rounded-lg"
                      title="Adicionar à Playlist"
                    >
                      <IconPlayerPlay className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onRemoveUpload(video.id)}
                      className="p-2 bg-gray-500/10 border border-gray-500/30 text-gray-300 hover:bg-gray-500/20 rounded-lg"
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
