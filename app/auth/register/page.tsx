"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain } from "lucide-react"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      await register(username, email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-end p-4">   

  <div className="w-full max-w-md bg-black/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
    <CardHeader className="text-center space-y-2">
      <div className="flex justify-center mb-4">
        <Brain className="h-12 w-12 text-primary" />
      </div>
      <CardTitle className="text-3xl font-serif tracking-wide">Join Lumine</CardTitle>
      <CardDescription className="text-sm text-gray-300">Create your account to get started</CardDescription>
    </CardHeader>

    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="username" className="text-gray-200">Username</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Choose a username"
            minLength={3}
            className="bg-black/50 text-white placeholder-gray-400 border border-white/20 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-200">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            className="bg-black/50 text-white placeholder-gray-400 border border-white/20 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-200">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
            minLength={6}
            className="bg-black/50 text-white placeholder-gray-400 border border-white/20 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-200">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
            className="bg-black/50 text-white placeholder-gray-400 border border-white/20 rounded-lg"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-black/50 hover:bg-primary/90 text-white rounded-lg shadow-lg"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-300">
        <span>Already have an account? </span>
        <Link href="/auth/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </CardContent>
  </div>
</div>

  )

}
