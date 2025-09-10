
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Search, SendHorizonal } from 'lucide-react';

export default function MessagesPage() {
  const conversations = [
    {
      id: 1,
      name: 'John Doe',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f',
      lastMessage: 'Hey, did you see my latest wish?',
      time: '5m',
      unread: 2,
    },
    {
      id: 2,
      name: 'Hope Foundation',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
      lastMessage: 'Thank you so much for your donation!',
      time: '1h',
      unread: 0,
    },
    {
      id: 3,
      name: 'Alice Smith',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704a',
      lastMessage: 'That\'s a great idea for a group gift!',
      time: '3h',
      unread: 0,
    },
    {
      id: 4,
      name: 'Michael Brown',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704c',
      lastMessage: 'Sure, I can help with that.',
      time: '1d',
      unread: 0,
    },
  ];

  const selectedConversation = {
    id: 1,
    name: 'John Doe',
    messages: [
        { id: 1, content: 'Hey, did you see my latest wish?', sender: 'John Doe', time: '10:00 AM' },
        { id: 2, content: 'I did! It looks amazing. I might be able to help you with the camera.', sender: 'Me', time: '10:01 AM' },
        { id: 3, content: 'Wow, really? That would be incredible!', sender: 'John Doe', time: '10:02 AM' },
        { id: 4, content: 'Yeah, let me check and get back to you in a bit.', sender: 'Me', time: '10:03 AM' },
    ],
  }

  const activeConversationId = 1;

  return (
    <div className="grid h-[calc(100vh-10rem)] grid-cols-12 overflow-hidden rounded-lg border">
      {/* Conversation List */}
      <div className="col-span-12 flex h-full flex-col border-r md:col-span-4 xl:col-span-3">
        <div className="p-4">
          <h2 className="text-2xl font-bold tracking-tight">Chats</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-10" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 p-2">
            {conversations.map((convo) => (
              <a
                key={convo.id}
                href="#"
                className={cn(
                  'flex items-start gap-4 rounded-lg p-3 text-left text-sm transition-all hover:bg-accent',
                  {
                    'bg-accent font-semibold': convo.id === activeConversationId,
                  }
                )}
              >
                <Avatar>
                  <AvatarImage src={convo.avatarUrl} alt={convo.name} />
                  <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                    <div className="flex items-center justify-between">
                        <p className="font-medium">{convo.name}</p>
                        <p className="text-xs text-muted-foreground">{convo.time}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="truncate text-xs text-muted-foreground">{convo.lastMessage}</p>
                        {convo.unread > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                {convo.unread}
                            </span>
                        )}
                    </div>
                </div>
              </a>
            ))}
          </nav>
        </ScrollArea>
      </div>

      {/* Chat View */}
      <div className="col-span-12 flex h-full flex-col md:col-span-8 xl:col-span-9">
        {selectedConversation ? (
            <>
            <div className="flex items-center gap-4 border-b p-4">
                <Avatar>
                    <AvatarImage src={`https://i.pravatar.cc/150?u=a042581f4e29026704f`} alt={selectedConversation.name} />
                    <AvatarFallback>{selectedConversation.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{selectedConversation.name}</h3>
            </div>
            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4">
                    {selectedConversation.messages.map(msg => (
                         <div key={msg.id} className={cn("flex items-end gap-2", { "justify-end": msg.sender === 'Me' })}>
                             {msg.sender !== 'Me' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={`https://i.pravatar.cc/150?u=a042581f4e29026704f`} alt={selectedConversation.name} />
                                    <AvatarFallback>{selectedConversation.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                             )}
                            <div className={cn("max-w-xs rounded-2xl p-3 md:max-w-md", {
                                "bg-primary text-primary-foreground rounded-br-none": msg.sender === 'Me',
                                "bg-muted rounded-bl-none": msg.sender !== 'Me',
                            })}>
                                <p className="text-sm">{msg.content}</p>
                                <p className="mt-1 text-right text-xs opacity-70">{msg.time}</p>
                            </div>
                         </div>
                    ))}
                </div>
            </ScrollArea>
            <div className="border-t p-4">
                 <div className="relative">
                    <Input placeholder="Type your message..." className="pr-12" />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2">
                        <SendHorizonal className="h-5 w-5" />
                        <span className="sr-only">Send Message</span>
                    </Button>
                </div>
            </div>
            </>
        ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <p>Select a conversation to start chatting</p>
            </div>
        )}
      </div>
    </div>
  );
}
