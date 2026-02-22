
// components/jobs/JobDetailsClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, X } from "lucide-react";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "@/providers/AuthProvider";

interface JobDetailsClientProps {
  jobId: string;
  primaryEnquiries?: string[];
}

export default function JobDetailsClient({
  jobId,
  primaryEnquiries,
}: JobDetailsClientProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [enquiryAnswers, setEnquiryAnswers] = useState<string[]>(
    primaryEnquiries ? new Array(primaryEnquiries.length).fill("") : []
  );

  // Fetch candidate data to check if job is already saved or applied
  const { data: candidateData } = useQuery({
    queryKey: ["candidate"],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/candidates/${user._id}`);
      return response.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Check if job is already saved or applied
  useEffect(() => {
    if (candidateData) {
      if (candidateData.savedJobs?.includes(jobId)) {
        setIsSaved(true);
      }
      if (candidateData.appliedJobs?.includes(jobId)) {
        setIsApplied(true);
      }
    }
  }, [candidateData, jobId]);

  // Apply Job Mutation
  const applyMutation = useMutation({
    mutationFn: async (data: { primaryEnquiries: string[] }) => {
      if (!user?._id || !jobId) throw new Error("Missing user ID or job ID");

      const response = await axiosInstance.post(
        `/api/candidates/${user._id}/apply/${jobId}`,
        {
          status: "applied",
          primaryEnquiries: data.primaryEnquiries || [],
        }
      );

      return response.data;
    },

    onSuccess: () => {
      toast.success("Job applied successfully!");
      queryClient.invalidateQueries({ queryKey: ["appliedJobs"] });
      queryClient.invalidateQueries({ queryKey: ["candidate"] });
      setIsApplied(true);
      setShowApplyForm(false);
    },

    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to apply for job");
      } else {
        toast.error("Unexpected error occurred");
      }
    },
  });

  // Save Job Mutation
  const saveJobMutation = useMutation({
    mutationFn: async () => {
      if (!user?._id || !jobId) throw new Error("Missing user ID or job ID");

      const response = await axiosInstance.put(
        `/api/candidates/${user._id}/savedjobs`,
        {
          jobId: jobId,
          action: "add", // make sure backend receives add/remove
        }
      );

      return response.data;
    },

    onSuccess: () => {
      setIsSaved(true);
      toast.success("Job saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["savedJobs"] });
      queryClient.invalidateQueries({ queryKey: ["candidate"] });
    },

    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to save job");
      } else {
        toast.error("Unexpected error occurred");
      }
    },
  });

  // Handle Apply Click
  const handleApplyClick = () => {
    if (isApplied) {
      toast("You have already applied to this job", { icon: "ℹ️" });
      return;
    }

    if (!primaryEnquiries || primaryEnquiries.length === 0) {
      applyMutation.mutate({ primaryEnquiries: [] });
    } else {
      setShowApplyForm(true);
    }
  };

  // Handle Enquiry Form Submit
  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();

    if (primaryEnquiries && primaryEnquiries.length > 0) {
      const hasEmptyAnswers = enquiryAnswers.some((answer) => answer.trim() === "");
      if (hasEmptyAnswers) {
        toast.error("Please answer all questions before submitting");
        return;
      }
    }

    applyMutation.mutate({ primaryEnquiries: enquiryAnswers });
  };

  // Handle Save Job
  const handleSaveJob = () => {
    if (isSaved) {
      toast("Job already saved", { icon: "ℹ️" });
      return;
    }

    saveJobMutation.mutate();
  };

  // Handle Enquiry Change
  const handleEnquiryChange = (index: number, value: string) => {
    const newAnswers = [...enquiryAnswers];
    newAnswers[index] = value;
    setEnquiryAnswers(newAnswers);
  };


  return (
    <>
      {/* Action Buttons in Sidebar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <button
          onClick={handleApplyClick}
          disabled={applyMutation.isPending || isApplied}
          className="w-full bg-[#7670d6] text-white py-3 rounded-lg font-semibold hover:bg-[#6660c6] transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {applyMutation.isPending
            ? "Applying..."
            : isApplied
              ? "Already Applied"
              : "Apply Now"}
        </button>
        <button
          onClick={handleSaveJob}
          disabled={saveJobMutation.isPending || isSaved}
          className="w-full border-2 border-[#7670d6] text-[#7670d6] py-3 rounded-lg font-semibold hover:bg-[#f8f3ed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaved ? (
            <>
              <BookmarkCheck size={20} />
              Job Saved
            </>
          ) : saveJobMutation.isPending ? (
            "Saving..."
          ) : (
            <>
              <Bookmark size={20} />
              Save Job
            </>
          )}
        </button>
      </div>

      {/* Application Form */}
      {showApplyForm && primaryEnquiries && primaryEnquiries.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Application Questions
            </h2>
            <button
              onClick={() => setShowApplyForm(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close form"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Please answer all questions to complete your application. Your
            responses will be reviewed by the employer.
          </p>
          <form onSubmit={handleSubmitApplication} className="space-y-6">
            {primaryEnquiries.map((question, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Question {index + 1}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <fieldset className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <legend className="text-sm font-medium text-gray-700 px-2 bg-white">
                    {question}
                  </legend>
                  <textarea
                    value={enquiryAnswers[index]}
                    onChange={(e) => handleEnquiryChange(index, e.target.value)}
                    className="w-full mt-2 p-3 border text-black dark:text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7670d6] focus:border-transparent resize-none bg-white"
                    rows={4}
                    placeholder="Type your answer here..."
                    required
                  />
                </fieldset>
              </div>
            ))}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={applyMutation.isPending}
                className="flex-1 bg-[#7670d6] text-white py-3 rounded-lg font-semibold hover:bg-[#6660c6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applyMutation.isPending
                  ? "Submitting..."
                  : "Submit Application"}
              </button>
              <button
                type="button"
                onClick={() => setShowApplyForm(false)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}


























































// // components/jobs/JobDetailsClient.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { Bookmark, BookmarkCheck, X } from "lucide-react";
// import axiosInstance from "@/lib/axios";
// import toast from "react-hot-toast";
// import axios from "axios";
// import { useAuth } from "@/providers/AuthProvider";

// interface JobDetailsClientProps {
//   jobId: string;
//   primaryEnquiries?: string[];
// }

// export default function JobDetailsClient({
//   jobId,
//   primaryEnquiries,
// }: JobDetailsClientProps) {
//   const { user } = useAuth();
//   const queryClient = useQueryClient();
//   const [showApplyForm, setShowApplyForm] = useState(false);
//   const [isSaved, setIsSaved] = useState(false);
//   const [isApplied, setIsApplied] = useState(false);
//   const [enquiryAnswers, setEnquiryAnswers] = useState<string[]>(
//     primaryEnquiries ? new Array(primaryEnquiries.length).fill("") : []
//   );

//   // Fetch candidate data to check if job is already saved or applied
//   const { data: candidateData } = useQuery({
//     queryKey: ["candidate"],
//     queryFn: async () => {
//       const response = await axiosInstance.get(`/candidates/${user.email}`);
//       return response.data;
//     },
//     retry: false,
//     staleTime: 1000 * 60 * 5, // 5 minutes
//   });

//   // Check if job is already saved or applied
//   useEffect(() => {
//     if (candidateData) {
//       if (candidateData.savedJobs?.includes(jobId)) {
//         setIsSaved(true);
//       }
//       if (candidateData.appliedJobs?.includes(jobId)) {
//         setIsApplied(true);
//       }
//     }
//   }, [candidateData, jobId]);

//   // Apply to job mutation at jobs collection
//   const applyMutation = useMutation({
//     mutationFn: async (data: { primaryEnquiries: string[] }) => {
//       const response = await axiosInstance.post(`/jobs/${jobId}/applicants`, {
//         employeeId: candidateData._id,
//         status: "applied",
//         primaryEnquiries: data.primaryEnquiries,
//       });
//       return response.data;
//     },
//     onSuccess: () => {
//       toast.success("Application submitted successfully!");
//       setShowApplyForm(false);
//       setIsApplied(true);
//       setEnquiryAnswers(
//         primaryEnquiries ? new Array(primaryEnquiries.length).fill("") : []
//       );
//       queryClient.invalidateQueries({ queryKey: ["job", jobId] });
//       queryClient.invalidateQueries({ queryKey: ["appliedJobs"] });
//       queryClient.invalidateQueries({ queryKey: ["candidate"] });
//     },
//     onError: (error: unknown) => {
//       if (axios.isAxiosError(error)) {
//         toast.error(
//           error.response?.data?.message || "Failed to submit application"
//         );
//       }
//     },
//   });

//   // Apply to job mutation to save data's on candidate collection
//   const appliedJobsMutation = useMutation({
//     mutationFn: async (data: { primaryEnquiries: string[] }) => {
//       const response = await axiosInstance.post(`/candidates/${user.email}/appliedJobs`, {
//         employeeId: candidateData._id,
//         status: "applied",
//         primaryEnquiries: data.primaryEnquiries,
//       });
//       return response.data;
//     },
//     onSuccess: () => {
//       toast.success("Application submitted successfully!");
//       setShowApplyForm(false);
//       setIsApplied(true);
//       setEnquiryAnswers(
//         primaryEnquiries ? new Array(primaryEnquiries.length).fill("") : []
//       );
//       queryClient.invalidateQueries({ queryKey: ["job", jobId] });
//       queryClient.invalidateQueries({ queryKey: ["appliedJobs"] });
//       queryClient.invalidateQueries({ queryKey: ["candidate"] });
//     },
//     onError: (error: unknown) => {
//       if (axios.isAxiosError(error)) {
//         toast.error(
//           error.response?.data?.message || "Failed to submit application"
//         );
//       }
//     },
//   });

//   // Save job mutation - Updates savedJobs array with job ID
//   const saveJobMutation = useMutation({
//     mutationFn: async () => {
//       const response = await axiosInstance.patch("/candidates/savedJobs", {
//         jobId: jobId,
//       });
//       return response.data;
//     },
//     onSuccess: () => {
//       setIsSaved(true);
//       toast.success("Job saved successfully!");
//       queryClient.invalidateQueries({ queryKey: ["savedJobs"] });
//       queryClient.invalidateQueries({ queryKey: ["candidate"] });
//     },
//     onError: (error: unknown) => {
//       if (axios.isAxiosError(error)) {
//         toast.error(error.response?.data?.message || "Failed to save job");
//       }
//     },
//   });

//   const handleApplyClick = () => {
//     if (isApplied) {
//       toast("You have already applied to this job", { icon: "ℹ️" });
//       return;
//     }

//     if (!primaryEnquiries || primaryEnquiries.length === 0) {
//       // If no enquiries, apply directly with empty array
//       applyMutation.mutate({
//         primaryEnquiries: [],
//       });
//     } else {
//       // Show the form with enquiries
//       setShowApplyForm(true);
//     }
//   };

//   const handleSubmitApplication = (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validate that all enquiries are answered if they exist
//     if (primaryEnquiries && primaryEnquiries.length > 0) {
//       const hasEmptyAnswers = enquiryAnswers.some(
//         (answer) => answer.trim() === ""
//       );
//       if (hasEmptyAnswers) {
//         toast.error("Please answer all questions before submitting");
//         return;
//       }
//     }

//     applyMutation.mutate({
//       primaryEnquiries: enquiryAnswers,
//     });
//         appliedJobsMutation.mutate({
//       primaryEnquiries: enquiryAnswers,
//     });
//   };

//   const handleSaveJob = () => {
//     if (isSaved) {
//       toast("Job already saved", { icon: "ℹ️" });
//       return;
//     }
//     saveJobMutation.mutate();
//   };

//   const handleEnquiryChange = (index: number, value: string) => {
//     const newAnswers = [...enquiryAnswers];
//     newAnswers[index] = value;
//     setEnquiryAnswers(newAnswers);
//   };

//   return (
//     <>
//       {/* Action Buttons in Sidebar */}
//       <div className="bg-white rounded-xl shadow-md p-6">
//         <button
//           onClick={handleApplyClick}
//           disabled={applyMutation.isPending || isApplied}
//           className="w-full bg-[#7670d6] text-white py-3 rounded-lg font-semibold hover:bg-[#6660c6] transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {applyMutation.isPending
//             ? "Applying..."
//             : isApplied
//               ? "Already Applied"
//               : "Apply Now"}
//         </button>
//         <button
//           onClick={handleSaveJob}
//           disabled={saveJobMutation.isPending || isSaved}
//           className="w-full border-2 border-[#7670d6] text-[#7670d6] py-3 rounded-lg font-semibold hover:bg-[#f8f3ed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//         >
//           {isSaved ? (
//             <>
//               <BookmarkCheck size={20} />
//               Job Saved
//             </>
//           ) : saveJobMutation.isPending ? (
//             "Saving..."
//           ) : (
//             <>
//               <Bookmark size={20} />
//               Save Job
//             </>
//           )}
//         </button>
//       </div>



//       {/* Application Form */}
//       {showApplyForm && primaryEnquiries && primaryEnquiries.length > 0 && (
//         <div className="bg-white rounded-xl shadow-md p-6 mt-6">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold text-gray-900">
//               Application Questions
//             </h2>
//             <button
//               onClick={() => setShowApplyForm(false)}
//               className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//               title="Close form"
//             >
//               <X size={20} className="text-gray-600" />
//             </button>
//           </div>
//           <p className="text-sm text-gray-600 mb-6">
//             Please answer all questions to complete your application. Your
//             responses will be reviewed by the employer.
//           </p>
//           <form onSubmit={handleSubmitApplication} className="space-y-6">
//             {primaryEnquiries.map((question, index) => (
//               <div key={index} className="space-y-2">
//                 <label className="block text-sm font-semibold text-gray-900">
//                   Question {index + 1}
//                   <span className="text-red-500 ml-1">*</span>
//                 </label>
//                 <fieldset className="border border-gray-300 rounded-lg p-4 bg-gray-50">
//                   <legend className="text-sm font-medium text-gray-700 px-2 bg-white">
//                     {question}
//                   </legend>
//                   <textarea
//                     value={enquiryAnswers[index]}
//                     onChange={(e) => handleEnquiryChange(index, e.target.value)}
//                     className="w-full mt-2 p-3 border text-black dark:text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7670d6] focus:border-transparent resize-none bg-white"
//                     rows={4}
//                     placeholder="Type your answer here..."
//                     required
//                   />
//                 </fieldset>
//               </div>
//             ))}

//             <div className="flex gap-4 pt-4">
//               <button
//                 type="submit"
//                 disabled={applyMutation.isPending}
//                 className="flex-1 bg-[#7670d6] text-white py-3 rounded-lg font-semibold hover:bg-[#6660c6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {applyMutation.isPending
//                   ? "Submitting..."
//                   : "Submit Application"}
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setShowApplyForm(false)}
//                 className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
//               >
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </div>
//       )}
//     </>
//   );
// }
