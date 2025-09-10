
import { LoginForm } from '@/components/login-form';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-screen-xl px-4 py-8 md:py-16">
          <div className="mx-auto max-w-md">
            <LoginForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
