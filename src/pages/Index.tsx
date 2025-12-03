import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { getFiles, uploadFile, trackDownload, getDownloadHistory, FileItem, DownloadHistoryItem } from '@/lib/api';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'popular' | 'profile'>('popular');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const categories = ['Все', 'Документы', 'Архивы', 'Видео', 'Дизайн'];

  useEffect(() => {
    loadFiles();
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab === 'profile') {
      loadHistory();
    }
  }, [activeTab]);

  const loadFiles = async () => {
    try {
      const data = await getFiles(selectedCategory);
      setFiles(data);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить список файлов',
        variant: 'destructive',
      });
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getDownloadHistory();
      setDownloadHistory(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить историю',
        variant: 'destructive',
      });
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    const category = selectedCategory === 'Все' ? 'Другое' : selectedCategory;
    
    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await uploadFile(file, category);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: 'Успешно загружено! 🎉',
        description: `Файл ${file.name} успешно загружен`,
      });

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        loadFiles();
      }, 1000);
    } catch (error) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить файл',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await trackDownload(fileId);
      toast({
        title: 'Скачивание начато',
        description: `Файл ${fileName} готов к скачиванию`,
      });
      loadFiles();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отследить скачивание',
        variant: 'destructive',
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf': return 'FileText';
      case 'zip': return 'Archive';
      case 'video': return 'Video';
      case 'excel': return 'Sheet';
      case 'figma': return 'Palette';
      default: return 'File';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Icon name="Cloud" className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                FileHub
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant={activeTab === 'popular' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('popular')}
                className="gap-2"
              >
                <Icon name="TrendingUp" size={18} />
                Популярное
              </Button>
              <Button
                variant={activeTab === 'profile' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('profile')}
                className="gap-2"
              >
                <Icon name="User" size={18} />
                Профиль
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'popular' ? (
          <div className="space-y-8 animate-fade-in">
            <div 
              className={`glass rounded-2xl p-8 border transition-all duration-300 ${
                isDragging ? 'border-primary border-2 bg-primary/5' : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-4xl font-heading font-bold">
                    Храните и делитесь файлами
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Быстро, безопасно, удобно
                  </p>
                </div>

                <div className="relative">
                  <Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    placeholder="Поиск файлов..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg rounded-xl"
                  />
                </div>

                {!isUploading && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      size="lg"
                      className="w-full h-14 text-lg rounded-xl gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                    >
                      <Icon name="Upload" size={20} />
                      {isDragging ? 'Отпустите файл для загрузки' : 'Загрузить файл'}
                    </Button>
                  </>
                )}

                {isUploading && (
                  <div className="space-y-2 animate-scale-in">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Загрузка файла...</span>
                      <span className="font-semibold">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category)}
                    className="rounded-full whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {filteredFiles.length === 0 ? (
                <Card className="glass p-12 text-center">
                  <Icon name="Inbox" className="mx-auto mb-4 text-muted-foreground" size={64} />
                  <h3 className="text-xl font-heading font-semibold mb-2">Файлов пока нет</h3>
                  <p className="text-muted-foreground">Загрузите первый файл или измените категорию</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFiles.map((file, index) => (
                    <Card 
                      key={file.id} 
                      className="glass group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 p-6 space-y-4 cursor-pointer"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon name={getFileIcon(file.type)} className="text-primary" size={24} />
                        </div>
                        <Badge variant="secondary" className="rounded-full">
                          {file.category}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-heading font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {file.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{file.size}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="text-xs bg-secondary">
                              {file.uploadedBy.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-xs">
                            <p className="font-medium">{file.uploadedBy}</p>
                            <p className="text-muted-foreground">{file.uploadedDate}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Icon name="Download" size={14} />
                          <span className="text-xs font-semibold">{file.downloads}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full gap-2" 
                        variant="outline"
                        onClick={() => handleDownload(file.id, file.name)}
                      >
                        <Icon name="Download" size={16} />
                        Скачать
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <Card className="glass p-8 space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-4 border-primary">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">АС</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-3xl font-heading font-bold">Александр Смирнов</h2>
                  <p className="text-muted-foreground">alex.smirnov@example.com</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Upload" size={16} className="text-primary" />
                      <span className="font-semibold">{files.length} файлов</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Download" size={16} className="text-secondary" />
                      <span className="font-semibold">{downloadHistory.length} скачиваний</span>
                    </div>
                  </div>
                </div>
                <Button className="gap-2">
                  <Icon name="Settings" size={18} />
                  Настройки
                </Button>
              </div>
            </Card>

            <Card className="glass p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-heading font-semibold flex items-center gap-2">
                  <Icon name="History" size={20} className="text-primary" />
                  История скачиваний
                </h3>
                <Button variant="ghost" size="sm" onClick={loadHistory}>
                  Обновить
                </Button>
              </div>

              <div className="space-y-3">
                {downloadHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="History" className="mx-auto mb-2" size={48} />
                    <p>История пуста</p>
                  </div>
                ) : (
                  downloadHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon name="FileText" className="text-primary" size={18} />
                        </div>
                        <div>
                          <p className="font-medium">{item.fileName}</p>
                          <p className="text-sm text-muted-foreground">{item.date}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="gap-2"
                        onClick={() => handleDownload(item.id, item.fileName)}
                      >
                        <Icon name="Download" size={16} />
                        Повторить
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="glass p-6 space-y-4">
              <h3 className="text-xl font-heading font-semibold flex items-center gap-2">
                <Icon name="HardDrive" size={20} className="text-primary" />
                Хранилище
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Использовано</span>
                  <span className="font-semibold">{files.length} из 100 файлов</span>
                </div>
                <Progress value={(files.length / 100) * 100} className="h-3" />
              </div>

              <Button className="w-full gap-2" variant="outline">
                <Icon name="Zap" size={18} />
                Увеличить объем хранилища
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
