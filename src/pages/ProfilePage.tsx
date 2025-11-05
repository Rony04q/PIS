import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { User, Edit, Briefcase, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RealtimeChannel } from "@supabase/supabase-js";
import { format } from "date-fns";

// Type for editable profile fields
type EditableProfile = {
  full_name: string;
  roll_number: string;
  department: string;
  cgpa: string;
};

// Type for fetched applications
type FetchedApplication = {
  status: string;
  job_postings: {
    title: string;
    companies: {
      name: string;
    } | null;
  } | null;
};

const ProfilePage = () => {
  // Profile & Auth States
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editableProfile, setEditableProfile] = useState<EditableProfile>({
    full_name: '', roll_number: '', department: '', cgpa: '',
  });

  // Admin States
  const [jobCount, setJobCount] = useState<number>(0);
  const [applicantCount, setApplicantCount] = useState<number>(0);

  // Student States
  const [fetchedApplications, setFetchedApplications] = useState<FetchedApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);

  // Main useEffect to fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (profileData) {
          setProfile(profileData);
          setEditableProfile({
            full_name: profileData.full_name || '',
            roll_number: profileData.roll_number || '',
            department: profileData.department || '',
            cgpa: profileData.cgpa || '',
          });
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

  // useEffect for Admin Stats & Realtime
  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const { count: jobCount, error: jobError } = await supabase
          .from('job_postings')
          .select('*', { count: 'exact', head: true });
        if (jobError) throw jobError;
        setJobCount(jobCount || 0);

        const { count: appCount, error: appError } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true });
        if (appError) throw appError;
        setApplicantCount(appCount || 0);
      } catch (error: any) {
        console.error("Error fetching admin stats:", error.message);
      }
    };

    if (profile && profile.role === 'admin') {
      fetchAdminStats(); // Initial fetch

      // Set up Realtime Subscriptions
      const realtimeChannel = supabase.channel('public-profile-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'job_postings' },
          (payload) => {
            console.log('Job change detected!', payload);
            fetchAdminStats(); // Re-fetch counts
          }
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' },
          (payload) => {
            console.log('Application change detected!', payload);
            fetchAdminStats(); // Re-fetch counts
          }
        )
        .subscribe();

      // Cleanup
      return () => {
        supabase.removeChannel(realtimeChannel);
      };
    }
  }, [profile]); // Depends on 'profile'

  // useEffect to fetch student's applications
  useEffect(() => {
    const fetchStudentApplications = async () => {
      if (!profile) return; // Wait for profile to be loaded
      setLoadingApplications(true);
      try {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            status,
            job_postings (
              title,
              companies ( name )
            )
          `)
          .eq('student_id', profile.id); // Fetch only *this* student's applications

        if (error) throw error;
        setFetchedApplications((data as any[] || []) as FetchedApplication[]);
      } catch (error: any) {
        console.error("Error fetching applications:", error.message);
      } finally {
        setLoadingApplications(false);
      }
    };

    // Only run this if the profile is loaded AND the user is a student
    if (profile && profile.role === 'student') {
      fetchStudentApplications();
    }
  }, [profile]); // Re-run when profile is loaded


  // --- HANDLER FUNCTIONS ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditableProfile((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          full_name: editableProfile.full_name,
          roll_number: editableProfile.roll_number,
          department: editableProfile.department,
          cgpa: editableProfile.cgpa,
        })
        .eq('id', profile.id)
        .select()
        .single();
      if (error) throw error;
      if (updatedProfile) {
        setProfile(updatedProfile);
        setIsEditing(false);
        alert("Profile updated successfully!");
      }
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      alert(`Error updating profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditableProfile({
        full_name: profile.full_name || '',
        roll_number: profile.roll_number || '',
        department: profile.department || '',
        cgpa: profile.cgpa || '',
      });
    }
    setIsEditing(false);
  };
  // --- END OF HANDLER FUNCTIONS ---


  if (loading) {
    return <div className="p-8">Loading profile...</div>;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* === MY PROFILE SECTION (Restored) === */}
      <section>
        <h2 className="text-3xl font-bold mb-6">My Profile</h2>
        <Card className="mb-8 shadow-[var(--shadow-card)] border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {/* --- Personal Info Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="full_name" className="text-sm font-medium text-muted-foreground mb-1">Full Name</Label>
                {isEditing ? (
                  <Input id="full_name" value={editableProfile.full_name} onChange={handleFormChange} className="text-base font-semibold" />
                ) : (
                  <p className="text-base font-semibold h-10 flex items-center">{profile.full_name}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-1">Email</Label>
                <p className="text-base font-semibold h-10 flex items-center">{profile.email}</p>
              </div>
              
              {/* Only show student fields if student */}
              {profile.role === 'student' && (
                <>
                  <div>
                    <Label htmlFor="roll_number" className="text-sm font-medium text-muted-foreground mb-1">Roll Number</Label>
                    {isEditing ? (
                      <Input id="roll_number" value={editableProfile.roll_number} onChange={handleFormChange} className="text-base font-semibold" />
                    ) : (
                      <p className="text-base font-semibold h-10 flex items-center">{profile.roll_number || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="department" className="text-sm font-medium text-muted-foreground mb-1">Department</Label>
                    {isEditing ? (
                      <Input id="department" value={editableProfile.department} onChange={handleFormChange} className="text-base font-semibold" />
                    ) : (
                      <p className="text-base font-semibold h-10 flex items-center">{profile.department || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="cgpa" className="text-sm font-medium text-muted-foreground mb-1">CGPA</Label>
                    {isEditing ? (
                      <Input id="cgpa" value={editableProfile.cgpa} onChange={handleFormChange} className="text-base font-semibold" />
                    ) : (
                      <p className="text-base font-semibold h-10 flex items-center">{profile.cgpa || 'N/A'}</p>
                    )}
                  </div>
                </>
              )}

               <div>
                <Label className="text-sm font-medium text-muted-foreground mb-1">Role</Label>
                <p className="text-base font-semibold h-10 flex items-center">{profile.role}</p>
              </div>
            </div>

            {/* Save/Cancel Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      {/* === END OF RESTORED SECTION === */}


      {/* === CONDITIONAL SECTIONS BASED ON ROLE === */}

      {/* --- STUDENT SECTION (UPDATED) --- */}
      {profile.role === 'student' && (
        <section>
          <div>
            <h3 className="text-2xl font-bold mb-4">My Applications</h3>
            <div className="bg-card rounded-lg shadow-[var(--shadow-card)] border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Company Name</TableHead>
                    <TableHead className="font-semibold">Job Title</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingApplications ? (
                    <TableRow><TableCell colSpan={3} className="text-center h-24">Loading applications...</TableCell></TableRow>
                  ) : fetchedApplications.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center h-24">You have not applied for any jobs yet.</TableCell></TableRow>
                  ) : (
                    // Map over the REAL data
                    fetchedApplications.map((app, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {app.job_postings?.companies?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {app.job_postings?.title || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground capitalize">
                            {app.status || 'N/A'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      )}

      {/* --- ADMIN SECTION (With real-time stats & JSX fixes) --- */}
      {profile.role === 'admin' && (
        <section className="space-y-8">
          <h2 className="text-3xl font-bold mb-6">Admin Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Jobs Posted */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jobs Posted</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobCount}</div>
                <p className="text-xs text-muted-foreground">Total job postings</p>
              </CardContent>
            </Card>

            {/* Card 2: Total Applications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{applicantCount}</div>
                <p className="text-xs text-muted-foreground">Across all postings</p>
              </CardContent>
            </Card>

            {/* Card 3: Manage Jobs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Manage Jobs</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 <p className="text-sm text-muted-foreground mb-4">Add, edit, or remove job postings.</p>
                 <Link to="/admin/job-postings">
                    <Button className="w-full">Go to Job Postings</Button>
                 </Link>
              </CardContent>
            </Card>

          </div>
        </section>
      )}
    </main>
  );
};

export default ProfilePage;