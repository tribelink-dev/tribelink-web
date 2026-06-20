'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';
import { validateEmergencyContact, EmergencyContact } from '@/lib/safetyUtils';

export default function EmergencyContactsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'other' as 'family' | 'friend' | 'colleague' | 'other',
    isPrimary: false
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/safety/contacts');
      setContacts(response.data.contacts || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validation = validateEmergencyContact(formData);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    try {
      if (editingContact && editingContact._id) {
        await api.put(`/safety/contacts/${editingContact._id}`, formData);
        setSuccess('Emergency contact updated successfully');
      } else {
        await api.post('/safety/contacts', formData);
        setSuccess('Emergency contact added successfully');
      }

      setShowAddForm(false);
      setEditingContact(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        relationship: 'other',
        isPrimary: false
      });
      fetchContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error saving emergency contact:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to save emergency contact';
      setError(errorMessage);
      if (err.response?.data?.details) {
        console.error('Error details:', err.response.data.details);
      }
    }
  };

  const handleEdit = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      relationship: contact.relationship,
      isPrimary: contact.isPrimary
    });
    setShowAddForm(true);
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to remove this emergency contact?')) {
      return;
    }

    try {
      await api.delete(`/safety/contacts/${contactId}`);
      setSuccess('Emergency contact removed successfully');
      fetchContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove emergency contact');
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingContact(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: 'other',
      isPrimary: false
    });
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mb-6"></div>
          <div className="text-xl font-medium text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pt-below-nav pb-sos-clear">
      <div className="section-container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                Emergency Contacts
              </h1>
              <p className="text-lg text-gray-600">Manage your emergency contacts for SOS alerts</p>
            </div>
            <Link 
              href="/dashboard" 
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert-error mb-6">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">×</button>
            </div>
          )}

          {success && (
            <div className="alert-success mb-6">
              <span className="text-lg">✅</span>
              <span className="flex-1">{success}</span>
              <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">×</button>
            </div>
          )}
        </div>

        {/* Add Contact Button */}
        {!showAddForm && (
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Emergency Contact
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="content-card mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-tertiary text-gray-900">
                {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="input-field"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="input-field"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Relationship
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value as any })}
                    className="input-field"
                  >
                    <option value="family">Family</option>
                    <option value="friend">Friend</option>
                    <option value="colleague">Colleague</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700">
                  Set as primary emergency contact
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Contacts List */}
        <div className="content-card">
          <h2 className="heading-tertiary text-gray-900 mb-6">Your Emergency Contacts</h2>

          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No emergency contacts yet</h3>
              <p className="text-gray-600 mb-6">Add at least one emergency contact to use SOS features</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                Add Your First Contact
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="border border-gray-200 rounded-xl p-6 hover:border-primary-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{contact.name}</h3>
                        {contact.isPrimary && (
                          <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold">
                            Primary
                          </span>
                        )}
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium capitalize">
                          {contact.relationship}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {contact.phone}
                        </p>
                        {contact.email && (
                          <p className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {contact.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="btn-secondary text-sm px-4 py-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => contact._id && handleDelete(contact._id)}
                        className="btn-secondary text-sm px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

