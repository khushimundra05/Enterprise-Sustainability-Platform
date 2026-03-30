"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login as cognitoLogin, userPool } from "@/lib/auth";
import { cognitoConfig } from "@/lib/cognito";
import { CognitoUser, CognitoUserAttribute } from "amazon-cognito-identity-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showVerification, setShowVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Login ──────────────────────────────────────────────────────
  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      // cognitoLogin() from auth.ts stores idToken in sessionStorage["idToken"]
      await cognitoLogin(email, password);
      router.replace("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "UserNotConfirmedException") {
        setError("Email not verified. Please check your inbox for the code.");
        setShowVerification(true);
        setMode("signup");
      } else if (err.code === "NotAuthorizedException") {
        setError("Incorrect email or password.");
      } else if (err.code === "UserNotFoundException") {
        setError("No account found with this email.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Sign up ────────────────────────────────────────────────────
  async function handleSignup() {
    setError("");
    setLoading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        const attributes = [
          new CognitoUserAttribute({ Name: "email", Value: email }),
        ];

        if (organization) {
          attributes.push(
            new CognitoUserAttribute({
              Name: "custom:Organisation",
              Value: organization,
            }),
          );
        }

        userPool.signUp(email, password, attributes, [], (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });

      setShowVerification(true);
      setError("");
      alert("Verification code sent to your email.");
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code === "UsernameExistsException") {
        setError("An account with this email already exists.");
      } else if (err.code === "InvalidPasswordException") {
        setError(
          "Password must be at least 8 characters with uppercase, lowercase, and a number.",
        );
      } else {
        setError(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Verify email ───────────────────────────────────────────────
  async function handleVerify() {
    setError("");
    setLoading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: userPool,
        });

        cognitoUser.confirmRegistration(verificationCode, true, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });

      alert("Email verified! You can now log in.");
      setShowVerification(false);
      setMode("login");
      setVerificationCode("");
    } catch (err: any) {
      console.error("Verify error:", err);
      if (err.code === "CodeMismatchException") {
        setError("Invalid verification code. Please check and try again.");
      } else if (err.code === "ExpiredCodeException") {
        setError("Code expired. Please sign up again to get a new code.");
      } else {
        setError(err.message || "Verification failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (showVerification) return; // handled by separate button
    if (mode === "login") handleLogin();
    else handleSignup();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10 dark:from-background dark:via-background dark:to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-lg">
            <Leaf className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            SustainHub
          </span>
        </div>

        <Card className="shadow-xl border-border/50 animate-slide-in-up">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Sign in to your account"
                : "Join us in building a sustainable future"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-smooth"
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Organization</label>
                  <Input
                    type="text"
                    placeholder="Your Company Name"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="transition-smooth"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 transition-smooth"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {showVerification && (
                <div className="space-y-2 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                  <p className="text-sm text-muted-foreground">
                    Check your email for a verification code.
                  </p>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="transition-smooth"
                  />
                  <Button
                    type="button"
                    onClick={handleVerify}
                    disabled={loading}
                    variant="secondary"
                    className="w-full"
                  >
                    {loading ? "Verifying..." : "Verify Email"}
                  </Button>
                </div>
              )}

              {!showVerification && (
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full"
                >
                  {loading
                    ? mode === "login"
                      ? "Signing in..."
                      : "Creating account..."
                    : mode === "login"
                      ? "Sign In"
                      : "Create Account"}
                </Button>
              )}

              <div className="pt-4 border-t border-border text-center text-sm">
                {mode === "login" ? (
                  <p className="text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-semibold"
                      onClick={() => {
                        setMode("signup");
                        setError("");
                      }}
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-semibold"
                      onClick={() => {
                        setMode("login");
                        setShowVerification(false);
                        setError("");
                      }}
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our{" "}
          <a href="#" className="underline hover:text-foreground transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-foreground transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
