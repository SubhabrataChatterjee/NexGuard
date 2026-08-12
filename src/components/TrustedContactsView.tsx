import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit3, Shield, Phone, Mail, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api } from '../lib/api';
import { TrustedContact } from '../types';

interface TrustedContactsViewProps {
  contacts: TrustedContact[];
  onRefresh: () => Promise<void>;
}

export const TrustedContactsView: React.FC<TrustedContactsViewProps> = ({ contacts, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<TrustedContact | null>(null);

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Sister');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openAddModal = () => {
    setName('');
    setRelationship('Sister');
    setPhone('');
    setEmail('');
    setEditingContact(null);
    setError('');
    setShowAddModal(true);
  };

  const openEditModal = (contact: TrustedContact) => {
    setEditingContact(contact);
    setName(contact.name);
    setRelationship(contact.relationship);
    setPhone(contact.phone || '');
    setEmail(contact.email || '');
    setError('');
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!phone.trim() && !email.trim())) {
      setError('Name and either a phone number or email are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (editingContact) {
        await api.updateTrustedContact(editingContact.id, {
          name,
          relationship,
          phone,
          email,
        });
      } else {
        await api.addTrustedContact({
          name,
          relationship,
          phone,
          email,
        });
      }
      await onRefresh();
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save contact.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.deleteTrustedContact(id);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete contact');
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight">Trusted Contacts</h1>
          <p className="text-sm text-[#51505f] mt-1">
            People who receive real-time location links and emergency SOS broadcasts during your active journeys.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#532dcf] hover:bg-[#481cc4] text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all flex items-center gap-2 text-sm shrink-0 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Trusted Contact</span>
        </button>
      </div>

      {/* Contact Cards Grid */}
      {contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-3xl p-6 border border-[#e1e2e5] shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#eee7ff] text-[#532dcf] font-bold text-lg flex items-center justify-center">
                      {contact.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#191c1e]">{contact.name}</h3>
                      <span className="text-xs bg-[#f2f3f6] text-[#484555] px-2.5 py-0.5 rounded-full font-medium">
                        {contact.relationship}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(contact)}
                      className="p-2 text-[#797586] hover:text-[#532dcf] hover:bg-[#f2f3f6] rounded-xl transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-2 text-[#797586] hover:text-[#ba1a1a] hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-[#51505f]">
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#797586]" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#797586]" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Permissions Pills */}
              <div className="pt-4 border-t border-[#f2f3f6] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[#008a00] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SOS Alerts Authorized</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#008a00] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Live Journey Sharing Enabled</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-[#e1e2e5] text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#eee7ff] text-[#532dcf] flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#191c1e]">No Contacts Added Yet</h3>
          <p className="text-xs text-[#51505f] leading-relaxed">
            Add your friends, family, or emergency services so they can be automatically alerted during active journeys or SOS events.
          </p>
          <button
            onClick={openAddModal}
            className="bg-[#532dcf] text-white font-bold py-3 px-6 rounded-xl text-xs hover:bg-[#481cc4]"
          >
            Add Your First Contact
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-[#e1e2e5] pb-3">
              <h3 className="text-lg font-bold text-[#191c1e]">
                {editingContact ? 'Edit Trusted Contact' : 'Add Trusted Contact'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#797586] hover:text-[#191c1e]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sarah Johnson"
                  required
                  className="w-full bg-[#f2f3f6] p-3 rounded-xl border border-transparent focus:border-[#532dcf] outline-none text-xs text-[#191c1e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full bg-[#f2f3f6] p-3 rounded-xl border border-transparent focus:border-[#532dcf] outline-none text-xs text-[#191c1e]"
                >
                  <option value="Sister">Sister</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Partner">Partner</option>
                  <option value="Friend">Friend</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Campus Security">Campus Security</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-[#f2f3f6] p-3 rounded-xl border border-transparent focus:border-[#532dcf] outline-none text-xs text-[#191c1e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full bg-[#f2f3f6] p-3 rounded-xl border border-transparent focus:border-[#532dcf] outline-none text-xs text-[#191c1e]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-[#f2f3f6] text-[#191c1e] font-bold rounded-xl text-xs hover:bg-[#e1e2e5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#532dcf] text-white font-bold rounded-xl text-xs hover:bg-[#481cc4] disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
