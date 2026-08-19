import { useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@lib/firebase';

interface UploadState {
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  downloadURL?: string;
}

/**
 * Hook for robust video uploads to Firebase Storage
 * Features: progress tracking, resumable upload, status management
 */
export const useVideoUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    status: 'pending',
  });

  const uploadFile = useCallback(async (file: File, path: string) => {
    setUploadState({ progress: 0, status: 'uploading' });

    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadState((prev) => ({ ...prev, progress }));
        },
        (error) => {
          setUploadState({ progress: 0, status: 'error', error: error.message });
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadState({ progress: 100, status: 'completed', downloadURL });
          resolve(downloadURL);
        }
      );
    });
  }, []);

  return {
    uploadFile,
    uploadState,
  };
};
