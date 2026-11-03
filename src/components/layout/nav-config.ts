import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  School,
  BookOpen,
  ClipboardCheck,
  DollarSign,
  FileSpreadsheet,
  BookOpenCheck,
  Bell,
  CalendarClock,
  ScrollText,
  Banknote,
  BarChart3,
  Settings,
  UserCheck,
  FileText,
  UserCircle,
  Library,
  Bus,
  Building2,
  Package,
  Calendar,
  UserMinus,
  Shield,
  GraduationCapIcon,
  CreditCard,
  Video,
  MessageSquare,
  Upload,
  ClipboardList,
  Globe,
  Smartphone,
  LineChart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/admin/students', icon: Users },
  { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
  { label: 'Staff', href: '/admin/staff', icon: Briefcase },
  { label: 'Classes', href: '/admin/classes', icon: School },
  { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
  { label: 'Attendance', href: '/admin/attendance', icon: ClipboardCheck },
  { label: 'Fee Management', href: '/admin/fees', icon: DollarSign },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Exams', href: '/admin/exams', icon: FileSpreadsheet },
  { label: 'Online Exams', href: '/admin/online-exams', icon: ClipboardList },
  { label: 'Homework', href: '/admin/homework', icon: BookOpenCheck },
  { label: 'Notices', href: '/admin/notices', icon: Bell },
  { label: 'Timetable', href: '/admin/timetable', icon: CalendarClock },
  { label: 'Calendar', href: '/admin/events', icon: Calendar },
  { label: 'Library', href: '/admin/library', icon: Library },
  { label: 'Transport', href: '/admin/transport', icon: Bus },
  { label: 'Hostel', href: '/admin/hostel', icon: Building2 },
  { label: 'Inventory', href: '/admin/inventory', icon: Package },
  { label: 'Leaves', href: '/admin/leaves', icon: UserMinus },
  { label: 'Admissions', href: '/admin/admissions', icon: GraduationCapIcon },
  { label: 'Meetings', href: '/admin/meetings', icon: Video },
  { label: 'Messages', href: '/admin/chat', icon: MessageSquare },
  { label: 'Certificates', href: '/admin/certificates', icon: ScrollText },
  { label: 'Payroll', href: '/admin/payroll', icon: Banknote },
  { label: 'Analytics', href: '/admin/analytics', icon: LineChart },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Audit Logs', href: '/admin/audit', icon: Shield },
  { label: 'Backups', href: '/admin/backups', icon: Upload },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

const teacherNav: NavItem[] = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'My Students', href: '/teacher/students', icon: Users },
  { label: 'Attendance', href: '/teacher/attendance', icon: ClipboardCheck },
  { label: 'Exams', href: '/teacher/exams', icon: FileSpreadsheet },
  { label: 'Homework', href: '/teacher/homework', icon: BookOpenCheck },
];

const studentNav: NavItem[] = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/student/attendance', icon: UserCheck },
  { label: 'Fees', href: '/student/fees', icon: DollarSign },
  { label: 'Results', href: '/student/results', icon: FileText },
  { label: 'Homework', href: '/student/homework', icon: BookOpenCheck },
];

const parentNav: NavItem[] = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
  { label: 'Children', href: '/parent/children', icon: UserCircle },
  { label: 'Attendance', href: '/parent/attendance', icon: ClipboardCheck },
  { label: 'Results', href: '/parent/results', icon: FileText },
  { label: 'Fees', href: '/parent/fees', icon: DollarSign },
  { label: 'Homework', href: '/parent/homework', icon: BookOpenCheck },
  { label: 'Notices', href: '/parent/notices', icon: Bell },
];

export const navConfig: Record<UserRole, NavItem[]> = {
  admin: adminNav,
  teacher: teacherNav,
  student: studentNav,
  parent: parentNav,
};
