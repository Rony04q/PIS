import { useState, useEffect } from "react";
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const StudentLayout = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // ... (fetchProfile logic remains the same) ...
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        if (profileData) {
          setProfile(profileData);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [navigate]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* --- RESPONSIVE NAVIGATION BAR --- */}
      <nav className="bg-card border-b border-border shadow-sm">
        {/* --- Adjusted Padding --- */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           {/* --- Adjusted Flex & Height --- */}
          <div className="flex justify-between items-center h-16 md:h-20"> {/* Slightly taller on medium screens */}
            <div className="flex items-center">
              {/* --- Adjusted Font Size --- */}
              <Link to="/dashboard" className="text-lg sm:text-xl md:text-2xl font-bold text-primary"> {/* Smaller text on small screens */}
                Placement Info System {/* Shortened name potentially for small screens */}
              </Link>
            </div>
            {/* --- Adjusted Gap --- */}
            <div className="flex items-center gap-2 sm:gap-4"> {/* Smaller gap on small screens */}
              {/* --- User Profile Link (Potentially hide text on small screens) --- */}
              <Link to="/profile" className="flex items-center gap-2 sm:gap-3 px-2 py-1 sm:px-4 sm:py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8"> {/* Smaller avatar */}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm"> {/* Smaller font */}
                    {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || '??'}
                  </AvatarFallback>
                </Avatar>
                {/* --- Hide text on extra-small screens --- */}
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs sm:text-sm font-medium">{profile?.full_name}</span>
                  <span className="text-xs text-muted-foreground">{profile?.role}</span>
                </div>
              </Link>
              {/* --- Logout Button (Potentially icon-only on small screens) --- */}
              <Button
                variant="outline"
                size="sm" // Smaller button size default
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 hover:scale-[1.02] transition-transform"
              >
                <LogOut className="h-4 w-4" />
                 {/* Hide text on small screens */}
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Renders the child page (Dashboard or ProfilePage) */}
      <Outlet />
    </div>
  );
};

export default StudentLayout;