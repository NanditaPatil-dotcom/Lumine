"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <ProtectedLayout>
      <div className="h-full overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-6">
            <h1 className="text-3xl font-serif font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-6 max-w-4xl">
          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue={user?.username} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={user?.profile?.firstName || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={user?.profile?.lastName || ""} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" defaultValue={user?.profile?.bio || ""} placeholder="Tell us about yourself" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            {/* Spaced Repetition Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Spaced Repetition</CardTitle>
                <CardDescription>Configure your learning schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Spaced Repetition</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically schedule note reviews based on difficulty
                    </p>
                  </div>
                  <Switch defaultChecked={user?.preferences?.spacedRepetition?.enabled} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">Daily Review Limit</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    defaultValue={user?.preferences?.spacedRepetition?.dailyLimit}
                    min="1"
                    max="100"
                  />
                  <p className="text-sm text-muted-foreground">Maximum number of notes to review per day</p>
                </div>
                <div className="space-y-2">
                  <Label>Review Intervals (days)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {user?.preferences?.spacedRepetition?.intervals?.map((interval, index) => (
                      <Input key={index} type="number" defaultValue={interval} min="1" className="text-center" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Days between reviews for each difficulty level</p>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Web Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive browser notifications for review reminders</p>
                  </div>
                  <Switch defaultChecked={user?.preferences?.notifications?.webPush} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email reminders for overdue reviews</p>
                  </div>
                  <Switch defaultChecked={user?.preferences?.notifications?.email} />
                </div>
                <Button variant="outline">Test Notifications</Button>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm">
                      Light
                    </Button>
                    <Button variant="outline" size="sm">
                      Dark
                    </Button>
                    <Button variant="outline" size="sm">
                      System
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
