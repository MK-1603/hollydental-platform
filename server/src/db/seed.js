import { db } from "../config/db.js";
import { users, services, blogPosts } from "./schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

/**
 * Reference data the application depends on at runtime. We seed this at
 * every boot but the operations are idempotent — existing rows are skipped,
 * not duplicated. NO demo users, appointments, messages, invoices, etc. are
 * created here. Use `npm run seed:doctor` to provision the clinic admin
 * once, and the patient portal handles real patient sign-ups from there.
 */
const SERVICES_TO_SEED = [
  { slug: "general-dentistry", name: "General Dentistry", category: "general", priceFrom: 50, priceTo: 300, durationMinutes: 30 },
  { slug: "dental-checkups", name: "Dental Check-ups & Examinations", category: "general", priceFrom: 50, priceTo: 80, durationMinutes: 30 },
  { slug: "teeth-cleaning", name: "Hygiene & Teeth Cleaning", category: "general", priceFrom: 70, priceTo: 120, durationMinutes: 45 },
  { slug: "teeth-whitening", name: "Teeth Whitening", category: "cosmetic", priceFrom: 250, priceTo: 400, durationMinutes: 60 },
  { slug: "invisalign", name: "Invisalign Clear Aligners", category: "orthodontics", priceFrom: 2500, priceTo: 5000, durationMinutes: 60 },
  { slug: "composite-bonding", name: "Composite Bonding", category: "cosmetic", priceFrom: 250, priceTo: 400, durationMinutes: 60 },
  { slug: "veneers", name: "Porcelain Veneers", category: "cosmetic", priceFrom: 800, priceTo: 1200, durationMinutes: 90 },
  { slug: "smile-design", name: "Smile Design", category: "cosmetic", priceFrom: 500, priceTo: 2000, durationMinutes: 60 },
  { slug: "root-canal", name: "Root Canal Treatment", category: "general", priceFrom: 600, priceTo: 1000, durationMinutes: 90 },
  { slug: "dental-crowns", name: "Dental Crowns", category: "advanced", priceFrom: 800, priceTo: 1000, durationMinutes: 90 },
  { slug: "tooth-extractions", name: "Tooth Extractions", category: "general", priceFrom: 120, priceTo: 250, durationMinutes: 30 },
  { slug: "emergency-dentistry", name: "Emergency Dentistry", category: "general", priceFrom: 80, priceTo: 300, durationMinutes: 45 },
  { slug: "dental-bridges", name: "Dental Bridges", category: "advanced", priceFrom: 1200, priceTo: 2000, durationMinutes: 90 },
  { slug: "gum-treatment", name: "Gum Treatment", category: "advanced", priceFrom: 150, priceTo: 400, durationMinutes: 60 },
  { slug: "composite-fillings", name: "Composite Fillings", category: "general", priceFrom: 80, priceTo: 200, durationMinutes: 30 },
  { slug: "dentures", name: "Dentures", category: "advanced", priceFrom: 800, priceTo: 2000, durationMinutes: 60 },
  { slug: "full-smile-makeovers", name: "Full Smile Makeovers", category: "cosmetic", priceFrom: 3000, priceTo: 8000, durationMinutes: 120 },
  { slug: "digital-smile-consultation", name: "Digital Smile Consultation", category: "cosmetic", priceFrom: 0, priceTo: 100, durationMinutes: 45 },
];

const STARTER_BLOG_POSTS = [
  {
    title: "7 Signs You May Need a Dental Checkup",
    slug: "7-signs-need-dental-checkup",
    excerpt:
      "From persistent sensitivity to bleeding gums, here are the top warning signs that mean it's time to book a checkup at Hollyhill Dental.",
    body: `<p>Twice-yearly checkups are the gold standard, but your mouth often tells you it needs attention before then. If any of the seven signs below sound familiar, book a consultation with our team in Cork.</p>
<h3>1. Persistent tooth sensitivity</h3><p>Sensitivity to hot, cold or sweet foods can mean worn enamel or an early cavity.</p>
<h3>2. Bleeding or swollen gums</h3><p>Healthy gums don't bleed. Bleeding while brushing is the earliest sign of gum disease.</p>
<h3>3. Chronic bad breath</h3><p>If brushing and flossing don't fix it, the cause is usually deeper than diet.</p>
<h3>4. Lingering toothaches</h3><p>A constant ache often signals a deep cavity or cracked tooth.</p>
<h3>5. Dry mouth</h3><p>Saliva protects your enamel; chronic dryness raises decay risk significantly.</p>
<h3>6. Jaw clicking or tenderness</h3><p>Common with grinding (bruxism) or TMJ disorders.</p>
<h3>7. Sores or patches that won't heal</h3><p>Anything in your mouth that lingers more than two weeks should be examined.</p>
<p>If any of these resonate, please call <strong>+353 21 430 3072</strong> or book online.</p>`,
    category: "Preventive Dentistry",
    tags: "checkup, sensitivity, gum health",
    featuredImageUrl: "/dentist-mirror.png",
    seoTitle: "7 Signs You May Need a Dental Checkup | Hollyhill Dental",
    seoDescription:
      "Discover seven warning signs from sensitivity to bleeding gums that mean it's time to book a checkup at Hollyhill Dental in Cork.",
  },
  {
    title: "Benefits of Professional Teeth Whitening",
    slug: "benefits-professional-teeth-whitening",
    excerpt:
      "Why in-clinic whitening is safer, faster and longer-lasting than supermarket whitening kits.",
    body: `<p>Over-the-counter whitening promises a brighter smile but rarely delivers a clinical-grade result. Here's why a professional whitening session at Hollyhill Dental outperforms drugstore kits.</p>
<h3>Stronger, safely applied</h3><p>Our medical-grade gels lift deep stains while custom barriers protect your gums.</p>
<h3>Faster transformation</h3><p>Most patients leave several shades brighter after a single 60-minute visit.</p>
<h3>Longer-lasting results</h3><p>With a take-home top-up kit your bright smile can last 18–24 months.</p>
<p>Curious if whitening suits you? Book a free shade consultation with Dr. Roghay Alizadeh today.</p>`,
    category: "Cosmetic Dentistry",
    tags: "whitening, cosmetic, smile",
    featuredImageUrl: "/image_copy_4.png",
    seoTitle: "Benefits of Professional Teeth Whitening | Hollyhill Dental",
    seoDescription:
      "Learn why clinical whitening is safer and longer-lasting than retail strips. Cork's Hollyhill Dental explains the science behind the smile.",
  },
  {
    title: "Invisalign vs Traditional Braces",
    slug: "invisalign-vs-traditional-braces",
    excerpt:
      "Comparing aesthetics, comfort, hygiene and treatment speed to help you choose the right alignment option.",
    body: `<p>Both Invisalign and traditional braces straighten teeth effectively, but the patient experience is very different. Here's how to decide.</p>
<h3>Aesthetics</h3><p>Invisalign aligners are virtually invisible, while metal brackets are highly visible.</p>
<h3>Comfort</h3><p>Aligners are smooth thermoplastic; braces can rub the cheeks until your mouth adapts.</p>
<h3>Hygiene</h3><p>Invisalign trays come out for brushing and flossing; braces require special tools to clean.</p>
<h3>Compliance</h3><p>Aligners only work if worn 22 hours a day; braces are fixed and continuous.</p>
<h3>Complex cases</h3><p>Severe crowding or rotated teeth still respond best to fixed appliances.</p>
<p>Not sure which is right for you? Book a digital smile consultation and we'll model both options.</p>`,
    category: "Orthodontics",
    tags: "invisalign, braces, alignment",
    featuredImageUrl: "/image_copy_2.png",
    seoTitle: "Invisalign vs Traditional Braces | Hollyhill Dental Cork",
    seoDescription:
      "Compare Invisalign with traditional braces — aesthetics, comfort, hygiene and treatment speed — at Hollyhill Dental Cork.",
  },
  {
    title: "The Complete Guide to Composite Bonding",
    slug: "complete-guide-to-composite-bonding",
    excerpt: "Learn how composite bonding can repair chipped, stained, or uneven teeth in a single visit without drilling.",
    body: `<p>Composite bonding is one of our most popular cosmetic dentistry treatments at Hollyhill Dental. It offers a fast, non-invasive, and cost-effective way to transform your smile. Here is everything you need to know about the procedure.</p>
<h3>What is Composite Bonding?</h3><p>It involves applying a tooth-colored composite resin to the surface of your teeth to reshape them, close gaps, or cover chips and discoloration. Dr. Roghay Alizadeh sculpts the resin by hand to match your surrounding teeth perfectly.</p>
<h3>Key Benefits</h3>
<ul>
  <li><strong>Single appointment:</strong> Most bonding treatments are completed in just 1 to 2 hours.</li>
  <li><strong>No tooth preparation:</strong> Unlike porcelain veneers, composite bonding requires little to no removal of natural enamel.</li>
  <li><strong>Pain-free:</strong> In most cases, no injections or drilling are necessary.</li>
</ul>
<h3>How Long Does It Last?</h3>
<p>Typically, composite bonding lasts between 5 to 8 years. Over time, the resin can stain or wear down, but it can be easily repaired or polished during your regular checkup.</p>
<p>Ready to transform your smile? Book a consultation with us today.</p>`,
    category: "Cosmetic Dentistry",
    tags: "bonding, cosmetic, composite",
    featuredImageUrl: "/image_copy_5.png",
    seoTitle: "The Complete Guide to Composite Bonding | Hollyhill Dental",
    seoDescription: "Learn how composite bonding can repair chipped or uneven teeth in a single visit in Cork. Read our expert guide.",
  },
  {
    title: "What to Do in a Dental Emergency",
    slug: "what-to-do-in-dental-emergency",
    excerpt: "Knocked-out tooth, severe toothache, or lost crown? Our Cork dental team explains the exact steps to save your tooth.",
    body: `<p>Dental emergencies can be stressful, but knowing how to react in the first few minutes can mean the difference between saving and losing a tooth. At Hollyhill Dental, we reserve emergency slots daily for patients in urgent need.</p>
<h3>1. Knocked-Out Tooth</h3><p>Handle the tooth only by the crown (the top part), not the root. Rinse it gently with water or milk, and if possible, try to place it back in the socket. If not, store it in a container of milk and head to our clinic immediately.</p>
<h3>2. Severe Toothache</h3><p>Rinse your mouth with warm water and use dental floss to remove any trapped food. Avoid placing aspirin directly on the gums, as this can burn the tissue. Take over-the-counter pain relief and call us to be seen.</p>
<h3>3. Lost Crown or Filling</h3><p>Keep the crown safe if it has come off. You can use temporary dental cement from a pharmacy to temporarily place it back in mouth, but avoid using superglue. Schedule an appointment to get it professionally bonded.</p>
<p>If you have an active dental emergency in Cork, call us immediately at <strong>+353 21 430 3072</strong>.</p>`,
    category: "Emergency Dental Care",
    tags: "emergency, pain, toothache",
    featuredImageUrl: "/image.png",
    seoTitle: "What to Do in a Dental Emergency | Hollyhill Dental Cork",
    seoDescription: "Find out what to do for a knocked-out tooth or severe toothache. Cork's emergency dental team explains.",
  },
  {
    title: "Prepare Your Child for Their First Dentist Visit",
    slug: "prepare-child-first-dentist-visit",
    excerpt: "Make your child's first dental checkup a positive, fear-free experience with these practical tips.",
    body: `<p>A child's first visit to the dentist sets the tone for their future oral health. At Hollyhill Dental, we focus on creating a fun, friendly, and completely fear-free environment for our pediatric patients.</p>
<h3>Start early</h3><p>We recommend bringing your child in as soon as their first baby teeth emerge, or by their first birthday. This helps them get used to the sights and sounds of the clinic.</p>
<h3>Keep it positive</h3><p>Avoid using words like 'pain', 'hurt', or 'needles'. Explain that the dentist is a friendly helper who counts their teeth and keeps them clean.</p>
<h3>Roleplay at home</h3><p>Practice counting each other's teeth in a mirror with a small flashlight. This makes the actual dental exam feel like a familiar game.</p>
<p>Book your child's pediatric checkup today and let us help them build a healthy smile for life.</p>`,
    category: "Pediatric Dentistry",
    tags: "child, pediatric, checkup",
    featuredImageUrl:
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=1200",
    seoTitle: "Prepare Your Child for Their First Dentist Visit | Hollyhill Dental",
    seoDescription: "Practical advice on making your child's first dental checkup positive and stress-free at Hollyhill Dental Cork.",
  },
  {
    title: "Gum Disease: Prevention, Symptoms, and Treatment",
    slug: "gum-disease-prevention-symptoms-treatment",
    excerpt: "Why healthy gums are the foundation of a beautiful smile, and how to prevent gingivitis from turning into periodontitis.",
    body: `<p>Many people focus entirely on their teeth, but your gums are the support structure for your smile. Gum disease is the leading cause of tooth loss in adults, but it is entirely preventable.</p>
<h3>Gingivitis vs. Periodontitis</h3><p>Gingivitis is the earliest stage of gum disease, characterized by red, swollen gums that bleed when you brush. It is completely reversible with professional cleaning. If left untreated, it can progress to periodontitis, which damages the bone supporting your teeth, leading to loose teeth.</p>
<h3>How to Prevent It</h3>
<ul>
  <li>Brush twice daily with a fluoride toothpaste.</li>
  <li>Floss daily to remove plaque from between the teeth.</li>
  <li>Book professional scaling and polishing twice a year.</li>
</ul>
<p>Have your gums been bleeding? Book an Exam, Scale & Polish appointment with us today.</p>`,
    category: "Gum Health & Periodontal Care",
    tags: "gum health, plaque, hygiene",
    featuredImageUrl: "/image_copy_3.png",
    seoTitle: "Gum Disease Prevention & Treatment | Hollyhill Dental Cork",
    seoDescription: "Learn the symptoms of gum disease and how to prevent it. Scale and polish services available at Hollyhill Dental.",
  },
  {
    title: "What Is Root Canal Treatment and Why Is It Pain-Free?",
    slug: "root-canal-treatment-pain-free",
    excerpt: "Demystifying root canal therapy. Learn why modern rotary endodontics make this tooth-saving procedure simple and comfortable.",
    body: `<p>The words 'root canal' often cause unnecessary anxiety. Modern dental techniques and rotary endodontics have made root canal treatment as simple and pain-free as a standard filling. Here is what actually happens.</p>
<h3>Why is it needed?</h3><p>When decay reaches the inner pulp of the tooth, it causes inflammation and severe pain. Root canal therapy removes the infected pulp, cleans the canals, and seals the tooth to save it from extraction.</p>
<h3>Modern technology makes it simple</h3><p>With precise local anesthetics and high-speed digital mapping, you won't feel anything during the procedure. We save your natural tooth, which maintains your natural bite structure.</p>
<p>If you're experiencing deep tooth pain, don't delay. Book a consultation today.</p>`,
    category: "Root Canal Treatment",
    tags: "root canal, endodontics, pain relief",
    featuredImageUrl: "/image_copy.png",
    seoTitle: "Modern Pain-Free Root Canal Treatment | Hollyhill Dental",
    seoDescription: "Demystifying root canals. Learn why modern endodontic therapy at Hollyhill Dental in Cork is comfortable and safe.",
  },
  {
    title: "How to Maintain Your Teeth Whitening Results",
    slug: "maintain-teeth-whitening-results",
    excerpt: "Tips on keeping your smile bright after professional teeth whitening. The 'white diet' explained.",
    body: `<p>Congratulations on your new, brighter smile! Professional teeth whitening can brighten your teeth up to 8 shades, but maintaining those results requires some care. Here are our top tips.</p>
<h3>The 'White Diet'</h3><p>For the first 48 hours post-whitening, the pores of your enamel are open and vulnerable to staining. Avoid coffee, tea, red wine, curry, and soy sauce. Opt for light-colored foods like chicken, pasta, rice, and milk.</p>
<h3>Daily maintenance habits</h3>
<ul>
  <li>Use a straw when drinking colored beverages.</li>
  <li>Rinse your mouth with water immediately after eating staining foods.</li>
  <li>Brush with a gentle whitening toothpaste to prevent surface stains from building up.</li>
</ul>
<p>Get in touch for home touch-up kits to keep your smile glowing all year round.</p>`,
    category: "Teeth Whitening",
    tags: "whitening, aftercare, smile care",
    featuredImageUrl: "/clinic-storefront.png",
    seoTitle: "How to Maintain Teeth Whitening Results | Hollyhill Dental",
    seoDescription: "Keep your teeth white after your treatment. Learn the best post-whitening care tips from our Cork cosmetic dentists.",
  },
  {
    title: "Dental Implants vs. Bridges: Which Is Right?",
    slug: "dental-implants-vs-bridges",
    excerpt: "Compare the long-term benefits, costs, and procedure steps of dental implants and fixed bridges for replacing missing teeth.",
    body: `<p>Replacing missing teeth is crucial for maintaining your bite alignment and facial structure. The two main solutions are dental implants and fixed bridges. Here is how they compare.</p>
<h3>Dental Implants</h3><p>Implants replace both the root and the crown. A titanium post is surgically placed in the jaw, fusing with the bone. It behaves like a natural tooth and doesn't require any alteration of adjacent teeth.</p>
<h3>Dental Bridges</h3><p>A bridge uses adjacent healthy teeth (anchors) to hold a replacement tooth in the gap. It is non-surgical and completed in 2 visits, but it requires preparing the adjacent teeth.</p>
<h3>Long-Term Value</h3><p>While implants have a higher initial cost, they can last a lifetime, making them the most cost-effective and premium solution in the long run.</p>
<p>Book a consultation to map out your restorative treatment plan.</p>`,
    category: "Dental Implants",
    tags: "implants, bridges, replacement",
    featuredImageUrl: "/dental-implants.png",
    seoTitle: "Dental Implants vs. Fixed Bridges | Hollyhill Dental Cork",
    seoDescription: "Compare implants and bridges for replacing missing teeth. Discuss options with Dr. Roghay Alizadeh in Cork.",
  },
  {
    title: "Is Invisalign Right for Adults?",
    slug: "invisalign-right-for-adults",
    excerpt: "Everything adults need to know about clear aligner orthodontic treatment, from daily wear to results.",
    body: `<p>It's never too late to get the straight smile you've always wanted. Invisalign orthodontic clear aligners are highly popular with adults because they are comfortable and virtually invisible. Here is what to expect.</p>
<h3>Virtually Invisible</h3><p>You can attend business meetings and social events without anyone knowing you're in orthodontic treatment.</p>
<h3>Removable & Convenient</h3><p>Remove your aligners to eat your favorite foods and brush your teeth normally. No food restrictions like traditional metal braces!</p>
<h3>Treatment Speed</h3><p>With Invisalign Go, simple cases can be completed in as little as 6 to 9 months.</p>
<p>Book a digital smile consultation today and view a 3D preview of your straight smile before you start.</p>`,
    category: "Orthodontics & Braces",
    tags: "invisalign, braces, orthodontics",
    featuredImageUrl: "/image-js-after.png",
    seoTitle: "Invisalign Clear Aligners for Adults | Hollyhill Dental Cork",
    seoDescription:
      "Adult orthodontics made simple. Learn how Invisalign aligners can straighten your smile comfortably.",
  },
];

export const seedDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    console.log("[seed] DATABASE_URL missing, skipping reference seed.");
    return;
  }

  try {
    console.log("[seed] Reference data check…");

    // 1. Services — required for booking, pricing pages, etc.
    let servicesAdded = 0;
    for (const service of SERVICES_TO_SEED) {
      const existing = await db
        .select({ id: services.id })
        .from(services)
        .where(eq(services.slug, service.slug))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(services).values(service);
        servicesAdded += 1;
      }
    }
    if (servicesAdded > 0) {
      console.log(`[seed] Inserted ${servicesAdded} new service(s).`);
    }

    // 2. Starter blog posts — only if a doctor/admin exists to author them.
    // We now automatically seed a default admin user if none exists so that the
    // blog posts can be seeded automatically on startup.
    const defaultEmail = "doctor@hollyhilldental.ie";

    let admin = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (admin.length === 0) {
      const passwordHash = await bcrypt.hash("Admin1234!", 10);
      const [newAdmin] = await db.insert(users).values({
        email: defaultEmail,
        passwordHash,
        role: "admin",
        isActive: true,
        mustChangePassword: true,
        displayName: "Dr. Roghay Alizadeh",
      }).returning({ id: users.id });
      console.log(`[seed] Created default admin account: ${defaultEmail}`);
      admin = [newAdmin];
    }
    // Existing admin — credentials left untouched. Use `npm run seed:doctor` to reset.

    if (admin.length > 0) {
      const adminId = admin[0].id;
      let postsAdded = 0;
      for (const post of STARTER_BLOG_POSTS) {
        const existing = await db
          .select({ id: blogPosts.id })
          .from(blogPosts)
          .where(eq(blogPosts.slug, post.slug))
          .limit(1);
        if (existing.length === 0) {
          await db.insert(blogPosts).values({
            ...post,
            authorId: adminId,
            status: "published",
            publishedAt: new Date(),
          });
          postsAdded += 1;
        } else {
          // Update the existing post's image URL and details to make sure it gets the new local images
          await db
            .update(blogPosts)
            .set({
              title: post.title,
              excerpt: post.excerpt,
              body: post.body,
              category: post.category,
              tags: post.tags,
              featuredImageUrl: post.featuredImageUrl,
              seoTitle: post.seoTitle,
              seoDescription: post.seoDescription,
              publishedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(blogPosts.id, existing[0].id));
        }
      }
      if (postsAdded > 0) {
        console.log(`[seed] Inserted ${postsAdded} starter blog post(s).`);
      }
    }

    console.log("[seed] Reference data ready.");
  } catch (error) {
    console.error("[seed] Reference seeding failed:", error);
  }
};
