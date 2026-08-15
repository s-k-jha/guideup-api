/**
 * Standalone seed script for the "Talk to a Mentor" chat product.
 *
 * Seeds 25 placeholder mentor profiles (mentorType: 'talk') that the site
 * owner will personally staff. Idempotent — safe to re-run; upserts by
 * email so re-running never creates duplicates.
 *
 * Usage: node database/seedTalkMentors.js
 */
require('dotenv').config();
const connectDB = require('./connection');
const Mentor = require('../models/Mentor');

const talkMentors = [
  {
    name: 'Priya Nair',
    email: 'priya.nair@guideup-talk.internal',
    role: 'Software Engineer',
    company: 'a mid-size IT services company',
    experienceYears: 6,
    bio: 'Helps students prep for coding interviews and untangle tricky DSA doubts one problem at a time.',
    domains: ['DSA Doubts', 'Interview Prep'],
    chatPrice: 149,
  },
  {
    name: 'Arjun Mehta',
    email: 'arjun.mehta@guideup-talk.internal',
    role: 'Product Manager',
    company: 'a fintech startup',
    experienceYears: 8,
    bio: 'Guides students exploring product management as a career, from breaking in to acing PM interviews.',
    domains: ['Product Management', 'Career Guidance'],
    chatPrice: 249,
  },
  {
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@guideup-talk.internal',
    role: 'Independent Career Coach',
    company: 'independent practice',
    experienceYears: 10,
    bio: 'Works with final-year students on resume building and career direction, especially for first-generation job seekers.',
    domains: ['Resume Building', 'Career Guidance'],
    chatPrice: 199,
  },
  {
    name: 'Rohit Verma',
    email: 'rohit.verma@guideup-talk.internal',
    role: 'Data Analyst turned Career Mentor',
    company: 'a retail analytics firm',
    experienceYears: 5,
    bio: 'Advises students on breaking into data analytics and data science roles without a traditional CS background.',
    domains: ['Data Science', 'Career Switch'],
    chatPrice: 179,
  },
  {
    name: 'Fatima Sheikh',
    email: 'fatima.sheikh@guideup-talk.internal',
    role: 'HR Business Partner',
    company: 'a manufacturing conglomerate',
    experienceYears: 9,
    bio: 'Runs mock HR rounds and helps students prepare honest, confident answers to the questions that trip them up.',
    domains: ['Mock HR Round', 'Interview Prep'],
    chatPrice: 129,
  },
  {
    name: 'Karthik Subramaniam',
    email: 'karthik.subramaniam@guideup-talk.internal',
    role: 'Final-year PhD Researcher',
    company: 'a public research university',
    experienceYears: 4,
    bio: 'Guides aspirants through the GRE and MS application process, from shortlisting universities to SOP reviews.',
    domains: ['Higher Studies'],
    chatPrice: 199,
  },
  {
    name: 'Ananya Reddy',
    email: 'ananya.reddy@guideup-talk.internal',
    role: 'Full Stack Developer',
    company: 'a mid-size product company',
    experienceYears: 3,
    bio: 'Helps early-career developers sharpen their web development fundamentals and portfolio projects.',
    domains: ['Web Development', 'Career Guidance'],
    chatPrice: 99,
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@guideup-talk.internal',
    role: 'Freelance Consultant',
    company: 'independent practice',
    experienceYears: 7,
    bio: 'Shares practical advice on starting out with freelancing and gig work while still in college or just after.',
    domains: ['Freelancing', 'Career Guidance'],
    chatPrice: 149,
  },
  {
    name: 'Meera Iyer',
    email: 'meera.iyer@guideup-talk.internal',
    role: 'Senior Software Engineer',
    company: 'a mid-size IT services company',
    experienceYears: 11,
    bio: 'Focuses on system design basics and interview prep for students targeting mid-to-senior engineering roles.',
    domains: ['Interview Prep', 'DSA Doubts'],
    chatPrice: 249,
  },
  {
    name: 'Aditya Kapoor',
    email: 'aditya.kapoor@guideup-talk.internal',
    role: 'Career Switch Coach',
    company: 'independent practice',
    experienceYears: 6,
    bio: 'Specializes in helping engineers and non-engineers alike plan a realistic switch into tech roles.',
    domains: ['Career Switch', 'Career Guidance'],
    chatPrice: 179,
  },
  {
    name: 'Nisha Pillai',
    email: 'nisha.pillai@guideup-talk.internal',
    role: 'Resume Consultant',
    company: 'independent practice',
    experienceYears: 5,
    bio: 'Reviews resumes line by line and explains exactly what recruiters are scanning for at each experience level.',
    domains: ['Resume Review'],
    chatPrice: 99,
  },
  {
    name: 'Rahul Deshmukh',
    email: 'rahul.deshmukh@guideup-talk.internal',
    role: 'Backend Engineer',
    company: 'a mid-size product company',
    experienceYears: 4,
    bio: 'Helps students clear DSA doubts and prepare for backend-focused technical interviews.',
    domains: ['DSA Doubts', 'Web Development'],
    chatPrice: 129,
  },
  {
    name: 'Zara Khan',
    email: 'zara.khan@guideup-talk.internal',
    role: 'Product Manager',
    company: 'an edtech company',
    experienceYears: 5,
    bio: 'Talks students through what a PM role actually looks like day to day and how to build a case for the switch.',
    domains: ['Product Management', 'Career Switch'],
    chatPrice: 199,
  },
  {
    name: 'Siddharth Rao',
    email: 'siddharth.rao@guideup-talk.internal',
    role: 'Data Scientist',
    company: 'a healthtech startup',
    experienceYears: 6,
    bio: 'Advises students on structuring a data science portfolio and preparing for analytics case interviews.',
    domains: ['Data Science', 'Interview Prep'],
    chatPrice: 219,
  },
  {
    name: 'Pooja Chatterjee',
    email: 'pooja.chatterjee@guideup-talk.internal',
    role: 'Independent Career Coach',
    company: 'independent practice',
    experienceYears: 8,
    bio: 'Helps students figure out career direction when they feel stuck between multiple options after graduation.',
    domains: ['Career Guidance'],
    chatPrice: 149,
  },
  {
    name: 'Devansh Joshi',
    email: 'devansh.joshi@guideup-talk.internal',
    role: 'Software Engineer',
    company: 'a cloud infrastructure company',
    experienceYears: 3,
    bio: 'Runs quick DSA doubt-solving sessions aimed at students preparing for placement season.',
    domains: ['DSA Doubts'],
    chatPrice: 99,
  },
  {
    name: 'Ritu Bhatia',
    email: 'ritu.bhatia@guideup-talk.internal',
    role: 'HR Generalist',
    company: 'a BPO and services firm',
    experienceYears: 7,
    bio: 'Coaches students on interview etiquette, salary negotiation basics, and handling mock HR rounds with confidence.',
    domains: ['Mock HR Round', 'Career Guidance'],
    chatPrice: 129,
  },
  {
    name: 'Manoj Pillai',
    email: 'manoj.pillai@guideup-talk.internal',
    role: 'GRE/MS Mentor',
    company: 'independent practice',
    experienceYears: 9,
    bio: 'A former international graduate student who now helps applicants plan their GRE prep and MS timelines.',
    domains: ['Higher Studies', 'Career Guidance'],
    chatPrice: 199,
  },
  {
    name: 'Kavya Menon',
    email: 'kavya.menon@guideup-talk.internal',
    role: 'Frontend Developer',
    company: 'a mid-size product company',
    experienceYears: 4,
    bio: 'Helps students strengthen frontend fundamentals and put together projects that stand out to recruiters.',
    domains: ['Web Development', 'Resume Review'],
    chatPrice: 129,
  },
  {
    name: 'Harsh Agarwal',
    email: 'harsh.agarwal@guideup-talk.internal',
    role: 'Product Analyst',
    company: 'a logistics-tech company',
    experienceYears: 3,
    bio: 'Talks students through entry-level product and analyst roles and how to prepare for case-study rounds.',
    domains: ['Product Management', 'Data Science'],
    chatPrice: 149,
  },
  {
    name: 'Ishita Ghosh',
    email: 'ishita.ghosh@guideup-talk.internal',
    role: 'Freelance Designer and Consultant',
    company: 'independent practice',
    experienceYears: 6,
    bio: 'Shares practical, no-nonsense advice on finding early freelance clients and pricing gig work fairly.',
    domains: ['Freelancing'],
    chatPrice: 129,
  },
  {
    name: 'Naveen Krishnan',
    email: 'naveen.krishnan@guideup-talk.internal',
    role: 'Senior Backend Engineer',
    company: 'a mid-size IT services company',
    experienceYears: 12,
    bio: 'Mentors students on advanced DSA topics and mock technical interviews for competitive product-based roles.',
    domains: ['DSA Doubts', 'Interview Prep'],
    chatPrice: 279,
  },
  {
    name: 'Tanvi Desai',
    email: 'tanvi.desai@guideup-talk.internal',
    role: 'Career Switch Coach',
    company: 'independent practice',
    experienceYears: 5,
    bio: 'Helps non-CS graduates plan a structured switch into tech and analytics roles without feeling overwhelmed.',
    domains: ['Career Switch', 'Resume Building'],
    chatPrice: 149,
  },
  {
    name: 'Abhishek Tiwari',
    email: 'abhishek.tiwari@guideup-talk.internal',
    role: 'Data Engineer',
    company: 'a supply-chain analytics company',
    experienceYears: 5,
    bio: 'Guides students on data engineering fundamentals and how to prepare for entry-level data role interviews.',
    domains: ['Data Science', 'Interview Prep'],
    chatPrice: 199,
  },
  {
    name: 'Shreya Bansal',
    email: 'shreya.bansal@guideup-talk.internal',
    role: 'Resume and Career Coach',
    company: 'independent practice',
    experienceYears: 7,
    bio: 'Reviews resumes and LinkedIn profiles for students applying to their first full-time roles.',
    domains: ['Resume Review', 'Resume Building'],
    chatPrice: 129,
  },
];

/**
 * Mirrors the slug-generation logic in models/Mentor.js's pre('save') hook,
 * used as a fallback since findOneAndUpdate upserts do not trigger 'save'
 * middleware.
 */
async function ensureSlug(mentor) {
  if (mentor.slug) return mentor;
  if (!mentor.isModified) return mentor; // safety guard
  // Triggers the model's own pre('save') hook, which generates a unique
  // slug from the name since isPubliclyListed is true and slug is unset.
  await mentor.save();
  return mentor;
}

const seedTalkMentors = async () => {
  let upserted = 0;

  for (const data of talkMentors) {
    const femaleNames = ['Priya', 'Sneha', 'Fatima', 'Ananya', 'Meera', 'Nisha', 'Zara', 'Pooja', 'Ritu', 'Kavya', 'Ishita', 'Tanvi', 'Shreya'];
    const isFemale = femaleNames.some(name => data.name.includes(name));
    const gender = isFemale ? 'women' : 'men';
    const photoId = (upserted % 50) + 1; // 1-50
    const photoUrl = `https://randomuser.me/api/portraits/${gender}/${photoId}.jpg`;

    const mentor = await Mentor.findOneAndUpdate(
      { email: data.email },
      {
        name: data.name,
        email: data.email,
        mentorType: 'talk',
        isActive: true,
        isPubliclyListed: true,
        role: data.role,
        company: data.company,
        experienceYears: data.experienceYears,
        bio: data.bio,
        domains: data.domains,
        chatPrice: data.chatPrice,
        photoUrl: photoUrl,
        discountPrice: 5,
        offers: { firstFree: true, secondDiscount: true },
        dailyFreeQuota: 20,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await ensureSlug(mentor);
    upserted += 1;
    console.log(`Upserted talk mentor: ${mentor.name} (${mentor.email}) slug=${mentor.slug}`);
  }

  const count = await Mentor.countDocuments({ mentorType: 'talk' });
  console.log(`\nDone. Upserted ${upserted} talk mentor records. Total 'talk' mentors in DB: ${count}`);
};

(async () => {
  try {
    await connectDB();
    await seedTalkMentors();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
})();
