

"use client";

import React, { useState } from "react";
import { Heart, Send, Smile, Laugh, MessageCircle, Users, Briefcase, MessageSquare, TrendingUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/providers/AuthProvider";
import axios from "axios";
import toast from "react-hot-toast";
import Lottie from "lottie-react";
import boyWindow from "../../../public/wave.json";
import bee from "../../../public/Flying Bee.json";
import Image from "next/image";

interface Comment {
  _id: string;
  commenterId: string;
  role: string;
  commenterName: string;
  commenterEmail: string;
  commentText: string;
  commentDate: string;
  totalLikes: string[];
  totalHaha: string[];
  totalLove: string[];
}

interface Post {
  _id: string;
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  postTitle: string;
  postStatus: string;
  post: string;
  totalLikes: string[] | number;
  totalHaha: string[] | number;
  totalLove: string[] | number;
  createdAt: string;
  comments: Comment[];
}

interface CreatePostData {
  postTitle: string;
  post: string;
  role: string
}

// Time ago helper function
const getTimeAgo = (timestamp?: string): string => {
  if (!timestamp) return "just now";
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffInMs = now.getTime() - postTime.getTime();

  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) return "Just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  if (diffInHours < 24)
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  if (diffInDays < 7)
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  if (diffInWeeks < 4)
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
  if (diffInMonths < 12)
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
};

// Avatar generator based on name
const getAvatar = (firstName?: string, lastName?: string): string => {
  const avatars = ["👤", "👨", "👩", "🧑", "👨‍💼", "👩‍💼", "🧑‍💼", "👨‍💻", "👩‍💻", "🧑‍💻"];
  const name = `${firstName || ""} ${lastName || ""}`.trim();
  if (!name) return avatars[0];
  const index =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    avatars.length;
  return avatars[index];
};

export default function CommunityPage() {
  const { user } = useAuth();
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPost, setNewPost] = useState("");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      const response = await axiosInstance.get("/api/community");
      return response.data;
    },
  });
  const approvedPosts = posts.filter(post => post.postStatus === "approved")

  // Get user's reaction on a post
  const getUserPostReaction = (post: Post): "like" | "love" | "haha" | null => {
    if (!user) return null;
    const likesArray = Array.isArray(post.totalLikes) ? post.totalLikes : [];
    const loveArray = Array.isArray(post.totalLove) ? post.totalLove : [];
    const hahaArray = Array.isArray(post.totalHaha) ? post.totalHaha : [];

    if (likesArray.includes(user._id)) return "like";
    if (loveArray.includes(user._id)) return "love";
    if (hahaArray.includes(user._id)) return "haha";
    console.log(user._id)

    return null;
  };

  // Get user's reaction on a comment
  const getUserCommentReaction = (comment: Comment): "like" | "love" | "haha" | null => {
    if (!user) return null;
    if (comment.totalLikes?.includes(user._id)) return "like";
    if (comment.totalLove?.includes(user._id)) return "love";
    if (comment.totalHaha?.includes(user._id)) return "haha";
    return null;
  };

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: CreatePostData) => {
      const response = await axiosInstance.post("/api/community", postData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setNewPostTitle("");
      setNewPost("");
      toast.success("Post created successfully!");
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to create post");
      }
    },
  });

  // React to post mutation
  const reactToPostMutation = useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: "like" | "love" | "haha" }) => {
      const response = await axiosInstance.patch(
        `/api/community/${postId}/react`,
        { type: reactionType }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to react");
      }
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, commentText }: { postId: string; commentText: string }) => {
      const response = await axiosInstance.post(`/api/community/${postId}/comments`, {
        commentText,
        commenterName: user ? `${user.firstName} ${user.lastName}` : "Anonymous",


      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setCommentTexts((prev) => ({ ...prev, [variables.postId]: "" }));
      toast.success("Comment added!");
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to add comment");
      }
    },
  });

  // React to comment mutation
  const reactToCommentMutation = useMutation({
    mutationFn: async ({ postId, commentId, reactionType }: { postId: string; commentId: string; reactionType: "like" | "love" | "haha" }) => {
      const response = await axiosInstance.patch(
        `/api/community/${postId}/comments/${commentId}/react`,
        { type: reactionType }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to react to comment");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !newPostTitle.trim()) return;

    createPostMutation.mutate({
      postTitle: newPostTitle,
      post: newPost,
      role: "Candidate"
    });
  };
  // console.log(user.role)
  const handlePostReaction = (postId: string, reaction: "like" | "love" | "haha") => {
    if (!user) {
      toast.error("Please login to react");
      return;
    }
    reactToPostMutation.mutate({ postId, reactionType: reaction });
  };

  const handleCommentReaction = (
    postId: string,
    commentId: string,
    reaction: "like" | "love" | "haha"
  ) => {
    if (!user) {
      toast.error("Please login to react");
      return;
    }
    reactToCommentMutation.mutate({ postId, commentId, reactionType: reaction });
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };



  const handleAddComment = (postId: string) => {
    const commentText = commentTexts[postId]?.trim();
    if (!commentText) return;
    if (!user) {
      toast.error("Please login to comment");
      return;
    }
    addCommentMutation.mutate({ postId, commentText });
  };

  return (
    <div className="min-h-screen z-10 flex gap-6 px-1.5 pt-24">
      {/* Left Section - Animation and Welcome (Fixed) */}
      <div className="flex-shrink-0 sticky top-6 h-fit hidden animation-section">
        <span className=" absolute z-100 -top-50" >
          <Lottie animationData={bee} loop />
        </span>
        <div className="min-h-screen bg-[#423ba6]   shadow-[inset_0_0_40px_#8f89ed]   rounded-[20px] p-8  text-center flex flex-col items-center justify-center relative overflow-hidden">

          {/* Animated Background */}
          <div className="absolute inset-0 opacity-90">
            {/* Purple glow blob */}
            <div className="absolute top-10 left-10 w-32 h-32 
                  bg-gradient-to-br from-purple-400 via-purple-600 to-pink-500 
                  rounded-b-full animate-blob 
                  blur-xl shadow-[0_0_40px_20px_rgba(168,85,247,0.6)]"></div>

            {/* Blue glow blob */}
            <div className="absolute top-40 right-20 w-40 h-40 
                  bg-gradient-to-br from-blue-400 via-blue-600 to-cyan-500 
                  rounded-full animate-blob animation-delay-2000 
                  blur-xl shadow-[0_0_40px_20px_rgba(59,130,246,0.6)]"></div>

            {/* Indigo glow blob */}
            <div className="absolute bottom-20 left-1/4 w-36 h-36 
                  bg-gradient-to-br from-indigo-400 via-indigo-600 to-violet-500 
                  rounded-full animate-blob animation-delay-4000 
                  blur-xl shadow-[0_0_40px_20px_rgba(99,102,241,0.6)]"></div>
          </div>


          <style>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -20px) scale(1.1); }
            50% { transform: translate(-20px, 20px) scale(0.9); }
            75% { transform: translate(20px, 20px) scale(1.05); }
          }
          .animate-blob {
            animation: blob 8s infinite ease-in-out;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>

          {/* Content Container */}
          <div className="relative z-10 w-full max-w-md">

            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-90 h-40 rounded-2xl shadow-lg">

              </div>

              <h2 className="text-3xl -mt-10 font-mono font-bold text-white mb-3">
                {user ? `Welcome, ${user?.firstName}!` : "Welcome!"} 👋
              </h2>

              <p className="text-gray-100 text-base leading-relaxed">
                Join our vibrant community of professionals sharing insights, opportunities, and career growth.
              </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-4 mb-8">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 text-left border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">Discover Opportunities</h3>
                    <p className="text-xs text-gray-600">Find jobs, projects, and collaborations</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 text-left border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">Share & Connect</h3>
                    <p className="text-xs text-gray-600">Engage with peers and industry leaders</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 text-left border border-indigo-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">Grow Together</h3>
                    <p className="text-xs text-gray-600">Learn from experiences and insights</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
              <p className="text-sm font-medium mb-2">Ready to get started?</p>
              <p className="text-xs opacity-90">Share your first post and connect with the community!</p>
            </div>
          </div>
        </div>
      </div>



      {/* Right Section - Posts (Scrollable) */}
      <div className="flex-1  max-w-full mx-auto">
        {/* Header */}
        <div className="bg-[#423ba6] relative  shadow-[inset_0_0_40px_#8f89ed]  rounded-[16px] py-8 px-6 mb-6 ">
          <div className="absolute z-5 -top-10 " >
            <Lottie animationData={boyWindow} loop />
          </div>
          <h1 className="text-[#f8f3ed] text-[32px] font-bold mb-2"
          >
            Community Thoughts
          </h1>
          <p
            className="text-[#d3d2ea] m-0 text-[16px]">
            Share your ideas and connect with others
          </p>
          <div
            className=" relative z-10  rounded-[16px] p-6  "

          >
            {!user && (

              <p className="text-red-300 text-[18px] my-3 text-center font-medium">


                Hey stranger <span className="animate-bounce inline-block px-2">!</span> You’ve got to log in before you can post anything.
              </p>
            )}
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <input
                type="text"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="Post Title"
                disabled={createPostMutation.isPending}
                className="text-white dark:text-white w-full border-2 border-[#d3d2ea] rounded-[12px] p-4 text-[15px] font-inherit font-semibold outline-none transition-colors duration-200 box-border"

                onFocus={(e) => (e.target.style.borderColor = "#7670d6")}
                onBlur={(e) => (e.target.style.borderColor = "#d3d2ea")}
              />
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind?"
                disabled={createPostMutation.isPending}
                style={{ resize: "vertical" }}
                className="text-white dark:text-white resize-none w-full min-h-[100px] border-2 border-[#d3d2ea] rounded-[12px] p-4 text-[15px] font-inherit  outline-none transition-colors duration-200 box-border"


                onFocus={(e) => (e.target.style.borderColor = "#7670d6")}
                onBlur={(e) => (e.target.style.borderColor = "#d3d2ea")}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    e.ctrlKey &&
                    newPost.trim() &&
                    newPostTitle.trim()
                  ) {
                    handleSubmit(e);
                  }
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={
                    !user ||
                    !newPost.trim() ||
                    !newPostTitle.trim() ||
                    createPostMutation.isPending
                  }

                  className={`flex items-center gap-2 px-6 py-3 rounded-[10px] text-[15px] font-semibold transition-all duration-200 border-none text-white ${newPost.trim() && newPostTitle.trim() && !createPostMutation.isPending
                    ? "bg-[#7670d6] cursor-pointer"
                    : "bg-[#d3d2ea] cursor-not-allowed"
                    }`}
                  onMouseEnter={(e) => {
                    if (
                      newPost.trim() &&
                      newPostTitle.trim() &&
                      !createPostMutation.isPending
                    ) {
                      e.currentTarget.style.background = "#9da0dc";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (
                      newPost.trim() &&
                      newPostTitle.trim() &&
                      !createPostMutation.isPending
                    ) {
                      e.currentTarget.style.background = "#7670d6";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <Send size={18} />
                  {createPostMutation.isPending ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Post Input */}


        {/* Posts Feed */}
        {isLoading ? (
          <div className="bg-white rounded-[16px] py-16 px-8 text-center shadow-[0_2px_12px_rgba(118,112,214,0.08)]">
            <p style={{ color: "#9da0dc", fontSize: "15px" }}>
              Loading posts...
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-[16px] py-16 px-8 text-center shadow-[0_2px_12px_rgba(118,112,214,0.08)]">
            <div className="text-[64px] mb-4 filter grayscale-[20%]">
              💭
            </div>
            <h3 className="text-[#7670d6] text-[22px] font-semibold mb-2">
              No posts yet
            </h3>
            <p className="text-[#9da0dc] text-[15px] m-0">
              Be the first to share your thoughts with the community!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {approvedPosts.map((post) => {
              const userReaction = getUserPostReaction(post);
              const isCommentsExpanded = expandedComments.has(post._id);

              return (
                <div
                  key={post._id}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 2px 12px rgba(118, 112, 214, 0.08)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 20px rgba(118, 112, 214, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 12px rgba(118, 112, 214, 0.08)";
                  }}
                >
                  {/* Post Header */}
                  <div
                    className="flex items-center gap-3 mb-4"

                  >
                    <div className="text-[32px] w-12 h-12 flex items-center justify-center bg-[#f8f3ed] rounded-full">

                      {getAvatar(post.firstName, post.lastName)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className=" font-semibold text-[#7670d6] text-[15px]"

                      >
                        {`${post.firstName} ${post.lastName}`}
                      </div>
                      <div style={{ fontSize: "13px", color: "#9da0dc" }}>
                        {getTimeAgo(post.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Post Title */}
                  <h3 className="text-[#333] text-[18px] font-bold mb-3 leading-[1.4]">


                    {post.postTitle}
                  </h3>

                  {/* Post Content */}
                  <p className="text-[#555] text-[15px] leading-[1.6] mb-4 whitespace-pre-wrap">


                    {post.post}
                  </p>

                  {/* Post Reactions */}
                  <div className="flex gap-2 pt-4 border-t border-[#f8f3ed] flex-wrap  items-center">
                    {/* LIKE */}
                    <button
                      onClick={() => handlePostReaction(post._id, "like")}
                      disabled={reactToPostMutation.isPending}
                      className={`flex shadow-2xs hover:shadow-2xl hover:shadow-black items-center gap-[6px] px-4 py-2 rounded-[10px] border-none cursor-pointer text-[14px] font-semibold transition-all duration-200 ${userReaction === "like" ? "bg-[#7670d6]/40 backdrop-blur-sm text-[#3A3AFC]" : "bg-transparent text-[#3A3AFC]"}`}
                    >
                      <Image
                        width={19}
                        height={19}
                        src="/icons8-like-100.png"
                        alt="like icon"
                        className=" shadow-2xl  shadow-black/80"
                      />
                      {Array.isArray(post.totalLikes)
                        ? post.totalLikes.length > 0 && post.totalLikes.length
                        : post.totalLikes > 0 && post.totalLikes}

                    </button>

                    {/* LOVE */}
                    <button
                      onClick={() => handlePostReaction(post._id, "love")}
                      disabled={reactToPostMutation.isPending}
                      className={`flex shadow-2xs hover:shadow-2xl hover:shadow-black items-center gap-[6px] px-4 py-2 rounded-[10px] border-none cursor-pointer text-[14px] font-semibold transition-all duration-200 ${userReaction === "love" ? "bg-red-500/40 text-[#DE3107]" : "bg-transparent text-[#DE3107]"}`}
                    >                          <Image
                        width={19}
                        height={19}
                        src="/icons8-hand-holding-heart-50.png"
                        alt="like icon"
                      />
                      {Array.isArray(post.totalLove)
                        ? post.totalLove.length > 0 && post.totalLove.length
                        : post.totalLove > 0 && post.totalLove}
                    </button>

                    {/* HAHA */}
                    <button
                      onClick={() => handlePostReaction(post._id, "haha")}
                      disabled={reactToPostMutation.isPending}
                      className={`flex shadow-2xs hover:shadow-2xl hover:shadow-black items-center gap-[6px] px-4 py-2 rounded-[10px] border-none cursor-pointer text-[14px] font-semibold transition-all duration-200 ${userReaction === "haha" ? "bg-yellow-400/10 text-[#FCBB3A]" : "bg-transparent text-[#FCBB3A]"}`}
                    >
                      <Image
                        width={19}
                        height={19}
                        src="/icons8-grinning-squinting-face-32 (1).png"
                        alt="like icon"
                      />


                      {Array.isArray(post.totalHaha)
                        ? post.totalHaha.length > 0 && post.totalHaha.length
                        : post.totalHaha > 0 && post.totalHaha}
                    </button>

                    {/* Comment Toggle Button */}
                    <button
                      onClick={() => toggleComments(post._id)}
                      className={`flex items-center gap-[6px] px-4 py-2 rounded-[10px] border-none cursor-pointer text-[14px] font-semibold transition-all duration-200 ml-auto 
      ${isCommentsExpanded ? "bg-[#7670d6] text-white" : "bg-transparent text-[#7670d6]"}`}
                    >
                      <MessageCircle size={18} />
                      {post.comments?.length || 0}
                    </button>
                  </div>


                  {/* Comments Section */}
                  {
                    isCommentsExpanded && (
                      <div
                        className="mt-5 pt-5 border-t border-[#f8f3ed]"

                      >
                        {/* Add Comment Form */}
                        <div style={{ marginBottom: "20px" }}>
                          <div style={{ display: "flex", gap: "12px" }}>
                            <textarea
                              value={commentTexts[post._id] || ""}
                              onChange={(e) =>
                                setCommentTexts((prev) => ({
                                  ...prev,
                                  [post._id]: e.target.value,
                                }))
                              }
                              placeholder="Write a comment..."
                              disabled={!user}
                              className="flex-1 text-black min-h-[60px] border-2 border-[#d3d2ea] rounded-[10px] p-3 text-[14px] font-inherit resize-none outline-none transition-colors duration-200"

                              onFocus={(e) =>
                                (e.target.style.borderColor = "#7670d6")
                              }
                              onBlur={(e) =>
                                (e.target.style.borderColor = "#d3d2ea")
                              }
                            />
                            <button
                              onClick={() => handleAddComment(post._id)}
                              disabled={!user || !commentTexts[post._id]?.trim() || addCommentMutation.isPending
                              }
                              className={`flex items-center gap-[6px] rounded-[10px] px-5 py-3 text-[14px] font-semibold transition-all duration-200 h-fit border-none ${user && commentTexts[post._id]?.trim()
                                ? "bg-[#7670d6] text-white cursor-pointer"
                                : "bg-[#d3d2ea] text-white cursor-not-allowed"
                                }`}

                            >
                              <Send size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Comments List */}
                        {post.comments && post.comments.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "16px",
                            }}
                          >
                            {post.comments.map((comment) => {
                              const commentReaction = getUserCommentReaction(comment);

                              return (
                                <div key={comment._id}
                                  className="bg-[#f8f3ed] rounded-[12px] p-4">
                                  {/* Comment Header */}
                                  <div
                                    className="flex items-center gap-2 mt-2">
                                    <div
                                      className="text-[24px] w-9 h-9 flex items-center justify-center bg-white rounded-full">
                                      {getAvatar(
                                        comment.commenterName.split(" ")[0],
                                        comment.commenterName.split(" ")[1]
                                      )}
                                    </div>
                                    <div>
                                      <div
                                        className="font-semibold text-[#7670d6] text-[14px]">
                                        {comment.commenterName}
                                      </div>
                                      <div className="text-[12px] text-[#9da0dc]"
                                      >
                                        {getTimeAgo(comment.commentDate)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Comment Text */}
                                  <p className="text-[#555] text-[14px] leading-[1.6] mb-3"

                                  >
                                    {comment.commentText}
                                  </p>

                                  {/* Comment Reactions */}
                                  <div className="flex gap-2 pt-4 border-t border-[#f8f3ed] flex-wrap items-center">
                                    {/* LIKE */}
                                    <button
                                      onClick={() => handleCommentReaction(post._id, comment._id, "like")}
                                      disabled={reactToCommentMutation.isPending}
                                      className={`flex shadow-2xs hover:shadow-2xl hover:shadow-black items-center gap-[6px] px-4 py-2 rounded-[10px] border-none cursor-pointer text-[14px] font-semibold transition-all duration-200 ${userReaction === "like" ? "bg-[#7670d6]/40 backdrop-blur-sm text-[#3A3AFC]" : "bg-transparent text-[#3A3AFC]"}`}
                                    >
                                      <Image
                                        width={19}
                                        height={19}
                                        src="/icons8-like-100.png"
                                        alt="like icon"
                                        className=" shadow-2xl  shadow-black/80"
                                      />
                                      {Array.isArray(comment.totalLikes)
                                        ? comment.totalLikes.length > 0 && comment.totalLikes.length
                                        : comment.totalLikes > 0 && comment.totalLikes}
                                    </button>

                                    {/* LOVE */}
                                    <button
                                      onClick={() => handleCommentReaction(post._id, comment._id, "love")}
                                      disabled={reactToCommentMutation.isPending}
                                      className={`flex shadow-2xs hover:shadow-2xl hover:shadow-black items-center gap-[6px] px-4 py-2 rounded-[10px] border-none cursor-pointer text-[14px] font-semibold transition-all duration-200 ${userReaction === "love" ? "bg-red-500/40 text-[#DE3107]" : "bg-transparent text-[#DE3107]"}`}
                                    >                          <Image
                                        width={19}
                                        height={19}
                                        src="/icons8-hand-holding-heart-50.png"
                                        alt="like icon"
                                      />
                                      {Array.isArray(comment.totalLove)
                                        ? comment.totalLove.length > 0 && comment.totalLove.length
                                        : comment.totalLove > 0 && comment.totalLove}
                                    </button>

                                    {/* HAHA */}
                                    <button
                                      onClick={() => handleCommentReaction(post._id, comment._id, "haha")}
                                      disabled={reactToCommentMutation.isPending}
                                      className={`flex shadow-2xs hover:shadow-2xl hover:shadow-black items-center gap-[6px] px-4 py-2 rounded-[10px] border-none cursor-pointer text-[14px] font-semibold transition-all duration-200 ${commentReaction === "haha" ? "bg-yellow-400/10 text-[#FCBB3A]" : "bg-transparent text-[#FCBB3A]"}`}
                                    >
                                      <Image
                                        width={19}
                                        height={19}
                                        src="/icons8-grinning-squinting-face-32 (1).png"
                                        alt="like icon"
                                        className="shadow-2xs  hover:shadow-2xl hover:shadow-black"
                                      />
                                      {Array.isArray(comment.totalHaha)
                                        ? comment.totalHaha.length > 0 && comment.totalHaha.length
                                        : comment.totalHaha > 0 && comment.totalHaha}
                                    </button>
                                  </div>





                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* there was the style for animation */}

      <style>{`
        @media (min-width: 768px) {
          .animation-section {
            display: block !important;
          }
          body > div > div:first-child {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
        }
        @media (min-width: 1280px) {
          body > div > div:first-child {
            padding-left: 120px !important;
            padding-right: 120px !important;
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div >
  );
}




























