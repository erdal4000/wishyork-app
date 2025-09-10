import { InspirationGenerator } from '@/components/inspiration-generator';

export default function InspirationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inspiration Box</h1>
        <p className="mt-2 text-muted-foreground">
          Discover new products and ideas tailored to your interests. Tell us
          what you like, and our AI will find things you'll love.
        </p>
      </div>
      <InspirationGenerator />
    </div>
  );
}
