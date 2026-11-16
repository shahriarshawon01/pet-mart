import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Checkbox } from '../components/ui/Checkbox';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { Container } from '../components/ui/Container';
import { Search } from 'lucide-react';

export default function UiKit() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(3);

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold text-ink mb-2">PetMart UI Kit</h1>
      <p className="text-muted mb-10">Design system preview — dev only</p>

      {/* Buttons */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-ink mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button variant="outline" iconLeft={<Search size={16} />}>With Icon</Button>
          <Button as="link" to="/" variant="outline">Link Button</Button>
        </div>
      </section>

      {/* Badges */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-ink mb-4">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge color="primary">Featured</Badge>
          <Badge color="amber">Stud</Badge>
          <Badge color="red">Lost</Badge>
          <Badge color="blue">Adoption</Badge>
          <Badge color="purple">Service</Badge>
          <Badge color="secondary">Default</Badge>
        </div>
      </section>

      {/* Form Fields */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-ink mb-4">Form Fields</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <Input label="Full Name" placeholder="Enter your name" required hint="Your legal name" />
          <Input label="Email" placeholder="email@example.com" error="Invalid email address" />
          <PhoneInput label="Phone Number" placeholder="1700000000" required />
          <Select label="Category" placeholder="Select category" options={[
            { value: 'dogs', label: 'Dogs & Puppies' },
            { value: 'cats', label: 'Cats & Kittens' },
          ]} required />
          <Textarea label="Description" placeholder="Describe your pet..." rows={3} hint="Min 50 characters" />
          <Checkbox label="I agree to terms" hint="Read the terms carefully" />
        </div>
      </section>

      {/* Modal */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-ink mb-4">Modal & ConfirmDialog</h2>
        <div className="flex gap-3">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>Open ConfirmDialog</Button>
        </div>
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Example Modal">
          <p className="text-muted mb-4">This is modal content. Press Escape or click outside to close.</p>
          <Input label="Name" placeholder="Enter name" />
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setModalOpen(false)}>Submit</Button>
          </div>
        </Modal>
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
          title="Delete listing?"
          message="This action cannot be undone. All data will be permanently removed."
          confirmLabel="Delete"
        />
      </section>

      {/* Skeleton & Spinner */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-ink mb-4">Loading States</h2>
        <div className="flex items-center gap-6 mb-6">
          <Spinner size={24} />
          <Spinner size={36} />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>

      {/* ImageWithFallback */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-ink mb-4">ImageWithFallback</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
          <ImageWithFallback src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300" alt="Dog" className="rounded-xl overflow-hidden" />
          <ImageWithFallback src="https://broken-url-test.invalid/image.jpg" alt="Broken image test" className="rounded-xl overflow-hidden" />
        </div>
      </section>

      {/* EmptyState */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-ink mb-4">EmptyState</h2>
        <Card>
          <EmptyState
            icon={Search}
            title="No results found"
            description="Try adjusting your filters or searching with different keywords."
            actionLabel="Clear Filters"
            action={() => {}}
          />
        </Card>
      </section>

      {/* Pagination */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-ink mb-4">Pagination</h2>
        <Pagination currentPage={page} lastPage={10} onPageChange={setPage} />
      </section>
    </Container>
  );
}
