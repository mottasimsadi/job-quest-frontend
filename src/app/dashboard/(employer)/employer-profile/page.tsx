"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import companyImage from '@/../public/placeholder-company.jpg'

interface Address {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

interface Employer {
    _id: string;
    firstName?: string;
    LastName?: string;
    name?: string;
    email: string;
    phone?: string;
    companyName?: string;
    companyDescription?: string;
    designation?: string;
    website?: string;
    industry?: string;
    companySize?: string;
    establishedYear?: number;
    address?: Address;
    profileImage?: string;
    companyLogo?: string;
    jobsPosted?: { _id: string; jobTitle: string }[];
}

export default function EmployerProfilePage() {
    const { id } = useParams();
    const [employer, setEmployer] = useState<Employer | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Employer>>({});

    useEffect(() => {
        const fetchEmployer = async () => {
            try {
                const res = await fetch(`https://job-portal-backend-xshy.onrender.com/api/employers/${id}`);
                const data = await res.json();
                setEmployer(data);
            } catch (error) {
                console.error("Failed to fetch employer:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchEmployer();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        try {
            const res = await fetch(`https://job-portal-backend-xshy.onrender.com/api/employers/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const updated = await res.json();
            setEmployer(updated);
            setIsEditing(false);
            alert("✅ Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update:", error);
            alert("❌ Update failed. Please try again.");
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-screen text-gray-500 dark:text-gray-300">
                Loading employer details...
            </div>
        );

    if (!employer)
        return (
            <div className="flex justify-center items-center h-screen text-red-500">
                Employer not found
            </div>
        );


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="max-w-5xl mx-auto p-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
                    {employer.companyLogo ? (
                        <img
                            src={employer.companyLogo}
                            alt="Company Logo"
                            width={100}
                            height={100}
                            className="rounded-xl shadow-lg object-cover"
                        />
                    ) : (
                        <img
                            src={companyImage.src}
                            alt="Company Logo"
                            width={100}
                            height={100}
                            className="rounded-xl shadow-lg object-cover"
                        />
                    )}
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">
                            {employer.companyName || "Unknown Company"}
                        </h1>
                        {employer.address && (
                            <p className="text-gray-600 dark:text-gray-300">
                                <strong>Address:</strong>{" "}
                                {[
                                    employer.address.street,
                                    employer.address.city,
                                    employer.address.state,
                                    employer.address.country,
                                ]
                                    .filter(Boolean)
                                    .join(", ")}
                            </p>
                        )}
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            {employer.industry || "No industry info"} ·{" "}
                            {employer.companySize || "N/A"} employees
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <strong>Website:</strong>{" "}
                            {employer.website ? (
                                <a
                                    href={employer.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-500 hover:underline"
                                >
                                    {employer.website}
                                </a>
                            ) : (
                                "N/A"
                            )}
                        </p>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Established in {employer.establishedYear || "N/A"}
                        </p>

                    </div>
                </div>

                {/* Profile Info */}
                <div className="flex flex-col md:flex-row gap-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    {employer.profileImage ? (
                        <img
                            src={employer.profileImage}
                            alt="Employer Image"
                            width={100}
                            height={100}
                            className="rounded-xl shadow-lg object-cover"
                        />
                    ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 flex items-center justify-center text-gray-500">
                            No Image
                        </div>
                    )}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                            Employer Details
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            <strong>Name:</strong> {employer.name || "N/A"}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                            <strong>Email:</strong> {employer.email}
                        </p>
                        {employer.phone && (
                            <p className="text-gray-600 dark:text-gray-300">
                                <strong>Phone:</strong> {employer.phone}
                            </p>
                        )}
                        {employer.designation && (
                            <p className="text-gray-600 dark:text-gray-300">
                                <strong>Designation:</strong> {employer.designation}
                            </p>
                        )}
                    </div>
                </div>

                {/* Description */}
                {employer.companyDescription && (
                    <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                            Company Description
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {employer.companyDescription}
                        </p>
                    </div>
                )}

                {/* Jobs Posted */}
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                        Jobs Posted
                    </h2>
                    {employer.jobsPosted && employer.jobsPosted.length > 0 ? (
                        <ul className="space-y-2">
                            {employer.jobsPosted.map((job) => (
                                <li
                                    key={job._id}
                                    className="p-3 border dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    {job.jobTitle || "Untitled Job"}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">
                            No jobs posted yet.
                        </p>
                    )}
                </div>
            </div>
            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-[90%] md:w-[600px]">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                            Update Employer Info
                        </h2>

                        <div className="grid grid-cols-1 gap-4">
                            <input
                                name="companyName"
                                value={formData.companyName || ""}
                                onChange={handleChange}
                                placeholder="Company Name"
                                className="p-2 rounded-md border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            />
                            <input
                                name="phone"
                                value={formData.phone || ""}
                                onChange={handleChange}
                                placeholder="Phone"
                                className="p-2 rounded-md border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            />
                            <input
                                name="website"
                                value={formData.website || ""}
                                onChange={handleChange}
                                placeholder="Website"
                                className="p-2 rounded-md border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            />
                            <textarea
                                name="companyDescription"
                                value={formData.companyDescription || ""}
                                onChange={handleChange}
                                placeholder="Company Description"
                                className="p-2 rounded-md border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 min-h-[100px]"
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 transition"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}