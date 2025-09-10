
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
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function DashboardExplorePage() {
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
    <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">Explore Causes</h1>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
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
  );
}
