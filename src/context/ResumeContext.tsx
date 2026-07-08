import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Resume, PersonalInfo, Experience, Education, Skill } from '../types/resume';

interface ResumeContextType {
  resume: Resume;
  updatePersonalInfo: (info: PersonalInfo) => void;
  addExperience: (experience: Experience) => void;
  updateExperience: (id: string, experience: Experience) => void;
  removeExperience: (id: string) => void;
  addEducation: (education: Education) => void;
  updateEducation: (id: string, education: Education) => void;
  removeEducation: (id: string) => void;
  addSkill: (skill: Skill) => void;
  updateSkill: (id: string, skill: Skill) => void;
  removeSkill: (id: string) => void;
  updateSummary: (summary: string) => void;
  setPaymentStatus: (paid: boolean, paymentId?: string) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

const initialPersonalInfo: PersonalInfo = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  website: '',
};

const initialResume: Resume = {
  personalInfo: initialPersonalInfo,
  experience: [],
  education: [],
  skills: [],
  summary: '',
  paid: false,
};

export const ResumeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [resume, setResume] = useState<Resume>(initialResume);

  const updatePersonalInfo = (info: PersonalInfo) => {
    setResume(prev => ({ ...prev, personalInfo: info }));
  };

  const addExperience = (experience: Experience) => {
    setResume(prev => ({
      ...prev,
      experience: [...prev.experience, experience],
    }));
  };

  const updateExperience = (id: string, experience: Experience) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? experience : exp),
    }));
  };

  const removeExperience = (id: string) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id),
    }));
  };

  const addEducation = (education: Education) => {
    setResume(prev => ({
      ...prev,
      education: [...prev.education, education],
    }));
  };

  const updateEducation = (id: string, education: Education) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? education : edu),
    }));
  };

  const removeEducation = (id: string) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id),
    }));
  };

  const addSkill = (skill: Skill) => {
    setResume(prev => ({
      ...prev,
      skills: [...prev.skills, skill],
    }));
  };

  const updateSkill = (id: string, skill: Skill) => {
    setResume(prev => ({
      ...prev,
      skills: prev.skills.map(s => s.id === id ? skill : s),
    }));
  };

  const removeSkill = (id: string) => {
    setResume(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.id !== id),
    }));
  };

  const updateSummary = (summary: string) => {
    setResume(prev => ({ ...prev, summary }));
  };

  const setPaymentStatus = (paid: boolean, paymentId?: string) => {
    setResume(prev => ({
      ...prev,
      paid,
      paymentId,
    }));
  };

  return (
    <ResumeContext.Provider
      value={{
        resume,
        updatePersonalInfo,
        addExperience,
        updateExperience,
        removeExperience,
        addEducation,
        updateEducation,
        removeEducation,
        addSkill,
        updateSkill,
        removeSkill,
        updateSummary,
        setPaymentStatus,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
