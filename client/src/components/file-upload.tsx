import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FolderOpen, Loader2, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  onFileUploaded: (fileData: any) => void;
  onDataProcessed: (processedData: any) => void;
  onDeleteFile?: () => void;
  hasFile?: boolean;
}

export default function FileUpload({ onFileUploaded, onDataProcessed, onDeleteFile, hasFile }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', '/api/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      onFileUploaded(data.file);
      onDataProcessed({
        preview: data.preview,
        stats: data.stats,
        distributions: data.distributions,
        jsonFields: data.jsonFields,
      });
      toast({
        title: "File uploaded successfully",
        description: `${data.file.originalName} has been processed and is ready for cleaning.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 100MB.",
          variant: "destructive",
        });
        return;
      }

      setUploadProgress(0);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  return (
    <div className="w-full">
      {hasFile ? (
        /* File Selected State */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between space-x-4 p-4 sm:p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
              <FileText className="text-green-600 flex-shrink-0" size={24} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-green-800 truncate">CSV file uploaded successfully</p>
                <p className="text-xs text-green-600">Ready for processing and cleaning</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onDeleteFile}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
            >
              <X size={16} className="mr-1" />
              <span className="hidden sm:inline">Remove</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Upload State */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
          <div className="text-center">
            <div
              {...getRootProps()}
              className={`upload-area border-2 border-dashed rounded-xl p-8 sm:p-12 lg:p-16 transition-colors cursor-pointer ${
                isDragActive 
                  ? 'border-primary bg-blue-50' 
                  : 'border-gray-300 hover:border-primary hover:bg-blue-50'
              }`}
            >
              <input {...getInputProps()} />
              <CloudUpload className="mx-auto text-gray-400 mb-4 sm:mb-6" size={48} />
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">Upload your CSV file</h3>
              <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base max-w-md mx-auto">
                {isDragActive 
                  ? "Drop the file here..." 
                  : "Drag and drop your file here, or click to browse"
                }
              </p>
              <Button disabled={uploadMutation.isPending} size="lg" className="mb-4">
                <FolderOpen size={18} className="mr-2" />
                Choose File
              </Button>
              <p className="text-xs sm:text-sm text-gray-400">Supports .csv files up to 100MB</p>
            </div>
            
            {/* File Processing Status */}
            {uploadMutation.isPending && (
              <div className="mt-6 sm:mt-8">
                <div className="flex items-center justify-center space-x-2 text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing your CSV file...</span>
                </div>
                <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
