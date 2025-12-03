const API_URLS = {
  getFiles: 'https://functions.poehali.dev/e19a6d69-9295-4b2d-a109-4609d4a8890f',
  uploadFile: 'https://functions.poehali.dev/5eab13b5-e4ba-4910-8b62-50f84339b90f',
  downloadFile: 'https://functions.poehali.dev/2fa37b00-44a7-410b-84fc-3d6d741e54f1',
  getHistory: 'https://functions.poehali.dev/baeda9a2-f6ab-44c8-91ee-49ef740f6f4f',
};

const USER_ID = 'Александр Смирнов';

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  downloads: number;
  uploadedBy: string;
  uploadedDate: string;
  category: string;
}

export interface DownloadHistoryItem {
  id: string;
  fileName: string;
  date: string;
}

export const getFiles = async (category?: string): Promise<FileItem[]> => {
  const url = category && category !== 'Все' 
    ? `${API_URLS.getFiles}?category=${encodeURIComponent(category)}`
    : API_URLS.getFiles;
    
  const response = await fetch(url);
  const data = await response.json();
  return data.files || [];
};

export const uploadFile = async (file: File, category: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const base64Content = reader.result?.toString().split(',')[1] || '';
        
        const response = await fetch(API_URLS.uploadFile, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': USER_ID,
          },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            type: file.type,
            category: category,
            content: base64Content,
          }),
        });
        
        const data = await response.json();
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export const trackDownload = async (fileId: string): Promise<void> => {
  await fetch(API_URLS.downloadFile, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': USER_ID,
    },
    body: JSON.stringify({ fileId }),
  });
};

export const getDownloadHistory = async (): Promise<DownloadHistoryItem[]> => {
  const response = await fetch(API_URLS.getHistory, {
    headers: {
      'X-User-Id': USER_ID,
    },
  });
  const data = await response.json();
  return data.history || [];
};
