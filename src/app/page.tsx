import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Gift,
  HeartHandshake,
  ListPlus,
  Share2,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

export default function Home() {
  const features = [
    {
      icon: <User className="h-10 w-10 text-primary" />,
      title: 'For Individuals',
      description:
        'Create personal wishlists for birthdays, weddings, or life goals. Share your dreams with friends and family effortlessly.',
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: 'For Groups',
      description:
        'Organize group gifts and events with shared lists. Perfect for friends, families, and communities pooling resources together.',
    },
    {
      icon: <HeartHandshake className="h-10 w-10 text-primary" />,
      title: 'For NGOs',
      description:
        'Amplify your impact. Verified organizations can create campaigns, call for volunteers, and transparently track fulfilled needs.',
    },
  ];

  const howItWorks = [
    {
      icon: <ListPlus className="h-8 w-8 text-primary" />,
      title: '1. Create a List',
      description:
        'Build a wishlist for any occasion, from personal dreams to public causes. Add items from anywhere on the web.',
    },
    {
      icon: <Share2 className="h-8 w-8 text-primary" />,
      title: '2. Share Your Wish',
      description:
        'Easily share your list with friends, family, or the world through a unique link or on your social feed.',
    },
    {
      icon: <Gift className="h-8 w-8 text-primary" />,
      title: '3. Make it Happen',
      description:
        'Watch as your community comes together to fulfill wishes, making dreams a reality one gift at a time.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto grid max-w-screen-xl items-center gap-8 px-4 py-20 md:grid-cols-2 md:py-32">
          <div className="flex flex-col items-start gap-6">
            <h1 className="text-4xl font-extrabold tracking-tighter md:text-5xl lg:text-6xl">
              Where Wishes Truly Find Their Way
            </h1>
            <p className="max-w-[600px] text-lg text-muted-foreground">
              Connect, share, and fulfill dreams. The social platform for
              personal goals, group gifts, and community support.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start a Wishlist <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/explore-causes">Explore Causes</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-64 w-full overflow-hidden rounded-2xl shadow-2xl md:h-auto md:aspect-square">
            <Image
              src="https://picsum.photos/800/800"
              alt="Community of people celebrating"
              data-ai-hint="community celebration"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full bg-secondary py-20 md:py-24">
          <div className="container mx-auto max-w-screen-xl px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                A Platform for Everyone
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                Whether you're an individual, a group, or a non-profit,
                WishYork has the tools you need.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="flex transform flex-col items-center text-center transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <CardHeader className="items-center">
                    <div className="mb-4 rounded-full bg-primary/10 p-4">
                      {feature.icon}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-20 md:py-24">
          <div className="container mx-auto max-w-screen-xl px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Simple Steps to a Fulfilled Wish
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                Getting started is as easy as one, two, three.
              </p>
            </div>
            <div className="grid gap-12 md:grid-cols-3">
              {howItWorks.map((step) => (
                <div
                  key={step.title}
                  className="flex flex-col items-center gap-4 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Feature Section */}
        <section className="w-full bg-secondary py-20 md:py-24">
          <div className="container mx-auto max-w-screen-xl px-4">
            <div className="grid items-center gap-8 rounded-2xl bg-card p-8 shadow-lg md:grid-cols-2 md:p-12">
              <div className="flex flex-col items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Discover Your Next Wish
                </h2>
                <p className="text-muted-foreground md:text-lg">
                  Our AI-powered suggestion engine helps you find new and
                  exciting products based on your interests and current trends.
                  Never run out of ideas again!
                </p>
                <Button variant="link" className="p-0 text-base" asChild>
                  <Link href="/dashboard/inspiration">
                    Let's Discover <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="relative h-64 w-full overflow-hidden rounded-xl">
                <Image
                  src="https://picsum.photos/600/400"
                  alt="AI suggestions"
                  data-ai-hint="futuristic technology"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="w-full py-20 md:py-24">
          <div className="container mx-auto max-w-screen-md px-4 text-center">
            <blockquote className="text-2xl font-medium italic text-foreground/80 md:text-3xl">
              "The best way to find yourself is to lose yourself in the service
              of others."
            </blockquote>
            <p className="mt-4 text-muted-foreground">- Mahatma Gandhi</p>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
