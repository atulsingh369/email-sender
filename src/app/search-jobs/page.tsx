"use client";

import { useState, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";
import axios from "axios";

interface Job {
  source: string;
  title: string;
  company: string;
  location: string;
  url: string;
  skills: string[];
  status?: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({ source: "", location: "" });
  const [updateStatus, setUpdateStatus] = useState<{ [key: string]: string }>(
    {}
  );

  const searchJobs = useCallback(
    async (newSearch: boolean = false) => {
      if (!debouncedQuery) return;

      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/search-jobs?query=${encodeURIComponent(debouncedQuery)}&page=${
            newSearch ? 1 : page
          }`
        );
        if (!response.ok) throw new Error("Failed to fetch jobs");
        const data = await response.json();
        setJobs(newSearch ? data.jobs : [...jobs, ...data.jobs]);
        setHasMore(data.hasMore);
        if (newSearch) setPage(1);
        else setPage(page + 1);
      } catch (error) {
        setError(
          "An error occurred while searching for jobs. Please try again."
        );
      }
      setLoading(false);
    },
    [debouncedQuery, page]
  );

  // Debounce the query update
  const debouncedSetQuery = useCallback(
    debounce((value: string) => {
      setDebouncedQuery(value);
    }, 500),
    []
  );

  // Update the query state immediately for the input field
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    debouncedSetQuery(e.target.value);
  };

  // Effect to trigger search when debouncedQuery changes
  useEffect(() => {
    if (debouncedQuery) {
      searchJobs(true);
    }
  }, [debouncedQuery, searchJobs]);

  const handleStatusUpdate = async (jobUrl: string) => {
    const status = updateStatus[jobUrl];
    if (!status) return;

    try {
      const response = await fetch("/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl, status }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      setJobs(
        jobs.map((job) => (job.url === jobUrl ? { ...job, status } : job))
      );

      setUpdateStatus({ ...updateStatus, [jobUrl]: "" });
    } catch (error) {
      setError(
        "An error occurred while updating the application status. Please try again."
      );
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      (filters.source === "" || job.source === filters.source) &&
      (filters.location === "" ||
        job.location.toLowerCase().includes(filters.location.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Job Search Tool
        </h1>

        <div className="bg-transparent shadow-md rounded-lg p-6 mb-8">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            className="w-full mb-4 p-3 border border-gray-300 text-gray-700 leading-tight rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter job search query"
          />

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
            <select
              value={filters.source}
              onChange={(e) =>
                setFilters({ ...filters, source: e.target.value })
              }
              className="w-full sm:w-1/3 p-3 border border-gray-300 text-gray-700 leading-tight rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sources</option>
              <option value="GitHub">GitHub</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Indeed">Indeed</option>
              <option value="Naukri">Naukri</option>
            </select>
            <input
              type="text"
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
              className="w-full sm:w-2/3 p-3 border border-gray-300 text-gray-700 leading-tight rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by location"
            />
          </div>
        </div>

        {loading && (
          <div className="text-center text-gray-600 mb-4">
            Searching for jobs...
          </div>
        )}
        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

        <div className="space-y-6">
          {filteredJobs.map((job, index) => (
            <div key={index} className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {job.title}
              </h2>
              <p className="text-gray-600 mb-2">
                {job.company} - {job.location}
              </p>
              <p className="text-sm text-gray-500 mb-2">Source: {job.source}</p>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline mb-2 inline-block"
              >
                View Job
              </a>
              <p className="text-gray-700 mb-4">
                Skills: {job.skills.join(", ")}
              </p>

              <div className="flex items-center space-x-2">
                <select
                  value={updateStatus[job.url] || ""}
                  onChange={(e) =>
                    setUpdateStatus({
                      ...updateStatus,
                      [job.url]: e.target.value,
                    })
                  }
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Update Status</option>
                  <option value="Applied">Applied</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offer Received">Offer Received</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button
                  onClick={() => handleStatusUpdate(job.url)}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200"
                >
                  Update
                </button>
              </div>

              {job.status && (
                <p className="mt-2 text-sm font-semibold text-gray-700">
                  Current Status: {job.status}
                </p>
              )}
            </div>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => searchJobs()}
            className="mt-8 w-full bg-gray-200 text-gray-800 p-3 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        )}
      </div>
    </main>
  );
}
