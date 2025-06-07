import { Camera, Upload, X, Download, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function CameraPage() {
  const [image, setImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        setIsCameraActive(true);
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      if (error.name === "NotAllowedError") {
        toast({
          title: "Camera Access Denied",
          description: "Please allow camera access in your browser settings to use this feature.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Camera Error",
          description: "Failed to start camera. Please try again.",
          variant: "destructive",
        });
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setImage(imageData);
        stopCamera();

        toast({
          title: "Image Captured",
          description: "Image has been captured successfully.",
        });
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setImage(imageData);
        toast({
          title: "Image Uploaded",
          description: "Image has been uploaded successfully.",
        });
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container relative min-h-screen flex flex-col">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {!image ? (
          /* Camera Interface */
          <Card className="glass-morphism border-0">
            <CardContent className="p-6">
              <div className="text-center space-y-6">
                {!isCameraActive ? (
                  /* Camera Start */
                  <div className="space-y-6">
                    <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Camera className="w-12 h-12 text-white" />
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-2">Image Gallery</h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        Take a photo or upload an image to view
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        onClick={startCamera}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-blue-500/30 hover:bg-blue-500/10"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Camera View */
                  <div className="space-y-4">
                    <div className="relative mx-auto max-w-md">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-lg shadow-lg"
                      />
                      <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg pointer-events-none" />
                    </div>

                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={captureImage}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture
                      </Button>

                      <Button
                        variant="outline"
                        onClick={stopCamera}
                        className="border-red-500/30 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Image Display */
          <div className="space-y-6">
            {/* Image Preview */}
            <Card className="glass-morphism border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Image View</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation(r => (r + 90) % 360)}
                      className="border-blue-500/30 hover:bg-blue-500/10"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
                      className="border-blue-500/30 hover:bg-blue-500/10"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
                      className="border-blue-500/30 hover:bg-blue-500/10"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `image-${new Date().toISOString().split('T')[0]}.jpg`;
                        link.href = image;
                        link.click();
                      }}
                      className="border-green-500/30 hover:bg-green-500/10"
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImage(null);
                        setZoom(1);
                        setRotation(0);
                      }}
                      className="border-red-500/30 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 min-h-[300px] flex items-center justify-center">
                  <img
                    src={image}
                    alt="Captured"
                    className="max-w-full max-h-[500px] object-contain transition-all duration-300"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}