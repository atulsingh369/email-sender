"use client";

import React, { useState } from "react";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";

interface EmailConfig {
  hiringManagerEmail: string;
  jobTitle: string;
  hiringManager: string;
  companyName: string;
}

interface EmailForm {
  emailConfigs: EmailConfig[];
}

export default function Home() {
  const [status, setStatus] = useState<string>("");
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailForm>({
    defaultValues: {
      emailConfigs: [
        {
          hiringManagerEmail: "",
          jobTitle: "",
          hiringManager: "",
          companyName: "",
        },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "emailConfigs",
  });

  const onSubmit: SubmitHandler<EmailForm> = async (data) => {
    setStatus("Sending...");
    try {
      const response = await fetch("/api/send-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
          setStatus(`Failed to send emails: ${errorJson.message}`);
        } catch (parseError) {
          console.error("Error parsing response:", errorText);
          setStatus(`Failed to send emails: ${response.statusText}`);
        }
      } else {
        const result = await response.json();
        setStatus(result.message || "Emails sent successfully!");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      setStatus(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Mail Wave</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-transparent border border-gray-300 shadow-md rounded px-8 pt-6 pb-8 mb-4"
          >
              <input
                {...register(`emailConfigs.${index}.hiringManagerEmail`, {
                  required: "Hiring Manager address is required",
                })}
                placeholder="Hiring Manager Address"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
              />
              {errors.emailConfigs?.[index]?.hiringManagerEmail && (
                <p className="text-red-500 text-xs italic">
                  {errors.emailConfigs[index]?.hiringManagerEmail?.message}
                </p>
              )}

            <div className="flex flex-row justify-between items-center w-full">
              <input
                {...register(`emailConfigs.${index}.jobTitle`, {
                  required: "Job Title is required",
                })}
                placeholder="Job Title"
                className="shadow appearance-none border rounded w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
              />
              {errors.emailConfigs?.[index]?.jobTitle && (
                <p className="text-red-500 text-xs italic">
                  {errors.emailConfigs[index]?.jobTitle?.message}
                </p>
              )}

              <input
                {...register(`emailConfigs.${index}.hiringManager`, {
                  required: "Hiring Manager is required",
                })}
                placeholder="Hiring Manager Name"
                className="shadow appearance-none border rounded w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
              />
              {errors.emailConfigs?.[index]?.hiringManager && (
                <p className="text-red-500 text-xs italic">
                  {errors.emailConfigs[index]?.hiringManager?.message}
                </p>
              )}

              <input
                {...register(`emailConfigs.${index}.companyName`, {
                  required: "Company Name is required",
                })}
                placeholder="Company Name"
                className="shadow appearance-none border rounded w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
              />
              {errors.emailConfigs?.[index]?.companyName && (
                <p className="text-red-500 text-xs italic">
                  {errors.emailConfigs[index]?.companyName?.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Remove
            </button>
          </div>
        ))}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() =>
              append({
                hiringManagerEmail: "",
                jobTitle: "",
                hiringManager: "",
                companyName: "",
              })
            }
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Add Email
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Send Emails
          </button>
        </div>
      </form>
      {status && <p className="mt-4 text-center font-bold text-lg">{status}</p>}
    </div>
  );
}
