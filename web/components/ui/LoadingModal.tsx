import Loader from "./Loader";

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

export default function LoadingModal({ isOpen, message }: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
      <div className="relative bg-white rounded-[25px] shadow-[0_0_20px_0_rgba(0,0,0,0.01)] p-8 flex flex-col items-center justify-center gap-4 min-w-[300px] min-h-[180px]">
        <Loader size={60} />
        <p className="text-[14px] font-medium text-gray-900">
          {message || "Processing..."}
        </p>
      </div>
    </div>
  );
}
