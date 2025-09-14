
"use client";

import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useAuth } from '@/context/auth-context';

export const useImageUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const uploadImage = (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!user) {
        const authError = new Error("You must be logged in to upload images.");
        toast({ title: "Authentication Error", description: authError.message, variant: "destructive" });
        setError(authError);
        reject(authError);
        return;
      }

      setUploading(true);
      setProgress(0);
      setDownloadURL(null);
      setError(null);

      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(currentProgress);
        },
        (error) => {
          console.error("Upload failed:", error);
          toast({ title: "Upload Failed", description: "There was an error uploading your image. Please try again.", variant: "destructive" });
          setUploading(false);
          setError(error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setDownloadURL(url);
            setUploading(false);
            toast({ title: "Upload Successful", description: "Your image has been uploaded." });
            resolve(url);
          } catch (getUrlError) {
             console.error("Failed to get download URL:", getUrlError);
             toast({ title: "Error", description: "Could not get the image URL after upload.", variant: "destructive" });
             setUploading(false);
             setError(getUrlError as Error);
             reject(getUrlError);
          }
        }
      );
    });
  };

  return { uploading, progress, downloadURL, error, uploadImage };
};
