import React, { useState, useEffect } from 'react';
import { X, User, GraduationCap, Phone, Mail, Award, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import { updateStudent, updateFaculty, createStudent, createFaculty, getBatches } from '../../services/api';

const EditContactModal = ({ isOpen, onClose, data, type, onUpdate }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    const [batches, setBatches] = useState([]);

    useEffect(() => {
        if (isOpen && type === 'student') {
            const fetchBatches = async () => {
                try {
                    const response = await getBatches();
                    setBatches(response.data || []);
                } catch (error) {
                    console.error("Error fetching batches:", error);
                }
            };
            fetchBatches();
        }
    }, [isOpen, type]);

    useEffect(() => {
        if (data) {
            setFormData({ ...data });
        } else {
            setFormData(type === 'student' 
                ? { name: '', student_id: '', email: '', phone: '', batch: '', section: '', account_type: 'Student' }
                : { name: '', initials: '', email: '', phone: '', designation: '', type: 'Permanent' }
            );
        }
    }, [data, isOpen, type]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const isAdd = !data;
            if (type === 'student') {
                if (isAdd) await createStudent(formData);
                else await updateStudent(data.id, formData);
            } else {
                if (isAdd) await createFaculty(formData);
                else await updateFaculty(data.id, formData);
            }
            toast.success(`Contact ${isAdd ? 'created' : 'updated'} successfully`);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Operation error:', error);
            toast.error(error.response?.data?.message || `Failed to ${data ? 'update' : 'create'} contact`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const isStudent = type === 'student';

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                        {isStudent ? <GraduationCap className="w-5 h-5 text-indigo-500" /> : <User className="w-5 h-5 text-indigo-500" />}
                        {data ? 'Edit' : 'Add New'} {isStudent ? 'Student' : 'Faculty'}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" /> Name
                            </label>
                            <input
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                        </div>

                        {isStudent ? (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                                    <Award className="w-3 h-3" /> Student ID
                                </label>
                                <input
                                    name="student_id"
                                    value={formData.student_id || ''}
                                    onChange={handleChange}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                                    <Award className="w-3 h-3" /> Initials
                                </label>
                                <input
                                    name="initials"
                                    value={formData.initials || ''}
                                    onChange={handleChange}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={handleChange}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" /> Phone
                            </label>
                            <input
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleChange}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        {!isStudent && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Designation</label>
                                    <input
                                        name="designation"
                                        value={formData.designation || ''}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Type</label>
                                    <select
                                        name="type"
                                        value={formData.type || 'Permanent'}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="Permanent">Permanent</option>
                                        <option value="Guest">Guest</option>
                                        <option value="Adjunct">Adjunct</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {isStudent && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Batch</label>
                                    <select
                                        name="batch"
                                        value={formData.batch || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(prev => ({ ...prev, batch: val, section: '' }));
                                        }}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        required
                                    >
                                        <option value="">Select Batch</option>
                                        {[...new Set(batches.map(b => b.name))].sort().map(batchName => (
                                            <option key={batchName} value={batchName}>{batchName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Section</label>
                                    <select
                                        name="section"
                                        value={formData.section || ''}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        required={!!formData.batch}
                                    >
                                        <option value="">Select Section</option>
                                        {batches
                                            .filter(b => b.name === formData.batch)
                                            .map(b => b.section)
                                            .filter(Boolean)
                                            .sort()
                                            .map(section => (
                                                <option key={section} value={section}>{section}</option>
                                            ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Account Type</label>
                                    <select
                                        name="account_type"
                                        value={formData.account_type || 'Student'}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="Student">Student</option>
                                        <option value="CR/ACR">CR/ACR</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> {data ? 'Save Changes' : 'Create Contact'}</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditContactModal;
