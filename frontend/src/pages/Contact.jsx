import React, { useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Container } from '../components/ui/Container';
import { PageHeader } from '../components/layout/PageHeader';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { useSiteSettings, setting } from '../hooks/useSiteSettings';
import api from '../services/api';
import { PhoneInput } from '../components/ui/PhoneInput';
import { BD_PHONE_REGEX } from '../lib/constants';
import { fieldErrors } from '../lib/auth';
import { isBlank, toastErrors } from '../lib/validation';

export default function Contact() {
  useDocumentTitle('Contact Support');
  const { settings } = useSiteSettings();
  const phone = setting(settings, 'contact_phone', null);
  const email = setting(settings, 'contact_email', null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });

  const [errors, setErrors] = useState({});
  const ids = { name: 'contact-name', phone: 'contact-phone', message: 'contact-message' };

  const validate = () => {
    const e = {};
    if (isBlank(formData.name)) e.name = 'Your name is required.';
    if (isBlank(formData.phone)) e.phone = 'Mobile number is required.';
    else if (!BD_PHONE_REGEX.test(formData.phone)) e.phone = 'Mobile number must be 11 digits and start with 01.';
    if (formData.message.trim().length < 10) e.message = 'Please write at least 10 characters.';
    setErrors(e);
    if (Object.keys(e).length) toastErrors(e, ids);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/contact', {
        name: formData.name.trim(),
        phone: formData.phone,
        message: formData.message.trim(),
      });
      toast.success(res.data?.message || 'Thanks, we have received your message.');
      setFormData({ name: '', phone: '', message: '' });
      setErrors({});
    } catch (err) {
      const fe = fieldErrors(err);
      if (Object.keys(fe).length) {
        setErrors(fe);
        toastErrors(fe, ids);
      } else if (err.response?.status === 429) {
        toast.error('You have sent several messages already. Please try again in a few minutes.');
      } else {
        toast.error(err.response?.data?.message || 'Your message could not be sent. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-8 sm:py-12 max-w-4xl">
      <PageHeader
        title="Contact PetMart Support"
        subtitle="Have questions about listing your pet, verifying your account, or reporting an issue?"
        breadcrumbs={[{ label: 'Contact Us' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Information */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-border shadow-xs space-y-4">
            <h3 className="font-bold text-ink text-base">Direct Channels</h3>
            
            {phone && (
              <div className="flex items-start gap-3 text-sm">
                <Phone size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-ink">Hotline</p>
                  <a href={`tel:${String(phone).replace(/[^\d+]/g, '')}`} className="text-muted hover:text-primary-hover">
                    {phone}
                  </a>
                </div>
              </div>
            )}

            {email && (
              <div className="flex items-start gap-3 text-sm">
                <Mail size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-ink">Email Support</p>
                  <a href={`mailto:${email}`} className="break-all text-muted hover:text-primary-hover">
                    {email}
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 text-sm">
              <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-ink">Office</p>
                <p className="text-muted">Banani, Dhaka, Bangladesh</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} noValidate className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-5">
            <h3 className="font-bold text-ink text-lg">Send Us a Message</h3>
            <Input
              id="contact-name"
              label="Your Name"
              required
              maxLength={100}
              error={errors.name}
              placeholder="e.g. Arif Hossain"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <PhoneInput
              id="contact-phone"
              label="Contact Phone"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={errors.phone}
            />
            <Textarea
              id="contact-message"
              label="Message"
              required
              maxLength={2000}
              error={errors.message}
              rows={4}
              placeholder="Describe your inquiry, issue, or feedback..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
            <Button type="submit" variant="primary" loading={loading} iconLeft={<Send size={16} />}>
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </Container>
  );
}

