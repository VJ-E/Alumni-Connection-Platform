import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex h-screen bg-background">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="/login-banner.jpg"
          alt="Login Banner"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-primary/80 dark:bg-primary/60" />
        <div className="absolute bottom-0 left-0 p-8 text-black">
          <h1 className="text-4xl font-bold mb-4">Alumni Connection Platform</h1>
          <p className="text-xl">Connect with your college alumni network</p>
        </div>
      </div>

      {/* Right side - Sign In */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <Image
              src="/kit_logo.png"
              alt="KIT Logo"
              width={120}
              height={120}
              className="mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to Alumni Connect
            </h2>
            <p className="mt-2 text-muted-foreground">
              Sign in or create an account to continue
            </p>
          </div>
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "bg-card text-card-foreground shadow-sm border border-border rounded-lg p-6",
                headerTitle: "text-foreground",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton: "border-border hover:bg-accent/50",
                socialButtonsBlockButtonText: "text-foreground",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground",
                formFieldLabel: "text-foreground",
                formFieldInput: "bg-background border-border text-foreground focus:ring-2 focus:ring-primary/20",
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                footerActionText: "text-muted-foreground",
                footerActionLink: "text-primary hover:text-primary/80",
              },
              variables: {
                colorPrimary: 'hsl(var(--primary))',
                colorText: 'hsl(var(--foreground))',
                colorTextSecondary: 'hsl(var(--muted-foreground))',
                colorBackground: 'hsl(var(--background))',
                colorInputBackground: 'hsl(var(--background))',
                colorInputText: 'hsl(var(--foreground))',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 