
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, UserPlus, Gift, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: 'follow',
      actor: {
        name: 'John Doe',
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f',
        username: 'johndoe',
      },
      time: '2h ago',
    },
    {
      id: 2,
      type: 'like',
      actor: {
        name: 'Alice Smith',
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704a',
        username: 'alicesmith',
      },
      postContent:
        'Just donated to the "Clean Water Initiative"! It feels so good...',
      time: '5h ago',
    },
    {
      id: 3,
      type: 'fulfill',
      actor: {
        name: 'Emily White',
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704b',
        username: 'emilywhite',
      },
      wish: 'A new laptop for my studies',
      time: '1d ago',
    },
    {
      id: 4,
      type: 'comment',
      actor: {
        name: 'Michael Brown',
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704c',
        username: 'michaelbrown',
      },
      postContent:
        'A huge thank you to all our volunteers this weekend! We successfully planted...',
      time: '3d ago',
      comment: 'This is amazing work! Happy to be a part of it.',
    },
  ];

  const renderIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return (
          <div className="absolute -bottom-1 -right-1 rounded-full bg-blue-500 p-1.5 text-white">
            <UserPlus className="h-4 w-4" />
          </div>
        );
      case 'like':
        return (
          <div className="absolute -bottom-1 -right-1 rounded-full bg-red-500 p-1.5 text-white">
            <Heart className="h-4 w-4" />
          </div>
        );
      case 'fulfill':
        return (
          <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500 p-1.5 text-white">
            <Gift className="h-4 w-4" />
          </div>
        );
      case 'comment':
        return (
          <div className="absolute -bottom-1 -right-1 rounded-full bg-gray-500 p-1.5 text-white">
            <MessageCircle className="h-4 w-4" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="relative mt-1 flex-shrink-0">
                  <Avatar>
                    <AvatarImage
                      src={notif.actor.avatarUrl}
                      alt={notif.actor.name}
                    />
                    <AvatarFallback>
                      {notif.actor.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  {renderIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <Link
                      href={`/profile/${notif.actor.username}`}
                      className="font-bold hover:underline"
                    >
                      {notif.actor.name}
                    </Link>{' '}
                    {notif.type === 'follow' && 'started following you.'}
                    {notif.type === 'like' && (
                      <>
                        liked your post:{' '}
                        <Link href="#" className="italic text-muted-foreground">
                          "{notif.postContent}"
                        </Link>
                      </>
                    )}
                    {notif.type === 'fulfill' && (
                      <>
                        fulfilled your wish:{' '}
                        <Link href="#" className="italic text-muted-foreground">
                          "{notif.wish}"
                        </Link>
                      </>
                    )}
                    {notif.type === 'comment' && (
                      <>
                        commented on your post:{' '}
                        <Link href="#" className="italic text-muted-foreground">
                          "{notif.postContent}"
                        </Link>
                      </>
                    )}
                  </p>
                  {notif.type === 'comment' && (
                    <p className="mt-2 rounded-lg bg-secondary p-2 text-sm text-muted-foreground">
                      "{notif.comment}"
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {notif.time}
                  </p>
                </div>
                {notif.type === 'follow' && <Button>Follow Back</Button>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
