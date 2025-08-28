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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }
/*
  return (
    <div className="min-h-screen flex items-center justify-end p-4">    
  <div className="w-full max-w-md bg-white/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
    <CardHeader className="text-center space-y-2">
      <div className="flex justify-center mb-4">
        <Brain className="h-12 w-12 text-black/80" />
      </div>
      <CardTitle className="text-3xl text-black/80 font-serif tracking-wide">Welcome Back</CardTitle>
      <CardDescription className="text-sm text-black">Login to your account</CardDescription>
    </CardHeader>

    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-black/80">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            className="bg-white/30 text-black/80 placeholder-black border border-black/20 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-black/80">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            className="bg-white/30 text-black/80 placeholder-black rounded-lg"
          />
        </div>

      

        <Button
          type="submit"
          className="w-full bg-white/35 hover:bg-primary/90 text-black/80 rounded-lg shadow-lg"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-black">
        <span>Don’t have an account? </span>
        <Link href="/auth/register" className="text-black hover:underline">
          Register
        </Link>
      </div>
    </CardContent>
  </div>
</div>


  )
} */
 
  return (
    <div className="flex items-center justify-end p-4 h-screen">  
  <div className="w-full max-w-md bg-black/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
    <CardHeader className="text-center space-y-2">
      <div className="flex justify-center mb-4">
        <Brain className="h-12 w-12 text-primary" />
      </div>
      <CardTitle className="text-3xl font-serif tracking-wide">Welcome Back</CardTitle>
      <CardDescription className="text-sm text-gray-300">Login to your account</CardDescription>
    </CardHeader>

    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
            placeholder="Enter your password"
            className="bg-black/50 text-white placeholder-gray-400 border none rounded-lg"
          />
        </div>

      

        <Button
          type="submit"
          className="w-full bg-black/50 hover:bg-primary/90 text-white rounded-lg shadow-lg"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-300">
        <span>Don’t have an account? </span>
        <Link href="/auth/register" className="text-primary hover:underline">
          Register
        </Link>
      </div>
    </CardContent>
  </div>
</div>


  )
}
