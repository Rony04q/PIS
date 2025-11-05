import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient'; // Adjust path if needed
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // For styling the status
import { format } from "date-fns"; // For formatting dates

// --- NEW: Define type for the fetched application data ---
type FetchedAdminApplication = {
  id: string; // Application ID
  created_at: string; // Application date
  status: string;
  profiles: { // Joined data from profiles table
    full_name: string | null;
    email: string | null;
  } | null;
  job_postings: { // Joined data from job_postings table
    title: string | null;
    companies: { // Nested join for company name
      name: string | null;
    } | null;
  } | null;
};

const AdminApplications = () => {
  // --- STATE for applications and loading ---
  const [applications, setApplications] = useState<FetchedAdminApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch applications on component load ---
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          status,
          profiles ( full_name, email ),
          job_postings (
            title,
            companies ( name )
          )
        `)
        .order('created_at', { ascending: false }); // Show most recent first

      if (error) throw error;

      setApplications((data as any[] || []) as FetchedAdminApplication[]); // Type assertion

    } catch (error: any) {
      console.error("Error fetching applications:", error.message);
      // You could add a toast here for error feedback
    } finally {
      setLoading(false);
    }
  };

  // --- Helper to determine badge variant based on status ---
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'shortlisted':
        return "default"; // Or your preferred success/highlight color
      case 'rejected':
        return "destructive";
      case 'under review':
        return "secondary";
      case 'applied':
      default:
        return "outline";
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">All Applications</h1>

      <div className="bg-card rounded-lg shadow-[var(--shadow-card)] border border-border overflow-hidden">
        <div className="overflow-x-auto"> {/* Added for horizontal scroll on small screens */}
          <Table className="min-w-[800px]"> {/* Min width to encourage scroll */}
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Student Name</TableHead>
                <TableHead className="whitespace-nowrap">Email</TableHead>
                <TableHead className="whitespace-nowrap">Job Title</TableHead>
                <TableHead className="whitespace-nowrap">Company</TableHead>
                <TableHead className="whitespace-nowrap">Applied Date</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Loading applications...</TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No applications found.</TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium whitespace-nowrap">{app.profiles?.full_name || 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{app.profiles?.email || 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{app.job_postings?.title || 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{app.job_postings?.companies?.name || 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {app.created_at ? format(new Date(app.created_at), 'yyyy-MM-dd') : 'N/A'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={getStatusVariant(app.status)} className="capitalize">
                        {app.status || 'N/A'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminApplications;