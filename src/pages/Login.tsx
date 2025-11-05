import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // Adjust path if needed
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// --- NEW: Import RadioGroup components ---
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // --- NEW: State to store the selected role ---
  const [selectedRole, setSelectedRole] = useState("student"); // Default to 'student'
  const [loading, setLoading] = useState(false); // Add loading state for the button
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); // Start loading

    try {
      // 1. Log in the user with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        throw new Error(`Login failed: ${authError.message}`); // Throw specific error
      }

      // 2. If login is successful, get the user's actual profile from the database
      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role') // We only need the role
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          throw new Error(`Could not fetch user profile: ${profileError.message}`);
        }

        // 3. Check if the selected role matches the database role
        if (profileData && profileData.role === selectedRole) {
          // Roles match! Redirect based on the role.
          if (selectedRole === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard'); // Default redirect for 'student'
          }
        } else {
          // Roles DO NOT match - show an error
          await supabase.auth.signOut(); // Log them out immediately
          throw new Error(`Authorization failed: You do not have '${selectedRole}' privileges.`);
        }
      } else {
        throw new Error("Login succeeded but no user data found."); // Should not happen
      }

    } catch (error: any) {
      console.error('Login process error:', error.message);
      alert(`Error: ${error.message}`); // Show the specific error
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-card)] border-border">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Placement Information System
          </CardTitle>
          <CardDescription className="text-base">
            Enter your credentials and select your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
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
            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            {/* --- NEW: Role Selection --- */}
            <div className="space-y-2">
              <Label>Log in as:</Label>
              <RadioGroup
                defaultValue="student"
                value={selectedRole}
                onValueChange={setSelectedRole} // Update state when radio changes
                className="flex space-x-4 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="role-student" />
                  <Label htmlFor="role-student">Student</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="role-admin" />
                  <Label htmlFor="role-admin">Admin</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading} // Disable button while loading
              className="w-full h-11 shadow-[var(--shadow-button)] hover:scale-[1.02] transition-transform"
            >
              {loading ? 'Logging in...' : 'Login'} {/* Show loading text */}
            </Button>
          </form>
          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link
              to="/signup"
              className="font-medium text-primary hover:underline transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};