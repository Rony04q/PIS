import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // <-- Make sure useNavigate is imported
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '../lib/supabaseClient'; // <-- IMPORT SUPABASE

const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // <-- ADD THIS to get the navigation function

  // --- THIS FUNCTION IS NOW UPDATED ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { // <-- 1. Added 'async'
    e.preventDefault();
    
    try {
      // 2. This is the new Supabase sign-up logic
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          // This 'data' is sent to your database trigger
          data: {
            full_name: fullName,
            role: 'student' // Automatically assign new users as 'student'
          }
        }
      });

      if (error) throw error; // If Supabase returns an error, stop here

      // 3. If sign-up is successful, show an alert and send them to login
      alert('Sign up successful! Please check your email for a confirmation link.');
      navigate('/login');

    } catch (error: any) {
      // 4. If an error happened, show it to the user
      console.error('Error signing up:', error.message);
      alert('Sign-up Error: ' + error.message);
    }
  };

  // --- YOUR JSX IS UNCHANGED ---
  // (It's already correct!)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-card)] border-border">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Placement Information System
          </CardTitle>
          <CardDescription className="text-base">
            Create your account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 shadow-[var(--shadow-button)] hover:scale-[1.02] transition-transform"
            >
              Sign Up
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              to="/login"
              className="font-medium text-primary hover:underline transition-colors"
            >
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;