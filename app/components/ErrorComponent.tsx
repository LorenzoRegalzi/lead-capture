import React from 'react';

type ErrorComponentProps = {
  error: string;
  onReset: () => void;
};

export default function ErrorComponent({ error, onReset }: ErrorComponentProps) {
  return (
    <div className="text-red-600 text-center mt-4">
      {error}
      <button onClick={onReset} className="block mt-4 underline">
        Try again
      </button>
    </div>
  );
}