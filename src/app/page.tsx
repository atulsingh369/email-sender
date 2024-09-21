"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";

interface EmailConfig {
  hiringManagerEmail: string;
  jobTitle: string;
  hiringManager: string;
  companyName: string;
  seniorURL?: string;
}

interface EmailForm {
  emailConfigs: EmailConfig[];
}

const text1: string = `Hi [hiringManager],\n\nI'm eager to become your next [jobTitle]!\n\nI recently came across the [jobTitle] opening at [companyName] on LinkedIn and felt compelled to reach out. With my 1.2 years of experience in [Industry], coupled with my skills in [Skills], I beleive I'd be an excellent fit for your team. \n\nPlease find my resume and portfolio attached for your review. I'm really looking forward to discusssing how I can bring fresh ideas to your team, particularly in [Industry].\n\n Excited about the possibility of working together!\n\n\Best, \n\nAtul Kumar Singh\nSoftware Developer\nhttps://www.linkedin.com/in/atulsingh369\n\nVisit my LinkTree\nhttps://linktr.ee/atulsingh369`;
const text2: string = `Dear [hiringManager],\n\nI hope this message finds you well. I am writing to express my interest in the [jobTitle] position at [companyName] that I discovered through linkedin.\n\nWith 1.2 years of experience in [Industry], I am confident in my ability to contribute effectively to your team and believe my skills in [Skills] align well with the requirements of the role.\n\nThank you for considering my application. I have attached my resume for your review. I would welcome the opportunity to discuss how my background, skills, and passion for [Industry] make me a strong candidate for this position.\n\nI look forward to hearing from you soon.\n\nBest regards,\n\nAtul Kumar Singh\nSoftware Developer\nhttps://www.linkedin.com/in/atulsingh369\n\nVisit my LinkTree\nhttps://linktr.ee/atulsingh369`;

const referralText: string = `Dear [Name],\n\nI hope this email finds you well. My name is Atul Kumar Singh, and I'm a Software Developer with experience in full-stack development, particularly in web technologies and agile methodologies. I came across your profile on [LinkedIn/Company Website] and was impressed by your work at [Company Name].\n\nI'm reaching out because I'm very interested in joining [Company Name] as a Software Developer. Your insights into the company culture and work environment would be invaluable to me. I was wondering if you might have a few minutes to chat about your experience at [Company Name] and any potential opportunities that might be a good fit for someone with my background?.\n\nFor context, here's a brief overview of my experience:\n\n • 1+ year of full-stack development experience.\n • Proficient in Angular, React, Node.js, and cloud platforms like AWS\n • Implemented Agile methodologies, improving team efficiency by 80%\n • Developed projects that increased productivity by over 100%\n\nI've attached my resume for your reference. If you feel there might be a suitable role for me at [Company Name], I would be incredibly grateful if you could refer me or point me in the right direction.\n\nThank you for your time and consideration. I look forward to the possibility of connecting with you.\n\nBest regards,\n\nAtul Kumar Singh\nSoftware Developer\n+91 7518299883\nhttps://www.linkedin.com/in/atulsingh369\n\nVisit my LinkTree\nhttps://linktr.ee/atulsingh369`;

const textSamples: string[] = [text1, text2];

export default function Home() {
  const router = useRouter();
  const [emailStatus, setEmailStatus] = useState<string>("");
  const [textidx, setTextidx] = useState<number>(0);
  const [referral, setReferral] = useState<boolean>(false);
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
    setEmailStatus("Sending...");
    try {
      const newData = { ...data, index: textidx, isReferral: referral };
      const response = await fetch("/api/send-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
          setEmailStatus(`Failed to send emails: ${errorJson.message}`);
        } catch (parseError) {
          console.error("Error parsing response:", errorText);
          setEmailStatus(`Failed to send emails: ${response.statusText}`);
        }
      } else {
        const result = await response.json();
        setEmailStatus(result.message || "Emails sent successfully!");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      setEmailStatus(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const checkReply = async () => {
    setEmailStatus("Checking...");
    try {
      const response = await fetch("/api/check-replies", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
          setEmailStatus(`Failed check replies: ${errorJson.message}`);
        } catch (parseError) {
          console.error("Error parsing response:", errorText);
          setEmailStatus(`Failed check replies: ${response.statusText}`);
        }
      } else {
        const result = await response.json();
        setEmailStatus(result.message || "Replies Checked Succesfully");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      setEmailStatus(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const scanJobs = async () => {
    setEmailStatus("Scanning...");
    try {
      const response = await fetch("/api/scan-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: textidx }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
          setEmailStatus(`Failed scan and send mails: ${errorJson.message}`);
        } catch (parseError) {
          console.error("Error parsing response:", errorText);
          setEmailStatus(`Failed scan and send mails: ${response.statusText}`);
        }
      } else {
        const result = await response.json();
        setEmailStatus(result.message || "Scanned and Sent Mail Succesfully");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      setEmailStatus(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const bouncedMails = async () => {
    setEmailStatus("Checking...");
    try {
      const response = await fetch("/api/bounced-mails", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
          setEmailStatus(`Failed check bounced: ${errorJson.message}`);
        } catch (parseError) {
          console.error("Error parsing response:", errorText);
          setEmailStatus(`Failed check bounced: ${response.statusText}`);
        }
      } else {
        const result = await response.json();
        setEmailStatus(result.message || "Bounced Mails Checked Succesfully");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      setEmailStatus(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">
          JobNexus - Email Sender
        </h1>

        <div className="text-lg flex justify-between items-center bg-transparent border border-gray-300 shadow-md rounded px-6 pt-4 pb-8 mb-4">
          {textSamples.length > 0 &&
            !referral &&
            textSamples.map((text, index) => (
              <div
                key={index}
                onClick={() => setTextidx(index)}
                className="bg-white cursor-pointer m-2 hover:bg-gray-100 text-black border border-gray-300 w-1/2 shadow-md rounded px-8 pt-6 pb-8 mb-4 flex items-center justify-between"
              >
                <input
                  disabled={referral}
                  checked={textidx === index ? true : false}
                  type="radio"
                />
                <p className="text-start h-56 overflow-scroll w-10/12 whitespace-pre-line">
                  {text}
                </p>
              </div>
            ))}

          {referral && (
            <div className="bg-white cursor-pointer m-2 hover:bg-gray-100 text-black border border-gray-300 w-full shadow-md rounded px-8 pt-6 pb-8 mb-4 flex items-center justify-between">
              <input checked={true} type="radio" />
              <p className="text-start h-56 overflow-scroll w-10/12 whitespace-pre-line">
                {referralText}
              </p>
            </div>
          )}
        </div>
        <p className={`text-center text-lg font-bold my-4`}>
          {referral ? "Selected Text - Referral" : `Selected Text - ${textidx}`}
        </p>

        <div className="flex justify-center my-5 items-center">
          <button
            type="button"
            onClick={() => setReferral(!referral)}
            className={`${
              referral
                ? "bg-green-500 hover:bg-green-700"
                : "bg-indigo-500 hover:bg-indigo-700"
            } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
          >
            {referral ? "Back to Mail" : "Asking Referral ??"}
          </button>
        </div>

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
                placeholder={`${
                  referral ? "Senior Adrress" : "Hiring Manager Address"
                }`}
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
                  placeholder={`${
                    referral ? "Senior Name" : "Hiring Manager Name"
                  }`}
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

              {referral && (
                <input
                  {...register(`emailConfigs.${index}.seniorURL`, {
                    required: "Senior link URL is required",
                  })}
                  placeholder="Senior LinkedIn URL"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
                />
              )}
              {errors.emailConfigs?.[index]?.seniorURL && (
                <p className="text-red-500 text-xs italic">
                  {errors.emailConfigs[index]?.seniorURL?.message}
                </p>
              )}

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
              type="button"
              onClick={checkReply}
              className="bg-amber-500 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Check Replies
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Send Emails
            </button>
          </div>
        </form>
        {emailStatus && (
          <p className="mt-4 text-center font-bold text-lg">{emailStatus}</p>
        )}

        <div className="flex justify-evenly items-center mt-5">
          <button
            type="button"
            onClick={() => router.push("/search-jobs")}
            className="bg-fuchsia-500 hover:bg-fuchsia-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Go to Search Job
          </button>
          <button
            type="button"
            onClick={scanJobs}
            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Scan and Send Mail
          </button>
          <button
            type="button"
            onClick={bouncedMails}
            className="bg-rose-500 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Search Bounced Mails
          </button>
        </div>
      </div>
    </>
  );
}
