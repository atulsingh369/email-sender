'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';

interface EmailConfig {
  to: string;
  subject: string;
  text: string;
}

interface EmailForm {
  emailConfigs: EmailConfig[];
}


export default function Home() {
  const [status, setStatus] = useState<string>('');
  const { register, control, handleSubmit, formState: { errors } } = useForm<EmailForm>({
    defaultValues: {
      emailConfigs: [{ to: '', subject: '', text: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emailConfigs',
  });

  const onSubmit: SubmitHandler<EmailForm> = async (data) => {
    setStatus('Sending...');
    try {
      const response = await fetch('/api/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
          setStatus(`Failed to send emails: ${errorJson.message}`);
        } catch (parseError) {
          console.error('Error parsing response:', errorText);
          setStatus(`Failed to send emails: ${response.statusText}`);
        }
      } else {
        const result = await response.json();
        setStatus(result.message || 'Emails sent successfully!');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      setStatus(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
  <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Email Sender</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <input
              {...register(`emailConfigs.${index}.to`, { required: 'To address is required' })}
              placeholder="To"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
            />
            {errors.emailConfigs?.[index]?.to && <p className="text-red-500 text-xs italic">{errors.emailConfigs[index]?.to?.message}</p>}
            
            <input
              {...register(`emailConfigs.${index}.subject`, { required: 'Subject is required' })}
              placeholder="Subject"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
            />
            {errors.emailConfigs?.[index]?.subject && <p className="text-red-500 text-xs italic">{errors.emailConfigs[index]?.subject?.message}</p>}
            
            <textarea
              {...register(`emailConfigs.${index}.text`, { required: 'Email content is required' })}
              placeholder="Email content"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
            />
            {errors.emailConfigs?.[index]?.text && <p className="text-red-500 text-xs italic">{errors.emailConfigs[index]?.text?.message}</p>}
            
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
            onClick={() => append({ to: '', subject: '', text: '' })}
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