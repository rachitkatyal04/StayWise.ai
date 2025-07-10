import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { tripPlanningAPI } from "../../services/api";

const AIChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your StayWise AI assistant. I can help you with hotel bookings, recommendations, amenities, and more. How can I assist you today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Enhanced AI Response Logic for Hotel-Related Queries
  const generateAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase();

    // Extract location from message
    const getLocationFromMessage = (msg) => {
      const locations = [
        "goa",
        "mumbai",
        "delhi",
        "bangalore",
        "chennai",
        "hyderabad",
        "pune",
        "kolkata",
        "jaipur",
        "udaipur",
        "agra",
        "kerala",
        "kashmir",
        "manali",
        "shimla",
        "rishikesh",
        "haridwar",
        "varanasi",
        "pushkar",
        "jodhpur",
        "mysore",
        "ooty",
        "darjeeling",
        "gangtok",
        "ladakh",
        "mcleodganj",
        "kochi",
        "alleppey",
        "munnar",
        "coorg",
        "hampi",
        "pondicherry",
      ];

      for (let location of locations) {
        if (msg.includes(location)) {
          return location.charAt(0).toUpperCase() + location.slice(1);
        }
      }
      return null;
    };

    const location = getLocationFromMessage(message);

    // Specific location queries - highest priority
    if (
      (message.includes("hotel") ||
        message.includes("want") ||
        message.includes("need") ||
        message.includes("find")) &&
      location
    ) {
      return `Great choice! ${location} is a fantastic destination! 🏨\n\nI can help you find perfect hotels in ${location}. Here's what I suggest:\n\n• Browse our curated ${location} hotels with real-time availability\n• Use our SmartStay AI for personalized recommendations\n• Filter by budget, amenities, or guest ratings\n• Compare prices and read verified reviews\n\nWhat type of experience are you looking for in ${location}? (Budget-friendly, luxury, family-friendly, business travel, romantic getaway)`;
    }

    // Hotel search without specific location
    if (
      (message.includes("hotel") || message.includes("want")) &&
      (message.includes("find") ||
        message.includes("search") ||
        message.includes("look"))
    ) {
      return "I'd love to help you find the perfect hotel! 🔍\n\nTo give you the best recommendations, could you tell me:\n\n• Which city/destination are you interested in?\n• Your preferred check-in and check-out dates?\n• Number of guests?\n• Budget range (if any)?\n• Any specific amenities you need?\n\nOnce I know these details, I can guide you to exactly what you're looking for!";
    }

    // Hotel booking related responses
    if (message.includes("book") || message.includes("reservation")) {
      return "Perfect! I'll help you with your booking! 📝\n\nHere's how our booking process works:\n\n1️⃣ Search hotels by location and dates\n2️⃣ Compare options and read reviews\n3️⃣ Select your preferred room\n4️⃣ Enter guest details\n5️⃣ Secure payment via Stripe\n6️⃣ Instant confirmation email\n\nDo you already have a specific hotel in mind, or would you like me to help you find options first?";
    }

    // Hotel recommendations
    if (
      message.includes("recommend") ||
      message.includes("suggest") ||
      message.includes("best")
    ) {
      return `I'd be happy to recommend hotels! 🌟\n\nOur SmartStay AI provides personalized recommendations based on:\n\n• Your travel preferences and history\n• Location and proximity to attractions\n• Guest reviews and ratings\n• Price range and value for money\n• Available amenities\n\nFor the best recommendations, could you share:\n• Your destination?\n• Travel dates?\n• What type of traveler are you? (Business, Family, Couple, Solo, Adventure)`;
    }

    // Budget and pricing queries - enhanced pattern matching
    if (
      message.includes("price") ||
      message.includes("cost") ||
      message.includes("cheap") ||
      message.includes("expensive") ||
      message.includes("budget") ||
      message.includes("affordable") ||
      message.includes("money") ||
      message.includes("rupee") ||
      message.includes("₹") ||
      message.includes("friendly") ||
      /budget\s*friendly/.test(message) ||
      /low\s*cost/.test(message) ||
      /good\s*deal/.test(message)
    ) {
      const budgetType =
        message.includes("cheap") ||
        message.includes("budget") ||
        message.includes("affordable") ||
        message.includes("friendly") ||
        /budget\s*friendly/.test(message) ||
        /low\s*cost/.test(message)
          ? "budget-friendly"
          : message.includes("expensive") ||
            message.includes("luxury") ||
            message.includes("premium")
          ? "luxury"
          : "all price ranges";

      if (budgetType === "budget-friendly") {
        return `Perfect! I'll help you find amazing budget-friendly hotels! 💰✨\n\n🏨 **Budget Hotel Options (₹1,000-₹3,000/night):**\n• Clean, comfortable accommodations\n• Essential amenities (WiFi, AC, TV)\n• Great locations near transport\n• Verified guest reviews\n• No hidden charges\n\n💡 **Money-Saving Tips:**\n• Book 15+ days in advance for best rates\n• Check for weekday discounts\n• Look for properties with free breakfast\n• Consider shared accommodations\n\n🎯 **Next Steps:**\nTell me your destination and dates, and I'll show you the best budget-friendly options available!\n\nWhich city are you planning to visit?`;
      } else if (budgetType === "luxury") {
        return `Excellent choice for a luxury experience! 🌟👑\n\n🏨 **Premium Hotels (₹8,000-₹20,000+/night):**\n• 5-star amenities and service\n• Spa, fine dining, concierge\n• Premium locations and views\n• Luxury room amenities\n• Exclusive experiences\n\n✨ **Luxury Features:**\n• Private pools and exclusive access\n• Multi-cuisine restaurants\n• Spa and wellness centers\n• Butler and concierge services\n• Airport transfers included\n\nWhich destination are you considering for your luxury getaway?`;
      } else {
        return `Great question about pricing! 💰\n\nWe offer accommodations across all budgets:\n\n• **Budget Hotels:** ₹1,000-₹3,000 per night\n• **Mid-range Hotels:** ₹3,000-₹8,000 per night  \n• **Premium Hotels:** ₹8,000-₹20,000+ per night\n\n📊 **Price Factors:**\n• Location and season\n• Room type and amenities\n• Advance booking discounts\n• Special offers and packages\n\nWhat's your preferred budget range? I can show you the best options within your budget!`;
      }
    }

    // Amenities and facilities
    if (
      message.includes("amenities") ||
      message.includes("facilities") ||
      message.includes("wifi") ||
      message.includes("pool") ||
      message.includes("gym") ||
      message.includes("spa") ||
      message.includes("restaurant")
    ) {
      const requestedAmenity = message.includes("wifi")
        ? "Free WiFi"
        : message.includes("pool")
        ? "Swimming Pool"
        : message.includes("gym")
        ? "Fitness Center"
        : message.includes("spa")
        ? "Spa Services"
        : message.includes("restaurant")
        ? "Restaurant"
        : "amenities";

      return `Absolutely! ${requestedAmenity} is important for a great stay! 🏊‍♂️\n\nOur hotels offer premium amenities including:\n\n• Free high-speed WiFi\n• Swimming pools & fitness centers\n• Spa and wellness services\n• Multi-cuisine restaurants\n• 24/7 room service\n• Business centers\n• Parking facilities\n• Airport transfers\n\nYou can filter hotels by specific amenities when searching. Which amenities are most important for your stay?`;
    }

    // Location and destination queries
    if (
      message.includes("where") ||
      message.includes("destination") ||
      message.includes("city") ||
      message.includes("place")
    ) {
      return "We have amazing hotels across India's top destinations! 🇮🇳\n\n🏖️ **Beach Destinations:** Goa, Kerala, Pondicherry\n🏔️ **Hill Stations:** Manali, Shimla, Ooty, Darjeeling\n🏛️ **Cultural Cities:** Delhi, Agra, Jaipur, Varanasi\n🌆 **Metro Cities:** Mumbai, Bangalore, Chennai, Hyderabad\n⛰️ **Adventure:** Ladakh, Rishikesh, Mcleodganj\n\nWhich type of destination interests you? I can provide detailed recommendations for any location!";
    }

    // Greeting responses
    if (
      message.includes("hello") ||
      message.includes("hi") ||
      message.includes("hey") ||
      message.includes("good")
    ) {
      const timeGreeting =
        new Date().getHours() < 12
          ? "Good morning"
          : new Date().getHours() < 17
          ? "Good afternoon"
          : "Good evening";

      return user
        ? `${timeGreeting}, ${user.name}! 🌟\n\nWelcome back to StayWise! I'm here to help you find amazing hotels and manage your bookings.\n\nWhat can I help you with today?\n• Find hotels for your next trip\n• Check your existing bookings\n• Get travel recommendations\n• Answer any questions about our services`
        : `${timeGreeting}! Welcome to StayWise! 🏨\n\nI'm your AI travel assistant, ready to help you find and book perfect accommodations!\n\n🎯 **I can help you with:**\n• Hotel search and recommendations\n• Booking assistance\n• Travel planning advice\n• Pricing and availability\n• Account support\n\nWhat destination are you planning to visit?`;
    }

    // General help and support
    if (
      message.includes("help") ||
      message.includes("support") ||
      message.includes("assist")
    ) {
      return "I'm here to provide complete travel assistance! 🆘\n\n📚 **I can help you with:**\n\n🏨 **Hotel Services:**\n• Search hotels by location/dates\n• Compare prices and amenities\n• Read reviews and ratings\n• Make and manage bookings\n\n🎯 **Personalized Features:**\n• SmartStay AI recommendations\n• Travel style profiling\n• Budget-based suggestions\n• Wishlist management\n\n💡 **Expert Advice:**\n• Best time to visit destinations\n• Local attractions and activities\n• Travel tips and suggestions\n\nWhat specific topic would you like help with?";
    }

    // Travel planning queries
    if (
      message.includes("plan") ||
      message.includes("trip") ||
      message.includes("travel") ||
      message.includes("vacation")
    ) {
      return "Excellent! I love helping plan amazing trips! ✈️🗺️\n\n📋 **Let's Plan Your Perfect Trip:**\n\n1️⃣ **Destination:** Where would you like to go?\n2️⃣ **Duration:** How many days/nights?\n3️⃣ **Travel Dates:** When are you planning to travel?\n4️⃣ **Group Size:** Solo, couple, family, or group?\n5️⃣ **Budget:** What's your accommodation budget?\n6️⃣ **Experience:** Relaxation, adventure, culture, business?\n\n🎯 **I'll provide:**\n• Perfect hotel recommendations\n• Local attractions near your hotel\n• Best areas to stay\n• Seasonal travel tips\n\nTell me about your dream destination!";
    }

    // Enhanced default response for unrecognized queries
    return `I understand you're interested in travel and hotels! 🏨\n\nWhile I'm specialized in StayWise services, I'm here to help with:\n\n🔍 **Hotel Search:** "Find hotels in [city]"\n💰 **Pricing:** "What are hotel prices in [location]?"\n🎯 **Recommendations:** "Suggest hotels for [type of trip]"\n📝 **Bookings:** "How do I book a hotel?"\n⭐ **Reviews:** "How do I check hotel reviews?"\n\n💡 **Quick Start:** Try asking "I want hotels in [your destination]" or "Help me plan a trip to [city]"\n\nWhat specific information can I help you find?`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputMessage.trim();
    setInputMessage("");
    setIsTyping(true);

    try {
      let botResponseText;

      // Try to get Gemini AI response if user is logged in
      if (user) {
        try {
          const aiResponse = await tripPlanningAPI.chatWithAI(messageText);
          if (aiResponse.success && aiResponse.response) {
            botResponseText = aiResponse.response;
          } else {
            throw new Error("AI response failed");
          }
        } catch (aiError) {
          console.log("Falling back to local AI response");
          botResponseText = generateAIResponse(messageText);
        }
      } else {
        // Use local AI for non-logged in users
        botResponseText = generateAIResponse(messageText);
      }

      // Simulate thinking delay for better UX
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          text: botResponseText,
          isBot: true,
          timestamp: new Date(),
          aiGenerated: user ? true : false,
        };

        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1000 + Math.random() * 1000); // 1-2 second delay
    } catch (error) {
      console.error("Chat error:", error);

      setTimeout(() => {
        const errorResponse = {
          id: Date.now() + 1,
          text: "I apologize, but I'm having trouble responding right now. Please try again or visit our Trip Planner for AI-powered itineraries!",
          isBot: true,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorResponse]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">StayWise Assistant</h3>
                <p className="text-xs opacity-90">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isBot ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.isBot
                      ? "bg-gray-100 text-gray-800"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.isBot ? "text-gray-500" : "text-blue-100"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about hotels..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
          </>
        )}
      </button>

      {/* Styles for animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AIChatbot;
