import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

export default function ExploreCausesPage() {
  const causes = [
    {
      title: 'Support Education for Underprivileged Children',
      author: 'Hope Foundation',
      category: 'Education',
      progress: 75,
      imageUrl: 'https://picsum.photos/400/250?random=1',
      aiHint: 'children classroom',
    },
    {
      title: 'Clean Water Initiative in Rural Areas',
      author: 'AquaLife Org',
      category: 'Environment',
      progress: 45,
      imageUrl: 'https://picsum.photos/400/250?random=2',
      aiHint: 'clean water',
    },
    {
      title: 'Provide Shelter for Stray Animals',
      author: 'Paws & Claws United',
      category: 'Animals',
      progress: 92,
      imageUrl: 'https://picsum.photos/400/250?random=3',
      aiHint: 'dog shelter',
    },
    {
      title: 'Emergency Medical Supplies for Disaster Relief',
      author: 'Global Aid Network',
      category: 'Health',
      progress: 60,
      imageUrl: 'https://picsum.photos/400/250?random=4',
      aiHint: 'medical supplies',
    },
    {
      title: 'Reforestation Project in the Amazon',
      author: 'Green-Planet Initiative',
      category: 'Environment',
      progress: 30,
      imageUrl: 'https://picsum.photos/400/250?random=5',
      aiHint: 'reforestation forest',
    },
    {
      title: 'Digital Literacy Program for Seniors',
      author: 'TechConnect Seniors',
      category: 'Community',
      progress: 85,
      imageUrl: 'https://picsum.photos/400/250?random=6',
      aiHint: 'seniors technology',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <Header />
      <main className="flex-1">
        <section className="w-full bg-background py-12 shadow-sm">
          <div className="container mx-auto max-w-screen-xl px-4">
            <div className="text-center">
              <h1 className="font-headline text-4xl font-extrabold tracking-tighter md:text-5xl">
                Discover & Support a Cause
              </h1>
              <p className="mx-auto mt-4 max-w-[700px] text-lg text-muted-foreground">
                Browse through active campaigns and wishlists. Your contribution
                can make a world of difference.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 rounded-xl border bg-card p-4 shadow-md md:grid-cols-4 md:p-6">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for causes, organizations, or keywords..."
                  className="pl-10 text-base"
                />
              </div>
              <Select>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="animals">Animals</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Sort by: Popular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="nearing_goal">Nearing Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-screen-xl px-4">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {causes.map((cause, index) => (
                <Card
                  key={index}
                  className="flex flex-col overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <CardHeader className="relative p-0">
                    <Badge className="absolute right-3 top-3 z-10">
                      {cause.category}
                    </Badge>
                    <Image
                      src={cause.imageUrl}
                      alt={cause.title}
                      data-ai-hint={cause.aiHint}
                      width={400}
                      height={250}
                      className="h-64 w-full object-cover"
                    />
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col p-6">
                    <h3 className="font-headline mb-2 text-xl font-bold">
                      {cause.title}
                    </h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      by{' '}
                      <Link href="#" className="font-semibold text-primary">
                        {cause.author}
                      </Link>
                    </p>
                    <div className="mb-1 flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-semibold text-foreground">
                        {cause.progress}%
                      </span>
                    </div>
                    <Progress value={cause.progress} className="h-2" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Target: Goal amount here
                    </p>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Button asChild className="w-full text-lg">
                      <Link href="#">
                        View Cause <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
