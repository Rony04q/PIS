import { useState, useEffect } from "react";
import { useNavigate, Link, Outlet, NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from "@/components/ui/button";
// --- CHANGED: Added ScanSearch icon ---
import { LogOut, Files, FileText, Home, ScanSearch } from "lucide-react"; 

const AdminLayout = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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

        // Role check
        if (profileData && profileData.role === 'student') {
          navigate('/dashboard'); // Send students away
        } else if (profileData) {
          setProfile(profileData); // Keep admin profile
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
    return <div className="min-h-screen flex items-center justify-center">Loading Admin Portal...</div>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/admin" className="text-xl font-bold text-primary hover:text-primary/90 transition-colors">
            Admin Portal
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          
          {/* Admin specific links */}
          <NavLink
            to="/admin/job-postings"
            className={({ isActive }) =>
              `flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`
            }
          >
            <Files className="h-4 w-4" />
            Job Postings
          </NavLink>
          <NavLink
            to="/admin/applications"
            className={({ isActive }) =>
              `flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`
            }
          >
            <FileText className="h-4 w-4" />
            Applications
          </NavLink>
          
          {/* --- NEW LINK ADDED HERE --- */}
          <NavLink
            to="/admin/evaluator"
            className={({ isActive }) =>
              `flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`
            }
          >
            <ScanSearch className="h-4 w-4" />
            AI Resume Evaluator
          </NavLink>
          
        </nav>
        <div className="p-4 mt-auto border-t border-border text-center text-sm text-muted-foreground">
            Logged in as {profile?.full_name || 'Admin'}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Admin Header */}
        <header className="bg-card border-b border-border shadow-sm flex justify-between items-center h-16 px-8">
          <Link to="/dashboard" title="Go to Student Dashboard">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          
          {/* Logout Button */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </header>

        {/* This renders the child admin page */}
        <main className="flex-1 p-8 bg-secondary/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;