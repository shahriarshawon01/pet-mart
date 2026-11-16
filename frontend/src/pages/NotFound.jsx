import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PawPrint, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Container } from '../components/ui/Container';

export default function NotFound() {
  useDocumentTitle('404 Page Not Found');

  return (
    <Container className="py-20 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary-soft text-primary mx-auto flex items-center justify-center">
          <PawPrint size={40} />
        </div>

        <div>
          <span className="text-sm font-bold uppercase tracking-wider text-primary">Error 404</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink mt-1">Page Not Found</h1>
          <p className="text-muted text-sm sm:text-base mt-2">
            The pet listing or page you're searching for might have been adopted, moved, or deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button as="link" to="/" variant="primary" iconLeft={<Home size={16} />}>
            Back to Home
          </Button>
          <Button as="link" to="/browse" variant="outline">
            Browse All Pets
          </Button>
        </div>
      </div>
    </Container>
  );
}

