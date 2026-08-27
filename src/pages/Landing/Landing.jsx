import { Link } from "react-router";

const blogs = [
  {
    id: 1,
    title: "The Things College Taught Me",
    description:
      "A personal reflection on growth, failure, friendship, and finding your own direction.",
    author: "Alex Kumar",
    username: "@alexwrites",
    category: "Life",
    readTime: "6 min read",
    likes: "245",
    comments: "32",
    image:
      "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=85",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: 2,
    title: "My Journey Into Programming",
    description:
      "How I went from knowing nothing about programming to building my first real application.",
    author: "Rahul Sharma",
    username: "@rahulthoughts",
    category: "Programming",
    readTime: "8 min read",
    likes: "342",
    comments: "48",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=85",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: 3,
    title: "Finding Peace in Small Moments",
    description:
      "Sometimes happiness is not a destination. It is a series of small, beautiful moments.",
    author: "Sarah Johnson",
    username: "@sarahj",
    category: "Lifestyle",
    readTime: "4 min read",
    likes: "189",
    comments: "21",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
];

const writers = [
  {
    name: "Alex Kumar",
    username: "@alexwrites",
    followers: "12.4K",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Sarah Johnson",
    username: "@sarahj",
    followers: "8.7K",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Rahul Sharma",
    username: "@rahulthoughts",
    followers: "7.2K",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Maya Patel",
    username: "@mayawrites",
    followers: "6.8K",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
  },
];

const topics = [
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

function ArrowIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* NAVBAR */}

      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white shadow-lg shadow-violet-200">
              I
            </div>

            <span className="text-[19px] font-black tracking-[-0.05em]">
              INKORA
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#explore"
              className="text-sm font-medium text-neutral-500 transition hover:text-violet-600"
            >
              Explore
            </a>

            <a
              href="#trending"
              className="text-sm font-medium text-neutral-500 transition hover:text-violet-600"
            >
              Trending
            </a>

            <a
              href="#about"
              className="text-sm font-medium text-neutral-500 transition hover:text-violet-600"
            >
              About
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
            >
              Create Account
            </Link>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 md:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* HERO */}

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />

          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-purple-100/60 blur-3xl" />

          <div className="mx-auto grid min-h-[680px] max-w-[1240px] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-24">
            <div className="relative z-10">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
                <span className="h-2 w-2 rounded-full bg-violet-600" />
                A new home for stories
              </div>

              <h1 className="max-w-[620px] text-[48px] font-black leading-[0.98] tracking-[-0.06em] sm:text-[64px] lg:text-[76px]">
                Stories worth
                <span className="block text-violet-600">reading.</span>
                Ideas worth
                <span className="block text-violet-600">sharing.</span>
              </h1>

              <p className="mt-7 max-w-[540px] text-base leading-7 text-neutral-500 sm:text-lg">
                Discover perspectives, stories, knowledge, and experiences from
                writers around the world. Read something meaningful, then
                share something of your own.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/home"
                  className="group flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700"
                >
                  Explore Blogs

                  <span className="transition group-hover:translate-x-1">
                    <ArrowIcon />
                  </span>
                </Link>

                <Link
                  to="/signup"
                  className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 py-3.5 text-sm font-bold text-neutral-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                >
                  Start Writing
                </Link>
              </div>

              <div className="mt-12 grid max-w-[500px] grid-cols-3 gap-6 border-t border-neutral-100 pt-7">
                <div>
                  <p className="text-2xl font-black">15K+</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Blogs Published
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-black">50K+</p>
                  <p className="mt-1 text-xs text-neutral-500">Writers</p>
                </div>

                <div>
                  <p className="text-2xl font-black">1M+</p>
                  <p className="mt-1 text-xs text-neutral-500">Readers</p>
                </div>
              </div>
            </div>

            {/* HERO CARDS */}

            <div className="relative mx-auto h-[470px] w-full max-w-[570px]">
              <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-100 blur-3xl" />

              <div className="absolute left-0 top-14 hidden w-[245px] -rotate-6 rounded-3xl border border-white bg-white p-3 shadow-2xl shadow-neutral-200 sm:block">
                <img
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=700&q=85"
                  alt="Programming"
                  className="h-52 w-full rounded-2xl object-cover"
                />

                <div className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    Technology
                  </p>

                  <h3 className="mt-2 text-sm font-bold">
                    Building My First Web App
                  </h3>
                </div>
              </div>

              <div className="absolute left-1/2 top-1/2 z-20 w-[285px] -translate-x-1/2 -translate-y-1/2 rotate-2 rounded-3xl border border-white bg-white p-3 shadow-[0_30px_80px_rgba(40,20,80,0.18)] sm:w-[320px]">
                <img
                  src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=900&q=85"
                  alt="College"
                  className="h-[300px] w-full rounded-2xl object-cover sm:h-[330px]"
                />

                <div className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    Life
                  </p>

                  <h3 className="mt-2 text-lg font-black tracking-tight">
                    The Things College Taught Me
                  </h3>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-600">
                      Alex Kumar
                    </span>

                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <HeartIcon />
                      245
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 right-0 hidden w-[235px] rotate-6 rounded-3xl border border-white bg-white p-3 shadow-2xl shadow-neutral-200 sm:block">
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=85"
                  alt="Travel"
                  className="h-48 w-full rounded-2xl object-cover"
                />

                <div className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    Travel
                  </p>

                  <h3 className="mt-2 text-sm font-bold">
                    Finding Stories Along the Way
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </section>
{/* FEATURED BLOGS */}

<section
  id="explore"
  className="border-t border-neutral-100 bg-neutral-50/70 py-20 sm:py-24"
>
  <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
      Discover
    </p>

    <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
      Stories people are reading
    </h2>

    <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
      Explore thoughtful writing from creators covering technology,
      life, travel, education, and everything in between.
    </p>

    <div className="mt-10 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
      {blogs.map((blog) => (
        <article
          key={blog.id}
          className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-2xl hover:shadow-violet-100"
        >
          {/* BLOG IMAGE */}
          <Link to={`/blog/${blog.id}`}>
            <div className="relative overflow-hidden">
              <img
                src={blog.thumbnail || blog.image}
                alt={blog.title}
                className="h-[300px] w-full object-cover transition duration-500 group-hover:scale-105"
              />

              <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 shadow">
                {blog.category}
              </div>
            </div>
          </Link>

          {/* BLOG CONTENT */}
          <div className="p-5">

            {/* AUTHOR */}
            <div className="flex items-center gap-2">
              <img
                src={
                  typeof blog.author === "object"
                    ? blog.author?.avatar
                    : blog.avatar
                }
                alt={
                  typeof blog.author === "object"
                    ? blog.author?.name
                    : blog.author
                }
                className="h-8 w-8 rounded-full object-cover"
              />

              <div>
                <p className="text-xs font-bold">
                  {typeof blog.author === "object"
                    ? blog.author?.name
                    : blog.author}
                </p>

                <p className="text-[11px] text-neutral-400">
                  {typeof blog.author === "object"
                    ? blog.author?.username
                    : blog.username}
                </p>
              </div>
            </div>

            {/* TITLE */}
            <Link to={`/blog/${blog.id}`}>
              <h3 className="mt-4 text-xl font-black leading-tight tracking-tight group-hover:text-violet-600">
                {blog.title}
              </h3>
            </Link>

            {/* DESCRIPTION */}
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
              {blog.description}
            </p>

            {/* FOOTER */}
            <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
              <span className="text-xs text-neutral-400">
                {blog.readTime}
              </span>

              <div className="flex items-center gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <HeartIcon />
                  {blog.likes}
                </span>

                <span className="flex items-center gap-1">
                  <CommentIcon />
                  {blog.comments}
                </span>

                <BookmarkIcon />
              </div>
            </div>

          </div>
        </article>
      ))}
    </div>
  </div>
</section>

        {/* TOPICS */}

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-[1100px] px-5 text-center sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
              Explore by topic
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Find something you love
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-500">
              Discover ideas from technology and programming to travel, life,
              education, music, and more.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {topics.map((topic, index) => (
                <Link
                  key={topic}
                  to="/discover"
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                    index % 3 === 0
                      ? "border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100"
                      : "border-neutral-200 text-neutral-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  }`}
                >
                  {topic}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* WRITERS */}

        <section
          id="trending"
          className="border-t border-neutral-100 bg-neutral-50/70 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
              Community
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Trending writers
            </h2>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {writers.map((writer) => (
                <div
                  key={writer.username}
                  className="rounded-3xl border border-neutral-200 bg-white p-5 transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={writer.image}
                      alt={writer.name}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />

                    <div>
                      <h3 className="text-sm font-black">{writer.name}</h3>

                      <p className="text-xs text-neutral-400">
                        {writer.username}
                      </p>

                      <p className="mt-1 text-[11px] text-neutral-500">
                        {writer.followers} followers
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-5 w-full rounded-xl bg-violet-50 py-2.5 text-xs font-bold text-violet-700 transition hover:bg-violet-600 hover:text-white"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT */}

        <section id="about" className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-[1100px] gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
                Why INKORA?
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                A social network built around stories.
              </h2>

              <p className="mt-5 text-base leading-7 text-neutral-500">
                INKORA brings writers and readers together in one place.
                Publish your thoughts, discover new perspectives, follow
                writers you enjoy, and join conversations around stories that
                matter.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xs font-black text-violet-600">
                    01
                  </div>

                  <div>
                    <h3 className="text-sm font-black">Write</h3>

                    <p className="mt-1 text-sm text-neutral-500">
                      Publish your stories and ideas.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xs font-black text-violet-600">
                    02
                  </div>

                  <div>
                    <h3 className="text-sm font-black">Discover</h3>

                    <p className="mt-1 text-sm text-neutral-500">
                      Discover writers and stories worth reading.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xs font-black text-violet-600">
                    03
                  </div>

                  <div>
                    <h3 className="text-sm font-black">Connect</h3>

                    <p className="mt-1 text-sm text-neutral-500">
                      Like, comment, bookmark, and follow.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-5 rounded-[40px] bg-violet-100 blur-3xl" />

              <div className="relative overflow-hidden rounded-[32px] border border-neutral-200 bg-white p-3 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85"
                  alt="Writing"
                  className="h-[430px] w-full rounded-[24px] object-cover"
                />

                <div className="absolute bottom-8 left-8 right-8 rounded-2xl bg-white/90 p-5 shadow-xl backdrop-blur-xl">
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                    INKORA
                  </p>

                  <p className="mt-2 text-lg font-black">
                    Your ideas deserve to be read.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}

        <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="relative mx-auto max-w-[1160px] overflow-hidden rounded-[36px] bg-neutral-950 px-7 py-16 text-center sm:px-12">
            <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/30 blur-3xl" />

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
                Start your story
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] text-white sm:text-5xl">
                Your next great story could start here.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-neutral-400">
                Join INKORA, discover stories you care about, and share your
                own perspective with a growing community.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="rounded-xl bg-violet-600 px-7 py-3.5 text-sm font-bold text-white hover:bg-violet-500"
                >
                  Create Your Account
                </Link>

                <Link
                  to="/home"
                  className="rounded-xl border border-neutral-700 px-7 py-3.5 text-sm font-bold text-white hover:bg-neutral-900"
                >
                  Explore Blogs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}

      <footer className="border-t border-neutral-100 bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-black text-white">
                  I
                </div>

                <span className="text-lg font-black">INKORA</span>
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">
                A social blogging platform for people who love to write,
                discover, and connect through stories.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Platform
              </h3>

              <div className="mt-4 flex flex-col gap-3">
                <Link
                  to="/discover"
                  className="text-sm text-neutral-500 hover:text-violet-600"
                >
                  Explore
                </Link>

                <Link
                  to="/home"
                  className="text-sm text-neutral-500 hover:text-violet-600"
                >
                  Trending
                </Link>

                <Link
                  to="/signup"
                  className="text-sm text-neutral-500 hover:text-violet-600"
                >
                  Start Writing
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Company
              </h3>

              <div className="mt-4 flex flex-col gap-3">
                <a
                  href="#about"
                  className="text-sm text-neutral-500 hover:text-violet-600"
                >
                  About
                </a>

                <a
                  href="#"
                  className="text-sm text-neutral-500 hover:text-violet-600"
                >
                  Privacy
                </a>

                <a
                  href="#"
                  className="text-sm text-neutral-500 hover:text-violet-600"
                >
                  Terms
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-neutral-100 pt-6">
            <p className="text-xs text-neutral-400">
              © 2026 INKORA. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;