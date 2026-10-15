import { Link } from 'react-router-dom';

export default function PaymentResult({ status }) {
  const messages = {
    success: {
      title: 'Payment successful!',
      body: 'Your subscription has been activated. You can now enjoy all the features of your plan.',
      color: 'text-green-700'
    },
    failed: {
      title: 'Payment failed',
      body: 'Something went wrong with the payment. Please try again or contact support.',
      color: 'text-red-700'
    },
    cancel: {
      title: 'Payment cancelled',
      body: 'You cancelled the payment. No charges were made.',
      color: 'text-amber-700'
    }
  };

  const msg = messages[status] || messages.failed;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-md text-center">
        <h1 className={`text-2xl font-bold ${msg.color}`}>{msg.title}</h1>
        <p className="mt-3 text-gray-600">{msg.body}</p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-block">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
