import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

type JobPostingFromDB = {
  id: string;
  title: string;
  package_ctc: string;
  deadline: string;
  min_cgpa: number | null; // Eligibility field
  companies: {
    id: string;
    name: string;
  } | null;
};

const Dashboard = () => {
  const [jobPostings, setJobPostings] = useState<JobPostingFromDB[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_postings')
        .select(`
          id,
          title,
          package_ctc,
          deadline,
          min_cgpa, 
          companies ( id, name ) 
        `) // Fetched min_cgpa
        .order('deadline', { ascending: true });

      if (jobsError) throw jobsError;
      setJobPostings((jobsData as any[] || []) as JobPostingFromDB[]);
    } catch (error: any) {
      console.error("Error fetching jobs:", error.message);
      toast({
        title: "Error",
        description: "Could not fetch job postings.",
        variant: "destructive",
      });
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleApply = async (job: JobPostingFromDB) => {
    setApplyingJobId(job.id);
    try {
      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "You must be logged in to apply.", variant: "destructive"});
        return;
      }
      const studentId = user.id;

      // 2. Fetch the student's profile to check eligibility
      const { data: studentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('cgpa')
        .eq('id', studentId)
        .single();
        
      if (profileError) throw profileError;

      // 3. Perform the eligibility check
      const minCgpa = job.min_cgpa;
      const studentCgpa = studentProfile.cgpa;

      if (minCgpa) { // Does this job have a CGPA requirement?
        if (!studentCgpa || studentCgpa < minCgpa) {
          toast({
            title: "Not Eligible",
            description: `Your CGPA (${studentCgpa || 'N/A'}) does not meet the minimum requirement of ${minCgpa} for this job.`,
            variant: "destructive",
          });
          return; // Stop the application
        }
      }

      // 4. Check if already applied
      const { data: existingApplication, error: checkError } = await supabase
        .from('applications')
        .select('id')
        .eq('student_id', studentId)
        .eq('job_id', job.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingApplication) {
        toast({
          title: "Already Applied",
          description: `You have already applied for this position.`,
          variant: "default",
        });
        return;
      }

      // 5. Insert new application
      const { error: insertError } = await supabase
        .from('applications')
        .insert({ student_id: studentId, job_id: job.id });

      if (insertError) throw insertError;

      // 6. Show success
      toast({
        title: "Application Submitted!",
        description: `Successfully applied for ${job.title} at ${job.companies?.name}.`,
      });

    } catch (error: any) {
      console.error("Error applying for job:", error.message);
      toast({
        title: "Application Failed",
        description: `Could not apply for the job. ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-6 md:py-8 space-y-8 md:space-y-12">
      <section>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Available Job Postings</h2>
        <div className="bg-card rounded-lg shadow-[var(--shadow-card)] border border-border overflow-hidden overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Package (CTC)</TableHead>
                <TableHead>Min. CGPA</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingJobs ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading available jobs...</TableCell></TableRow>
              ) : jobPostings.length === 0 ? (
                 <TableRow><TableCell colSpan={6} className="text-center h-24">No job postings available.</TableCell></TableRow>
              ) : (
                jobPostings.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium whitespace-nowrap">{job.companies?.name || 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{job.title}</TableCell>
                    <TableCell className="whitespace-nowrap">{job.package_ctc}</TableCell>
                    <TableCell className="whitespace-nowrap">{job.min_cgpa || 'None'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {job.deadline ? format(new Date(job.deadline), "yyyy-MM-dd") : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        onClick={() => handleApply(job)}
                        disabled={applyingJobId === job.id}
                        className="shadow-[var(--shadow-button)] hover:scale-[1.02] transition-transform"
                      >
                        {applyingJobId === job.id ? 'Applying...' : 'Apply'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;