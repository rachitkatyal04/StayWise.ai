const mongoose = require("mongoose");
const Hotel = require("../models/Hotel");
const User = require("../models/User");

// MongoDB connection - load from environment variables
require("dotenv").config();
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set");
  console.error("Please set MONGODB_URI in your .env file");
  process.exit(1);
}

// Sample hotel data for major Indian cities
const indianCitiesHotels = [
  // Mumbai, Maharashtra
  {
    name: "The Taj Mahal Palace",
    description:
      "An iconic luxury hotel overlooking the Gateway of India with world-class amenities and heritage charm.",
    location: {
      city: "Mumbai",
      state: "Maharashtra",
      address: "Apollo Bunder, Colaba, Mumbai",
      pincode: "400001",
    },
    images: {
      main: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1578774204375-83d77e8b0b86?w=800",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
      ],
    },
    rooms: [
      {
        type: "Deluxe",
        description: "Spacious rooms with modern amenities and city views",
        basePrice: 15000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service", "Minibar"],
        images: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600",
        ],
        totalRooms: 50,
        availableRooms: 45,
      },
      {
        type: "Suite",
        description: "Luxurious suites with panoramic harbor views",
        basePrice: 35000,
        maxOccupancy: 4,
        amenities: ["AC", "WiFi", "Room Service", "Minibar", "Balcony"],
        images: [
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600",
        ],
        totalRooms: 20,
        availableRooms: 18,
      },
    ],
    amenities: [
      "Pool",
      "Spa",
      "Gym",
      "Restaurant",
      "Bar",
      "Concierge",
      "Valet Parking",
    ],
    rating: { average: 4.8, count: 1250 },
    contact: { phone: "9876543210", email: "reservations@tajhotels.com" },
    featured: true,
  },

  // Delhi
  {
    name: "The Imperial New Delhi",
    description:
      "A luxury heritage hotel in the heart of New Delhi with colonial architecture and modern comforts.",
    location: {
      city: "New Delhi",
      state: "Delhi",
      address: "Janpath, Connaught Place, New Delhi",
      pincode: "110001",
    },
    images: {
      main: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
      ],
    },
    rooms: [
      {
        type: "Double",
        description: "Elegant rooms with classic decor and modern amenities",
        basePrice: 12000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service", "Safe"],
        images: [
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600",
        ],
        totalRooms: 80,
        availableRooms: 72,
      },
      {
        type: "Executive",
        description: "Premium rooms with access to executive lounge",
        basePrice: 18000,
        maxOccupancy: 3,
        amenities: ["AC", "WiFi", "Room Service", "Safe", "Executive Lounge"],
        images: [
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600",
        ],
        totalRooms: 40,
        availableRooms: 35,
      },
    ],
    amenities: ["Pool", "Spa", "Gym", "Restaurant", "Bar", "Business Center"],
    rating: { average: 4.6, count: 980 },
    contact: { phone: "9876543211", email: "info@theimperialindia.com" },
    featured: true,
  },

  // Bangalore
  {
    name: "The Leela Palace Bengaluru",
    description:
      "A grand palace hotel offering royal luxury in the Silicon Valley of India.",
    location: {
      city: "Bangalore",
      state: "Karnataka",
      address: "23, Airport Road, Kodihalli, Bangalore",
      pincode: "560008",
    },
    images: {
      main: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
      ],
    },
    rooms: [
      {
        type: "Premium",
        description: "Sophisticated rooms with contemporary design",
        basePrice: 10000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service", "Minibar"],
        images: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600",
        ],
        totalRooms: 60,
        availableRooms: 55,
      },
      {
        type: "Suite",
        description: "Spacious suites with separate living area",
        basePrice: 25000,
        maxOccupancy: 4,
        amenities: ["AC", "WiFi", "Room Service", "Minibar", "Living Room"],
        images: [
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600",
        ],
        totalRooms: 30,
        availableRooms: 28,
      },
    ],
    amenities: ["Pool", "Spa", "Gym", "Restaurant", "Bar", "Golf Course"],
    rating: { average: 4.7, count: 750 },
    contact: { phone: "9876543212", email: "bangalore@theleela.com" },
    featured: true,
  },

  // Chennai
  {
    name: "ITC Grand Chola",
    description:
      "A luxury hotel showcasing South Indian heritage with world-class amenities.",
    location: {
      city: "Chennai",
      state: "Tamil Nadu",
      address: "63, Mount Road, Guindy, Chennai",
      pincode: "600032",
    },
    images: {
      main: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
      ],
    },
    rooms: [
      {
        type: "Double",
        description: "Elegant rooms with traditional Tamil Nadu decor",
        basePrice: 8000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service", "Safe"],
        images: [
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600",
        ],
        totalRooms: 70,
        availableRooms: 65,
      },
      {
        type: "Deluxe",
        description: "Spacious rooms with modern amenities and city views",
        basePrice: 12000,
        maxOccupancy: 3,
        amenities: ["AC", "WiFi", "Room Service", "Safe", "City View"],
        images: [
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600",
        ],
        totalRooms: 50,
        availableRooms: 45,
      },
    ],
    amenities: ["Pool", "Spa", "Gym", "Restaurant", "Bar", "Cultural Center"],
    rating: { average: 4.5, count: 650 },
    contact: { phone: "9876543213", email: "itcgrandchola@itchotels.in" },
    featured: false,
  },

  // Kolkata
  {
    name: "The Oberoi Grand",
    description:
      "A heritage luxury hotel in the cultural capital of India with Victorian elegance.",
    location: {
      city: "Kolkata",
      state: "West Bengal",
      address: "15, Jawaharlal Nehru Road, Kolkata",
      pincode: "700013",
    },
    images: {
      main: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      ],
    },
    rooms: [
      {
        type: "Single",
        description: "Cozy rooms perfect for business travelers",
        basePrice: 6000,
        maxOccupancy: 1,
        amenities: ["AC", "WiFi", "Room Service", "Work Desk"],
        images: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600",
        ],
        totalRooms: 40,
        availableRooms: 38,
      },
      {
        type: "Premium",
        description: "Luxurious rooms with heritage charm",
        basePrice: 15000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service", "Minibar", "Heritage Decor"],
        images: [
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600",
        ],
        totalRooms: 60,
        availableRooms: 55,
      },
    ],
    amenities: ["Pool", "Spa", "Gym", "Restaurant", "Bar", "Library"],
    rating: { average: 4.4, count: 520 },
    contact: { phone: "9876543214", email: "reservations@oberoihotels.com" },
    featured: false,
  },

  // Hyderabad
  {
    name: "Taj Falaknuma Palace",
    description:
      "A palace hotel offering royal experiences in the City of Pearls.",
    location: {
      city: "Hyderabad",
      state: "Telangana",
      address: "Engine Bowli, Falaknuma, Hyderabad",
      pincode: "500053",
    },
    images: {
      main: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      ],
    },
    rooms: [
      {
        type: "Deluxe",
        description: "Royal rooms with palace architecture",
        basePrice: 20000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service", "Palace View"],
        images: [
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600",
        ],
        totalRooms: 30,
        availableRooms: 25,
      },
      {
        type: "Suite",
        description: "Magnificent suites fit for royalty",
        basePrice: 50000,
        maxOccupancy: 4,
        amenities: [
          "AC",
          "WiFi",
          "Room Service",
          "Palace View",
          "Butler Service",
        ],
        images: [
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600",
        ],
        totalRooms: 10,
        availableRooms: 8,
      },
    ],
    amenities: ["Pool", "Spa", "Gym", "Restaurant", "Bar", "Palace Tours"],
    rating: { average: 4.9, count: 420 },
    contact: { phone: "9876543215", email: "falaknuma@tajhotels.com" },
    featured: true,
  },

  // Pune
  {
    name: "JW Marriott Hotel Pune",
    description:
      "A contemporary luxury hotel in the cultural capital of Maharashtra.",
    location: {
      city: "Pune",
      state: "Maharashtra",
      address: "Senapati Bapat Road, Pune",
      pincode: "411053",
    },
    images: {
      main: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
      ],
    },
    rooms: [
      {
        type: "Double",
        description: "Modern rooms with contemporary design",
        basePrice: 9000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service", "Minibar"],
        images: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600",
        ],
        totalRooms: 100,
        availableRooms: 90,
      },
      {
        type: "Executive",
        description: "Premium rooms with executive club access",
        basePrice: 15000,
        maxOccupancy: 3,
        amenities: ["AC", "WiFi", "Room Service", "Minibar", "Club Access"],
        images: [
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600",
        ],
        totalRooms: 40,
        availableRooms: 35,
      },
    ],
    amenities: ["Pool", "Spa", "Gym", "Restaurant", "Bar", "Business Center"],
    rating: { average: 4.3, count: 380 },
    contact: { phone: "9876543216", email: "pune@marriott.com" },
    featured: false,
  },

  // Jaipur
  {
    name: "Rambagh Palace",
    description:
      "The Jewel of Jaipur - a former palace turned luxury hotel with royal heritage.",
    location: {
      city: "Jaipur",
      state: "Rajasthan",
      address: "Bhawani Singh Road, Jaipur",
      pincode: "302005",
    },
    images: {
      main: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
      ],
    },
    rooms: [
      {
        type: "Premium",
        description: "Elegant rooms with Rajasthani decor",
        basePrice: 18000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service", "Rajasthani Decor"],
        images: [
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600",
        ],
        totalRooms: 50,
        availableRooms: 45,
      },
      {
        type: "Suite",
        description: "Royal suites with palace views",
        basePrice: 40000,
        maxOccupancy: 4,
        amenities: [
          "AC",
          "WiFi",
          "Room Service",
          "Palace View",
          "Royal Service",
        ],
        images: [
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600",
        ],
        totalRooms: 20,
        availableRooms: 18,
      },
    ],
    amenities: ["Pool", "Spa", "Gym", "Restaurant", "Bar", "Palace Museum"],
    rating: { average: 4.8, count: 920 },
    contact: { phone: "9876543217", email: "rambagh@tajhotels.com" },
    featured: true,
  },

  // Goa
  {
    name: "The Leela Goa",
    description:
      "A beachfront luxury resort in South Goa with stunning ocean views.",
    location: {
      city: "Goa",
      state: "Goa",
      address: "Cavelossim Beach, South Goa",
      pincode: "403731",
    },
    images: {
      main: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
      ],
    },
    rooms: [
      {
        type: "Double",
        description: "Comfortable rooms with garden or sea views",
        basePrice: 12000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service", "Balcony"],
        images: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600",
        ],
        totalRooms: 80,
        availableRooms: 70,
      },
      {
        type: "Premium",
        description: "Luxury rooms with direct beach access",
        basePrice: 20000,
        maxOccupancy: 3,
        amenities: ["AC", "WiFi", "Room Service", "Beach Access", "Sea View"],
        images: [
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600",
        ],
        totalRooms: 40,
        availableRooms: 35,
      },
    ],
    amenities: [
      "Pool",
      "Spa",
      "Gym",
      "Restaurant",
      "Bar",
      "Beach Access",
      "Water Sports",
    ],
    rating: { average: 4.6, count: 680 },
    contact: { phone: "9876543218", email: "goa@theleela.com" },
    featured: true,
  },

  // Kochi
  {
    name: "Grand Hyatt Kochi Bolgatty",
    description:
      "A waterfront luxury hotel with stunning backwater views in God's Own Country.",
    location: {
      city: "Kochi",
      state: "Kerala",
      address: "Bolgatty Island, Mulavukad P.O, Kochi",
      pincode: "682504",
    },
    images: {
      main: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      ],
    },
    rooms: [
      {
        type: "Double",
        description: "Modern rooms with backwater views",
        basePrice: 8000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service", "Backwater View"],
        images: [
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600",
        ],
        totalRooms: 60,
        availableRooms: 55,
      },
      {
        type: "Suite",
        description: "Spacious suites with panoramic water views",
        basePrice: 18000,
        maxOccupancy: 4,
        amenities: [
          "AC",
          "WiFi",
          "Room Service",
          "Panoramic View",
          "Living Area",
        ],
        images: [
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600",
        ],
        totalRooms: 25,
        availableRooms: 22,
      },
    ],
    amenities: ["Pool", "Spa", "Gym", "Restaurant", "Bar", "Backwater Cruise"],
    rating: { average: 4.4, count: 450 },
    contact: { phone: "9876543219", email: "kochi@hyatt.com" },
    featured: false,
  },
];

// Additional cities hotels
const additionalHotels = [
  // Ahmedabad
  {
    name: "The House of MG",
    description:
      "A heritage hotel showcasing Gujarat's rich culture and hospitality.",
    location: {
      city: "Ahmedabad",
      state: "Gujarat",
      address: "Lal Darwaja, Ahmedabad",
      pincode: "380001",
    },
    images: {
      main: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
      ],
    },
    rooms: [
      {
        type: "Double",
        description: "Traditional rooms with modern comforts",
        basePrice: 7000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service"],
        images: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600",
        ],
        totalRooms: 50,
        availableRooms: 45,
      },
    ],
    amenities: ["Restaurant", "Cultural Programs", "Heritage Tours"],
    rating: { average: 4.2, count: 280 },
    contact: { phone: "9876543220", email: "mg@heritagehotels.com" },
    featured: false,
  },

  // Lucknow
  {
    name: "Taj Mahal Lucknow",
    description:
      "A luxury hotel in the city of Nawabs with Awadhi hospitality.",
    location: {
      city: "Lucknow",
      state: "Uttar Pradesh",
      address: "Vipin Khand, Gomti Nagar, Lucknow",
      pincode: "226010",
    },
    images: {
      main: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
      ],
    },
    rooms: [
      {
        type: "Deluxe",
        description: "Elegant rooms with Awadhi touches",
        basePrice: 9000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service", "Minibar"],
        images: [
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600",
        ],
        totalRooms: 40,
        availableRooms: 35,
      },
    ],
    amenities: ["Pool", "Spa", "Restaurant", "Bar"],
    rating: { average: 4.3, count: 320 },
    contact: { phone: "9876543221", email: "lucknow@tajhotels.com" },
    featured: false,
  },

  // Chandigarh
  {
    name: "JW Marriott Hotel Chandigarh",
    description: "A modern luxury hotel in India's first planned city.",
    location: {
      city: "Chandigarh",
      state: "Chandigarh",
      address: "Plot No. 6, Sector 35-B, Chandigarh",
      pincode: "160022",
    },
    images: {
      main: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
      ],
    },
    rooms: [
      {
        type: "Premium",
        description: "Contemporary rooms with city views",
        basePrice: 11000,
        maxOccupancy: 2,
        amenities: ["AC", "WiFi", "Room Service", "City View"],
        images: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600",
        ],
        totalRooms: 45,
        availableRooms: 40,
      },
    ],
    amenities: ["Pool", "Spa", "Gym", "Restaurant", "Business Center"],
    rating: { average: 4.4, count: 260 },
    contact: { phone: "9876543222", email: "chandigarh@marriott.com" },
    featured: false,
  },
];

// Create admin user for hotel management
const createAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ email: "admin@staywise.ai" });
    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      return existingAdmin;
    }

    const adminUser = new User({
      name: "StayWise Admin",
      email: "admin@staywise.ai",
      password: "admin123",
      phone: "9999999999",
      role: "admin",
    });

    await adminUser.save();
    console.log("✅ Admin user created: admin@staywise.ai / admin123");
    return adminUser;
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    return null;
  }
};

// Seed hotels function
const seedHotels = async () => {
  try {
    console.log("🌱 Starting hotel seeding process...");

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Create admin user
    const adminUser = await createAdminUser();
    if (!adminUser) {
      throw new Error("Failed to create admin user");
    }

    // Clear existing hotels
    await Hotel.deleteMany({});
    console.log("🗑️  Cleared existing hotels");

    // Add createdBy field to all hotels
    const hotelsWithCreator = indianCitiesHotels.map((hotel) => ({
      ...hotel,
      createdBy: adminUser._id,
    }));

    // Insert hotels
    const insertedHotels = await Hotel.insertMany(hotelsWithCreator);
    console.log(
      `✅ Successfully seeded ${insertedHotels.length} hotels across Indian cities`
    );

    // Display summary
    const cityCount = {};
    insertedHotels.forEach((hotel) => {
      const city = hotel.location.city;
      cityCount[city] = (cityCount[city] || 0) + 1;
    });

    console.log("\n📊 Hotels by City:");
    Object.entries(cityCount).forEach(([city, count]) => {
      console.log(`   ${city}: ${count} hotels`);
    });

    console.log("\n🎉 Hotel seeding completed successfully!");
    console.log("🔗 You can now access the hotels via the API endpoints");
    console.log("🌐 Featured hotels are marked for the homepage");
  } catch (error) {
    console.error("❌ Error seeding hotels:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the seeding
if (require.main === module) {
  seedHotels();
}

module.exports = { seedHotels, indianCitiesHotels, additionalHotels };
