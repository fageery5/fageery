
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  Plus, 
  Search, 
  TrendingUp, 
  Wallet, 
  X,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Upload,
  Download,
  FileText,
  CreditCard,
  Building2
} from 'lucide-react';
import { Employee, ViewType } from './types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import * as XLSX from 'xlsx';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 w-full p-2 md:p-4 transition-all duration-200 active:scale-90 ${
      active 
      ? 'text-blue-600 md:bg-blue-600 md:text-white md:shadow-lg md:shadow-blue-200' 
      : 'text-gray-400 md:text-gray-600 hover:bg-gray-100'
    } rounded-xl`}
  >
    <Icon size={24} className={active ? 'scale-110' : ''} />
    <span className="text-[10px] md:text-sm font-bold">{label}</span>
    {active && <div className="md:hidden w-1 h-1 bg-blue-600 rounded-full mt-0.5"></div>}
  </button>
);

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [view, setView] = useState<ViewType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('employees_data_v2');
    if (saved) {
      setEmployees(JSON.parse(saved));
    } else {
      const initial: Employee[] = [
        { id: '1', fullName: 'أحمد محمد', bankName: 'بنك الراجحي', accountNumber: 'SA1234567890', createdAt: new Date().toISOString() },
        { id: '2', fullName: 'سارة خالد', bankName: 'بنك الإنماء', accountNumber: 'SA0987654321', createdAt: new Date().toISOString() },
        { id: '3', fullName: 'عمر فهد', bankName: 'البنك الأهلي', accountNumber: 'SA1122334455', createdAt: new Date().toISOString() },
      ];
      setEmployees(initial);
      localStorage.setItem('employees_data_v2', JSON.stringify(initial));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('employees_data_v2', JSON.stringify(employees));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.bankName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const stats = useMemo(() => {
    const bankGroups = employees.reduce((acc, emp) => {
      acc[emp.bankName] = (acc[emp.bankName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(bankGroups).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const handleSaveEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEmp: Employee = {
      id: editingEmployee?.id || Math.random().toString(36).substr(2, 9),
      fullName: formData.get('fullName') as string,
      bankName: formData.get('bankName') as string,
      accountNumber: formData.get('accountNumber') as string,
      createdAt: editingEmployee?.createdAt || new Date().toISOString(),
    };

    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? newEmp : emp));
    } else {
      setEmployees(prev => [...prev, newEmp]);
    }
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const importedEmployees: Employee[] = jsonData.map((row) => ({
          id: Math.random().toString(36).substr(2, 9),
          fullName: row['الاسم الكامل'] || row['الاسم'] || row['Name'] || 'غير معروف',
          bankName: row['اسم البنك'] || row['البنك'] || row['Bank'] || 'غير محدد',
          accountNumber: String(row['رقم الحساب'] || row['آيبان'] || row['IBAN'] || ''),
          createdAt: new Date().toISOString(),
        }));

        if (importedEmployees.length > 0) {
          setEmployees(prev => [...prev, ...importedEmployees]);
          alert(`تم استيراد ${importedEmployees.length} موظف بنجاح.`);
        }
      } catch (error) {
        alert('حدث خطأ أثناء قراءة الملف.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExcelExport = () => {
    if (employees.length === 0) return;
    const exportData = employees.map(emp => ({
      'الاسم الكامل': emp.fullName,
      'اسم البنك': emp.bankName,
      'رقم الحساب': emp.accountNumber,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الموظفين");
    XLSX.writeFile(workbook, `بيانات_البنوك.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const templateData = [{ 'الاسم الكامل': 'محمد علي', 'اسم البنك': 'بنك الراجحي', 'رقم الحساب': 'SA0000...' }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `نموذج_بيانات_الموظفين.xlsx`);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0">
      <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleExcelImport} />

      {/* Header - Mobile Only */}
      <header className="md:hidden bg-blue-600 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-lg">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Wallet size={20} />
            <span>بيانات البنوك</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="p-2 active:scale-75 transition-transform"><Upload size={20}/></button>
          <button onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }} className="p-2 active:scale-75 transition-transform"><Plus size={24}/></button>
        </div>
      </header>

      {/* Sidebar / Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-64 bg-white md:h-screen border-t md:border-t-0 md:border-l px-4 py-2 md:py-8 flex md:flex-col justify-around md:justify-start gap-2 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:shadow-none safe-bottom">
        <div className="hidden md:flex items-center gap-3 px-4 mb-8">
          <div className="bg-blue-600 p-2 rounded-xl text-white"><Users size={24} /></div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">إدارة الحسابات</h1>
        </div>
        
        <SidebarItem icon={Users} label="قائمة الموظفين" active={view === 'list'} onClick={() => setView('list')} />
        <SidebarItem icon={LayoutDashboard} label="الإحصائيات" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
        
        <div className="hidden md:block mt-auto p-4 bg-blue-50 rounded-2xl">
          <p className="text-xs text-blue-600 font-bold mb-1">العدد الإجمالي</p>
          <p className="text-2xl font-black text-blue-700">{employees.length}</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {view === 'list' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="بحث سريع..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-11 pl-4 py-4 rounded-2xl bg-white border-none shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                
                {/* Actions Bar - Desktop only or as icons in mobile */}
                <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
                  <button onClick={handleDownloadTemplate} className="shrink-0 flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs active:bg-slate-200">
                    <FileText size={16} /><span>النموذج</span>
                  </button>
                  <button onClick={handleExcelExport} className="shrink-0 flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl font-bold text-xs active:bg-blue-200">
                    <Download size={16} /><span>تصدير</span>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="shrink-0 md:hidden flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl font-bold text-xs active:bg-emerald-200">
                    <Upload size={16} /><span>استيراد</span>
                  </button>
                </div>
              </div>

              {/* Mobile Card List (Better for touch) */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                {filteredEmployees.map(emp => (
                  <div key={emp.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 leading-tight">{emp.fullName}</h3>
                          <span className="text-xs text-slate-500">{emp.bankName}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingEmployee(emp); setIsModalOpen(true); }} className="p-2 text-slate-400"><Edit2 size={18}/></button>
                        <button onClick={() => handleDelete(emp.id)} className="p-2 text-red-300"><Trash2 size={18}/></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 text-blue-600">
                        <CreditCard size={14} />
                        <code className="text-sm font-mono font-bold tracking-tight">{emp.accountNumber}</code>
                      </div>
                      <button className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500 font-bold uppercase" onClick={() => navigator.clipboard.writeText(emp.accountNumber)}>نسخ</button>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredEmployees.length === 0 && (
                <div className="text-center py-20">
                  <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Search size={32} />
                  </div>
                  <p className="text-slate-400 font-bold">لا توجد بيانات متاحة</p>
                </div>
              )}
            </div>
          )}

          {view === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                  <p className="text-slate-400 text-xs font-bold mb-1">الموظفين</p>
                  <p className="text-3xl font-black text-slate-800">{employees.length}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                  <p className="text-slate-400 text-xs font-bold mb-1">البنوك</p>
                  <p className="text-3xl font-black text-slate-800">{stats.length}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/> توزيع البنوك</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {stats.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0}/>))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {stats.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-[10px] font-bold text-slate-600 truncate">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Full Screen Modal for Native Look */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">{editingEmployee ? 'تعديل البيانات' : 'إضافة جديد'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">الاسم الكامل</label>
                <input required name="fullName" defaultValue={editingEmployee?.fullName} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">اسم البنك</label>
                <select name="bankName" defaultValue={editingEmployee?.bankName || 'بنك الراجحي'} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none">
                  <option>بنك الراجحي</option>
                  <option>البنك الأهلي</option>
                  <option>بنك الإنماء</option>
                  <option>بنك البلاد</option>
                  <option>بنك ساب</option>
                  <option>بنك الرياض</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">رقم الحساب (IBAN)</label>
                <input required name="accountNumber" defaultValue={editingEmployee?.accountNumber} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm uppercase" placeholder="SA0000..." />
              </div>

              <div className="pt-4 flex gap-3 pb-safe">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-blue-200">حفظ</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold active:bg-slate-200">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
