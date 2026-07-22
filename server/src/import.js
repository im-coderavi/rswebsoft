import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import { connectDB } from "./config/db.js";
import Product from "./models/Product.js";
import Category from "./models/Category.js";
import Brand from "./models/Brand.js";
import User from "./models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productsDir = path.join(__dirname, "..", "products");

// Helper to sanitize price values
function sanitizePrice(value) {
  if (!value) return 0;
  const parsed = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
}

// Helper to extract list items from HTML to populate features array
function extractFeatures(html) {
  if (!html) return [];
  const features = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = liRegex.exec(html)) !== null) {
    let text = match[1]
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .trim();
    // remove leading emojis or checkmarks
    text = text.replace(/^[✔️✅❌⚡📦📦✔️•\-\s]+/, "");
    if (text) {
      features.push(text);
    }
  }
  return features.slice(0, 10); // cap at 10 features
}

// Helper to classify product type based on Category and Name keywords
function getProductType(categoriesStr, nameStr, idx) {
  const cat = (categoriesStr || "").toLowerCase();
  const name = (nameStr || "").toLowerCase();

  // 1. Plugins
  if (
    cat.includes("plugin") || 
    name.includes("plugin") || 
    name.includes("addon") || 
    name.includes("add-on") || 
    name.includes("extension")
  ) {
    return "plugin";
  }

  // 2. Themes (WordPress Themes & Templates)
  if (
    cat.includes("theme") || 
    cat.includes("generatepress") || 
    name.includes("theme") || 
    name.includes("template") || 
    name.includes("elementor kit") || 
    name.includes("elementor template") ||
    name.includes("divi") ||
    name.includes("astra") ||
    name.includes("child theme")
  ) {
    const lowercaseName = name.toLowerCase();
    if (
      !lowercaseName.includes("excel") && 
      !lowercaseName.includes("checklist") && 
      !lowercaseName.includes("document") && 
      !lowercaseName.includes("spreadsheet") && 
      !lowercaseName.includes("invoice") &&
      !lowercaseName.includes("sales") &&
      !lowercaseName.includes("accounting") &&
      !lowercaseName.includes("prompts") &&
      !lowercaseName.includes("course") &&
      !lowercaseName.includes("management") &&
      !lowercaseName.includes("project") &&
      !lowercaseName.includes("kit") &&
      !lowercaseName.includes("notion") &&
      !lowercaseName.includes("bundle")
    ) {
      return "theme";
    }
  }

  // 3 & 4. Ready Websites and Delivered Websites
  if (
    cat.includes("website") || 
    cat.includes("listing") || 
    cat.includes("directory") || 
    cat.includes("booking") || 
    cat.includes("restaurant") || 
    cat.includes("ready-made-website") ||
    cat.includes("ecommerce") ||
    cat.includes("e-commerce") ||
    name.includes("website") || 
    name.includes("ready-made website") || 
    name.includes("readymade website") ||
    name.includes("clone website") ||
    name.includes("store website")
  ) {
    // Distribute websites between ready-website and delivered-website to fill sections
    if (idx % 2 === 0) {
      return "ready-website";
    } else {
      return "delivered-website";
    }
  }

  // 5. SaaS
  if (cat.includes("saas") || cat.includes("software") || name.includes("saas") || name.includes("software panel")) {
    return "saas";
  }

  // 6. Source Codes / Scripts
  if (
    cat.includes("source code") || 
    cat.includes("script") || 
    cat.includes("laravel") || 
    cat.includes("react project") || 
    cat.includes("php script") || 
    name.includes("source code") ||
    name.includes("php script") ||
    name.includes("laravel script") ||
    name.includes("react native") ||
    name.includes("flutter") ||
    name.includes("app source")
  ) {
    return "source-code";
  }

  // 7. Tools
  if (cat.includes("tool") || name.includes("tool") || name.includes("bot") || name.includes("leads database") || name.includes("database")) {
    return "tool";
  }

  // NOTE: "package" is intentionally not assigned here. It's reserved for the
  // 5 hardcoded web development pricing plans below (Standard/Premium/Custom/
  // Premium E-commerce/Multi-vendor), which power the homepage's "Packages &
  // Pricing" section and the admin's dedicated Packages & Pricing list. CSV
  // rows that look like bundles/kits/planners/etc. fall through to "other"
  // instead - they used to also get tagged "package", which mixed unrelated
  // digital bundles into that same list.

  return "other";
}

// Helper to assign icons/colors to categories
function getCategoryDesign(name) {
  const n = name.toLowerCase();
  if (n.includes("plugin") || n.includes("addon")) return { icon: "Wordpress", tone: "violet" };
  if (n.includes("theme") || n.includes("template")) return { icon: "Wordpress", tone: "indigo" };
  if (n.includes("ready") || n.includes("website")) return { icon: "Globe", tone: "pink" };
  if (n.includes("saas") || n.includes("software")) return { icon: "Cloud", tone: "teal" };
  if (n.includes("ai") || n.includes("spark")) return { icon: "Sparkles", tone: "amber" };
  if (n.includes("source") || n.includes("code")) return { icon: "Code2", tone: "sky" };
  if (n.includes("script")) return { icon: "FileCode2", tone: "rose" };
  if (n.includes("laravel")) return { icon: "Atom", tone: "red" };
  if (n.includes("react")) return { icon: "Boxes", tone: "cyan" };
  if (n.includes("app") || n.includes("mobile")) return { icon: "Smartphone", tone: "blue" };
  if (n.includes("bundle") || n.includes("package")) return { icon: "Package", tone: "fuchsia" };
  if (n.includes("graphic") || n.includes("design") || n.includes("art")) return { icon: "Palette", tone: "pink" };
  if (n.includes("marketing") || n.includes("seo")) return { icon: "Megaphone", tone: "rose" };
  return { icon: "Box", tone: "violet" };
}

// Helper to clean WooCommerce descriptions (newlines, shortcodes, etc.)
function cleanDescription(text) {
  if (!text) return "";
  return text
    .replace(/\\r\\n/g, "<br />")
    .replace(/\\n/g, "<br />")
    .replace(/\\r/g, "<br />")
    // Translate WordPress [button] shortcode into actual styled responsive button
    .replace(/\[button\s+link="([^"]+)"[^\]]*\](.*?)\[\/button\]/gi, (match, url, label) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-2.5 text-sm font-extrabold text-white transition hover:opacity-95 shadow-md hover:scale-102 my-3 cursor-pointer">${label.trim()}</a>`;
    });
}

// Helper to generate professional fallback features based on type
function getDefaultFeatures(type) {
  switch (type) {
    case "ready-website":
    case "delivered-website":
      return [
        "100% Fully Responsive Layout",
        "SEO Optimized Markup & Meta",
        "Speed Optimized (90+ mobile metrics)",
        "Modern Clean UI & UX Design",
        "Admin Dashboard Panel Integration"
      ];
    case "theme":
      return [
        "Highly Customizable Configuration Options",
        "Cross-Browser Compatible Layout",
        "Lighthouse Speed Optimized Code",
        "Elementor & Gutenberg Builder Support",
        "Responsive Mobile First Layout"
      ];
    case "plugin":
      return [
        "Super Lightweight Execution Code",
        "Seamless WordPress API Integration",
        "Secure Database Operations",
        "Translation & RTL Layout Ready",
        "Lifetime Free Version Updates"
      ];
    case "tool":
      return [
        "Instant Automated Data Processing",
        "User Friendly GUI Dashboard",
        "Safe Encryption Integration Protocols",
        "Developer Friendly API Hooks",
        "Comprehensive User Manual Guide"
      ];
    case "package":
      return [
        "Mega Bundle Premium Digital Assets",
        "Lifetime Download Access & Links",
        "High Resolution Customizable Elements",
        "Fully Organized & Structured Folders",
        "Commercial Usage Licenses Included"
      ];
    default:
      return [
        "Premium Digital Product Asset",
        "Instant Digital Download Link",
        "Developer Certified Codebase",
        "24/7 Priority Support Access",
        "Free Lifetime Version Updates"
      ];
  }
}

// Function to parse a single CSV file
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

async function runImport() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Connected to MongoDB successfully.");

    // Fetch files
    if (!fs.existsSync(productsDir)) {
      throw new Error(`Products directory not found: ${productsDir}`);
    }

    const csvFiles = fs.readdirSync(productsDir).filter(file => file.endsWith(".csv"));
    if (csvFiles.length === 0) {
      throw new Error(`No CSV files found in: ${productsDir}`);
    }

    console.log(`Found ${csvFiles.length} CSV files to process:`, csvFiles);

    // Read and parse all CSV files
    let allRows = [];
    for (const file of csvFiles) {
      const filePath = path.join(productsDir, file);
      console.log(`Parsing file: ${file}...`);
      const rows = await parseCSV(filePath);
      console.log(`Parsed ${rows.length} rows from ${file}.`);
      allRows = allRows.concat(rows);
    }

    console.log(`Total rows parsed from all files: ${allRows.length}`);

    // Retrieve default admin user to set createdBy
    const adminUser = await User.findOne({ status: "active" }) || await User.findOne();
    const createdById = adminUser ? adminUser._id : null;
    if (createdById) {
      console.log(`Products will be associated with user: ${adminUser.email}`);
    } else {
      console.log("Warning: No user found in the database. createdBy will be blank.");
    }

    // Cache categories & brands to minimize queries and prevent duplicate insertions
    const categoryCache = {};
    const brandCache = {};

    // Retrieve existing categories & brands to seed cache
    const existingCategories = await Category.find({});
    existingCategories.forEach(cat => {
      categoryCache[cat.name.toLowerCase()] = cat._id;
    });

    const existingBrands = await Brand.find({});
    existingBrands.forEach(b => {
      brandCache[b.name.toLowerCase()] = b._id;
    });

    const productsToInsert = [];
    
    // Seed Web Development Pricing Plans
    console.log("Preparing Web Development Pricing Plans...");
    let readyWebsitesCat = await Category.findOne({ name: "Ready Websites" });
    if (!readyWebsitesCat) {
      readyWebsitesCat = await Category.create({
        name: "Ready Websites",
        icon: "Globe",
        tone: "pink"
      });
    }

    const pricingPlans = [
      {
        name: "Standard Plan",
        description: "Talk to a web expert",
        shortDescription: "Perfect for small businesses & startups",
        price: 10000,
        salePrice: 7999,
        demoUrl: "tel:+919876543210",
        features: [
          "5 pages Website",
          "1 Year Free Domain Name (.com / .in / .org)",
          "1 Year Free Cloud Hosting",
          "Dynamic Website (Premium Design)",
          "Admin Access",
          "Lifetime 24/7 Free Hosting Support",
          "Unlimited Images & Videos Upload",
          "Free SSL Certificates",
          "5 Free Email IDs"
        ],
        tags: ["Save 20%+"],
        type: "package"
      },
      {
        name: "Premium Plan",
        description: "Upgrade to Premium",
        shortDescription: "For growing brands & serious businesses",
        price: 20000,
        salePrice: 13999,
        demoUrl: "tel:+919876543210",
        features: [
          "12 pages Website",
          "1 Year Free Domain Name (.com / .in / .org)",
          "1 Year Free Cloud Hosting",
          "Dynamic Website (Premium Design)",
          "Admin Access",
          "Google Search Console Setup",
          "Lifetime 24/7 Free Hosting Support",
          "Unlimited Images & Videos Upload",
          "Free SSL Certificates",
          "10 Free Email IDs"
        ],
        tags: ["Most Popular", "Best Value"],
        type: "package"
      },
      {
        name: "Custom Plan (Pro)",
        description: "Discuss Your Requirements",
        shortDescription: "Tailored web solution for your business",
        price: 4999,
        salePrice: 0,
        demoUrl: "https://wa.me/919876543210",
        features: [
          "Pages: According to Requirement",
          "1 Year Free Domain Name (.com / .in / .org)",
          "1 Year Free Cloud Hosting",
          "Dynamic Website",
          "Admin Access",
          "Google Search Console Setup",
          "Lifetime 24/7 Free Hosting Support",
          "Unlimited Images & Videos Upload",
          "Free SSL Certificates"
        ],
        tags: ["Fully Custom"],
        type: "package"
      },
      {
        name: "Premium E-commerce Plan",
        description: "Start Your Online Store",
        shortDescription: "Complete, sales-ready online store",
        price: 30000,
        salePrice: 21999,
        demoUrl: "tel:+919876543210",
        features: [
          "30 pages Website",
          "1 Year Free Domain Name (.com / .in / .org)",
          "1 Year Free Cloud Hosting",
          "20 Product Categories",
          "30 Product Listing from Our Side",
          "Premium Design",
          "Dynamic Website",
          "Admin Access",
          "Google Search Console Setup",
          "Free SSL Certificates"
        ],
        tags: ["E Commerce Ready"],
        type: "package"
      },
      {
        name: "Multi-vendor E-commerce Plan",
        description: "Launch Your Marketplace",
        shortDescription: "Marketplace style business solution",
        price: 60000,
        salePrice: 50000,
        demoUrl: "tel:+919876543210",
        features: [
          "40 pages Website",
          "1 Year Free Domain Name (.com / .in / .org)",
          "1 Year Free Cloud Hosting",
          "50 Product Categories",
          "30 Product Listing (from our side)",
          "Premium Design",
          "Dynamic Website",
          "Admin Access",
          "Google Search Console Setup",
          "Free SSL Certificates"
        ],
        tags: ["For Marketplaces"],
        type: "package"
      }
    ];

    const pricingPlansToInsert = pricingPlans.map(plan => ({
      ...plan,
      category: readyWebsitesCat._id,
      images: [{ url: "/brand-logos/rswebsoft.svg", publicId: `pricing/${plan.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}` }],
      status: "published",
      createdBy: createdById || undefined
    }));

    productsToInsert.push(...pricingPlansToInsert);
    console.log(`Prepared ${pricingPlansToInsert.length} pricing plans.`);

    let rowIndex = 0;
    
    // Track featured counts per type to make sure 2-3 items of each type are featured
    const featuredCounts = {};

    for (const row of allRows) {
      const name = row.Name || row.name;
      if (!name) {
        console.log(`Row ${rowIndex + 1}: Skipped due to missing product Name.`);
        rowIndex++;
        continue;
      }

      // Determine product type
      const rawCategories = row.Categories || row.categories || "Other";
      const primaryCategoryName = rawCategories.split(",")[0].trim();
      const type = getProductType(rawCategories, name, rowIndex);
      rowIndex++;

      // Handle category (retrieve or create)
      let categoryId = categoryCache[primaryCategoryName.toLowerCase()];
      
      if (!categoryId) {
        console.log(`Creating missing category: "${primaryCategoryName}"`);
        const design = getCategoryDesign(primaryCategoryName);
        const newCat = await Category.create({
          name: primaryCategoryName,
          icon: design.icon,
          tone: design.tone
        });
        categoryId = newCat._id;
        categoryCache[primaryCategoryName.toLowerCase()] = categoryId;
      }

      // Handle brand if present (retrieve or create)
      const rawBrand = row.Brands || row.brands;
      let brandId = undefined;
      if (rawBrand && rawBrand.trim()) {
        const brandName = rawBrand.trim();
        brandId = brandCache[brandName.toLowerCase()];
        if (!brandId) {
          console.log(`Creating missing brand: "${brandName}"`);
          const newBrand = await Brand.create({
            name: brandName,
            icon: "Building2",
            tone: "violet"
          });
          brandId = newBrand._id;
          brandCache[brandName.toLowerCase()] = brandId;
        }
      }

      // Process Images
      const rawImages = row.Images || row.images || "";
      const imageUrls = rawImages.split(",").map(url => url.trim()).filter(Boolean);
      const images = imageUrls.map((url, imgIndex) => {
        const parts = url.split("/");
        const filename = parts[parts.length - 1] || `img-${imgIndex}`;
        const cleanName = filename.split("?")[0].split(".")[0];
        return {
          url,
          publicId: `import/${cleanName}-${Date.now()}-${imgIndex}`
        };
      });

      // Extract features from short description or main description list items
      let features = extractFeatures(row["Short description"] || row["short description"]);
      if (features.length === 0) {
        features = extractFeatures(row.Description || row.description);
      }
      
      // Fallback features if empty
      if (features.length === 0) {
        features = getDefaultFeatures(type);
      }

      // Determine product type
      const regularPrice = sanitizePrice(row["Regular price"] || row["regular price"]);
      const salePrice = row["Sale price"] || row["sale-price"] ? sanitizePrice(row["Sale price"] || row["sale-price"]) : undefined;

      // Handle featured status (make first 3 of each type featured if not explicitly set)
      let isFeatured = row["Is featured?"] === "1" || row["Is featured?"] === "true" || row["Is featured?"] === "yes";
      if (!isFeatured && (featuredCounts[type] || 0) < 3 && images.length > 0) {
        isFeatured = true;
        featuredCounts[type] = (featuredCounts[type] || 0) + 1;
      }

      const isPublished = row["Published"] === "1" || row["Published"] === "true" || row["Published"] === "yes" || row["Published"] === "visible";

      const productDoc = {
        name: name.trim(),
        description: cleanDescription(row.Description || row.description || ""),
        shortDescription: cleanDescription(row["Short description"] || row["short description"] || ""),
        price: regularPrice,
        salePrice: salePrice && salePrice < regularPrice ? salePrice : undefined,
        features: features,
        category: categoryId,
        brand: brandId,
        type: type,
        tags: row.Tags ? row.Tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        images: images,
        demoUrl: row["External URL"] || row["external url"] || "",
        downloadUrl: row["Download 1 URL"] || row["Download URL"] || row["download url"] || "",
        rating: Number((4.0 + (Math.random() * 1.0)).toFixed(1)), // Seed a premium rating (4.0 to 5.0)
        numReviews: Math.floor(Math.random() * 45) + 5, // Seed random reviews count (5 to 50)
        featured: isFeatured,
        status: isPublished ? "published" : "draft",
        createdBy: createdById || undefined
      };

      productsToInsert.push(productDoc);
    }

    console.log(`Prepared ${productsToInsert.length} products to insert.`);

    // Clear existing products
    console.log("Wiping existing products from database...");
    const deleteRes = await Product.deleteMany({});
    console.log(`Successfully cleared ${deleteRes.deletedCount} products.`);

    // Bulk insert new products
    console.log("Inserting new products into database...");
    const insertRes = await Product.insertMany(productsToInsert);
    console.log(`Successfully imported ${insertRes.length} products!`);

    console.log("Import process completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Import failed with error:", error);
    process.exit(1);
  }
}

runImport();
