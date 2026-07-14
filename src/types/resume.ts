export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  linkedin?: string;
  website?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Fluent' | 'Native';
}

export interface Resume {
  id?: string;
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  summary: string;
  createdAt?: Date;
  paid: boolean;
  paymentId?: string;
}

export interface PaymentStatus {
  paid: boolean;
  paymentId?: string;
  amount: number;
}
