"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { IconBarrierBlock } from "@tabler/icons-react";

interface ReviewData {
  userID: number,
  role: string,
  firstName: string,
  lastName: string,
  rating:number,
  designation?: string;
  review: string;
  email: string;
  // createdAt: string | Date;

  image: string | number;
}

export function ReviewSection() {
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    review: "",
  });
  const defaultUserImage = "https://i.ibb.co/ZVFsg37/default-avatar.png";
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Mutation function to POST review
  const postReview = async (reviewData: ReviewData) => {
    const response = await axiosInstance.post("/api/reviews", reviewData,
      
    );
    return response.data;
  };

  //  useMutation hook
  const { mutateAsync } = useMutation({
    mutationFn: postReview,
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      setFormData({ name: "", designation: "", review: "" });
      setIsModalOpen(false);
      setIsSubmitting(false);
    },
    onError: () => {
      toast.error("Failed to submit review. Please try again.");
      setIsSubmitting(false);
    },
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.review) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    const reviewData = {
      ...formData,
      rating: 5,
      // userEmail: user?.email || defaultUserEmail,
      // userImage: user?.photoURL || defaultUserImage,
      userID: user?._id,
      userName:user?.firstName,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user?.email || "user@gmail.com",
      image: user?.profile || defaultUserImage,
      designation: formData.designation,
      // createdAt: new Date().toISOString(),
      // status: "pending",
    };

    await mutateAsync(reviewData);
  };

  return (
    <>
      {/* 🔔 Toast Container */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: "var(--primary-light)",
            color: "#0A5EB0",
            fontFamily: "monospace",
            borderRadius: "0.75rem",
          },
        }}
      />

      {/* Main Section */}
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="mb-4 font-mono text-4xl font-bold text-primary-dark">
          Share Your <span className="text-yellow-500">Valuable</span> Thoughts
        </h2>
        <p className="mb-8 text-lg text-primary-dark">
          We would love to hear about your experience
        </p>
        {
          !user && <h1 className="text-2xl flex items-center justify-center gap-5 my-5 text-red-400 font mono">You must Logged in to give a review <IconBarrierBlock></IconBarrierBlock> </h1>

        }
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!user}
          className={`rounded-lg bg-yellow-500 px-8 py-3 font-semibold text-white transition-all ${!user ? 'cursor-not-allowed' : 'cursor-pointer'} hover:bg-yellow-700 hover:shadow-lg `}
        >
          Give Review
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-primary-lightest p-8 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-primary-dark hover:bg-gray-100"
            >
              <X size={24} />
            </button>

            <h3 className="mb-6 text-3xl font-bold font-mono text-primary-dark">
              Share Your Review
            </h3>


            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium font-mono text-primary-dark"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-primary-medium px-4 py-3 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label
                  htmlFor="designation"
                  className="mb-2 block text-sm font-medium font-mono text-primary-dark"
                >
                  Designation
                </label>
                <input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-primary-medium px-4 py-3 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g., Software Engineer"
                />
              </div>

              <div>
                <label
                  htmlFor="review"
                  className="mb-2 block text-sm font-medium font-mono text-primary-dark"
                >
                  Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="review"
                  name="review"
                  rows={3}
                  value={formData.review}
                  onChange={handleInputChange}
                  className="w-full resize-none rounded-lg border border-gray-300 bg-primary-medium px-4 py-3 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Share your thoughts and experience..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-yellow-400 px-6 py-3 font-semibold text-white hover:bg-yellow-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-primary-dark px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
