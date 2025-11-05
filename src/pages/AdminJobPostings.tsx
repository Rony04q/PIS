import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Trash2, Pencil, PlusCircle, Check, X } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Types
type Company = {
  id: string;
  name: string;
};

type JobPosting = {
  id: string;
  title: string;
  company_id: string;
  package_ctc: string;
  deadline: string;
  description?: string;
  eligibility_criteria?: string;
  min_cgpa?: number | null; // Added min_cgpa
  companies: { name: string } | null;
};

const AdminJobPostings = () => {
  // State for jobs, companies, loading
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  const [eligibility, setEligibility] = useState("");
  const [packageCtc, setPackageCtc] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [minCgpa, setMinCgpa] = useState<string>(""); // Store as string for input field

  // State for adding a company
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchJobsAndCompanies();
  }, []);

  const fetchJobsAndCompanies = async () => {
    setLoadingJobs(true);
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name', { ascending: true });
      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      const { data: jobsData, error: jobsError } = await supabase
        .from('job_postings')
        .select(`id, title, package_ctc, deadline, min_cgpa, companies ( name )`) // Added min_cgpa
        .order('deadline', { ascending: false });

      if (jobsError) throw jobsError;
      setJobPostings((jobsData as any[] || []) as JobPosting[]);

    } catch (error: any) {
      console.error("Error fetching data:", error.message);
      alert("Error fetching data: " + error.message);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Function to add a company
  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      alert("Please enter a company name.");
      return;
    }
    setIsAddingCompany(true);
    try {
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({ name: newCompanyName.trim() })
        .select()
        .single(); 

      if (error) throw error;

      if (newCompany) {
        setCompanies(prevCompanies => [...prevCompanies, newCompany].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedCompanyId(newCompany.id);
        setNewCompanyName("");
        setShowAddCompany(false);
        alert(`Company "${newCompany.name}" added successfully!`);
      }

    } catch (error: any) {
      console.error("Error adding company:", error.message);
      alert("Error adding company: " + error.message);
    } finally {
      setIsAddingCompany(false);
    }
  };

  // Handle form submit (Create Job)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCompanyId || !deadline) {
      alert("Please select a company and a deadline.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('job_postings')
        .insert({
          title: title,
          company_id: selectedCompanyId,
          eligibility_criteria: eligibility,
          package_ctc: packageCtc,
          deadline: deadline.toISOString(),
          description: description,
          min_cgpa: minCgpa ? parseFloat(minCgpa) : null, // Convert string to number or null
        });

      if (error) throw error;

      alert("Job posted successfully!");
      resetForm();
      fetchJobsAndCompanies(); // Re-fetch jobs

    } catch (error: any) {
      console.error("Error posting job:", error.message);
      alert("Error posting job: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete job
  const handleDelete = async (jobId: string, jobTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete the job "${jobTitle}"?`)) return;
    try {
      const { error } = await supabase.from('job_postings').delete().eq('id', jobId);
      if (error) throw error;
      alert(`Job "${jobTitle}" deleted successfully!`);
      fetchJobsAndCompanies(); // Re-fetch jobs
    } catch (error: any) {
      console.error("Error deleting job:", error.message);
      alert("Error deleting job: " + error.message);
    }
  };

  // Reset form helper
  const resetForm = () => {
    setTitle(""); setSelectedCompanyId(undefined); setEligibility("");
    setPackageCtc(""); setDeadline(undefined); setDescription(""); setMinCgpa("");
  };

  return (
    <div className="space-y-8">
      {/* Create New Job Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input id="jobTitle" placeholder="e.g., Software Engineer" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              {/* Company Selection & Add */}
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <div className="flex gap-2 items-center">
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId} required>
                    <SelectTrigger id="company">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowAddCompany(true)}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                {showAddCompany && (
                  <div className="flex gap-2 items-center mt-2 p-2 border rounded-md bg-secondary/30">
                    <Input
                      type="text"
                      placeholder="New company name"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      disabled={isAddingCompany}
                      className="flex-grow h-9"
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={handleAddCompany} disabled={isAddingCompany || !newCompanyName.trim()} className="text-green-600 hover:text-green-700 h-9 w-9">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => { setShowAddCompany(false); setNewCompanyName(""); }} disabled={isAddingCompany} className="text-red-600 hover:text-red-700 h-9 w-9">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Eligibility */}
              <div className="space-y-2">
                <Label htmlFor="eligibility">Eligibility Criteria (Text)</Label>
                <Input id="eligibility" placeholder="e.g., B.Tech with 70%+ marks" value={eligibility} onChange={(e) => setEligibility(e.target.value)} />
              </div>
              {/* Package */}
              <div className="space-y-2">
                <Label htmlFor="package">Package (CTC)</Label>
                <Input id="package" placeholder="e.g., ₹12 LPA" value={packageCtc} onChange={(e) => setPackageCtc(e.target.value)} required />
              </div>
              {/* Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal ${!deadline && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              {/* Min CGPA */}
              <div className="space-y-2">
                <Label htmlFor="minCgpa">Minimum CGPA (e.g., 7.5)</Label>
                <Input id="minCgpa" type="number" step="0.1" placeholder="e.g., 7.5 (leave blank if none)" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} />
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter job description..." value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Job'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Manage Existing Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Existing Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingJobs ? (
            <p>Loading jobs...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Min. CGPA</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobPostings.length === 0 && (
                     <TableRow><TableCell colSpan={5} className="text-center">No jobs posted yet.</TableCell></TableRow>
                  )}
                  {jobPostings.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.companies?.name || 'N/A'}</TableCell>
                      <TableCell>{job.min_cgpa || 'None'}</TableCell>
                      <TableCell>{job.deadline ? format(new Date(job.deadline), "yyyy-MM-dd") : 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" /* onClick={() => handleEdit(job)} */ >
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(job.id, job.title)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminJobPostings;