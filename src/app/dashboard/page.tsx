
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardPage() {
  const posts = [
    {
      id: 1,
      author: 'Jane Doe',
      username: 'janedoe',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
      time: '5m ago',
      content:
        'Just donated to the "Clean Water Initiative"! It feels so good to contribute to such a meaningful cause. Every little bit helps to bring safe drinking water to communities in need. #CleanWater #GivingBack #SocialGood',
      imageUrl: 'https://picsum.photos/600/400?random=1',
      aiHint: 'clean water charity',
    },
    {
      id: 2,
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

  return (
    <div className="space-y-6">
      {/* Create Post Card */}
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
          <Avatar>
            <AvatarImage
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
              alt="User"
            />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div className="w-full">
            <Textarea
              placeholder="What's on your mind? Share a wish or a success story!"
              className="border-0 bg-secondary/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={3}
            />
          </div>
        </CardHeader>
        <CardFooter className="flex justify-end p-4 pt-0">
          <Button>Post</Button>
        </CardFooter>
      </Card>

      {/* Feed Posts */}
      {posts.map((post) => (
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
                <Link href={`/profile/${post.username}`}>@{post.username}</Link>{' '}
                · {post.time}
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-2">
            <p className="whitespace-pre-wrap">{post.content}</p>
            {post.imageUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                <Image
                  src={post.imageUrl}
                  alt={`Post by ${post.author}`}
                  fill
                  className="object-cover"
                  data-ai-hint={post.aiHint ?? ''}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="p-2">
            <Button variant="ghost" className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              <span className="text-sm">123</span>
            </Button>
            <Button variant="ghost" className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">45</span>
            </Button>
            <Button variant="ghost" className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              <span className="text-sm">Share</span>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
