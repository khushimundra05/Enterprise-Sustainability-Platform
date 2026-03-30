"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login as cognitoLogin, userPool } from "@/lib/auth";
import { cognitoConfig } from "@/lib/cognito";
import { CognitoUser, CognitoUserAttribute } from "amazon-cognito-identity-js";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={submit}
        className="bg-white p-8 rounded-xl shadow-md w-96 space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">
          SustainHub {mode === "login" ? "Login" : "Sign Up"}
        </h1>

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-50 border border-red-200 rounded p-2">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {mode === "signup" && (
          <input
            type="text"
            placeholder="Organization Name"
            className="w-full border p-3 rounded"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        )}

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full border p-3 rounded pr-16"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-sm text-gray-500"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {showVerification && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Check your email for a verification code.
            </p>
            <input
              type="text"
              placeholder="Verification Code"
              className="w-full border p-3 rounded"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </div>
        )}

        {!showVerification && (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
                ? "Login"
                : "Create Account"}
          </button>
        )}

        {mode === "login" ? (
          <p className="text-center text-sm">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-green-600 underline"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
            >
              Sign Up
            </button>
          </p>
        ) : (
          <p className="text-center text-sm">
            Already have an account?{" "}
            <button
              type="button"
              className="text-green-600 underline"
              onClick={() => {
                setMode("login");
                setShowVerification(false);
                setError("");
              }}
            >
              Login
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
