/* =========================================================
   INKORA DEMO DATA

   Sample blogs so the app isn't empty on a fresh install.

   All in one file so every page resolves the same id to the
   same blog. Ids are strings ("demo-1") so they can't clash
   with the uuids on real posts.
========================================================= */

export const demoBlogs = [
  {
    id: "demo-1",
    demo: true,
    author: "Alex Kumar",
    username: "@alexwrites",
    date: "Aug 25, 2026",
    createdAt: "2026-08-25T09:00:00.000Z",
    title: "The Things College Taught Me",
    description:
      "A personal reflection on growth, failure, friendship, and finding your own direction.",
    category: "Technology",
    readTime: "6 min read",
    likes: 245,
    comments: 32,
    tags: ["college", "growth", "student life"],
    image:
      "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=85",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    content: [
      "Nobody tells you that the most important lessons in college happen outside the lecture halls. They happen at 2 AM in a hostel corridor, arguing about something that will not matter in a year but feels enormous right now.",
      "I arrived convinced that grades were the whole story. I left understanding that the people who grew the most were the ones who were comfortable being bad at something in public — the ones who asked the obvious question everyone else was too proud to ask.",
      "Failure was the other teacher. My first real project collapsed two days before the deadline. I rebuilt it badly, submitted it, and scraped through. That week taught me more about planning than any syllabus did.",
      "If I could tell my first-year self one thing, it would be this: the direction matters far more than the speed. You are allowed to change your mind. You are allowed to start over. Most people do, they just do it quietly.",
    ],
  },
  {
    id: "demo-2",
    demo: true,
    author: "Sarah Johnson",
    username: "@sarahj",
    date: "Aug 24, 2026",
    createdAt: "2026-08-24T09:00:00.000Z",
    title: "Finding Peace in Small Moments",
    description:
      "Sometimes, happiness is not a destination. It's a series of tiny, beautiful moments.",
    category: "Life",
    readTime: "4 min read",
    likes: 189,
    comments: 21,
    tags: ["mindfulness", "slow living"],
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    content: [
      "I spent years treating happiness like a finish line. Finish the degree, get the job, move to the city, then be happy. The line kept moving.",
      "What changed was noticing smaller things. The first ten minutes of morning light. A friend texting for no reason. The particular quiet of a room after rain.",
      "None of these fix anything. They are not a strategy. But collected together they turn out to be most of what a good week is actually made of.",
      "Peace, it turns out, is less something you arrive at and more something you keep noticing.",
    ],
  },
  {
    id: "demo-3",
    demo: true,
    author: "Rahul Sharma",
    username: "@rahulthoughts",
    date: "Aug 23, 2026",
    createdAt: "2026-08-23T09:00:00.000Z",
    title: "My Journey Into Programming",
    description:
      "How I went from knowing nothing about programming to building my first real application.",
    category: "Programming",
    readTime: "8 min read",
    likes: 342,
    comments: 48,
    tags: ["programming", "beginners", "javascript"],
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=85",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    content: [
      "My first program printed my name. It took me two hours and a stack overflow question, and I have never been prouder of anything since.",
      "The hardest part was not syntax. It was the feeling that everyone else already understood something I had missed. That feeling never fully disappears, but it does get quieter.",
      "What actually worked: building small, broken, useless things constantly. A calculator. A to-do list nobody used. A weather app that showed the wrong city. Each one taught me something a tutorial could not.",
      "If you are at the start of this, the advice is boring and it is true. Write code every day, even badly. Read other people's code. Ship something ugly. The understanding arrives later, in retrospect.",
    ],
  },
  {
    id: "demo-4",
    demo: true,
    author: "Maya Patel",
    username: "@mayawrites",
    date: "Aug 22, 2026",
    createdAt: "2026-08-22T09:00:00.000Z",
    title: "A Weekend in the Mountains",
    description:
      "Sometimes the best way to reset your mind is to step away from everything familiar.",
    category: "Travel",
    readTime: "5 min read",
    likes: 212,
    comments: 26,
    tags: ["travel", "mountains", "reset"],
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
    content: [
      "We left on a Friday with no plan beyond a direction. The road climbed for three hours and the phone signal gave up somewhere around the second bend, which turned out to be the point.",
      "There is a specific silence at altitude. Not the absence of sound, but the absence of demand. Nothing up there needed anything from me.",
      "By Sunday the thing I had been anxious about all month had not solved itself. It had just moved to a sensible size.",
      "Go to the mountains. Not to find yourself, necessarily. Just to stop being findable for two days.",
    ],
  },
  {
    id: "demo-5",
    demo: true,
    author: "Michael Lee",
    username: "@michaellee",
    date: "Aug 21, 2026",
    createdAt: "2026-08-21T09:00:00.000Z",
    title: "The Future of Artificial Intelligence",
    description:
      "A simple look at how artificial intelligence could change the way we work and live.",
    category: "Technology",
    readTime: "7 min read",
    likes: 521,
    comments: 73,
    tags: ["ai", "technology", "future"],
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=85",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    content: [
      "Every big technology shift gets described twice: once as a miracle and once as a catastrophe. The truth usually ends up being stranger and more boring than either version.",
      "The jobs most affected are rarely the ones people predict. It is not the craft that disappears, it is the tedious middle — the copying, the reformatting, the first draft nobody enjoyed writing.",
      "The interesting question is not whether these tools are capable. It is which decisions we are willing to hand over, and which ones we should insist on making slowly, by hand, with our names attached.",
    ],
  },
  {
    id: "demo-6",
    demo: true,
    author: "Emma Davis",
    username: "@emmadavis",
    date: "Aug 20, 2026",
    createdAt: "2026-08-20T09:00:00.000Z",
    title: "How I Started Learning Music",
    description:
      "The unexpected lessons I learned after picking up an instrument and starting from zero.",
    category: "Music",
    readTime: "5 min read",
    likes: 167,
    comments: 19,
    tags: ["music", "learning", "practice"],
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=85",
    avatar:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=200&q=80",
    content: [
      "I started at twenty-four, which everyone assured me was far too late. It was not too late. It was just uncomfortable, which people often confuse with the same thing.",
      "The first three months sounded terrible. There is no way around this part and no shortcut through it. You simply have to be willing to make bad sounds in a room where you can hear them.",
      "What surprised me was how much practising an instrument taught me about everything else. Progress is not linear. Plateaus are not failure. Twenty focused minutes beats two distracted hours.",
    ],
  },
  {
    id: "demo-7",
    demo: true,
    author: "Alex Kumar",
    username: "@alexwrites",
    date: "Aug 19, 2026",
    createdAt: "2026-08-19T09:00:00.000Z",
    title: "Building My First Web App",
    description:
      "What I learned while building my first full-stack application from scratch.",
    category: "Technology",
    readTime: "6 min read",
    likes: 245,
    comments: 32,
    tags: ["web development", "react", "projects"],
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    content: [
      "The gap between a tutorial project and a real one is enormous, and nobody warns you about the specific shape of it.",
      "Tutorials never cover the part where you have three half-finished features, a bug you cannot reproduce, and a growing suspicion that your data model was wrong from the beginning.",
      "I rewrote the storage layer three times. The third version was simple, and the only reason I could write it was that I had already written the two complicated ones.",
      "Ship it anyway. A working ugly thing teaches you more than a beautiful thing you never finished.",
    ],
  },
];

export const demoWriters = [
  {
    name: "Michael Lee",
    username: "@michaellee",
    followers: "9.2K",
    category: "Technology",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Emma Davis",
    username: "@emmadavis",
    followers: "8.1K",
    category: "Music",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "David Wilson",
    username: "@davidwrites",
    followers: "6.7K",
    category: "Travel",
    image:
      "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Maya Patel",
    username: "@mayawrites",
    followers: "6.8K",
    category: "Life",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Sarah Johnson",
    username: "@sarahj",
    followers: "5.4K",
    category: "Life",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Rahul Sharma",
    username: "@rahulthoughts",
    followers: "4.9K",
    category: "Programming",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  },
];

export const topics = [
  "Technology",
  "Programming",
  "Life",
  "Travel",
  "Education",
  "Music",
  "Gaming",
  "Science",
  "Finance",
  "Stories",
];

export const categories = ["All", ...topics];

export const trendingTopics = [
  { name: "Artificial Intelligence", posts: "2.4K blogs" },
  { name: "Web Development", posts: "1.8K blogs" },
  { name: "Personal Growth", posts: "1.3K blogs" },
  { name: "Travel Stories", posts: "984 blogs" },
  { name: "Student Life", posts: "821 blogs" },
];

/* Look up a demo writer by their @username. */

export function findWriter(username) {
  if (!username) {
    return null;
  }

  const handle = String(username).toLowerCase();

  const writer = demoWriters.find(
    (item) => item.username.toLowerCase() === handle
  );

  if (writer) {
    return writer;
  }

  const blog = demoBlogs.find(
    (item) => String(item.username).toLowerCase() === handle
  );

  if (!blog) {
    return null;
  }

  return {
    name: blog.author,
    username: blog.username,
    followers: "0",
    category: blog.category,
    image: blog.avatar,
  };
}
