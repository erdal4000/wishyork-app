
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

export default function BookmarksPage() {
  // Placeholder data
  const savedPosts = [
    {
      id: 1,
      author: 'Hope Foundation',
      username: 'hopefoundation',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
      time: '2h ago',
      content:
        'A huge thank you to all our volunteers this weekend! We successfully planted over 200 trees for our reforestation project. Together, we are making a greener planet! 🌱💚 #Volunteer #Environment #Reforestation',
      imageUrl: null,
      aiHint: null,
    },
  ];

  const savedCauses = [
    {
      title: 'Provide Shelter for Stray Animals',
      author: 'Paws & Claws United',
      category: 'Animals',
      progress: 92,
      imageUrl: 'https://picsum.photos/400/250?random=3',
      aiHint: 'dog shelter',
    },
  ];

  const savedItems = [
    {
      id: 1,
      name: 'Professional Camera',
      description:
        'To document our field trips and create compelling stories for our causes.',
      price: '$1,200',
      imageUrl: 'https://picsum.photos/300/300?random=10',
      aiHint: 'professional camera',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
      <p className="text-muted-foreground">
        Your saved posts, causes, and items for later.
      </p>
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="causes">Causes</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-6">
          <div className="space-y-6">
            {savedPosts.map((post) => (
              <Card key={post.id}>
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <Avatar>
                    <AvatarImage src={post.avatarUrl} alt={post.author} />
                    <AvatarFallback>
                      {post.author
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold">{post.author}</p>
                    <p className="text-sm text-muted-foreground">
                      <Link href={`/profile/${post.username}`}>
                        @{post.username}
                      </Link>{' '}
                      · {post.time}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="whitespace-pre-wrap">{post.content}</p>
                </CardContent>
              </Card>
            ))}
            <div className="flex items-center justify-center p-8 text-center text-muted-foreground">
              <p>No more saved posts.</p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="causes" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {savedCauses.map((cause, index) => (
              <Card
                key={index}
                className="flex flex-col overflow-hidden rounded-2xl shadow-lg"
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
                    className="h-56 w-full object-cover"
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
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button asChild className="w-full">
                    <Link href="#">
                      View Cause <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
             <div className="flex items-center justify-center p-8 text-center text-muted-foreground md:col-span-2 xl:col-span-3">
                <p>No more saved causes.</p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="items" className="mt-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                 {savedItems.map((item) => (
                    <Card key={item.id} className="group">
                        <div className="relative aspect-square w-full overflow-hidden rounded-t-lg">
                            <Image
                                src={item.imageUrl}
                                alt={item.name}
                                data-ai-hint={item.aiHint}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                            />
                        </div>
                        <CardContent className="p-4">
                            <h3 className="font-semibold leading-tight">{item.name}</h3>
                            <p className="mt-1 text-sm text-muted-foreground truncate">{item.description}</p>
                            <p className="mt-2 font-bold">{item.price}</p>
                        </CardContent>
                         <CardFooter>
                             <Button variant="outline" className="w-full">Remove</Button>
                         </CardFooter>
                    </Card>
                 ))}
                  <div className="flex items-center justify-center p-8 text-center text-muted-foreground sm:col-span-2 md:col-span-3 lg:col-span-4">
                    <p>No more saved items.</p>
                  </div>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
