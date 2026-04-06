import React, { useState, useEffect } from 'react';
import { X, User, GraduationCap, Phone, Mail, Award, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import { updateStudent, updateFaculty } from '../../services/api';

const EditContactModal = ({ isOpen, onClose, data, type, onUpdate }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (data) {
            setFormData({ ...data });
        }
    }, [data, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (type === 'student') {
                await updateStudent(data.id, formData);
            } else {
                await updateFaculty(data.id, formData);
            }
            toast.success('Contact updated successfully');
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Update error:', error);
            toast.error(error.response?.data?.message || 'Failed to update contact');
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
                        Edit {isStudent ? 'Student' : 'Faculty'} Details
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
                                    <input
                                        name="batch"
                                        value={formData.batch || ''}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Section</label>
                                    <input
                                        name="section"
                                        value={formData.section || ''}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
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
                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditContactModal;
