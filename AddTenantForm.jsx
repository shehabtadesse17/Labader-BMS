import React, { useState } from 'react';
import { createTenant } from './airtable';

const AddTenantForm = ({ onTenantAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    unitInfo: '',
    phoneNumber: '', // New field
    telegramUsername: '', // New field
    memberSince: '',
    monthlyRent: '',
    dueDay: '',
    paidStatus: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const rent = parseFloat(formData.monthlyRent);
    const day = parseInt(formData.dueDay, 10);

    if (isNaN(rent) || isNaN(day)) {
      alert("Please enter valid numbers for Rent and Due Day.");
      setIsSubmitting(false);
      return;
    }

    try {
      const newTenant = await createTenant({
        ...formData,
        monthlyRent: rent,
        dueDay: day,
      });
      onTenantAdded(newTenant);
      setFormData({
        name: '',
        unitInfo: '',
        phoneNumber: '',
        telegramUsername: '',
        memberSince: '',
        monthlyRent: '',
        dueDay: '',
        paidStatus: false
      });
    } catch (error) {
      alert(`Failed to add tenant: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-bold mb-4">Add New Tenant</h2>
      <div className="grid grid-cols-1 gap-4">
        <input
          type="text"
          name="name"
          placeholder="Tenant Name (e.g. Abebe Kebede)"
          value={formData.name}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <input
          type="tel"
          name="phoneNumber"
          placeholder="Phone Number (e.g. +251...)"
          value={formData.phoneNumber}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="unitInfo"
          placeholder="Unit Info (e.g. Office #101)"
          value={formData.unitInfo}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <input
          type="tel"
          name="phoneNumber"
          placeholder="Phone Number (e.g. +251...)"
          value={formData.phoneNumber}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="telegramUsername"
          placeholder="Telegram Username (without @)"
          value={formData.telegramUsername}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          type="date"
          name="memberSince"
          value={formData.memberSince}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <input
          type="date"
          name="memberSince"
          value={formData.memberSince}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <input
          type="number"
          name="monthlyRent"
          placeholder="Monthly Rent (ETB)"
          value={formData.monthlyRent}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <input
          type="number"
          name="dueDay"
          placeholder="Due Day (1-31)"
          min="1"
          max="31"
          value={formData.dueDay}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition"
        >
          {isSubmitting ? 'Adding...' : 'Add Tenant'}
        </button>
      </div>
    </form>
  );
};

export default AddTenantForm;