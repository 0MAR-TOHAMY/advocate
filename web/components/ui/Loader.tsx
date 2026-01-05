import Lottie from "lottie-react";
import loadingAnimation from "@/public/Loading.json";

interface LoaderProps {
    size?: number;
    className?: string;
}

export default function Loader({ size = 100, className = "" }: LoaderProps) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <Lottie
                animationData={loadingAnimation}
                loop={true}
                style={{ width: size, height: size }}
            />
        </div>
    );
}
