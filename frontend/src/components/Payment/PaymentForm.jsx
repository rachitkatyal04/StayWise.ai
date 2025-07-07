import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const STRIPE_KEY =
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51RhquJC4lBEDY7rxtHPimvPM76T0UzjupllbUeUWPcp4O9WT2YPoI0w7KSG9byTB8cWKJF2wupUGUNTlR5gZIHrm00ovZkSPdJ";
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

const PaymentFormContent = ({ amount, bookingId }) => {
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-confirmation/${bookingId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        setError(`Payment failed: ${error.message}`);
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setSucceeded(true);
        setProcessing(false);

        // Start countdown timer
        let timeLeft = 5;
        const countdownInterval = setInterval(() => {
          timeLeft -= 1;
          setCountdown(timeLeft);

          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            navigate("/my-bookings");
          }
        }, 1000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setProcessing(false);
      console.error("Payment error:", err);
    }
  };

  // PaymentElement doesn't need custom styling like CardElement

  if (!stripe || !elements) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading payment form...</p>
      </div>
    );
  }

  // Show success screen when payment is completed
  if (succeeded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your booking has been confirmed successfully.
          </p>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-semibold text-lg">
                ₹{amount?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">Stripe</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 mb-2">
              Redirecting to your bookings in:
            </p>
            <div className="text-3xl font-bold text-blue-600">{countdown}s</div>
          </div>

          {/* Manual Navigation Button */}
          <button
            onClick={() => navigate("/my-bookings")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            View My Bookings Now
          </button>

          {/* Additional Actions */}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => navigate("/")}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Side - Payment Form */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Complete your booking
            </h1>
            <p className="text-gray-600">Secure payment powered by Stripe</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Express Payment Methods */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Express checkout</h3>
              <div className="space-y-3">
                {stripe && elements ? (
                  <PaymentElement
                    options={{
                      layout: {
                        type: "accordion",
                        defaultCollapsed: false,
                        radios: false,
                        spacedAccordionItems: true,
                      },
                      paymentMethodOrder: ["apple_pay", "google_pay", "card"],
                      fields: {
                        billingDetails: {
                          name: "auto",
                          email: "auto",
                          phone: "auto",
                          address: {
                            country: "auto",
                            line1: "auto",
                            line2: "auto",
                            city: "auto",
                            state: "auto",
                            postalCode: "auto",
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">
                      Loading payment methods...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Payment Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="submit"
              disabled={!stripe || !elements || processing || succeeded}
              className={`w-full py-4 px-6 rounded-lg text-white font-semibold text-lg transition-colors ${
                !stripe || !elements || processing || succeeded
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              }`}
            >
              {processing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing payment...
                </span>
              ) : (
                `Complete payment • ₹${amount?.toLocaleString()}`
              )}
            </button>

            {/* Security Info */}
            <div className="text-center text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secured by Stripe • SSL encrypted</span>
              </div>
            </div>
          </form>
        </div>

        {/* Right Side - Order Summary */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="bg-gray-50 border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Hotel booking</span>
                <span className="font-medium">₹{amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes & fees</span>
                <span className="font-medium">Included</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>₹{amount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <svg
                  className="h-4 w-4 text-green-500 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Free cancellation up to 24 hours before check-in</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg
                  className="h-4 w-4 text-green-500 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Instant confirmation</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg
                  className="h-4 w-4 text-green-500 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>24/7 customer support</span>
              </div>
            </div>
          </div>

          {/* Payment Methods Accepted */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 mb-2">We accept</p>
            <div className="flex justify-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                  VISA
                </div>
                <div className="w-8 h-5 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">
                  MC
                </div>
                <div className="w-8 h-5 bg-blue-400 rounded text-white text-xs flex items-center justify-center font-bold">
                  AMEX
                </div>
                <div className="w-8 h-5 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">
                  UPI
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component to provide Stripe context
const StripePaymentForm = ({ amount, bookingId }) => {
  const [clientSecret, setClientSecret] = useState("");

  // Create PaymentIntent for the PaymentElement
  useEffect(() => {
    if (!amount || !bookingId) return;

    console.log("🚀 Creating payment intent for:", { amount, bookingId });

    const createPaymentIntent = async () => {
      try {
        const response = await api.post("/payment/create-payment-intent", {
          amount,
          bookingId,
        });
        console.log("💳 Payment intent response:", response);
        setClientSecret(response.clientSecret);
      } catch (err) {
        console.error("❌ Payment intent creation error:", err);
      }
    };
    createPaymentIntent();
  }, [amount, bookingId]);

  if (!STRIPE_KEY) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <h3 className="font-semibold mb-2">Payment Not Available</h3>
          <p>
            The payment system is currently unavailable. Please try again later
            or contact support.
          </p>
        </div>
      </div>
    );
  }

  console.log(
    "🔑 Client Secret:",
    clientSecret ? "✅ Available" : "❌ Missing"
  );

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#3b82f6",
        fontFamily: "Arial, sans-serif",
      },
    },
    loader: "auto",
  };

  return (
    <div>
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <PaymentFormContent amount={amount} bookingId={bookingId} />
        </Elements>
      )}
      {!clientSecret && (
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading payment options...</p>
        </div>
      )}
    </div>
  );
};

export default StripePaymentForm;
