import React, { useState, useEffect, useMemo } from 'react';
import {
    createFaculty, updateFaculty, deleteFaculty, getFaculty,
    createCourse, updateCourse, deleteCourse, getCourses,
    createRoom, updateRoom, deleteRoom, getRooms,
    createBatch, updateBatch, deleteBatch, getBatches
} from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import toast from 'react-hot-toast';
import { Users, BookOpen, MapPin, Layers, Save, Edit, Trash2, Copy, X, Plus, Search, Download } from 'lucide-react'; // Removed HardDriveDownload, Upload
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import BackupDashboard from './BackupDashboard';

const AdminPanel = () => {
    const { hasPermission } = useAuth();

    const availableTabs = [
        { id: 'faculty', label: 'Faculty', icon: <Users size={18} />, perm: 'manage_faculty' },
        { id: 'courses', label: 'Courses', icon: <BookOpen size={18} />, perm: 'manage_courses' },
        { id: 'rooms', label: 'Rooms', icon: <MapPin size={18} />, perm: 'manage_rooms' },
        { id: 'batches', label: 'Batches', icon: <Layers size={18} />, perm: 'manage_batches' },
    ];
    const tabs = availableTabs.filter(tab => hasPermission(tab.perm));

    const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[0].id : '');
    const [dataList, setDataList] = useState([]);
    const [rooms, setRooms] = useState([]); // For dropdowns
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    // const fileInputRef = useRef(null); // Removed

    // Added state for BackupDashboard modal
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

    // Room Filter State
    const [showClassrooms, setShowClassrooms] = useState(true);

    const [showLabs, setShowLabs] = useState(true);

    // Faculty Filter State
    const [showPermanent, setShowPermanent] = useState(true);
    const [showGuest, setShowGuest] = useState(true);
    const [showAdjunct, setShowAdjunct] = useState(true);

    // Course Filter State
    const [showTheory, setShowTheory] = useState(true);
    const [showLabCourses, setShowLabCourses] = useState(true);

    // Initial Form States
    const initialFacultyForm = { name: '', initials: '', type: 'Permanent', email: '', phone: '', designation: 'Lecturer' };
    const initialCourseForm = { code: '', name: '', credit: 3.0, type: 'Theory', assigned_faculty_id: '' };
    const initialRoomForm = { room_number: '', capacity: 40, floor: 1, type: 'Theory' };
    const initialBatchForm = { name: '', year: '1st Year', semester: '1st Sem', section: 'A', default_room_id: '' };

    const [facultyForm, setFacultyForm] = useState(initialFacultyForm);
    const [courseForm, setCourseForm] = useState(initialCourseForm);
    const [roomForm, setRoomForm] = useState(initialRoomForm);
    const [batchForm, setBatchForm] = useState(initialBatchForm);

    // Fetch Data
    const fetchData = async () => {
        setIsLoading(true);
        try {
            let response;
            if (activeTab === 'faculty') response = await getFaculty();
            if (activeTab === 'courses') response = await getCourses();
            if (activeTab === 'rooms') response = await getRooms();
            if (activeTab === 'batches') {
                response = await getBatches();
                const roomsResponse = await getRooms();
                setRooms(roomsResponse.data || []);
            }

            setDataList(response.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        cancelEdit(); // Reset form on tab change
        setSearchQuery(''); // Reset search
    }, [activeTab]);

    // Handle Form Submit (Create or Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading(editingId ? 'Updating...' : 'Saving...');
        try {
            if (activeTab === 'faculty') {
                editingId
                    ? await updateFaculty(editingId, facultyForm)
                    : await createFaculty(facultyForm);
            }
            if (activeTab === 'courses') {
                editingId
                    ? await updateCourse(editingId, courseForm)
                    : await createCourse(courseForm);
            }
            if (activeTab === 'rooms') {
                editingId
                    ? await updateRoom(editingId, roomForm)
                    : await createRoom(roomForm);
            }
            if (activeTab === 'batches') {
                const batchName = `${batchForm.year} ${batchForm.semester}`;
                // Check for duplicate batch name + section
                const isDuplicate = dataList.some(item =>
                    item.name === batchName &&
                    item.section === batchForm.section &&
                    item.id !== editingId
                );

                if (isDuplicate) {
                    toast.error(`${batchName} Section ${batchForm.section} already exists!`, { id: loadingToast });
                    return;
                }

                const combinedBatchForm = {
                    ...batchForm,
                    name: batchName,
                    default_room_id: batchForm.default_room_id || null
                };
                editingId
                    ? await updateBatch(editingId, combinedBatchForm)
                    : await createBatch(combinedBatchForm);
            }

            toast.success(editingId ? 'Updated Successfully!' : 'Saved Successfully!', { id: loadingToast });
            fetchData();
            cancelEdit();
        } catch (err) {
            console.error(err);
            toast.error('Operation failed.', { id: loadingToast });
        }
    };

    // Actions
    const handleEdit = (item) => {
        setEditingId(item.id);
        if (activeTab === 'faculty') setFacultyForm(item);
        if (activeTab === 'courses') setCourseForm(item);
        if (activeTab === 'rooms') setRoomForm(item);
        if (activeTab === 'batches') {
            const batchName = item.name || '';
            const nameParts = batchName.split(' ');
            const year = nameParts.length >= 2 ? `${nameParts[0]} ${nameParts[1]}` : '1st Year';
            const semester = nameParts.length >= 4 ? `${nameParts[2]} ${nameParts[3]}` : '1st Sem';
            setBatchForm({ ...item, year, semester, default_room_id: item.default_room_id || '' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDuplicate = (item) => {
        setEditingId(null);
        // Exclude ID to treat as new
        const { id, ...rest } = item;
        if (id) { /* Ignore id */ }
        if (activeTab === 'faculty') setFacultyForm(rest);
        if (activeTab === 'courses') setCourseForm(rest);
        if (activeTab === 'rooms') setRoomForm(rest);
        if (activeTab === 'batches') {
            const batchName = rest.name || '';
            const nameParts = batchName.split(' ');
            const year = nameParts.length >= 2 ? `${nameParts[0]} ${nameParts[1]}` : '1st Year';
            const semester = nameParts.length >= 4 ? `${nameParts[2]} ${nameParts[3]}` : '1st Sem';
            setBatchForm({ ...rest, year, semester, default_room_id: rest.default_room_id || '' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast('Data copied to form. Modify and Save.', { icon: '📋' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        const loadingToast = toast.loading('Deleting...');
        try {
            if (activeTab === 'faculty') await deleteFaculty(id);
            if (activeTab === 'courses') await deleteCourse(id);
            if (activeTab === 'rooms') await deleteRoom(id);
            if (activeTab === 'batches') await deleteBatch(id);

            toast.success('Deleted Successfully', { id: loadingToast });
            fetchData();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Delete failed.", { id: loadingToast });
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFacultyForm(initialFacultyForm);
        setCourseForm(initialCourseForm);
        setRoomForm(initialRoomForm);
        setBatchForm(initialBatchForm);
    };

    // Removed handleSystemExport, handleSystemRestore, processFileImport

    const filteredData = useMemo(() => {
        let result = dataList.filter(item => {
            const query = searchQuery.toLowerCase();
            let matchesSearch = false;
            if (activeTab === 'faculty') {
                matchesSearch = String(item.name || '').toLowerCase().includes(query) ||
                    String(item.initials || '').toLowerCase().includes(query) ||
                    String(item.email || '').toLowerCase().includes(query);
            } else if (activeTab === 'courses') {
                matchesSearch = String(item.name || '').toLowerCase().includes(query) ||
                    String(item.code || '').toLowerCase().includes(query);
            } else if (activeTab === 'rooms') {
                matchesSearch = String(item.room_number).toLowerCase().includes(query);
            } else if (activeTab === 'batches') {
                matchesSearch = String(item.name || '').toLowerCase().includes(query) ||
                    String(item.section || '').toLowerCase().includes(query);
            }
            if (!matchesSearch) return false;

            if (activeTab === 'faculty') {
                if (item.type === 'Permanent' && !showPermanent) return false;
                if (item.type === 'Guest' && !showGuest) return false;
                if (item.type === 'Adjunct' && !showAdjunct) return false;
            }
            if (activeTab === 'rooms') {
                if (item.type === 'Theory' && !showClassrooms) return false;
                if (item.type === 'Lab' && !showLabs) return false;
            }
            if (activeTab === 'courses') {
                if (item.type === 'Theory' && !showTheory) return false;
                if (item.type === 'Lab' && !showLabCourses) return false;
            }
            return true;
        });

        // Numerical sorting for Courses tab (by code digits)
        if (activeTab === 'courses') {
            result.sort((a, b) => {
                const numA = parseInt((a.code || '').match(/\d+/)?.[0] || '0', 10);
                const numB = parseInt((b.code || '').match(/\d+/)?.[0] || '0', 10);
                return numA - numB || (a.code || '').localeCompare(b.code || '');
            });
        }

        // Alphabetical sorting for Faculty tab
        if (activeTab === 'faculty') {
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }

        // Numeric Sorting for Rooms tab (digit order)
        if (activeTab === 'rooms') {
            result.sort((a, b) => {
                const numA = parseInt(a.room_number, 10) || 0;
                const numB = parseInt(b.room_number, 10) || 0;
                return numA - numB;
            });
        }

        // Hierarchical Sorting for Batches tab
        if (activeTab === 'batches') {
            result.sort((a, b) => {
                const getSortMetadata = (name) => {
                    const safeName = name || '';
                    const parts = safeName.split(' ');
                    // "1st Year 1st Sem" -> [1, 1]
                    const yearNum = parseInt(parts[0]) || 0;
                    const semNum = parts.length >= 3 ? parseInt(parts[2]) : 0;
                    return { year: yearNum, sem: semNum };
                };
                const metaA = getSortMetadata(a.name);
                const metaB = getSortMetadata(b.name);

                if (metaA.year !== metaB.year) return metaA.year - metaB.year;
                if (metaA.sem !== metaB.sem) return metaA.sem - metaB.sem;
                return (a.section || '').localeCompare(b.section || '');
            });
        }

        return result;
    }, [dataList, searchQuery, activeTab, showPermanent, showGuest, showAdjunct, showClassrooms, showLabs, showTheory, showLabCourses]);

    const stats = useMemo(() => {
        if (activeTab === 'faculty') {
            return [
                { label: 'Total Faculty', value: dataList.length, color: 'bg-indigo-500' },
                { label: 'Permanent', value: dataList.filter(i => i.type === 'Permanent').length, color: 'bg-emerald-500' },
                { label: 'Guest & Adjunct', value: dataList.filter(i => i.type === 'Guest' || i.type === 'Adjunct').length, color: 'bg-amber-500' },
            ];
        } else if (activeTab === 'courses') {
            return [
                { label: 'Total Courses', value: dataList.length, color: 'bg-indigo-500' },
                { label: 'Theory Courses', value: dataList.filter(i => i.type === 'Theory').length, color: 'bg-purple-500' },
                { label: 'Lab Courses', value: dataList.filter(i => i.type === 'Lab').length, color: 'bg-cyan-500' },
            ];
        } else if (activeTab === 'rooms') {
            return [
                { label: 'Total Rooms', value: dataList.length, color: 'bg-indigo-500' },
                { label: 'Classrooms', value: dataList.filter(i => i.type === 'Theory').length, color: 'bg-rose-500' },
                { label: 'Laboratories', value: dataList.filter(i => i.type === 'Lab').length, color: 'bg-blue-500' },
            ];
        } else if (activeTab === 'batches') {
            const sections = new Set(dataList.map(i => i.section)).size;
            return [
                { label: 'Total Batches', value: dataList.length, color: 'bg-indigo-500' },
                { label: 'Unique Sections', value: sections, color: 'bg-fuchsia-500' },
            ];
        }
        return [];
    }, [dataList, activeTab]);

    // Memoized sorted rooms for dropdowns
    const sortedRooms = useMemo(() => {
        return [...rooms].sort((a, b) => {
            const numA = parseInt(String(a.room_number).replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(String(b.room_number).replace(/\D/g, ''), 10) || 0;
            if (numA !== numB) return numA - numB;
            return String(a.room_number).localeCompare(String(b.room_number));
        });
    }, [rooms]);

    // Tabs are now defined dynamically above

    return (
        <div className="w-full px-6 mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Database Admin Dashboard</h2>
                    <p className="text-muted-foreground mt-1">Manage system data, schedule, and configurations.</p>
                </div>

                {/* Backup & Restore Option */}
                {hasPermission('manage_database') && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsBackupModalOpen(true)}
                            className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-800/50 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                        >
                            <Download className="h-4 w-4 mr-2" /> Backup & Restore
                        </Button>
                    </div>
                )}
            </div>

            {/* Insight Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx}
                        className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-shadow"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color} opacity-[0.08] dark:opacity-10 rounded-bl-[100px] -z-0 transition-transform duration-500 group-hover:scale-125`}></div>
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 z-10">{stat.label}</span>
                        <div className="flex items-center gap-3 z-10">
                            <span className={`w-3 h-3 rounded-full ${stat.color} shadow-sm`}></span>
                            <h3 className="text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex flex-col gap-6">
                {/* Horizontal Tab Selection */}
                <div className="w-full">
                    <div className="bg-muted/40 rounded-2xl border border-border/50 shadow-inner p-1.5 flex flex-row gap-1 overflow-x-auto w-fit">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-background text-foreground shadow-sm font-bold transform scale-[1.02] border-transparent'
                                    : 'font-medium text-muted-foreground hover:bg-background/50 hover:text-foreground hover:border-border/50 border border-transparent'
                                    }`}
                            >
                                <span className={activeTab === tab.id ? "text-indigo-500" : ""}>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="w-full space-y-6">

                    {/* Input Form Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-2xl border border-indigo-100 dark:border-indigo-950 shadow-md shadow-indigo-500/5 p-6 md:p-8 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px] pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    {editingId ? <Edit size={18} className="text-indigo-500" /> : <Plus size={18} className="text-indigo-500" />}
                                    {editingId ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}
                                </h3>
                                {editingId && (
                                    <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
                                        <X size={14} className="mr-1" /> Cancel
                                    </Button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {activeTab === 'faculty' && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField label="Full Name">
                                            <Input value={facultyForm.name} onChange={e => setFacultyForm({ ...facultyForm, name: e.target.value })} placeholder="Dr. Name" required />
                                        </FormField>
                                        <FormField label="Initials (Short Form)">
                                            <Input value={facultyForm.initials} onChange={e => setFacultyForm({ ...facultyForm, initials: e.target.value })} placeholder="DN" required />
                                        </FormField>
                                        <FormField label="Type">
                                            <Select value={facultyForm.type} onChange={e => setFacultyForm({ ...facultyForm, type: e.target.value })}>
                                                <option value="Permanent">Permanent</option>
                                                <option value="Guest">Guest</option>
                                                <option value="Adjunct">Adjunct</option>
                                            </Select>
                                        </FormField>
                                        <FormField label="Designation">
                                            <Select value={facultyForm.designation} onChange={e => setFacultyForm({ ...facultyForm, designation: e.target.value })}>
                                                <option value="Head of the Department">Head of the Department</option>
                                                <option value="Professor">Professor</option>
                                                <option value="Associate Professor">Associate Professor</option>
                                                <option value="Assistant Professor">Assistant Professor</option>
                                                <option value="Senior Lecturer">Senior Lecturer</option>
                                                <option value="Lecturer">Lecturer</option>
                                                <option value="Junior Lecturer">Junior Lecturer</option>
                                                <option value="Adjunct Faculty">Adjunct Faculty</option>
                                            </Select>
                                        </FormField>
                                        <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                                            <FormField label="Email">
                                                <Input type="email" value={facultyForm.email} onChange={e => setFacultyForm({ ...facultyForm, email: e.target.value })} placeholder="email@example.com" required />
                                            </FormField>
                                            <FormField label="WhatsApp Number">
                                                <Input type="tel" value={facultyForm.phone} onChange={e => setFacultyForm({ ...facultyForm, phone: e.target.value })} placeholder="+88017..." />
                                            </FormField>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'courses' && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField label="Code">
                                            <Input
                                                value={courseForm.code}
                                                onChange={e => {
                                                    const newCode = e.target.value;
                                                    // Auto-detect type based on last digit
                                                    // Extract numbers: CSE-1101 -> 1101
                                                    const numbers = newCode.replace(/\D/g, '');
                                                    let newType = courseForm.type;
                                                    if (numbers.length > 0) {
                                                        const lastDigit = parseInt(numbers.slice(-1));
                                                        newType = (lastDigit % 2 === 0) ? 'Lab' : 'Theory';
                                                    }
                                                    setCourseForm({ ...courseForm, code: newCode, type: newType });
                                                }}
                                                placeholder="CSE-1101"
                                                required
                                            />
                                        </FormField>
                                        <FormField label="Type">
                                            <Select
                                                value={courseForm.type}
                                                onChange={e => setCourseForm({ ...courseForm, type: e.target.value })}
                                            >
                                                <option value="Theory">Theory</option>
                                                <option value="Lab">Lab</option>
                                            </Select>
                                        </FormField>
                                        <FormField label="Credits">
                                            <Input type="number" step="0.5" value={courseForm.credit} onChange={e => setCourseForm({ ...courseForm, credit: Number(e.target.value) })} required />
                                        </FormField>
                                        {/* <FormField label="Assigned Faculty ID">
                                            <Input type="number" value={courseForm.assigned_faculty_id} onChange={e => setCourseForm({ ...courseForm, assigned_faculty_id: Number(e.target.value) })} required />
                                        </FormField> */}
                                        {/* <div className="md:col-span-2"> */}
                                        <FormField label="Course Name">
                                            <Input value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} placeholder="Course Name" required />
                                        </FormField>
                                        {/* </div> */}
                                    </div>
                                )}

                                {activeTab === 'rooms' && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField label="Room No">
                                            <Input value={roomForm.room_number} onChange={e => setRoomForm({ ...roomForm, room_number: e.target.value })} placeholder="101" required />
                                        </FormField>
                                        <FormField label="Capacity">
                                            <Input type="number" value={roomForm.capacity} onChange={e => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} required />
                                        </FormField>
                                        <FormField label="Floor">
                                            <Input type="number" value={roomForm.floor} onChange={e => setRoomForm({ ...roomForm, floor: Number(e.target.value) })} required />
                                        </FormField>
                                        <FormField label="Type">
                                            <Select
                                                value={roomForm.type}
                                                onChange={e => setRoomForm({ ...roomForm, type: e.target.value })}
                                            >
                                                <option value="Theory">Classroom</option>
                                                <option value="Lab">Laboratory</option>
                                            </Select>
                                        </FormField>
                                    </div>
                                )}

                                {activeTab === 'batches' && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
                                            <FormField label="Year">
                                                <Select
                                                    value={batchForm.year}
                                                    onChange={e => setBatchForm({ ...batchForm, year: e.target.value })}
                                                >
                                                    <option value="1st Year">1st Year</option>
                                                    <option value="2nd Year">2nd Year</option>
                                                    <option value="3rd Year">3rd Year</option>
                                                    <option value="4th Year">4th Year</option>
                                                </Select>
                                            </FormField>
                                            <FormField label="Semester">
                                                <Select
                                                    value={batchForm.semester}
                                                    onChange={e => setBatchForm({ ...batchForm, semester: e.target.value })}
                                                >
                                                    <option value="1st Sem">1st Sem</option>
                                                    <option value="2nd Sem">2nd Sem</option>
                                                </Select>
                                            </FormField>
                                            <FormField label="Section">
                                                <Select
                                                    value={batchForm.section}
                                                    onChange={e => setBatchForm({ ...batchForm, section: e.target.value })}
                                                >
                                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </Select>
                                            </FormField>
                                        </div>
                                        <div className="md:col-span-2">
                                            <FormField label="Default Room">
                                                <Select
                                                    value={batchForm.default_room_id}
                                                    onChange={e => setBatchForm({ ...batchForm, default_room_id: e.target.value })}
                                                >
                                                    <option value="">Select Room</option>
                                                    {sortedRooms.map(r => (
                                                        <option key={r.id} value={r.id}>Room {r.room_number}</option>
                                                    ))}
                                                </Select>
                                            </FormField>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end border-t border-border mt-6">
                                    <Button type="submit" className="w-full md:w-auto px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all">
                                        <Save className="mr-2 h-4 w-4" />
                                        {editingId ? "Update Record" : "Save Record"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>

                    {/* Data List */}
                    <div className="space-y-4">
                        {/* Sticky Search and Filters Row */}
                        <div className="sticky top-[64px] z-20 bg-background/95 backdrop-blur-sm py-4 border-b -mx-6 px-6 mb-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-center justify-between flex-1 gap-4">
                                    <h3 className="text-lg font-semibold text-foreground whitespace-nowrap">
                                        Existing Records ({filteredData.length})
                                    </h3>

                                    {/* Search Input */}
                                    <div className="relative w-full max-w-sm">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder={`Search ${activeTab}...`}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-4 py-2 w-full text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                        />
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                                    {activeTab === 'faculty' && (
                                        <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg border border-border min-w-max">
                                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={showPermanent}
                                                    onChange={(e) => setShowPermanent(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="flex items-center gap-1.5 text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                    Permanent
                                                </span>
                                            </label>
                                            <div className="h-4 w-px bg-border"></div>
                                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={showGuest}
                                                    onChange={(e) => setShowGuest(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                                />
                                                <span className="flex items-center gap-1.5 text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                    Guest
                                                </span>
                                            </label>
                                            <div className="h-4 w-px bg-border"></div>
                                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={showAdjunct}
                                                    onChange={(e) => setShowAdjunct(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                                                />
                                                <span className="flex items-center gap-1.5 text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                    Adjunct
                                                </span>
                                            </label>
                                        </div>
                                    )}

                                    {activeTab === 'rooms' && (
                                        <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg border border-border min-w-max">
                                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={showClassrooms}
                                                    onChange={(e) => setShowClassrooms(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="flex items-center gap-1.5 text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                    Classrooms
                                                </span>
                                            </label>
                                            <div className="h-4 w-px bg-border"></div>
                                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={showLabs}
                                                    onChange={(e) => setShowLabs(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="flex items-center gap-1.5 text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    Laboratories
                                                </span>
                                            </label>
                                        </div>
                                    )}

                                    {activeTab === 'courses' && (
                                        <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg border border-border min-w-max">
                                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={showTheory}
                                                    onChange={(e) => setShowTheory(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="flex items-center gap-1.5 text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                    Theory
                                                </span>
                                            </label>
                                            <div className="h-4 w-px bg-border"></div>
                                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={showLabCourses}
                                                    onChange={(e) => setShowLabCourses(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="flex items-center gap-1.5 text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    Lab
                                                </span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">Loading...</div>
                        ) : dataList.length === 0 ? (
                            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border text-muted-foreground">
                                No records found. Add one above.
                            </div>
                        ) : (
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                <AnimatePresence>
                                    {filteredData.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between group transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-indigo-500/40 relative overflow-hidden ${editingId === item.id ? 'ring-2 ring-indigo-500 border-indigo-500/50' : ''}`}
                                        >
                                            <div className="space-y-1 mb-4">
                                                {/* Dynamic Content Rendering */}
                                                {activeTab === 'faculty' && (
                                                    <>
                                                        <h4 className="font-semibold text-foreground">{item.name} ({item.initials})</h4>
                                                        <p className="text-sm text-muted-foreground font-medium text-indigo-600/80 dark:text-indigo-400/80 mb-0.5">{item.designation}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.type} • {item.email}
                                                            {item.phone && <span> • {item.phone}</span>}
                                                        </p>
                                                    </>
                                                )}
                                                {activeTab === 'courses' && (
                                                    <>
                                                        <h4 className="font-semibold text-foreground">{item.code}</h4>
                                                        <p className="text-sm text-foreground">{item.name}</p>
                                                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                                            <span className="bg-muted px-1.5 py-0.5 rounded">{item.type}</span>
                                                            <span>Credits: {item.credit}</span>
                                                        </div>
                                                    </>
                                                )}
                                                {activeTab === 'rooms' && (
                                                    <>
                                                        <h4 className="font-semibold text-foreground">Room {item.room_number}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.type === 'Theory' ? 'Classroom' : 'Laboratory'} • Capacity: {item.capacity} • Floor: {item.floor}
                                                        </p>
                                                    </>
                                                )}
                                                {activeTab === 'batches' && (
                                                    <>
                                                        <h4 className="font-semibold text-foreground">{item.name}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Section: {item.section}
                                                            {rooms.find(r => String(r.id) === String(item.default_room_id))?.room_number
                                                                ? ` • Room: ${rooms.find(r => String(r.id) === String(item.default_room_id)).room_number}`
                                                                : ''}
                                                        </p>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 pt-3 border-t border-border mt-auto">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="h-8 px-2 flex-1 text-xs">
                                                    <Edit size={14} className="mr-1.5" /> Edit
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleDuplicate(item)} className="h-8 px-2 flex-1 text-xs">
                                                    <Copy size={14} className="mr-1.5" /> Copy
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <BackupDashboard
                isOpen={isBackupModalOpen}
                onClose={() => setIsBackupModalOpen(false)}
                onRestoreSuccess={fetchData} // Pass fetchData to refresh data after restore
            />
        </div>
    );
};

const FormField = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">{label}</label>
        {children}
    </div>
);

export default AdminPanel;
