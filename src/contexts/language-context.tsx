'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'ur'

interface Translations {
  [key: string]: { en: string; ur: string }
}

const translations: Translations = {
  dashboard: { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  students: { en: 'Students', ur: 'طلبا' },
  teachers: { en: 'Teachers', ur: 'اساتذہ' },
  staff: { en: 'Staff', ur: 'عملہ' },
  classes: { en: 'Classes', ur: 'جماعتیں' },
  subjects: { en: 'Subjects', ur: 'مضامین' },
  attendance: { en: 'Attendance', ur: 'حاضری' },
  fees: { en: 'Fee Management', ur: 'فیس کا انتظام' },
  payments: { en: 'Payments', ur: 'ادائیگیاں' },
  exams: { en: 'Exams', ur: 'امتحانات' },
  onlineExams: { en: 'Online Exams', ur: 'آن لائن امتحانات' },
  homework: { en: 'Homework', ur: 'گھر کا کام' },
  notices: { en: 'Notices', ur: 'اطلاعات' },
  timetable: { en: 'Timetable', ur: 'ٹائم ٹیبل' },
  calendar: { en: 'Calendar', ur: 'کیلنڈر' },
  library: { en: 'Library', ur: 'لائبریری' },
  transport: { en: 'Transport', ur: 'ٹرانسپورٹ' },
  hostel: { en: 'Hostel', ur: 'ہاسٹل' },
  inventory: { en: 'Inventory', ur: 'انوینٹری' },
  leaves: { en: 'Leaves', ur: 'چھٹیاں' },
  admissions: { en: 'Admissions', ur: 'داخلے' },
  meetings: { en: 'Meetings', ur: 'میٹنگز' },
  messages: { en: 'Messages', ur: 'پیغامات' },
  certificates: { en: 'Certificates', ur: 'سرٹیفیکیٹ' },
  payroll: { en: 'Payroll', ur: 'تنخواہ' },
  analytics: { en: 'Analytics', ur: 'تجزیات' },
  reports: { en: 'Reports', ur: 'رپورٹیں' },
  auditLogs: { en: 'Audit Logs', ur: 'audit لاگز' },
  backups: { en: 'Backups', ur: 'بیک اپ' },
  settings: { en: 'Settings', ur: 'ترتیبات' },
  search: { en: 'Search', ur: 'تلاش' },
  addNew: { en: 'Add New', ur: 'نیا شامل کریں' },
  edit: { en: 'Edit', ur: 'ترمیم' },
  delete: { en: 'Delete', ur: 'حذف' },
  save: { en: 'Save', ur: 'محفوظ کریں' },
  cancel: { en: 'Cancel', ur: 'منسوخ' },
  confirm: { en: 'Confirm', ur: 'توسیق' },
  loading: { en: 'Loading...', ur: 'لوڈ ہو رہا ہے...' },
  noData: { en: 'No data found', ur: 'کوئی ڈیٹا نہیں ملا' },
  totalStudents: { en: 'Total Students', ur: 'کل طلبا' },
  totalTeachers: { en: 'Total Teachers', ur: 'کل اساتذہ' },
  totalStaff: { en: 'Total Staff', ur: 'کل عملہ' },
  present: { en: 'Present', ur: 'حاضر' },
  absent: { en: 'Absent', ur: 'غیر حاضر' },
  late: { en: 'Late', ur: 'دیر سے' },
  paid: { en: 'Paid', ur: 'ادا شدہ' },
  unpaid: { en: 'Unpaid', ur: 'غیر ادا شدہ' },
  pending: { en: 'Pending', ur: 'زیر التوا' },
  approved: { en: 'Approved', ur: 'منظور شدہ' },
  rejected: { en: 'Rejected', ur: 'مسترد' },
  logout: { en: 'Logout', ur: 'لاگ آؤٹ' },
  profile: { en: 'Profile', ur: 'پروفائل' },
  overview: { en: 'Overview', ur: 'جائزہ' },
  welcomeBack: { en: 'Welcome back!', ur: 'خوش آمدید!' },
  darkMode: { en: 'Dark Mode', ur: 'ڈارک موڈ' },
  language: { en: 'Language', ur: 'زبان' },
  english: { en: 'English', ur: 'English' },
  urdu: { en: 'Urdu', ur: 'اردو' },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language
    if (saved && (saved === 'en' || saved === 'ur')) {
      setLanguageState(saved)
    }
  }, [])

  function setLanguage(lang: Language) {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    if (lang === 'ur') {
      document.documentElement.dir = 'rtl'
    } else {
      document.documentElement.dir = 'ltr'
    }
  }

  function t(key: string): string {
    const entry = translations[key]
    if (!entry) return key
    return entry[language] || entry.en || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
