import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex h-screen">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="/login-banner.jpg"
          alt="Login Banner"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-blue-900/30" />
        <div className="absolute bottom-0 left-0 p-8 text-white">
          <h1 className="text-4xl font-bold mb-4">Alumni Connection Platform</h1>
          <p className="text-xl">Connect with your college alumni network</p>
        </div>
      </div>

      {/* Right side - Sign In */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <Image
              src="/kit_logo.png"
              alt="KIT Logo"
              width={120}
              height={120}
              className="mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome to Alumni Connect
            </h2>
            <p className="mt-2 text-gray-600">
              Sign in or create an account to continue
            </p>
          </div>
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "bg-white shadow-none border-0",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 