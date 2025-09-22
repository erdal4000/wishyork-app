
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
import placeholderImages from '@/lib/placeholder-images.json';

export default function Home() {
  const features = [
    {
      icon: <User className="h-10 w-10 text-primary" />,
      title: 'For Individuals',
      description:
        'Create and share personal wishlists for any occasion. From birthdays to life goals, let your dreams be known and turn them into reality with the help of your community.',
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: 'For Groups & Communities',
      description:
        'Organize group gifts seamlessly. Pool resources with friends and family for a bigger impact, whether for a shared present or a community project.',
    },
    {
      icon: <HeartHandshake className="h-10 w-10 text-primary" />,
      title: 'For Causes & NGOs',
      description:
        'Amplify your impact with transparent, item-based campaigns. Verified organizations can directly list their needs, ensuring every contribution is meaningful and direct.',
    },
  ];

  const howItWorks = [
    {
      icon: <ListPlus className="h-8 w-8 text-primary" />,
      title: '1. Create Your Wish',
      description:
        'Build a wishlist for any goal. Add items manually, or automatically fetch product details from any website just by pasting a link.',
    },
    {
      icon: <Share2 className="h-8 w-8 text-primary" />,
      title: '2. Share with Your World',
      description:
        'Easily share your list with a unique link. Control who sees it, from a private group of friends to the public.',
    },
    {
      icon: <Gift className="h-8 w-8 text-primary" />,
      title: '3. Receive & Give',
      description:
        'Watch your community come together to fulfill wishes. Contribute to public causes and make a tangible difference in the world.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto grid max-w-screen-xl items-center gap-8 px-4 py-20 md:grid-cols-2 md:py-32">
          <div className="flex flex-col items-start gap-6">
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter md:text-5xl lg:text-6xl">
              Turn Wishes into Reality.
            </h1>
            <p className="max-w-[600px] text-lg text-muted-foreground">
              WishYork is the social platform where personal dreams, group gifts, and community causes connect. Share your wishes, support others, and make a real impact, together.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Your First Wishlist <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/explore-causes">Explore Causes</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-64 w-full overflow-hidden rounded-2xl shadow-2xl md:h-auto md:aspect-square">
            <Image
              src={placeholderImages.home.hero}
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
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
                A Platform for Every Dream
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                Whether you are an individual with a personal goal, a group of friends, or a non-profit organization, WishYork has the tools you need.
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
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
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
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
                  Discover Your Next Wish
                </h2>
                <p className="text-muted-foreground md:text-lg">
                  Stuck for ideas? Our AI-powered Inspiration Box helps you find new and
                  exciting products based on your interests and current trends.
                </p>
                <Button variant="link" className="p-0 text-base" asChild>
                  <Link href="/dashboard/inspiration">
                    Get Inspired <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="relative h-64 w-full overflow-hidden rounded-xl">
                <Image
                  src={placeholderImages.home.aiFeature}
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
            <blockquote className="font-headline text-2xl font-medium italic text-foreground/80 md:text-3xl">
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
